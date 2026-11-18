import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const source = (file) => readFile(new URL(`../../src/christmas/${file}`, import.meta.url), 'utf8');
const config = await source('campaign.js');
const configUrl = `data:text/javascript;base64,${Buffer.from(config).toString('base64')}`;
const campaign = await import(configUrl);
const stateCode = (await source('state.js')).replace('./campaign.js', configUrl);
const states = await import(
    `data:text/javascript;base64,${Buffer.from(stateCode).toString('base64')}`
);
const state = states.freshState();
assert.equal(campaign.familyReflection(state), null);
for (const [kind, trial] of Object.entries(campaign.TRIALS)) {
    assert.equal(campaign.STAGE_STORIES[kind].length, trial.stages.length);
    for (const flag of trial.needs.filter((flag) => flag !== 'recipe'))
        assert.ok(campaign.FOUND_NOTES[flag]);
}
for (const kind of states.FLAGS) {
    assert.equal(campaign.missingPreparations(state, kind).length, 2);
    for (const flag of campaign.TRIALS[kind].needs) state[flag] = true;
    assert.equal(campaign.missingPreparations(state, kind).length, 0);
    assert.equal(states.completeStage(state, kind), false);
    assert.equal(state[kind], false);
    assert.equal(states.hydrateState(JSON.parse(JSON.stringify(state))).stages[kind], 1);
    assert.equal(states.completeStage(state, kind), false);
    assert.equal(states.completeStage(state, kind), true);
    assert.equal(state.stages[kind], 3);
    assert.equal(states.completeStage(state, kind), false); // no duplicate reward
}
assert.equal(campaign.canEnterEnding(state), false);
assert.equal(campaign.familyReflection(state).length, 4);
assert.ok(campaign.familyReflection(state).at(-1).text.includes('cây thông'));
state.treeLit = true;
assert.equal(campaign.canEnterEnding(state), true);
assert.ok(campaign.familyReflection(state).at(-1).text.includes('Cây thông đã sáng'));
state.ended = true;
assert.ok(campaign.familyReflection(state).at(-1).text.includes('Cả nhà đã đoàn viên'));
const old = states.hydrateState({
    started: true,
    baking: true,
    memory: true,
    crossing: true,
    ended: true,
});
assert.equal(campaign.canEnterEnding(old), true);
assert.equal(old.stages.memory, 3);
const malformed = states.hydrateState({
    started: true,
    stages: { memory: 900, baking: '2', crossing: -4 },
    location: '__proto__',
});
assert.equal(malformed.stages.memory, 2);
assert.equal(malformed.stages.baking, 0);
assert.equal(malformed.stages.crossing, 0);
assert.equal(malformed.location, 'living');

// Exercise the actual scene mechanics with a small rendering stub. No production
// save is read or written, and no guessed copy of the mechanics is tested.
const main = await source('main.js');
const trialCode = main.slice(
    main.indexOf('class ChristmasTrial '),
    main.indexOf('class ChristmasEnding '),
);
const shape = () =>
    new Proxy(
        {},
        {
            get(target, key) {
                if (key in target) return target[key];
                return (...args) => {
                    if (key === 'setVisible') target.visible = args[0];
                    return shape();
                };
            },
        },
    );
const context = vm.createContext({
    StoryScene: class {},
    W: 950,
    H: 680,
    UI_Y: 70,
    Phaser: {
        Utils: { Array: { Shuffle: (a) => a } },
        Math: { Clamp: (v, a, b) => Math.max(a, Math.min(b, v)), Between: () => 0 },
    },
    progress: states.freshState(),
    TRIALS: campaign.TRIALS,
    STAGE_STORIES: campaign.STAGE_STORIES,
    completeStage: states.completeStage,
    hasSave: false,
    saveState: () => true,
    updateJournal: () => {},
    burst: () => {},
    document: { querySelector: () => ({ textContent: '' }) },
    button: shape,
    text: shape,
});
vm.runInContext(`${trialCode}\nglobalThis.Trial = ChristmasTrial;`, context);
function scene(kind, round) {
    const t = new context.Trial();
    Object.assign(t, {
        kind,
        round,
        cells: [],
        selected: 0,
        status: shape(),
        detail: shape(),
        board: { add() {} },
        controls: { clear() {} },
        add: { rectangle: shape },
        completed: 0,
        failed: false,
        won: false,
        busy: false,
        timers: [],
        icon: shape,
        boardText: shape,
        complete() {
            this.completed++;
            this.won = true;
        },
        fail() {
            this.failed = true;
        },
        cell(x, y, w, h) {
            const s = shape();
            this.cells.push(s);
            return s;
        },
    });
    t.time = {
        now: 0,
        delayedCall(_delay, callback) {
            t.timers.push(callback);
        },
    };
    return t;
}
function flush(t) {
    while (t.timers.length) t.timers.shift()();
}
for (let round = 0; round < 2; round++) {
    const t = scene('baking', round);
    t.buildBaking();
    t.chooseBaking((t.recipe[0] + 1) % 4);
    assert.equal(t.failed, true);
    t.failed = false;
    for (const i of t.recipe) t.chooseBaking(i);
    assert.equal(t.completed, 1);
}
{
    const t = scene('baking', 2);
    t.buildOven();
    t.ovenNeedle.x = 400;
    t.checkOven();
    assert.equal(t.failed, true);
    t.failed = false;
    t.ovenNeedle.x = 486;
    for (let i = 0; i < 3; i++) {
        t.checkOven();
        flush(t);
    }
    assert.equal(t.completed, 1);
}
for (let round = 0; round < 3; round++) {
    const t = scene('memory', round);
    t.buildMemory();
    assert.equal(t.deck.length, [8, 12, 16][round]);
    t.flip(0);
    t.flip(2);
    assert.equal(t.busy, true);
    flush(t);
    assert.equal(t.flipped.length, 0);
    for (let i = 0; i < t.deck.length; i += 2) {
        t.flip(i);
        t.flip(i + 1);
    }
    assert.equal(t.completed, 1);
    const c = scene('crossing', round);
    c.buildCrossing();
    c.stepOn(0, c.path[0]);
    assert.equal(c.column, 0);
    flush(c);
    c.stepOn(0, (c.path[0] + 1) % c.pathRows);
    assert.equal(c.failed, true);
    c.failed = false;
    for (let i = 0; i < c.pathColumns; i++) c.stepOn(i, c.path[i]);
    assert.equal(c.completed, 1);
}
{
    const t = scene('lights', 0);
    t.buildLights();
    t.chooseLight(3);
    assert.equal(t.lightStep, 0);
    for (const i of [0, 1, 2, 3]) t.chooseLight(i);
    assert.equal(t.completed, 1);
}
// Scene completion must save partial stages, award only after stage three, then unlock ritual.
for (let round = 0; round < 3; round++) {
    const t = scene('baking', round);
    t.complete = context.Trial.prototype.complete;
    let stageOverlay = 0,
        rewardOverlay = 0;
    t.stageOverlay = () => stageOverlay++;
    t.rewardOverlay = () => rewardOverlay++;
    t.complete();
    flush(t);
    assert.equal(context.progress.stages.baking, round + 1);
    assert.equal(context.progress.baking, round === 2);
    assert.equal(stageOverlay, round < 2 ? 1 : 0);
    assert.equal(rewardOverlay, round === 2 ? 1 : 0);
}
console.log(
    'Campaign verified: preparation gates, save migration, nine stages, failures/retries, idempotent rewards and final ritual gate.',
);

// One continuous fresh campaign through the real trial completion/save protocol.
// This is a VM integration check, not a timed human/browser walkthrough.
context.progress = states.freshState();
let savedCampaign;
context.saveState = (progress) => {
    savedCampaign = JSON.parse(JSON.stringify(progress));
    return true;
};
for (const kind of states.FLAGS) {
    for (const flag of campaign.TRIALS[kind].needs) context.progress[flag] = true;
    for (let round = 0; round < 3; round++) {
        const t = scene(kind, round);
        t.complete = context.Trial.prototype.complete;
        t.stageOverlay = () => {};
        t.rewardOverlay = () => {};
        if (kind === 'baking') {
            t.buildBaking();
            if (round < 2) for (const index of t.recipe) t.chooseBaking(index);
            else {
                t.ovenNeedle.x = 486;
                for (let hit = 0; hit < 3; hit++) {
                    t.checkOven();
                    flush(t);
                }
            }
        } else if (kind === 'memory') {
            t.buildMemory();
            for (let index = 0; index < t.deck.length; index += 2) {
                t.flip(index);
                t.flip(index + 1);
            }
        } else {
            t.buildCrossing();
            flush(t);
            for (let column = 0; column < t.pathColumns; column++) t.stepOn(column, t.path[column]);
        }
        flush(t);
        assert.equal(context.progress.stages[kind], round + 1);
        // Reload every checkpoint through the production save migrator.
        context.progress = states.hydrateState(savedCampaign);
        assert.equal(campaign.canEnterEnding(context.progress), false);
    }
    assert.equal(context.progress[kind], true);
}
assert.equal(campaign.canLightTree(context.progress), true);
const ritual = scene('lights', 0);
ritual.complete = context.Trial.prototype.complete;
ritual.rewardOverlay = () => {};
ritual.buildLights();
for (const index of [0, 1, 2, 3]) ritual.chooseLight(index);
flush(ritual);
assert.equal(campaign.canEnterEnding(states.hydrateState(savedCampaign)), true);
console.log(
    'Fresh campaign VM integration: all nine stages, checkpoint reloads and tree ritual unlock the ending.',
);
