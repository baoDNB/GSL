// src/assets/VirtualJoypad.js

// Đối tượng lưu trữ trạng thái phím
export const joypad = {
    up: false,
    down: false,
    left: false,
    right: false,
    actionA: false,
    actionB: false
};

// Hàm gắn sự kiện vào HTML
export function initVirtualJoypad() {
    const bindButton = (htmlId, keyName) => {
        const btn = document.getElementById(htmlId);
        if (!btn) return;

        // Dùng 'pointerdown/up/out' để bao gồm cả cảm ứng điện thoại và click chuột
        btn.addEventListener('pointerdown', (e) => { 
            e.preventDefault(); 
            joypad[keyName] = true; 
        });
        
        btn.addEventListener('pointerup', (e) => { 
            e.preventDefault(); 
            joypad[keyName] = false; 
        });
        
        btn.addEventListener('pointerout', (e) => { 
            e.preventDefault(); 
            joypad[keyName] = false; 
        });
    };

    bindButton('btn-up', 'up');
    bindButton('btn-down', 'down');
    bindButton('btn-left', 'left');
    bindButton('btn-right', 'right');
    bindButton('btn-a', 'actionA');
    bindButton('btn-b', 'actionB');
}