// src/assets/VirtualJoypad.js

export const joypad = {
    up: false,
    down: false,
    left: false,
    right: false,
    axisX: 0,
    axisY: 0,
    actionA: false,
    actionB: false,
};

let disposeJoypad;
const pulseTimers = new Map();

export function pulseActionButton(buttonId = 'btn-a') {
    const btn = document.getElementById(buttonId);
    if (!btn) return;

    btn.classList.remove('is-pressed');
    void btn.offsetWidth;
    btn.classList.add('is-pressed');

    window.clearTimeout(pulseTimers.get(btn));
    pulseTimers.set(
        btn,
        window.setTimeout(() => {
            btn.classList.remove('is-pressed');
            pulseTimers.delete(btn);
        }, 120),
    );
}

export function initVirtualJoypad() {
    disposeJoypad?.();
    const handlers = [];
    const listen = (target, event, handler) => {
        target.addEventListener(event, handler);
        handlers.push([target, event, handler]);
    };
    const resetDirections = () => {
        joypad.up = false;
        joypad.down = false;
        joypad.left = false;
        joypad.right = false;
        joypad.axisX = 0;
        joypad.axisY = 0;
        joypad.actionA = false;
        joypad.actionB = false;
        document.querySelectorAll('.is-pressed').forEach((btn) => {
            btn.classList.remove('is-pressed');
        });
    };

    const bindButton = (htmlId, keyName) => {
        const btn = document.getElementById(htmlId);
        if (!btn) return;

        listen(btn, 'pointerdown', (e) => {
            e.preventDefault();
            joypad[keyName] = true;
            btn.classList.add('is-pressed');
        });

        listen(btn, 'pointerup', (e) => {
            e.preventDefault();
            joypad[keyName] = false;
            btn.classList.remove('is-pressed');
        });

        listen(btn, 'pointerout', (e) => {
            e.preventDefault();
            joypad[keyName] = false;
            btn.classList.remove('is-pressed');
        });

        listen(btn, 'pointercancel', (e) => {
            e.preventDefault();
            joypad[keyName] = false;
            btn.classList.remove('is-pressed');
        });
    };

    bindButton('btn-up', 'up');
    bindButton('btn-down', 'down');
    bindButton('btn-left', 'left');
    bindButton('btn-right', 'right');
    bindButton('btn-a', 'actionA');
    bindButton('btn-b', 'actionB');

    resetDirections();

    listen(window, 'keydown', (event) => {
        if (!event.repeat && event.key?.toLowerCase() === 'e') {
            pulseActionButton('btn-a');
        }
    });
    listen(window, 'blur', resetDirections);
    listen(document, 'visibilitychange', () => {
        if (document.hidden) resetDirections();
    });

    let disposed = false;
    const dispose = () => {
        if (disposed) return;
        disposed = true;
        handlers.forEach(([target, event, handler]) => target.removeEventListener(event, handler));
        pulseTimers.forEach((timer) => window.clearTimeout(timer));
        pulseTimers.clear();
        resetDirections();
        if (disposeJoypad === dispose) disposeJoypad = undefined;
    };
    disposeJoypad = dispose;
    return dispose;
}
