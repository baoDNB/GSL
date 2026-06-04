import Player from '../objects/Player.js';

export default class RoomMasterScene extends Phaser.Scene {
    constructor() { super('RoomMasterScene'); }

    init(data) {
        this.spawnDirection = data.fromScene || 'default';
    }

    create() {
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;

        // 1. Thêm nền 
        let bg = this.add.image(0, 0, 'roommaster_bg').setOrigin(0);
        bg.displayWidth = screenWidth;
        bg.displayHeight = screenHeight;




        // 2. Tạo Player ở giữa phòng
        this.player = new Player(this, screenWidth * 0.5, screenHeight * 0.9);

        // 3. Vùng chạm lên Hành Lang (Góc trên bên phải)
        this.toHallwayZone = this.add.zone(screenWidth * 0.49, screenHeight * 1, screenWidth * 0.19, screenHeight * 0.05).setOrigin(0.5);
        this.physics.add.existing(this.toHallwayZone, true);
        this.physics.add.overlap(this.player, this.toHallwayZone, () => {
            this.scene.start('HallwayScene', { fromScene: 'fromMasterRoom' });
        });

    }

    update() {
        if (this.player) this.player.update();
    }
}