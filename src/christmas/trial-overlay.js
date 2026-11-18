import { W, H, text, button } from './art.js';

// Overlays own their layout: they also work when revisiting a completed trial.
export function trialOverlay(scene, { title, body, count = '', action, onAction }) {
    const overlay = scene.add.container(0, 0).setDepth(1000);
    const shade = scene.add.rectangle(W / 2, H / 2, W, H, 0x10251f, 0.92).setInteractive();
    const panel = scene.add.rectangle(W / 2, H / 2, 660, 390, 0x234335).setStrokeStyle(2, 0xcab176);
    const heading = text(scene, W / 2, 210, title, 25, '#f4d897')
        .setName('overlay-heading')
        .setOrigin(0.5, 0)
        .setAlign('center');
    const description = text(scene, W / 2, 270, body, 17)
        .setName('overlay-description')
        .setOrigin(0.5, 0)
        .setAlign('center');
    const progress = text(scene, W / 2, 360, count, 12, '#b7cba5')
        .setName('overlay-progress')
        .setOrigin(0.5, 0)
        .setAlign('center');
    const next = button(scene, W / 2, 460, action, onAction, 440);
    next.setName('overlay-action');
    overlay.add([shade, panel, heading, description, progress, next]);
    const layout = () => {
        const compact = scene.game.canvas.getBoundingClientRect().width < 600;
        const width = compact ? 856 : 660;
        panel.setSize(width, compact ? 600 : 390);
        heading
            .setY(compact ? 104 : 204)
            .setFontSize(compact ? 34 : 25)
            .setWordWrapWidth(width - 80);
        description.setFontSize(compact ? 28 : 17).setWordWrapWidth(width - 96);
        description.y = heading.y + heading.height + (compact ? 24 : 16);
        progress.setFontSize(compact ? 24 : 12).setWordWrapWidth(width - 96);
        progress.y = description.y + description.height + 18;
        progress.setVisible(Boolean(count));
        next.setLayout(
            W / 2,
            compact ? 562 : 466,
            compact ? 716 : 460,
            compact ? 104 : 48,
            compact ? 28 : 15,
        );
    };
    layout();
    scene.scale.on('resize', layout);
    const detach = () => scene.scale.off('resize', layout);
    overlay.once('destroy', detach);
    scene.events.once('shutdown', detach);
    return overlay;
}
