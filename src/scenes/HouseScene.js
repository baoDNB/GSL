import Player from '../objects/Player.js';
import Phaser from 'phaser';
// 1. IMPORT THÊM DIALOGUEBOX
import DialogueBox from '../objects/DialogueBox.js';

export default class HouseScene extends Phaser.Scene {
    constructor() {
        super('HouseScene');
    }

    create() {
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;

        // 1. Thêm nền sân vườn
        let bg = this.add.image(0, 0, 'house_bg').setOrigin(0);
        bg.displayWidth = screenWidth;
        bg.displayHeight = screenHeight;

        // Khởi tạo Dialogue Box để chạy thoại trước
        this.dialogueBox = new DialogueBox(this);

        // Mặc định bật cờ khóa di chuyển để Player không bị trượt vật lý
        this.isAutoWalking = true;

        // 2. Tạo Player đứng đúng vị trí góc dưới bên trái vỉa hè
        const startX = screenWidth * 0.18; 
        const startY = screenHeight * 0.88; 

        this.player = new Player(this, startX, startY);

        // Thiết lập trạng thái đang thoại cho Player (để đứng im)
        this.player.isTalking = true;

        // Tọa độ các điểm nút để nhân vật đi vào nhà
        this.stepsX = screenWidth * 0.6;
        this.stepsY = screenHeight * 0.72;
        this.doorX = screenWidth * 0.6;
        this.doorY = screenHeight * 0.42;

        // ==========================================================
        // KÍCH HOẠT CHUỖI THOẠI TRƯỚC KHI ĐI VÀO NHÀ
        // ==========================================================
        // Bạn nhớ thêm key 'introHouse' này vào file kịch bản DIALOGUES của bạn nhé
        this.dialogueBox.startSequence('introHouse', () => {
            // Sau khi xem xong thoại -> Tắt cờ thoại và bắt đầu cho nhân vật tự đi
            this.player.isTalking = false;
            this.startAutoWalk();
        });
    }

    // Hàm xử lý chuỗi di chuyển tự động sau khi đọc thoại xong
    startAutoWalk() {
        // Bước 1: Đi chéo từ vỉa hè đến trước bậc tam cấp
        this.tweens.add({
            targets: this.player,
            x: this.stepsX,
            y: this.stepsY,
            duration: 1800,
            ease: 'Linear',
            onStart: () => {
                if (this.player.anims && this.player.anims.exists('walk_up')) {
                    this.player.anims.play('walk_up', true);
                }
            },
            onComplete: () => {
                // Bước 2: Đi thẳng từ bậc tam cấp khuất vào cánh cửa đen
                this.tweens.add({
                    targets: this.player,
                    x: this.doorX,
                    y: this.doorY,
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
        // Khóa hoàn toàn quyền bấm phím của người chơi khi đang trong chế độ tự động đi / đang thoại
        if (this.isAutoWalking || (this.player && this.player.isTalking)) {
            if (this.player && this.player.body) {
                this.player.setVelocity(0); // Triệt tiêu hoàn toàn vận tốc vật lý
            }
            return;
        }

        if (this.player) this.player.update();
    }
}