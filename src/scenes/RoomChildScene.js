import Phaser from 'phaser';
import Player from '../objects/Player.js';
import DialogueBox from '../objects/DialogueBox.js';
import ArrowGraphic from '../assets/ArrowGraphic.js';

// IMPORT THÊM JOYPAD ẢO
import { joypad } from '../assets/VirtualJoypad.js';

export default class RoomChildScene extends Phaser.Scene {
    constructor() { super('RoomChildScene'); }

    init(data) {
        this.spawnDirection = data.fromScene || 'default';
    }

    create() {
        const sw = this.cameras.main.width;
        const sh = this.cameras.main.height;

        let bg = this.add.image(0, 0, 'roomchild_bg').setOrigin(0);
        bg.displayWidth = sw;
        bg.displayHeight = sh;

        this.dialogueBox = new DialogueBox(this);

        this.puzzyX = sw * 0.5;
        this.puzzyY = sh * 0.5;

        // --- KHỞI TẠO DẤU CHẤM THAN TƯƠNG TÁC ---
        this.exclamation = this.add.text(this.puzzyX, this.puzzyY - 60, '!', {
            fontSize: '35px',
            fill: '#ffcc00', // Mặc định vào phòng sẽ là màu vàng
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 5
        })
            .setOrigin(0.5)
            .setDepth(2000);

        // 💡 KIỂM TRA: Nếu phòng này đã thắng (chơi xong), ẩn luôn dấu ! ngay khi vào phòng
        if (this.registry.get('puzzyRoomWon')) {
            this.exclamation.setVisible(false);
        }

        // Tạo hiệu ứng nhấp nhô liên tục cho dấu !
        this.tweens.add({
            targets: this.exclamation,
            y: this.puzzyY - 75,
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        let spawnX = sw * 0.53;
        let spawnY = sh * 0.53;

        if (this.spawnDirection === 'fromHallway') {
            spawnX = sw * 0.5;
            spawnY = sh * 0.9;
        }
        this.player = new Player(this, spawnX, spawnY);
        if (this.spawnDirection === 'fromHallway') {
            if (this.player.anims) {
                this.player.lastDirection = 'up';
                this.player.anims.play('walk-up', true);
                this.player.anims.stop();
            }
        }

        this.ArrowHallway = ArrowGraphic.createArrowDown(this, sw * 0.49, sh * 0.9);
        this.tweens.add({
            targets: this.ArrowHallway,
            y: '+=10',
            duration: 500,
            yoyo: true,
            repeat: -1
        });

        this.physics.world.setBounds(20, 180, sw - 50, sh - 190);
        if (this.player.body) {
            this.player.setCollideWorldBounds(true);
        }

        this.toHallwayZone = this.add.zone(sw * 0.48, sh, sw * 0.18, sh * 0.05).setOrigin(0.5);
        this.physics.add.existing(this.toHallwayZone, true);
        this.physics.add.overlap(this.player, this.toHallwayZone, () => {
            if (this.dialogueBox && this.dialogueBox.visible) return;
            this.sound.play('doorOpenSfx'); // <--- THÊM VÀO ĐÂY
            this.scene.start('HallwayScene', { fromScene: 'fromChildRoom' });
        });

        // Tạo vùng tương tác
        this.puzzyZone = this.add.zone(this.puzzyX, this.puzzyY, 150, 150).setOrigin(0.5);
        this.physics.add.existing(this.puzzyZone, true);

        this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.keyEsc = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.cameras.main.fadeIn(1200, 0, 0, 0);

    }

    update() {
        if (this.player) this.player.update();

        // Kiểm tra trạng thái đã thắng game chưa
        const isWon = this.registry.get('puzzyRoomWon');

        // Kiểm tra xem Player có đang đứng trong vùng tương tác hay không
        let isNearPuzzy = this.physics.overlap(this.player, this.puzzyZone) && !isWon;

        const isActionA = Phaser.Input.Keyboard.JustDown(this.keyE) ||
            Phaser.Input.Keyboard.JustDown(this.keySpace) ||
            joypad.actionA;

        const isActionB = Phaser.Input.Keyboard.JustDown(this.keyEsc) ||
            joypad.actionB;

        // CHẶN HỘI THOẠI
        if (this.dialogueBox && this.dialogueBox.visible) {
            if (isActionA) {
                joypad.actionA = false;
                this.dialogueBox.next();
            }
            return;
        }

        // XỬ LÝ ĐỔI MÀU DẤU CHẤM THAN THEO KHOẢNG CÁCH (CHỈ XỬ LÝ KHI CHƯA THẮNG)
        if (isNearPuzzy) {
            if (this.exclamation && this.exclamation.active && !isWon) {
                this.exclamation.setFill('#00ff00'); // Đứng gần thì chuyển sang màu xanh lá
            }

            if (isActionA) {
                joypad.actionA = false;

                if (this.player && this.player.body) {
                    this.player.setVelocity(0, 0);
                    if (this.player.anims) this.player.anims.stop();
                }

                this.input.keyboard.resetKeys();

                if (this.registry.get('talkedToFish')) {
                    this.scene.start('PuzzyRoomScene', { fromScene: 'RoomChildScene' });
                } else {
                    this.dialogueBox.startSequence('childTent');
                }
            }
        } else {
            if (this.exclamation && this.exclamation.active && !isWon) {
                this.exclamation.setFill('#ffcc00'); // Đứng xa thì trả lại màu vàng
            }
        }

        // if (isActionB) {
        //     joypad.actionB = false;
        //     this.scene.start('HallwayScene', { fromScene: 'fromChildRoom' });
        // }
    }
}