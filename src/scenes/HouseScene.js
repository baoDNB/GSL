import Player from '../objects/Player.js';

export default class HouseScene extends Phaser.Scene {
    constructor() {
        super('HouseScene');
    }

    create() {
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;

        // 1. Thêm nền sân vườn (Bản đồ từ ảnh của bạn)
        let bg = this.add.image(0, 0, 'house_bg').setOrigin(0);
        bg.displayWidth = screenWidth;
        bg.displayHeight = screenHeight;

        // Bật cờ khóa bàn phím trong lúc đang chạy tự động đi
        this.isAutoWalking = true;

        // 2. Tạo Player đứng đúng vị trí góc dưới bên trái vỉa hè (như trong ảnh)
        const startX = screenWidth * 0.18; // Vị trí đứng ở vỉa hè bên trái
        const startY = screenHeight * 0.88; // Sát cạnh dưới cùng

        this.player = new Player(this, startX, startY);

        // 3. Tọa độ các điểm nút để nhân vật đi vào nhà
        // Điểm 1: Đi từ vỉa hè bên trái đến chân bậc tam cấp (giữa thảm cỏ)
        const stepsX = screenWidth * 0.6;
        const stepsY = screenHeight * 0.72;

        // Điểm 2: Đi thẳng từ bậc tam cấp vào trong cánh cửa đen
        const doorX = screenWidth * 0.6;
        const doorY = screenHeight * 0.42;

        // 4. Tạo chuỗi di chuyển tự động (Tweens Timeline)
        // Bước 1: Đi chéo từ vỉa hè đến trước bậc tam cấp
        this.tweens.add({
            targets: this.player,
            x: stepsX,
            y: stepsY,
            duration: 1800,
            ease: 'Linear',
            onStart: () => {
                if (this.player.anims && this.player.anims.exists('walk_up')) {
                    this.player.anims.play('walk_up', true);
                }
            },
            onComplete: () => {
                // Bước 2: Đi thẳng từ bậc tam cấp khuất vào cánh cửa đen (Chạy ngay sau khi Bước 1 xong)
                this.tweens.add({
                    targets: this.player,
                    x: doorX,
                    y: doorY,
                    duration: 800,
                    ease: 'Linear',
                    onComplete: () => {
                        // Khi đã bước hẳn vào cửa đen, làm tối màn hình và chuyển cảnh
                        this.cameras.main.fadeOut(400, 0, 0, 0);

                        this.cameras.main.once('camerafadeoutcomplete', () => {
                            this.scene.start('KitchenScene');
                        });
                    }
                });
            }
        });
    }

    update() {
        // Khóa hoàn toàn quyền bấm phím của người chơi khi đang chạy tự động
        if (this.isAutoWalking) {
            if (this.player && this.player.body) {
                this.player.setVelocity(0); // Triệt tiêu vật lý để Tween điều khiển tọa độ chuẩn xác
            }
            return;
        }

        if (this.player) this.player.update();
    }
}