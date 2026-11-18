import test from 'node:test';
import assert from 'node:assert/strict';
import { moduleLoader, shape, plain, Events } from './module-loader.mjs';

const load = moduleLoader(
    {},
    {
        phaser: { default: { Scene: class {} } },
        '../objects/Player.js': { default: class {} },
        '../objects/DialogueBox.js': { default: class {} },
        '../assets/VirtualJoypad.js': { joypad: {} },
    },
);
const { default: Puzzle } = await load('src/ScenesGame/PuzzyRoomScene.js');
const { default: Memory } = await load('src/ScenesGame/MemoryGameScene.js');
const { default: Lava } = await load('src/ScenesGame/LavaGameScene.js');

test('sliding puzzle shuffle preserves all tiles and solvable inversion parity', () => {
    for (let run = 0; run < 100; run++) {
        const puzzle = new Puzzle();
        puzzle.boardState = [0, 1, 2, 3, 4, 5, 6, 7, 8];
        puzzle.emptyIndex = 8;
        puzzle.shuffleBoard();
        assert.deepEqual([...puzzle.boardState].sort(), [0, 1, 2, 3, 4, 5, 6, 7, 8]);
        assert.equal(puzzle.boardState[puzzle.emptyIndex], 8);
        const values = puzzle.boardState.filter((value) => value !== 8);
        let inversions = 0;
        for (let i = 0; i < values.length; i++) {
            for (let j = i + 1; j < values.length; j++) inversions += Number(values[i] > values[j]);
        }
        assert.equal(inversions % 2, 0);
    }
});

test('sliding puzzle only accepts adjacent tile clicks during active play', () => {
    const puzzle = new Puzzle();
    puzzle.boardState = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    puzzle.emptyIndex = 8;
    puzzle.gameActive = true;
    const moved = [];
    puzzle.moveTile = (index) => moved.push(index);
    for (const tileValue of [0, 2, 3, 6, 8]) puzzle.onTileClicked({ tileValue });
    assert.deepEqual(moved, []);
    puzzle.onTileClicked({ tileValue: 5 });
    puzzle.onTileClicked({ tileValue: 7 });
    assert.deepEqual(moved, [5, 7]);
    puzzle.gameActive = false;
    puzzle.onTileClicked({ tileValue: 5 });
    assert.deepEqual(moved, [5, 7]);
});

test('sliding puzzle moves preserve empty index and invoke win detection', () => {
    const puzzle = new Puzzle();
    puzzle.boardState = [0, 1, 2, 3, 4, 5, 6, 8, 7];
    puzzle.emptyIndex = 7;
    let updates = 0,
        wins = 0;
    puzzle.updateTilePositionsImmediately = () => updates++;
    puzzle.checkPuzzleWin = () => wins++;
    puzzle.moveTile(8);
    assert.deepEqual(plain(puzzle.boardState), [0, 1, 2, 3, 4, 5, 6, 7, 8]);
    assert.equal(puzzle.emptyIndex, 8);
    assert.equal(updates, 1);
    assert.equal(wins, 1);
});

test('memory trial defaults invalid levels and configures all three valid levels', () => {
    const memory = new Memory();
    for (const data of [undefined, {}, { level: 'bad' }, { level: -1 }, { level: 9 }]) {
        memory.init(data);
        assert.equal(memory.currentLevel, 1);
        assert.equal(memory.totalCards, 4);
    }
    for (let level = 1; level <= 3; level++) {
        memory.init({ level });
        assert.equal(memory.totalPairs, [2, 4, 6][level - 1]);
        assert.equal(memory.selectedCards.length, 0);
        assert.equal(memory.canFlip, true);
    }
});

test('memory mismatch blocks additional flips and resets both cards after timeout', () => {
    const memory = new Memory();
    memory.init({ level: 1 });
    const timers = [];
    memory.time = {
        delayedCall(_delay, callback) {
            timers.push(callback);
        },
    };
    const card = (value) =>
        Object.assign(shape(), { cardValue: value, cardFrontText: shape(), isFlipped: false });
    const a = card(1),
        b = card(2),
        c = card(1);
    memory.handleFlip(a);
    memory.handleFlip(a);
    assert.equal(memory.selectedCards.length, 1);
    memory.handleFlip(b);
    memory.handleFlip(c);
    assert.equal(c.isFlipped, false);
    assert.equal(memory.canFlip, false);
    timers.shift()();
    assert.equal(a.isFlipped, false);
    assert.equal(b.isFlipped, false);
    assert.equal(memory.selectedCards.length, 0);
    assert.equal(memory.canFlip, true);
});

test('memory match advances only when all pairs are found', () => {
    const memory = new Memory();
    memory.init({ level: 1 });
    const timers = [];
    memory.time = {
        delayedCall(_delay, callback) {
            timers.push(callback);
        },
    };
    const card = (value) =>
        Object.assign(shape(), { cardValue: value, cardFrontText: shape(), isFlipped: false });
    memory.handleFlip(card(1));
    memory.handleFlip(card(1));
    assert.equal(memory.matchedPairs, 1);
    assert.equal(timers.length, 0);
    memory.handleFlip(card(2));
    memory.handleFlip(card(2));
    assert.equal(memory.matchedPairs, 2);
    assert.equal(timers.length, 1);
});

test('lava reward cannot increment key count on replay', () => {
    const lava = new Lava();
    lava.registry = new Map([['keysFound', 2]]);
    lava.awardKey();
    lava.awardKey();
    assert.equal(lava.registry.get('keysFound'), 3);
    assert.equal(lava.registry.get('lavaGameWon'), true);
});

function lavaLifecycleHarness() {
    const lava = new Lava();
    const timers = [];
    let restarts = 0,
        rewards = 0,
        keyDestructions = 0;
    Object.assign(lava, {
        isGameOver: false,
        registry: new Map([['keysFound', 0]]),
        player: { body: {}, setVelocity() {}, anims: { stop() {} } },
        keyItem: {
            destroy() {
                keyDestructions++;
            },
        },
        cameras: { main: { flash() {} } },
        time: {
            delayedCall(_delay, callback) {
                timers.push(callback);
            },
        },
        scene: {
            restart() {
                restarts++;
            },
            start() {},
        },
        dialogueBox: {
            startSequence(_key, callback) {
                callback();
            },
        },
        playKeyRewardEffect(callback) {
            rewards++;
            callback();
        },
    });
    return {
        lava,
        timers,
        restarts: () => restarts,
        rewards: () => rewards,
        keyDestructions: () => keyDestructions,
    };
}

test('lava failure blocks subsequent win without scheduling or awarding a reward', () => {
    const h = lavaLifecycleHarness();
    h.lava.triggerLavaFail();
    assert.equal(h.timers.length, 1);
    h.lava.triggerWinGame();
    assert.equal(h.timers.length, 1);
    assert.equal(h.keyDestructions(), 0);
    h.timers.shift()();
    assert.equal(h.restarts(), 1);
    assert.equal(h.rewards(), 0);
    assert.equal(h.lava.registry.get('keysFound'), 0);
});

test('repeated lava win schedules one reward and suppresses competing failure', () => {
    const h = lavaLifecycleHarness();
    h.lava.triggerWinGame();
    h.lava.triggerWinGame();
    h.lava.triggerLavaFail();
    assert.equal(h.timers.length, 1);
    assert.equal(h.keyDestructions(), 1);
    h.timers.shift()();
    assert.equal(h.rewards(), 1);
    assert.equal(h.restarts(), 0);
    assert.equal(h.lava.registry.get('keysFound'), 1);
});

for (const file of [
    'src/scenes/KitchenScene.js',
    'src/scenes/LivingRoomScene.js',
    'src/scenes/RoomChildScene.js',
    'src/scenes/RoomMasterScene.js',
    'src/ScenesGame/PuzzyRoomScene.js',
    'src/ScenesGame/LavaGameScene.js',
]) {
    test(`${file} accepts missing/null scene-entry data and preserves an explicit origin`, async () => {
        const { default: Scene } = await load(file);
        const scene = new Scene();
        const field = file.includes('RoomMasterScene') ? 'fromScene' : 'spawnDirection';
        const fallback = field === 'fromScene' ? '' : 'default';
        for (const data of [undefined, null]) {
            assert.doesNotThrow(() => scene.init(data));
            assert.equal(scene[field], fallback);
        }
        scene.init({ fromScene: 'test-origin' });
        assert.equal(scene[field], 'test-origin');
    });
}

test('original HUD unregisters its registry observer on shutdown and reentry adds one listener', async () => {
    const { default: HUD } = await load('src/assets/UIScene.js');
    const hud = new HUD();
    const registry = new Map([['keysFound', 0]]);
    registry.events = new Events();
    Object.assign(hud, {
        registry,
        events: new Events(),
        cameras: { main: { width: 950, height: 540 } },
        add: { text: shape, image: shape, container: shape },
    });
    hud.create();
    assert.equal(registry.events.count('changedata-keysFound'), 1);
    registry.events.emit('changedata-keysFound', registry, 2);
    assert.equal(hud.keyUiText.text, '2/3');
    hud.events.emit('shutdown');
    assert.equal(registry.events.count('changedata-keysFound'), 0);
    registry.events.emit('changedata-keysFound', registry, 3);
    assert.equal(hud.keyUiText.text, '2/3');
    hud.create();
    assert.equal(registry.events.count('changedata-keysFound'), 1);
    hud.events.emit('shutdown');
    assert.equal(registry.events.count('changedata-keysFound'), 0);
});

test('memory final level awards once and duplicate completion cannot restart the reward', () => {
    const memory = new Memory();
    const registry = new Map([['keysFound', 2]]);
    let rewards = 0;
    Object.assign(memory, {
        registry,
        selectionRect: shape(),
        statusText: shape(),
        input: { keyboard: { resetKeys() {} } },
        dialogueBox: {
            startSequence(_key, callback) {
                callback();
                callback();
            },
        },
        playKeyRewardEffect() {
            rewards++;
        },
    });
    memory.init({ level: 3 });
    memory.nextLevel();
    assert.equal(registry.get('keysFound'), 3);
    assert.equal(registry.get('masterGameWon'), true);
    const firstRewardCount = rewards;
    memory.nextLevel();
    assert.equal(rewards, firstRewardCount);
    memory.init({ level: 3 });
    memory.nextLevel();
    assert.equal(registry.get('keysFound'), 3);
});

test('memory intermediate completion schedules one restart at the next level', () => {
    const memory = new Memory();
    memory.init({ level: 1 });
    const restarts = [];
    memory.scene = { restart: (data) => restarts.push(data.level) };
    memory.nextLevel();
    memory.nextLevel();
    assert.deepEqual(restarts, [2]);
});

test('original virtual joypad reinitialization disposes listeners and blur resets movement', async () => {
    const buttons = Object.fromEntries(
        ['btn-up', 'btn-down', 'btn-left', 'btn-right', 'btn-a', 'btn-b'].map((name) => {
            const classes = new Set();
            return [
                name,
                Object.assign(new Events(), {
                    classes,
                    classList: {
                        add: (key) => classes.add(key),
                        remove: (key) => classes.delete(key),
                    },
                }),
            ];
        }),
    );
    const window = Object.assign(new Events(), { clearTimeout() {}, setTimeout: () => 1 });
    const document = Object.assign(new Events(), {
        getElementById: (id) => buttons[id],
        querySelectorAll: () => Object.values(buttons),
    });
    const mod = await moduleLoader({ document, window })('src/assets/VirtualJoypad.js');
    const firstDispose = mod.initVirtualJoypad();
    const dispose = mod.initVirtualJoypad();
    assert.equal(buttons['btn-left'].count('pointerdown'), 1);
    assert.equal(window.count('blur'), 1);
    buttons['btn-left'].emit('pointerdown', { preventDefault() {} });
    assert.equal(mod.joypad.left, true);
    window.emit('blur');
    assert.equal(mod.joypad.left, false);
    assert.equal(buttons['btn-left'].classes.size, 0);
    firstDispose();
    assert.equal(window.count('blur'), 1);
    dispose();
    dispose();
    assert.equal(window.count('blur'), 0);
    assert.equal(buttons['btn-left'].count('pointerdown'), 0);
});
