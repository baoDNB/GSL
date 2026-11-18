import test from 'node:test';
import assert from 'node:assert/strict';
import { moduleLoader, Events, shape } from './module-loader.mjs';

const Phaser = {
    Input: {
        Keyboard: {
            KeyCodes: { E: 'E' },
            JustDown(key) {
                const pressed = key.pressed;
                key.pressed = false;
                return Boolean(pressed);
            },
        },
    },
};

async function controlsHarness() {
    const buttons = Object.fromEntries(
        ['action', 'left', 'right', 'up', 'down', 'back'].map((name) => {
            const button = new Events();
            button.dataset = { input: name };
            button.classes = new Set();
            button.classList = {
                add: (key) => button.classes.add(key),
                remove: (key) => button.classes.delete(key),
            };
            button.setPointerCapture = () => {};
            return [name, button];
        }),
    );
    const document = Object.assign(new Events(), {
        hidden: false,
        querySelectorAll: () => Object.values(buttons),
    });
    const window = new Events();
    let keys;
    let resets = 0;
    const events = new Events();
    const scene = {
        events,
        input: {
            keyboard: {
                addKeys(names) {
                    keys = Object.fromEntries(
                        names.split(',').map((name) => [name, { isDown: false, pressed: false }]),
                    );
                    return keys;
                },
                resetKeys() {
                    resets++;
                    for (const key of Object.values(keys)) {
                        key.pressed = false;
                        key.isDown = false;
                    }
                },
            },
        },
    };
    const { Controls } = await moduleLoader(
        { document, window },
        { phaser: { default: Phaser } },
    )('src/christmas/controls.js');
    const controls = new Controls(scene);
    return {
        controls,
        keys,
        buttons,
        events,
        document,
        window,
        resets: () => resets,
        pointer(name, type, id, button = 0) {
            buttons[name].emit(type, { pointerId: id, button, preventDefault() {} });
        },
    };
}

test('two fingers on one action retain held state until the last release', async () => {
    const h = await controlsHarness();
    h.pointer('action', 'pointerdown', 1);
    assert.equal(h.controls.read().action, true);
    h.pointer('action', 'pointerdown', 2);
    assert.equal(h.controls.read().action, false);
    h.pointer('action', 'pointerup', 1);
    assert.equal(h.controls.held.has('action'), true);
    assert.equal(h.buttons.action.classes.has('is-pressed'), true);
    h.pointer('action', 'pointerup', 2);
    assert.equal(h.controls.held.has('action'), false);
    assert.equal(h.buttons.action.classes.has('is-pressed'), false);
});

test('equivalent simultaneous action keys are consumed in the same frame', async () => {
    const h = await controlsHarness();
    h.keys.E.pressed = true;
    h.keys.SPACE.pressed = true;
    assert.equal(h.controls.read().action, true);
    assert.equal(h.controls.read().action, false);
});

test('direction taps are one-shot while held movement lasts until release', async () => {
    const h = await controlsHarness();
    h.pointer('right', 'pointerdown', 1);
    assert.equal(h.controls.read().right, true);
    const next = h.controls.read();
    assert.equal(next.right, false);
    assert.equal(next.x, 1);
    h.pointer('right', 'pointercancel', 1);
    assert.equal(h.controls.read().x, 0);
    h.pointer('left', 'pointerdown', 2, 2);
    assert.equal(h.controls.read().x, 0);
});

test('window blur and hidden document clear keyboard, pointer, tap and pressed state', async () => {
    const h = await controlsHarness();
    h.pointer('up', 'pointerdown', 1);
    h.keys.E.pressed = true;
    h.document.hidden = true;
    h.document.emit('visibilitychange');
    assert.equal(h.controls.read().y, 0);
    assert.equal(h.controls.read().action, false);
    assert.equal(h.controls.pointers.size, 0);
    assert.equal(h.buttons.up.classes.size, 0);
    h.pointer('left', 'pointerdown', 2);
    h.window.emit('blur');
    assert.equal(h.controls.read().x, 0);
    assert.equal(h.resets(), 2);
});

test('assistive/keyboard click activates action but pointer click does not duplicate it', async () => {
    const h = await controlsHarness();
    h.buttons.action.emit('click', { detail: 0 });
    assert.equal(h.controls.read().action, true);
    assert.equal(h.controls.read().action, false);
    h.buttons.action.emit('click', { detail: 1 });
    assert.equal(h.controls.read().action, false);
});

test('scene shutdown removes all external control listeners and clears movement', async () => {
    const h = await controlsHarness();
    h.pointer('left', 'pointerdown', 2);
    h.events.emit('shutdown');
    assert.equal(h.window.count('blur'), 0);
    assert.equal(h.document.count('visibilitychange'), 0);
    for (const button of Object.values(h.buttons)) {
        for (const event of [
            'pointerdown',
            'pointerup',
            'pointercancel',
            'lostpointercapture',
            'click',
        ]) {
            assert.equal(button.count(event), 0);
        }
    }
    assert.equal(h.controls.read().x, 0);
});

async function dialogueHarness(customGameDialogues) {
    const joypad = { actionA: false };
    const scene = {
        events: new Events(),
        input: Object.assign(new Events(), { keyboard: { addKey: () => ({ pressed: false }) } }),
        add: { rectangle: shape, text: shape },
        time: { now: 100 },
        game: { loop: { frame: 1 } },
        player: { isTalking: false, body: {}, setVelocity() {} },
    };
    const { default: DialogueBox } = await moduleLoader(
        { window: { customGameDialogues } },
        {
            phaser: { default: Phaser },
            '../assets/VirtualJoypad.js': { joypad },
        },
    )('src/objects/DialogueBox.js');
    return { box: new DialogueBox(scene), scene, joypad };
}

test('dialogue opening action cannot skip first node and same-frame advances collapse', async () => {
    const { box, scene } = await dialogueHarness();
    box.startSequence([{ text: 'first' }, { text: 'second' }]);
    box.next();
    assert.equal(box.index, 0);
    assert.equal(scene.player.isTalking, true);
    scene.game.loop.frame++;
    box.next();
    box.next();
    assert.equal(box.index, 1);
    assert.match(box.text.text, /second/);
});

test('dialogue completion callback runs exactly once and unlocks player', async () => {
    const { box, scene, joypad } = await dialogueHarness();
    let completed = 0;
    box.startSequence([{ text: 'one' }], () => completed++);
    joypad.actionA = true;
    scene.game.loop.frame++;
    box.next();
    scene.game.loop.frame++;
    box.next();
    box.showNode();
    assert.equal(completed, 1);
    assert.equal(box.isShowing, false);
    assert.equal(scene.player.isTalking, false);
    assert.equal(joypad.actionA, false);
    assert.equal(scene.input.count('pointerdown'), 0);
});

test('malformed stored dialogue falls back to authored nodes and malformed direct nodes finish safely', async () => {
    const { box, scene } = await dialogueHarness({ foundKey: [null, { text: 9 }] });
    box.startSequence('foundKey');
    assert.equal(box.dialogues.length, 2);
    assert.equal(box.isShowing, true);
    box.hide();
    let completed = 0;
    box.startSequence([null, { text: 9 }], () => completed++);
    assert.equal(completed, 1);
    assert.equal(box.isShowing, false);
    assert.equal(scene.player.isTalking, false);
});

test('dialogue shutdown unregisters update and pointer listeners without completing abandoned sequence', async () => {
    const { box, scene } = await dialogueHarness();
    let completed = 0;
    box.startSequence([{ text: 'abandoned' }], () => completed++);
    assert.equal(scene.events.count('update'), 1);
    assert.equal(scene.input.count('pointerdown'), 1);
    scene.events.emit('shutdown');
    assert.equal(scene.events.count('update'), 0);
    assert.equal(scene.input.count('pointerdown'), 0);
    assert.equal(box.onComplete, null);
    assert.equal(completed, 0);
});
