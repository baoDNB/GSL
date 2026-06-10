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

        // BÀN ĂN (Vùng cản vật lý gốc của bạn)
        this.tableZone = this.add.zone(screenWidth * 0.36, screenHeight * 0.5, screenWidth * 0.25, screenHeight * 0.2).setOrigin(0);
        this.obstacles.add(this.tableZone);


        // Khởi tạo Dialogue Box và phím tương tác E
        this.dialogueBox = new DialogueBox(this);
        this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

        // ==========================================
        // TẠO DẤU CHẤM THAN (!) CHO TỦ LẠNH
        // ==========================================
        this.fridgeX = screenWidth * 0.2;
        this.fridgeY = screenHeight * 0.18;

        this.exclamationFridge = this.add.text(this.fridgeX, this.fridgeY, '!', {
            fontSize: '28px',
            fill: '#ffcc00',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(1005);

        this.tweens.add({
            targets: this.exclamationFridge,
            y: this.fridgeY - 12,
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // ==========================================
        // TẠO DẤU CHẤM THAN (!) CHO BÀN ĂN
        // ==========================================
        // Lấy vị trí trung tâm phía trên mặt bàn ăn một chút để đặt dấu !
        this.tableX = screenWidth * 0.485;
        this.tableY = screenHeight * 0.52;

        this.exclamationTable = this.add.text(this.tableX, this.tableY, '!', {
            fontSize: '28px',
            fill: '#ffcc00',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(1005);

        this.tweens.add({
            targets: this.exclamationTable,
            y: this.tableY - 12,
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });


        // Mũi tên hướng xuống đi ra phòng khách
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
            if (this.dialogueBox && this.dialogueBox.isDialogueActive) return; // Không chuyển cảnh khi đang thoại
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
        if (!this.player) return;
        this.player.update();

        // 1. XỬ LÝ LOGIC KHOẢNG CÁCH TẠI TỦ LẠNH
        if (this.exclamationFridge && this.exclamationFridge.active) {
            let distFridge = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.fridgeX, this.fridgeY);

            if (distFridge < 80) {
                this.exclamationFridge.setFill('#00ff00'); // Màu xanh lá báo hiệu bấm được

                if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
                    this.handleInteraction('openFridge');
                }
            } else {
                this.exclamationFridge.setFill('#ffcc00'); // Trả lại màu vàng
            }
        }

        // 2. XỬ LÝ LOGIC KHOẢNG CÁCH TẠI BÀN ĂN
        if (this.exclamationTable && this.exclamationTable.active) {
            let distTable = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.tableX, this.tableY);

            // Bàn ăn có kích thước to hơn tủ lạnh nên ta tăng khoảng cách kích hoạt lên 95px cho dễ bấm
            if (distTable < 95) {
                this.exclamationTable.setFill('#00ff00'); // Màu xanh lá báo hiệu bấm được

                if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
                    this.handleInteraction('inspectTable');
                }
            } else {
                this.exclamationTable.setFill('#ffcc00'); // Trả lại màu vàng
            }
        }
    }

    // Viết gọn lại hàm tương tác dùng chung cho cả 2 vật thể
    handleInteraction(dialogueKey) {
        if (this.player.isTalking) return;

        // Đóng băng nhân vật
        this.player.setVelocity(0, 0);
        if (this.player.anims) this.player.anims.stop();
        this.player.isTalking = true;

        // Kích hoạt chuỗi hội thoại dựa trên key truyền vào
        this.dialogueBox.startSequence(dialogueKey, () => {
            this.player.isTalking = false;
        });
    }
}