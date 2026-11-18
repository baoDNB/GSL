import Phaser from 'phaser';
export const W = 950,
    H = 680;
// Phông chữ ưu tiên hỗ trợ đầy đủ dấu tiếng Việt trên mọi hệ điều hành
export const FONT = '"Be Vietnam Pro", "Segoe UI", system-ui, -apple-system, Arial, sans-serif';
export const DISPLAY_FONT = '"VT323", "Courier New", monospace';

export function text(scene, x, y, value, size = 16, color = '#fff2cf') {
    // Giảm viền chữ ở cỡ nhỏ để không làm bít nét các chữ cái tiếng Việt (e, a, 0, ă, ê...)
    const strokeThickness = size >= 24 ? 1 : 0;
    const t = scene.add
        .text(x, y, value, {
            fontFamily: FONT,
            fontSize: `${size}px`,
            fontStyle: size <= 14 ? '500' : '600',
            color,
            stroke: '#142a25',
            strokeThickness,
            lineSpacing: 6,
            resolution: 2,
            padding: { top: 4, bottom: 5, left: 4, right: 4 },
        })
        .setDepth(20);
    // Giữ lọc tuyến tính (LINEAR) cho texture chữ để chữ không bị răng cưa khi bật pixelArt: true
    t.texture?.setFilter(Phaser.Textures.FilterMode.LINEAR);
    const origSetText = t.setText.bind(t);
    t.setText = (...args) => {
        origSetText(...args);
        t.texture?.setFilter(Phaser.Textures.FilterMode.LINEAR);
        return t;
    };
    return t;
}
export function button(scene, x, y, label, callback, width = 250, color = 0x943f3b) {
    const box = scene.add
        .rectangle(x, y, width, 42, color)
        .setStrokeStyle(1, 0xdac28a)
        .setInteractive({ useHandCursor: true });
    const labelText = text(scene, x, y, label, 14).setOrigin(0.5).setDepth(0);
    const group = scene.add.container(0, 0, [box, labelText]).setDepth(120);
    let selected = false;
    group.setSelected = (value) => {
        selected = value;
        box.setFillStyle(selected ? 0x9b4b3f : color);
        box.setStrokeStyle(selected ? 2 : 1, selected ? 0xf9d888 : 0xdac28a);
        return group;
    };
    box.on('pointerover', () => {
        box.setFillStyle(0x49634b);
        group.emit('focus');
    });
    box.on('pointerout', () => group.setSelected(selected));
    box.on('pointerdown', callback);
    group.setLayout = (x, y, width, height, fontSize) => {
        box.setPosition(x, y).setSize(width, height);
        // Rectangle geometry and its pointer hit area must grow together.
        box.input.hitArea.setTo(0, 0, width, height);
        labelText.setPosition(x, y).setFontSize(fontSize);
        return group;
    };
    return group;
}
export function star(g, x, y, size, color = 0xffdc80) {
    g.fillStyle(color).fillPoints(
        [
            { x, y: y - size },
            { x: x + size * 0.3, y: y - size * 0.3 },
            { x: x + size, y },
            { x: x + size * 0.3, y: y + size * 0.3 },
            { x, y: y + size },
            { x: x - size * 0.3, y: y + size * 0.3 },
            { x: x - size, y },
            { x: x - size * 0.3, y: y - size * 0.3 },
        ],
        true,
    );
}
export function snow(scene, count = 65) {
    const flakes = Array.from({ length: count }, () =>
        scene.add
            .rectangle(
                Math.random() * W,
                Math.random() * H,
                Math.random() < 0.8 ? 2 : 4,
                3,
                0xf5ffff,
                0.35 + Math.random() * 0.5,
            )
            .setDepth(16),
    );
    const tick = (_time, delta) =>
        flakes.forEach((f, i) => {
            f.y += delta * (0.014 + (i % 4) * 0.006);
            f.x += delta * 0.007;
            if (f.y > H) {
                f.y = -5;
                f.x = Math.random() * W;
            }
            if (f.x > W) f.x = 0;
        });
    scene.events.on('update', tick);
    scene.events.once('shutdown', () => scene.events.off('update', tick));
}
export function background(scene, key, winter = false) {
    scene.add
        .image(W / 2, H / 2, key)
        .setDisplaySize(W, H)
        .setDepth(0);
    if (winter) snow(scene);
}
export function warmLight(scene, x, y, size = 180) {
    if (!scene.textures.exists('holiday-soft-light')) {
        const texture = scene.textures.createCanvas('holiday-soft-light', 256, 256),
            ctx = texture.context;
        const glow = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
        glow.addColorStop(0, 'rgba(255,205,107,.85)');
        glow.addColorStop(0.35, 'rgba(255,184,70,.3)');
        glow.addColorStop(1, 'rgba(255,172,55,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, 256, 256);
        texture.refresh();
    }
    return scene.add
        .image(x, y, 'holiday-soft-light')
        .setDisplaySize(size, size)
        .setDepth(1)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setAlpha(0.18);
}
export function burst(scene, x, y) {
    for (let i = 0; i < 24; i++) {
        const dot = scene.add.rectangle(x, y, 4, 4, i % 2 ? 0xffdc80 : 0xf9eee0).setDepth(200);
        const angle = (i / 24) * Math.PI * 2;
        scene.tweens.add({
            targets: dot,
            x: x + Math.cos(angle) * 120,
            y: y + Math.sin(angle) * 100,
            alpha: 0,
            duration: 1200,
            onComplete: () => dot.destroy(),
        });
    }
}
