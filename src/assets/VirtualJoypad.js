// src/assets/VirtualJoypad.js

export const joypad = {
    up: false,
    down: false,
    left: false,
    right: false,
    axisX: 0,
    axisY: 0,
    actionA: false,
    actionB: false
};

export function pulseActionButton(buttonId = 'btn-a') {
    const btn = document.getElementById(buttonId);
    if (!btn) return;

    btn.classList.remove('is-pressed');
    void btn.offsetWidth;
    btn.classList.add('is-pressed');

    window.setTimeout(() => {
        btn.classList.remove('is-pressed');
    }, 120);
}

export function initVirtualJoypad() {
    const resetDirections = () => {
        joypad.up = false;
        joypad.down = false;
        joypad.left = false;
        joypad.right = false;
        joypad.axisX = 0;
        joypad.axisY = 0;
    };

    const bindButton = (htmlId, keyName) => {
        const btn = document.getElementById(htmlId);
        if (!btn) return;

        btn.addEventListener('pointerdown', (e) => {
            e.preventDefault();    
            joypad[keyName] = true;
            btn.classList.add('is-pressed');
        });

        btn.addEventListener('pointerup', (e) => {
            e.preventDefault();
            joypad[keyName] = false;
            btn.classList.remove('is-pressed');
        });

        btn.addEventListener('pointerout', (e) => {
            e.preventDefault();
            joypad[keyName] = false;
            btn.classList.remove('is-pressed');
        });

        btn.addEventListener('pointercancel', (e) => {
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

    window.addEventListener('keydown', (event) => {
        if (!event.repeat && event.key?.toLowerCase() === 'e') {
            pulseActionButton('btn-a');
        }
    });
}
