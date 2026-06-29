import Player from '../objects/Player.js';
import DialogueBox from '../objects/DialogueBox.js';
import Phaser from 'phaser';


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
        this.keyItem = this.add.image(keyX, keyY, 'key_icon_bg').setScale(0.05).setDepth(10);

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

                    this.registry.set('lavaGameWon', true);
                    let currentKeys = this.registry.get('keysFound') || 0;
                    this.registry.set('keysFound', currentKeys + 1);

                    this.playKeyRewardEffect(() => {
                        this.scene.start('HallwayScene', { fromScene: 'fromLavaGame' });
                    });
                });
            } else {
                this.registry.set('lavaGameWon', true);
                let currentKeys = this.registry.get('keysFound') || 0;
                this.registry.set('keysFound', currentKeys + 1);
                this.playKeyRewardEffect(() => {
                    this.scene.start('HallwayScene', { fromScene: 'fromLavaGame' });
                });
            }
        });
    }

    playKeyRewardEffect(onComplete) {
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;
        const rewardContainer = this.add.container(centerX, centerY).setDepth(2600);
        const overlay = this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.55);
        const glow = this.add.circle(0, -16, 58, 0xf1c40f, 0.28);
        const ring = this.add.circle(0, -16, 72, 0xf1c40f, 0).setStrokeStyle(3, 0xf1c40f, 0.9);
        const key = this.add.image(0, -18, 'key_icon_bg').setScale(0.18).setAngle(-18);
        const title = this.add.text(0, 70, 'KEY ACQUIRED', {
            fontSize: '22px',
            color: '#ffe066',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 5
        }).setOrigin(0.5);

        const sparklePoints = [
            [-84, -58], [82, -62], [-70, 38], [76, 34], [0, -96], [0, 26]
        ];
        const sparkles = sparklePoints.map(([x, y], index) => {
            const sparkle = this.add.star(x, y, 5, 4, 11, 0xffffff, 0.95)
                .setScale(0)
                .setAngle(index * 24);
            rewardContainer.add(sparkle);

            this.tweens.add({
                targets: sparkle,
                scale: { from: 0, to: 1 },
                alpha: { from: 0.2, to: 0 },
                angle: sparkle.angle + 120,
                duration: 650,
                delay: index * 80,
                ease: 'Sine.easeOut'
            });

            return sparkle;
        });

        rewardContainer.add([overlay, glow, ring, key, title]);
        rewardContainer.setAlpha(0);
        rewardContainer.setScale(0.7);

        this.tweens.add({
            targets: rewardContainer,
            alpha: 1,
            scale: 1,
            duration: 260,
            ease: 'Back.easeOut'
        });

        this.tweens.add({
            targets: key,
            y: -34,
            angle: 14,
            scale: 0.26,
            duration: 620,
            yoyo: true,
            repeat: 1,
            ease: 'Sine.easeInOut'
        });

        this.tweens.add({
            targets: ring,
            scale: { from: 0.55, to: 1.35 },
            alpha: { from: 1, to: 0 },
            duration: 900,
            repeat: 1,
            ease: 'Sine.easeOut'
        });

        this.tweens.add({
            targets: glow,
            scale: { from: 0.75, to: 1.25 },
            alpha: { from: 0.45, to: 0.15 },
            duration: 520,
            yoyo: true,
            repeat: 2,
            ease: 'Sine.easeInOut'
        });

        this.time.delayedCall(1650, () => {
            this.tweens.add({
                targets: rewardContainer,
                alpha: 0,
                scale: 0.92,
                duration: 240,
                ease: 'Sine.easeIn',
                onComplete: () => {
                    sparkles.forEach((sparkle) => sparkle.destroy());
                    rewardContainer.destroy();
                    if (onComplete) onComplete();
                }
            });
        });
    }

}
