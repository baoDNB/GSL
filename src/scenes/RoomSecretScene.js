import Player from '../objects/Player.js';
// 1. IMPORT THÊM DIALOGUEBOX
import DialogueBox from '../objects/DialogueBox.js';
import Phaser from 'phaser';

export default class RoomSecretScene extends Phaser.Scene {
    constructor() {
        super('RoomSecretScene');
    }

    create() {
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;

        // 1. Thêm nền sân vườn
        let bg = this.add.image(0, 0, 'roomsecret_bg').setOrigin(0);
        bg.displayWidth = screenWidth;
        bg.displayHeight = screenHeight;

        // Khởi tạo Dialogue Box để chạy thoại trước
        this.dialogueBox = new DialogueBox(this);
        const startX = screenWidth * 0.5;
        const startY = screenHeight * 0.88;

        this.player = new Player(this, startX, startY);

        // Thiết lập trạng thái đang thoại cho Player (để đứng im)
        this.player.isTalking = true;

        // Tọa độ các điểm nút để nhân vật đi vào nhà
        this.stepsX = screenWidth * 0.6;
        this.stepsY = screenHeight * 0.72;
        this.doorX = screenWidth * 0.6;
        this.doorY = screenHeight * 0.42;

        this.cameras.main.fadeIn(1200, 0, 0, 0);
        this.startFireworks();

        this.time.delayedCall(900, () => {
            this.dialogueBox.startSequence('finalRoom', () => {
                if (this.player) this.player.isTalking = false;
            });
        });

    }

    // Hàm xử lý chuỗi di chuyển tự động sau khi đọc thoại xong

    startFireworks() {
        const colors = [0xffd166, 0xef476f, 0x06d6a0, 0x4cc9f0, 0xf72585, 0xffffff];

        this.time.addEvent({
            delay: 850,
            loop: true,
            callback: () => {
                const x = Phaser.Math.Between(120, this.cameras.main.width - 120);
                const y = Phaser.Math.Between(70, 220);
                const color = Phaser.Utils.Array.GetRandom(colors);
                this.createFirework(x, y, color);
            }
        });

        this.time.delayedCall(250, () => this.createFirework(this.cameras.main.width * 0.3, 130, 0xffd166));
        this.time.delayedCall(650, () => this.createFirework(this.cameras.main.width * 0.7, 110, 0x4cc9f0));
    }

    createFirework(x, y, color) {
        const sparkCount = 22;

        for (let i = 0; i < sparkCount; i++) {
            const angle = (Math.PI * 2 * i) / sparkCount;
            const distance = Phaser.Math.Between(45, 95);
            const spark = this.add.circle(x, y, Phaser.Math.Between(2, 4), color, 1)
                .setDepth(900);

            this.tweens.add({
                targets: spark,
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                alpha: 0,
                scale: 0.2,
                duration: Phaser.Math.Between(650, 950),
                ease: 'Cubic.easeOut',
                onComplete: () => spark.destroy()
            });
        }

        const flash = this.add.circle(x, y, 12, 0xffffff, 0.85).setDepth(899);
        this.tweens.add({
            targets: flash,
            scale: 2.3,
            alpha: 0,
            duration: 320,
            ease: 'Sine.easeOut',
            onComplete: () => flash.destroy()
        });
    }

    update() {


        if (this.player) this.player.update();
    }
}
