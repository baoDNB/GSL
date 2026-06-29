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
    };

    bindButton('btn-up', 'up');
    bindButton('btn-down', 'down');
    bindButton('btn-left', 'left');
    bindButton('btn-right', 'right');
    bindButton('btn-a', 'actionA');
    bindButton('btn-b', 'actionB');

    const stickArea = document.querySelector('.dpad-cross');
    const stickKnob = document.querySelector('.dpad-center-pivot');
    const maxDistance = 36;
    const deadZone = 10;
    let activePointerId = null;

    const updateStick = (clientX, clientY) => {
        if (!stickArea || !stickKnob) return;

        const rect = stickArea.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dx = clientX - centerX;
        const dy = clientY - centerY;
        const distance = Math.hypot(dx, dy);
        const limitedDistance = Math.min(distance, maxDistance);
        const angle = Math.atan2(dy, dx);
        const knobX = Math.cos(angle) * limitedDistance;
        const knobY = Math.sin(angle) * limitedDistance;

        stickKnob.style.transform = `translate(${knobX}px, ${knobY}px)`;

        resetDirections();
        if (distance < deadZone) return;

        joypad.left = dx < -deadZone;
        joypad.right = dx > deadZone;
        joypad.up = dy < -deadZone;
        joypad.down = dy > deadZone;
        joypad.axisX = knobX / maxDistance;
        joypad.axisY = knobY / maxDistance;
    };

    const releaseStick = () => {
        activePointerId = null;
        resetDirections();
        if (stickKnob) {
            stickKnob.style.transform = 'translate(0, 0)';
        }
    };

    if (stickArea && stickKnob) {
        stickArea.addEventListener('pointerdown', (event) => {
            event.preventDefault();
            activePointerId = event.pointerId;
            stickArea.setPointerCapture(event.pointerId);
            stickArea.classList.add('is-dragging');
            updateStick(event.clientX, event.clientY);
        });

        stickArea.addEventListener('pointermove', (event) => {
            if (activePointerId !== event.pointerId) return;
            event.preventDefault();
            updateStick(event.clientX, event.clientY);
        });

        ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((eventName) => {
            stickArea.addEventListener(eventName, (event) => {
                if (activePointerId !== null && event.pointerId !== activePointerId) return;
                stickArea.classList.remove('is-dragging');
                releaseStick();
            });
        });
    }

    window.addEventListener('keydown', (event) => {
        if (!event.repeat && event.key?.toLowerCase() === 'e') {
            pulseActionButton('btn-a');
        }
    });
}
