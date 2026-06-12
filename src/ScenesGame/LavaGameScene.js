import Player from '../objects/Player.js';
import DialogueBox from '../objects/DialogueBox.js';


export default class LavaGameScene extends Phaser.Scene {
    constructor() {
        super('LavaGameScene');
    }

    init(data) {
        this.spawnDirection = data.fromScene || 'default';
    }

    create() {
        this.input.enabled = true;

        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;

        this.isGameOver = false;

        // 1. Thêm nền dung nham phủ đầy màn hình
        let bg = this.add.image(0, 0, 'lavagame_bg').setOrigin(0);
        bg.displayWidth = screenWidth;
        bg.displayHeight = screenHeight;

        // 2. KHỞI TẠO CÁC VÙNG GỖ AN TOÀN THEO TỶ LỆ % MÀN HÌNH (Đã sửa lỗi lệch)
        this.safeZones = this.add.group();

        this.createSafeZone(screenWidth * 0.78, screenHeight * 0.2, screenWidth * 0.3, screenHeight * 0.3);
        this.createSafeZone(screenWidth * 0.85, screenHeight * 0.4, screenWidth * 0.2, screenHeight * 0.3);
        this.createSafeZone(screenWidth * 0.7, screenHeight * 0.40, screenWidth * 0.15, screenHeight * 0.1);
        this.createSafeZone(screenWidth * 0.47, screenHeight * 0.5, screenWidth * 0.3, screenHeight * 0.1);
        this.createSafeZone(screenWidth * 0.24, screenHeight * 0.6, screenWidth * 0.3, screenHeight * 0.1);
        this.createSafeZone(screenWidth * 0.16, screenHeight * 0.5, screenWidth * 0.15, screenHeight * 0.1);
        this.createSafeZone(screenWidth * 0.085, screenHeight * 0.4, screenWidth * 0.15, screenHeight * 0.1);

        // 🚨 3. TẠO Ô GỖ GIẢ ĐỂ CHE CHÌA KHÓA CỦA ẢNH NỀN GỐC
        const lastZoneX = screenWidth * 0.08;
        const lastZoneY = screenHeight * 0.3;
        const lastZoneW = screenWidth * 0.075;
        const lastZoneH = screenHeight * 0.1;
        this.createSafeZone(lastZoneX, lastZoneY, lastZoneW, lastZoneH);

        // 🚨 3. TẠO Ô GỖ GIẢ ĐỂ CHE CHÌA KHÓA CỦA ẢNH NỀN GỐC
        // Đặt miếng gỗ giả vừa khít với ô an toàn cuối cùng, dùng chung Origin(0) để không bị lệch tâm
        let woodCover = this.add.rectangle(lastZoneX, lastZoneY, lastZoneW, lastZoneH, 0x3d2314)
            .setOrigin(0)
            .setDepth(5);
        woodCover.setStrokeStyle(2, 0x24150c);

        // 🚨 4. TẠO ĐỐI TƯỢNG CHÌA KHÓA THẬT (Đặt chính giữa ô gỗ giả)
        const keyX = lastZoneX + (lastZoneW / 2);
        const keyY = lastZoneY + (lastZoneH / 2);
        this.keyItem = this.add.image(keyX, keyY, 'key_sprite').setScale(1).setDepth(10);

        this.tweens.add({
            targets: this.keyItem,
            alpha: 0.4,
            duration: 500,
            yoyo: true,
            repeat: -1
        });

        // 5. Đặt vị trí xuất phát cho Player ở thềm đá bên phải
        const spawnX = screenWidth * 0.80;
        const spawnY = screenHeight * 0.42;

        this.player = new Player(this, spawnX, spawnY);
        this.player.setDepth(15);
        //6
        this.dialogueBox = new DialogueBox(this);


    }

    /**
     * Hàm phụ trợ vẽ các vùng an toàn tàng hình đè lên mặt gỗ
     */
    createSafeZone(x, y, width, height) {
        // Tạo hình chữ nhật tàng hình (Alpha = 0). Nếu muốn debug xem vị trí chuẩn chưa, bạn đổi 0 thành 0.4
        let zone = this.add.rectangle(x, y, width, height, 0x00ff00, 0)
            .setOrigin(0);

        // Kích hoạt vật lý dạng tĩnh để không bị rơi hoặc di chuyển
        this.physics.add.existing(zone, true);
        this.safeZones.add(zone);
    }

    update() {
        if (this.isGameOver) return;

        if (this.player) {
            this.player.update();

            // 🚨 LOGIC KIỂM TRA RƠI XUỐNG DUNG NHAM
            let onSafeGround = false;

            // Lấy tọa độ điểm chân của nhân vật (vị trí tiếp xúc đất thực tế)
            // Nếu class Player của bạn không có body.height, sử dụng this.player.y
            let playerFootX = this.player.x;
            let playerFootY = this.player.body ? this.player.y + (this.player.body.height / 2) : this.player.y;

            // Duyệt qua toàn bộ các vùng gỗ an toàn để check xem chân Player có nằm trong vùng nào không
            this.safeZones.getChildren().forEach((zone) => {
                if (zone.getBounds().contains(playerFootX, playerFootY)) {
                    onSafeGround = true;
                }
            });

            // Nếu bước hụt ra ngoài mặt gỗ -> Chạm vào Lava -> Thua cuộc!
            if (!onSafeGround) {
                this.triggerLavaFail();
            }

            // 🚨 LOGIC KIỂM TRA NHẬN CHÌA KHÓA ĐỂ THẮNG CUỘC
            if (this.keyItem && this.keyItem.active) {
                let distanceToKey = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.keyItem.x, this.keyItem.y);
                if (distanceToKey < 30) {
                    this.triggerWinGame();
                }
            }
        }
        this.cameras.main.fadeIn(1200, 0, 0, 0);

    }

    /**
     * Xử lý khi rơi vào dung nham: Dừng chuyển động, nháy đỏ màn hình và reset game
     */
    triggerLavaFail() {
        this.isGameOver = true;

        if (this.player && this.player.body) {
            this.player.setVelocity(0, 0);
            if (typeof this.player.anims !== 'undefined') this.player.anims.stop();
        }

        // Hiệu ứng camera flash màu đỏ báo cháy bỏng dung nham
        this.cameras.main.flash(400, 255, 0, 0);

        // Đợi 600ms sau hiệu ứng flash thì tự động khởi động lại màn chơi hiện tại
        this.time.delayedCall(600, () => {
            this.scene.restart();
        });
    }

    /**
     * Xử lý khi nhặt được chìa khóa thành công
     */
    /**
         * Xử lý khi nhặt được chìa khóa thành công (Đã sửa lỗi lag đứng hình)
         */
    /**
         * Xử lý khi nhặt được chìa khóa thành công (Bắt buộc chạy qua hội thoại)
         */
    triggerWinGame() {
        this.isGameOver = true;

        // --- BẮT BUỘC THÊM ĐOẠN NÀY ---
        // 1. Đánh dấu đã thắng game
        this.registry.set('lavaGameWon', true);

        // 2. Tăng số lượng chìa khóa trong bộ nhớ chung
        let currentKeys = this.registry.get('keysFound') || 0;
        this.registry.set('keysFound', currentKeys + 1);
        // -------------------------------

        if (this.keyItem) {
            this.keyItem.destroy();
        }

        if (this.player && this.player.body) {
            this.player.setVelocity(0, 0);
            if (this.player.anims) this.player.anims.stop();
        }

        this.cameras.main.flash(500, 241, 196, 15);

        this.time.delayedCall(600, () => {
            if (this.player) this.player.isTalking = true;

            if (this.dialogueBox && typeof this.dialogueBox.startSequence === 'function') {
                this.dialogueBox.startSequence('foundKey', () => {
                    if (this.player) this.player.isTalking = false;

                    // Chuyển sang Hallway thay vì LivingRoom
                    // Vì bạn muốn về Hallway trước để logic check "đã thắng" ở Hallway hoạt động
                    this.scene.start('LivingRoomScene', { fromScene: 'fromLavaGame' });
                });
            } else {
                this.scene.start('LivingRoomScene', { fromScene: 'fromLavaGame' });
            }
        });
    }

}
