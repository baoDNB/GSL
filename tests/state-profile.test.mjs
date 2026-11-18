import test from 'node:test';
import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import { moduleLoader, plain } from './module-loader.mjs';

const load = moduleLoader();
const state = await load('src/christmas/state.js');
const campaign = await load('src/christmas/campaign.js');
const profile = await load('src/christmas/profile.js');

test('fresh campaigns own independent stage objects and start with no rewards', () => {
    const first = state.freshState(),
        second = state.freshState();
    first.stages.baking = 2;
    assert.equal(second.stages.baking, 0);
    assert.equal(state.countRewards(first), 0);
    assert.equal(campaign.canEnterEnding(first), false);
});

test('hydration rejects absent starts and clamps malformed saved stages and locations', () => {
    for (const value of [null, false, {}, { started: 'true' }])
        assert.equal(state.hydrateState(value), null);
    const saved = state.hydrateState({
        started: true,
        memory: 'true',
        stages: {
            baking: -2,
            memory: 999,
            crossing: '2',
        },
        location: '__proto__',
    });
    assert.deepEqual(plain(saved.stages), { baking: 0, memory: 2, crossing: 0 });
    assert.equal(saved.memory, false);
    assert.equal(saved.location, 'living');
});

test('completed legacy campaigns retain three rewards and ending access', () => {
    const saved = state.hydrateState({
        started: true,
        baking: true,
        memory: true,
        crossing: true,
        ended: true,
    });
    assert.equal(state.countRewards(saved), 3);
    assert.equal(saved.stages.memory, 3);
    assert.equal(saved.treeLit, true);
    assert.equal(campaign.canEnterEnding(saved), true);
});

test('each trial needs three stages and cannot award a duplicate reward', () => {
    const progress = state.freshState();
    for (const kind of state.FLAGS) {
        assert.equal(state.completeStage(progress, kind), false);
        assert.equal(state.completeStage(progress, kind), false);
        assert.equal(state.completeStage(progress, kind), true);
        assert.equal(state.completeStage(progress, kind), false);
        assert.equal(progress.stages[kind], 3);
    }
    assert.equal(state.countRewards(progress), 3);
    assert.equal(campaign.canEnterEnding(progress), false);
    progress.treeLit = true;
    assert.equal(campaign.canEnterEnding(progress), true);
});

test('stage completion rejects inherited trial keys and repairs malformed counters', () => {
    const progress = state.freshState();
    for (const kind of ['__proto__', 'constructor', 'toString', 'unknown', null]) {
        assert.equal(state.completeStage(progress, kind), false);
    }
    assert.equal(state.completeStage(null, 'baking'), false);
    progress.stages = null;
    assert.equal(state.completeStage(progress, 'baking'), false);
    assert.equal(progress.stages.baking, 1);
    progress.stages.memory = NaN;
    state.completeStage(progress, 'memory');
    assert.equal(progress.stages.memory, 1);
});

test('preparations and final gate remain locked until requirements are satisfied', () => {
    const progress = state.freshState();
    for (const kind of state.FLAGS) {
        assert.equal(campaign.missingPreparations(progress, kind).length, 2);
        for (const key of campaign.TRIALS[kind].needs) progress[key] = true;
        assert.equal(campaign.missingPreparations(progress, kind).length, 0);
        assert.match(campaign.questDescription(progress, kind), /1\/3/);
    }
    for (const kind of state.FLAGS) {
        assert.equal(campaign.canLightTree(progress), false);
        progress[kind] = true;
    }
    assert.equal(campaign.canLightTree(progress), true);
});

test('save/load handle invalid JSON, blocked storage, and quota errors without throwing', async () => {
    const broken = await moduleLoader({
        localStorage: {
            getItem: () => '{oops',
            setItem() {
                throw Error('quota');
            },
        },
    })('src/christmas/state.js');
    assert.equal(broken.loadState(), null);
    assert.equal(broken.saveState(state.freshState()), null);
    const blocked = await moduleLoader({
        localStorage: {
            getItem() {
                throw Error('blocked');
            },
        },
    })('src/christmas/state.js');
    assert.equal(blocked.loadState(), null);
    let saved;
    const working = await moduleLoader({
        localStorage: {
            setItem(_key, value) {
                saved = value;
            },
            getItem: () => saved,
        },
    })('src/christmas/state.js');
    assert.equal(working.saveState(state.freshState()), true);
    assert.equal(working.loadState().started, true);
});

test('profile normalization rejects unexpected assets and blank control-only names', () => {
    const normalized = profile.normalizeProfile({
        gameTitle: '\0\n',
        playerName: 'p'.repeat(100),
        character: { body: '../../secret', outfit: 'https://evil.test/x', hairstyle: '' },
    });
    assert.equal(normalized.gameTitle, profile.DEFAULT_PROFILE.gameTitle);
    assert.equal(normalized.playerName.length, 24);
    assert.equal(normalized.character.body, profile.DEFAULT_PROFILE.character.body);
    assert.equal(normalized.character.outfit, profile.DEFAULT_PROFILE.character.outfit);
    assert.equal(normalized.character.hairstyle, '');
});

test('explicit no-hat choices survive reload while old hat toggles migrate', () => {
    assert.equal(
        profile.normalizeProfile({ character: { accessory: '' } }).character.accessory,
        '',
    );
    assert.equal(profile.normalizeProfile({ santaHat: false }).character.accessory, '');
    assert.equal(
        profile.normalizeProfile({ santaHat: true }).character.accessory,
        profile.NOEL_HATS[0],
    );
});

test('all permitted character asset paths exist and invalid paths are rejected', async () => {
    assert.equal(profile.assetPath('body', '../bad.png'), '');
    assert.equal(profile.assetPath('missing', 'Body_1.png'), '');
    for (const [kind, part] of Object.entries(profile.PARTS)) {
        for (const file of part.files) await access(`public/${profile.assetPath(kind, file)}`);
    }
});

test('profile can use session storage fallback when persistence is denied', async () => {
    let saved;
    const mod = await moduleLoader({
        localStorage: {
            setItem() {
                throw Error('quota');
            },
            getItem() {
                throw Error('blocked');
            },
        },
        sessionStorage: {
            setItem(_key, value) {
                saved = value;
            },
            getItem: () => saved,
        },
    })('src/christmas/profile.js');
    assert.equal(mod.setProfile({ playerName: 'Mai' }), false);
    assert.equal(JSON.parse(saved).playerName, 'Mai');
    assert.equal(mod.getProfile().playerName, 'Mai');
});
