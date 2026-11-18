import Phaser from 'phaser';
export class Controls {
    constructor(scene) {
        this.scene = scene;
        this.held = new Set();
        this.taps = new Set();
        this.pointers = new Map();
        this.keys = scene.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,E,ENTER,SPACE,ESC');
        this.handlers = [];
        document.querySelectorAll('[data-input]').forEach((button) => {
            const name = button.dataset.input;
            const down = (event) => {
                if (event.button !== 0) return;
                event.preventDefault();
                button.setPointerCapture?.(event.pointerId);
                if (!this.held.has(name)) this.taps.add(name);
                this.pointers.set(event.pointerId, name);
                this.held.add(name);
                button.classList.add('is-pressed');
            };
            const up = (event) => {
                event.preventDefault();
                this.pointers.delete(event.pointerId);
                if (![...this.pointers.values()].includes(name)) {
                    this.held.delete(name);
                    button.classList.remove('is-pressed');
                }
            };
            // Native keyboard/assistive activation emits a click without a pointer.
            const click = (event) => {
                if (event.detail === 0) this.taps.add(name);
            };
            [
                ['pointerdown', down],
                ['pointerup', up],
                ['pointercancel', up],
                ['lostpointercapture', up],
                ['click', click],
            ].forEach(([event, handler]) => {
                button.addEventListener(event, handler);
                this.handlers.push([button, event, handler]);
            });
        });
        this.blur = () => this.clear();
        this.visibility = () => {
            if (document.hidden) this.clear();
        };
        window.addEventListener('blur', this.blur);
        document.addEventListener('visibilitychange', this.visibility);
        scene.events.once('shutdown', () => {
            this.handlers.forEach(([el, event, handler]) => el.removeEventListener(event, handler));
            window.removeEventListener('blur', this.blur);
            document.removeEventListener('visibilitychange', this.visibility);
            this.clear();
        });
    }
    clear() {
        this.held.clear();
        this.taps.clear();
        this.pointers.clear();
        document.querySelectorAll('[data-input]').forEach((button) => {
            button.classList.remove('is-pressed');
        });
        this.scene.input.keyboard.resetKeys();
    }
    pressed(...names) {
        // Consume every equivalent key this frame, even if the first is pressed.
        return names.map((name) => Phaser.Input.Keyboard.JustDown(this.keys[name])).some(Boolean);
    }
    read() {
        const result = {
            x:
                Number(this.keys.RIGHT.isDown || this.keys.D.isDown || this.held.has('right')) -
                Number(this.keys.LEFT.isDown || this.keys.A.isDown || this.held.has('left')),
            y:
                Number(this.keys.DOWN.isDown || this.keys.S.isDown || this.held.has('down')) -
                Number(this.keys.UP.isDown || this.keys.W.isDown || this.held.has('up')),
            action: this.pressed('E', 'ENTER', 'SPACE') || this.taps.has('action'),
            back: this.pressed('ESC') || this.taps.has('back'),
            left: this.pressed('LEFT', 'A') || this.taps.has('left'),
            right: this.pressed('RIGHT', 'D') || this.taps.has('right'),
            up: this.pressed('UP', 'W') || this.taps.has('up'),
            down: this.pressed('DOWN', 'S') || this.taps.has('down'),
        };
        this.taps.clear();
        return result;
    }
}
