import Phaser from 'phaser';

export default class UIScene extends Phaser.Scene {
    constructor() {
        super('UIScene');
    }

    create() {
        const { width, height } = this.scale;

        const consoleFrame = this.add
            .image(width / 2, height / 2, 'retroconsole')
            .setDepth(100);

        consoleFrame.setDisplaySize(width, height);

        this.createZoneBtn(130, 420, 30, 'up');
        this.createZoneBtn(130, 520, 30, 'down');
        this.createZoneBtn(80, 470, 30, 'left');
        this.createZoneBtn(180, 470, 30, 'right');

        this.createZoneBtn(330, 480, 35, 'actionA');
        this.createZoneBtn(270, 530, 35, 'actionB');
    }

    createZoneBtn(x, y, radius, actionName) {

        const btn = this.add.zone(
            x,
            y,
            radius * 2,
            radius * 2
        );

        btn.setInteractive(
            new Phaser.Geom.Circle(radius, radius, radius),
            Phaser.Geom.Circle.Contains
        );

        btn.setDepth(101);

        btn.on('pointerdown', () => {
            this.game.events.emit(`mobile-input-${actionName}-down`);
        });

        btn.on('pointerup', () => {
            this.game.events.emit(`mobile-input-${actionName}-up`);
        });

        btn.on('pointerout', () => {
            this.game.events.emit(`mobile-input-${actionName}-up`);
        });
    }
}