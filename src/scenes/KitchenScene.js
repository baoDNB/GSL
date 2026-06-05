import DialogueBox from '../objects/DialogueBox.js';
import Player from '../objects/Player.js';
import ArrowGraphic from '../assets/ArrowGraphic.js';

export default class KitchenScene extends Phaser.Scene {
    constructor() {
        super('KitchenScene');
    }

    init(data) {
        // Nhận dữ liệu từ Phòng Khách truyền sang
        this.spawnDirection = data.fromScene || 'default';
    }

    create() {
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;

        // Nền phòng bếp
        let bg = this.add.image(0, 0, 'kitchen_bg').setOrigin(0);
        bg.displayWidth = screenWidth;
        bg.displayHeight = screenHeight;

        // ==========================================
        // CÁC VÙNG CẢN VẬT THỂ (VẬT LÝ TĨNH)
        // ==========================================
        this.obstacles = this.physics.add.staticGroup();

        this.fridgeZone = this.add.zone(screenWidth * 0.15, screenHeight * 0.12, screenWidth * 0.1, screenHeight * 0.2).setOrigin(0);
        this.obstacles.add(this.fridgeZone);

        let microwaveObstacle = this.add.zone(screenWidth * 0.25, screenHeight * 0.17, screenWidth * 0.15, screenHeight * 0.15).setOrigin(0);
        this.obstacles.add(microwaveObstacle);

        this.toasterZone = this.add.zone(screenWidth * 0.4, screenHeight * 0.17, screenWidth * 0.4, screenHeight * 0.2).setOrigin(0);
        this.obstacles.add(this.toasterZone);

        let cabinetObstacle = this.add.zone(screenWidth * 0.09, screenHeight * 0.35, screenWidth * 0.08, screenHeight * 0.28).setOrigin(0);
        this.obstacles.add(cabinetObstacle);

        this.tableZone = this.add.zone(screenWidth * 0.36, screenHeight * 0.5, screenWidth * 0.25, screenHeight * 0.2).setOrigin(0);
        this.obstacles.add(this.tableZone);



        // Khởi tạo Dialogue Box (Hỗ trợ nếu cần chạy thoại cơ bản sau này)
        this.dialogueBox = new DialogueBox(this);

        this.arrowLivingRoom = ArrowGraphic.createArrowDown(this, screenWidth * 0.5, screenHeight * 0.8)
        this.tweens.add({
            targets: this.arrowLivingRoom,
            y: '+=10',
            duration: 500,
            yoyo: true,
            repeat: -1
        });
        // ==========================================
        // LOGIC CHUYỂN PHÒNG: ĐI RA PHÒNG KHÁCH
        // ==========================================
        let spawnX = screenWidth * 1;
        let spawnY = screenHeight / 2;

        if (this.spawnDirection === 'LivingRoomScene') {
            spawnX = screenWidth * 0.5;
            spawnY = screenHeight * 0.75;
        }
        this.player = new Player(this, spawnX, spawnY);

        this.toLivingroomZone = this.add.zone(screenWidth * 0.5, screenHeight * 0.87, screenWidth * 0.1, 40).setOrigin(0.5);
        this.physics.add.existing(this.toLivingroomZone, true);

        // Xử lý dẫm chân vào vùng cửa phụ -> Chuyển Scene sang LivingRoomScene
        this.physics.add.overlap(this.player, this.toLivingroomZone, () => {
            this.scene.start('LivingRoomScene', { fromScene: 'fromKitchen' });
        });

        // Thiết lập va chạm giữa người chơi và các vật cản trong bếp
        this.physics.add.collider(this.player, this.obstacles);

        // Giới hạn di chuyển của nhân vật trong khung bản đồ
        this.physics.world.setBounds(100, 45, screenWidth - 200, screenHeight - 130);
        if (this.player.body) {
            this.player.setCollideWorldBounds(true);
        }
    }

    update() {
        // Luôn cập nhật trạng thái di chuyển/diễn hoạt của nhân vật từ class Player
        if (this.player && typeof this.player.update === 'function') {
            this.player.update();
        }
    }
}
