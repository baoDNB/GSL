import DialogueBox from '../objects/DialogueBox.js';
import Player from '../objects/Player.js';
import ArrowGraphic from '../assets/ArrowGraphic.js';
import { joypad } from '../assets/VirtualJoypad.js'; // 1. IMPORT JOYPAD

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

        this.wall1 = this.add.zone(screenWidth * 0.1, screenHeight * 0.85, screenWidth * 0.34, screenHeight * 0.5).setOrigin(0);
        this.obstacles.add(this.wall1);
        this.wall2 = this.add.zone(screenWidth * 0.56, screenHeight * 0.85, screenWidth * 0.34, screenHeight * 0.5).setOrigin(0);
        this.obstacles.add(this.wall2);

        // Khởi tạo Dialogue Box và phím tương tác
        this.dialogueBox = new DialogueBox(this);
        this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.keyEsc = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

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
        this.arrowLivingRoom = ArrowGraphic.createArrowDown(this, screenWidth * 0.5, screenHeight * 0.8);
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
        if (this.spawnDirection === 'LivingRoomScene') {
            if (this.player.anims) {
                this.player.anims.play('walk_up', true);
                this.player.anims.stop(); // Giữ nguyên frame đứng im hướng lên
            }
        }

        this.toLivingroomZone = this.add.zone(screenWidth * 0.5, screenHeight * 0.95, screenWidth * 0.1, 40).setOrigin(0.5);
        this.physics.add.existing(this.toLivingroomZone, true);

        // Xử lý dẫm chân vào vùng cửa phụ -> Chuyển Scene sang LivingRoomScene
        this.physics.add.overlap(this.player, this.toLivingroomZone, () => {
            if (this.dialogueBox && this.dialogueBox.visible) return; // Không chuyển cảnh khi đang thoại
            this.scene.start('LivingRoomScene', { fromScene: 'fromKitchen' });
        });

        // Thiết lập va chạm giữa người chơi và các vật cản trong bếp
        this.physics.add.collider(this.player, this.obstacles);

        // Giới hạn di chuyển của nhân vật trong khung bản đồ
        this.physics.world.setBounds(100, 45, screenWidth - 200, screenHeight - 10);
        if (this.player.body) {
            this.player.setCollideWorldBounds(true);
        }
        this.cameras.main.fadeIn(1500, 0, 0, 0);

    }

    update() {
        if (!this.player) return;
        this.player.update();

        const isActionA = Phaser.Input.Keyboard.JustDown(this.keyE) ||
            Phaser.Input.Keyboard.JustDown(this.keySpace) ||
            joypad.actionA;

        const isActionB = Phaser.Input.Keyboard.JustDown(this.keyEsc) ||
            joypad.actionB;

        // XỬ LÝ KHI ẤN NÚT HÀNH ĐỘNG A
        if (isActionA) {
            joypad.actionA = false; // Xóa ngay tín hiệu để không dính nút

            // ƯU TIÊN 1: Nếu hộp thoại ĐANG MỞ -> Nhấn để xem câu thoại tiếp theo
            if (this.dialogueBox && this.dialogueBox.visible) {
                this.dialogueBox.next(); // Hoặc hàm tương ứng chuyển thoại của bạn
                return; // Thoát hàm luôn, chặn hoàn toàn việc chạy tiếp xuống logic kích hoạt thoại mới bên dưới
            }

            // ƯU TIÊN 2: Nếu hộp thoại ĐANG ĐÓNG -> Kiểm tra khoảng cách vật thể để kích hoạt thoại mới
            // Kiểm tra tủ lạnh
            if (this.exclamationFridge && this.exclamationFridge.active) {
                let distFridge = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.fridgeX, this.fridgeY);
                if (distFridge < 80) {
                    this.handleInteraction('openFridge');
                    return;
                }
            }

            // Kiểm tra bàn ăn
            if (this.exclamationTable && this.exclamationTable.active) {
                let distTable = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.tableX, this.tableY);
                if (distTable < 95) {
                    this.handleInteraction('inspectTable');
                    return;
                }
            }
        }

        // ĐỔI MÀU DẤU CHẤM THAN DỰA TRÊN KHOẢNG CÁCH (Không phụ thuộc vào việc nhấn nút)
        if (this.exclamationFridge && this.exclamationFridge.active) {
            let distFridge = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.fridgeX, this.fridgeY);
            if (distFridge < 80) {
                this.exclamationFridge.setFill('#00ff00');
            } else {
                this.exclamationFridge.setFill('#ffcc00');
            }
        }

        if (this.exclamationTable && this.exclamationTable.active) {
            let distTable = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.tableX, this.tableY);
            if (distTable < 95) {
                this.exclamationTable.setFill('#00ff00');
            } else {
                this.exclamationTable.setFill('#ffcc00');
            }
        }
    }

    // Hàm tương tác dùng chung cho cả các vật thể
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
