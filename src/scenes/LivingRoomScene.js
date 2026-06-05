import Player from '../objects/Player.js';
import ArrowGraphic from '../assets/ArrowGraphic.js';

export default class LivingRoomScene extends Phaser.Scene {
    constructor() { super('LivingRoomScene'); }

    init(data) {
        this.spawnDirection = data.fromScene || 'default';
    }

    create() {
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;

        // 1. Thêm nền 
        let bg = this.add.image(0, 0, 'livingroom_bg').setOrigin(0);
        bg.displayWidth = screenWidth;
        bg.displayHeight = screenHeight;


        // 2. Tạo Player ở giữa phòng
        let spawnX = screenWidth * 0.9;
        let spawnY = screenHeight * 0.5;

        if (this.spawnDirection === 'fromKitchen') {
            spawnX = screenWidth * 0.9;
            spawnY = screenHeight * 0.9;
        } else if (this.spawnDirection === 'fromHallway') {
            spawnX = screenWidth * 0.9;
            spawnY = screenHeight * 0.3;
        }
        this.player = new Player(this, spawnX, spawnY);

        this.arrowHallway = ArrowGraphic.createArrowRight(this, screenWidth * 0.9, screenHeight * 0.3)
        this.tweens.add({
            targets: this.arrowHallway,
            x: this.arrowHallway.x - 10,
            duration: 500,
            yoyo: true,
            repeat: -1
        });


        this.arrowKitchen = ArrowGraphic.createArrowRight(this, screenWidth * 0.9, screenHeight * 0.9)
        this.tweens.add({
            targets: this.arrowKitchen,
            y: this.arrowKitchen.y - 10,
            duration: 500,
            yoyo: true,
            repeat: -1
        });

        // 3. Vùng chạm đi xuống Bếp (Cạnh dưới bên phải)
        this.toKitchenZone = this.add.zone(screenWidth * 1, screenHeight * 0.9, screenWidth * 0.1, 100).setOrigin(0.5);
        this.physics.add.existing(this.toKitchenZone, true); // True = Static Body (đứng im)

        this.physics.add.overlap(this.player, this.toKitchenZone, () => {
            this.scene.start('KitchenScene', { fromScene: 'LivingRoomScene' });
        });

        // 4. Vùng chạm lên Hành Lang (Góc trên bên phải)
        this.toHallwayZone = this.add.zone(screenWidth * 1, screenHeight * 0.3, 100, screenHeight * 0.2).setOrigin(0.5);
        this.physics.add.existing(this.toHallwayZone, true); // True = Static Body (đứng im)
        this.physics.add.overlap(this.player, this.toHallwayZone, () => {
            this.scene.start('HallwayScene', { fromScene: 'LivingRoomScene' });
        });

    }

    update() {
        if (this.player) this.player.update();
    }
}