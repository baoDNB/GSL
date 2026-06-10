import Player from '../objects/Player.js';
import ArrowGraphic from '../assets/ArrowGraphic.js';
import DialogueBox from '../objects/DialogueBox.js';

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

        this.obstacles = this.physics.add.staticGroup();
        this.sofa1 = this.add.zone(screenWidth * 0.3, screenHeight * 0.73, screenWidth * 0.1, screenHeight * 0.2).setOrigin(0);
        this.obstacles.add(this.sofa1);

        this.table = this.add.zone(screenWidth * 0.4, screenHeight * 0.45, screenWidth * 0.18, screenHeight * 0.2).setOrigin(0);
        this.obstacles.add(this.table);

        this.sofa2 = this.add.zone(screenWidth * 0.65, screenHeight * 0.65, screenWidth * 0.14, screenHeight * 0.2).setOrigin(0);
        this.obstacles.add(this.sofa2);

        this.dialogueBox = new DialogueBox(this);
        this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

        this.tableX = (screenWidth * 0.4) + (screenWidth * 0.18) / 2;
        this.tableY = (screenHeight * 0.45) + (screenHeight * 0.2) / 2 - 20; // Nhích lên trên một chút cho đẹp

        this.exclamationTable = this.add.text(this.tableX, this.tableY, '!', {
            fontSize: '28px',
            fill: '#ffcc00',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(1005);

        // Hiệu ứng nhấp nháy nhún nhảy cho dấu !
        this.tweens.add({
            targets: this.exclamationTable,
            y: this.tableY - 12,
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
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


        this.physics.world.setBounds(300, 175, screenWidth - 50, screenHeight - 190);
        if (this.player.body) {
            this.player.setCollideWorldBounds(true);
        }
        this.physics.add.collider(this.player, this.obstacles);



    }

    update() {
        if (!this.player) return;
        this.player.update();

        // LOGIC KHOẢNG CÁCH TƯƠNG TÁC BÀN PHÒNG KHÁCH
        if (this.exclamationTable && this.exclamationTable.active) {
            // Nếu đang mở hộp thoại thì dừng đổi màu dấu ! để tránh xung đột phím
            if (this.dialogueBox && this.dialogueBox.isDialogueActive) return;

            let dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.tableX, this.tableY);

            if (dist < 80) {
                this.exclamationTable.setFill('#00ff00'); // Đổi sang màu xanh lá khi đứng gần

                if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
                    this.handleTableInteraction();
                }
            } else {
                this.exclamationTable.setFill('#ffcc00'); // Trả lại màu vàng khi đi xa
            }
        }
    }

    handleTableInteraction() {
        if (this.player.isTalking) return;

        // Đóng băng nhân vật
        this.player.setVelocity(0, 0);
        if (this.player.anims) this.player.anims.stop();
        this.player.isTalking = true;

        // Gọi thoại tương tác bàn phòng khách
        this.dialogueBox.startSequence('livingRoomTable', () => {
            this.player.isTalking = false;

            // ĐỔI SANG NÚT A: Đổi phím lật chữ của DialogueBox sang phím A cho lần tương tác sau
            if (this.dialogueBox.keyE) {
                this.dialogueBox.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
            }

            // Xóa sạch bộ nhớ đệm phím kẹt để tránh nhân vật bị tự động di chuyển sau khi xem xong
            this.input.keyboard.resetKeys();
        });
    }
}