import Phaser from 'phaser';
import Player from '../objects/Player.js';
import DialogueBox from '../objects/DialogueBox.js';
import ArrowGraphic from '../assets/ArrowGraphic.js';

// IMPORT THÊM JOYPAD ẢO
import { joypad } from '../assets/VirtualJoypad.js';

export default class RoomMasterScene extends Phaser.Scene {
    constructor() {
        super('RoomMasterScene');
    }

    init(data) {
        this.fromScene = data.fromScene || '';
    }

    create() {
        const sw = this.cameras.main.width;
        const sh = this.cameras.main.height;

        this.isPlayerAtBed = false;

        let bg = this.add.image(0, 0, 'roommaster_bg').setOrigin(0);
        bg.displayWidth = sw;
        bg.displayHeight = sh;

        this.dialogueBox = new DialogueBox(this);
        this.player = new Player(this, sw * 0.5, sh * 0.82);
        this.player.setDepth(10);

        this.bedX = sw * 0.35;
        this.bedY = sh * 0.45;

        this.bedZone = this.add.zone(this.bedX, this.bedY, 180, 150).setOrigin(0.5);
        this.physics.add.existing(this.bedZone, true);

        // --- KHỞI TẠO DẤU CHẤM THAN TƯƠNG TÁC (HIỆN LUỒN KHI VÀO PHÒNG) ---
        this.exclamation = this.add.text(this.bedX, this.bedY - 60, '!', {
            fontSize: '35px',
            fill: '#ffcc00', // Mặc định là màu vàng
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 5
        })
        .setOrigin(0.5)
        .setDepth(2000);

        // Nếu phòng này đã thắng rồi thì ẩn dấu ! đi luôn
        if (this.registry.get('masterGameWon')) {
            this.exclamation.setVisible(false);
        }

        // Tạo hiệu ứng nhấp nhô liên tục cho dấu !
        this.tweens.add({
            targets: this.exclamation,
            y: this.bedY - 75,
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.ArrowHallway = ArrowGraphic.createArrowDown(this, sw * 0.49, sh * 0.9);
        this.tweens.add({
            targets: this.ArrowHallway,
            y: '+=10',
            duration: 500,
            yoyo: true,
            repeat: -1
        });

        // Đăng ký các phím vật lý
        this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.keyEsc = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

        this.toHallwayZone = this.add.zone(sw * 0.5, sh - 10, sw * 0.2, 30).setOrigin(0.5);
        this.physics.add.existing(this.toHallwayZone, true);
        this.physics.add.overlap(this.player, this.toHallwayZone, () => {
            if (this.dialogueBox && this.dialogueBox.visible) return; // Không chuyển cảnh khi đang thoại
            this.scene.start('HallwayScene', { fromScene: 'fromMasterRoom' });
        });
    }

    update() {
        if (this.player) this.player.update();

        // Kiểm tra va chạm giường
        const isWon = this.registry.get('masterGameWon');
        this.isPlayerAtBed = this.physics.overlap(this.player, this.bedZone) && !isWon;

        // GỘP PHÍM BÀN PHÍM VÀ NÚT ẢO
        const isActionA = Phaser.Input.Keyboard.JustDown(this.keyE) || 
                          Phaser.Input.Keyboard.JustDown(this.keySpace) || 
                          joypad.actionA;

        const isActionB = Phaser.Input.Keyboard.JustDown(this.keyEsc) || 
                          joypad.actionB;

        // ƯU TIÊN CHẶN ĐẦU KHI ĐANG THOẠI: Tua đoạn thoại
        if (this.dialogueBox && this.dialogueBox.visible) {
            if (isActionA) {
                joypad.actionA = false; // Giải phóng nút ảo
                this.dialogueBox.next(); // Gọi hàm xử lý kế tiếp
            }
            return;
        }

        // XỬ LÝ ĐỔI MÀU DẤU CHẤM THAN THEO KHOẢNG CÁCH VA CHẠM
        if (this.isPlayerAtBed) {
            if (this.exclamation && this.exclamation.active) {
                this.exclamation.setFill('#00ff00'); // Đổi sang màu xanh lá báo hiệu tương tác được
            }

            // LOGIC NÚT A: Tương tác mở thoại / vào game
            if (isActionA) {
                joypad.actionA = false; 

                // Đóng băng nhân vật
                if (this.player && this.player.body) {
                    this.player.setVelocity(0, 0);
                    if (this.player.anims) this.player.anims.stop();
                }

                this.input.keyboard.resetKeys(); // Tránh kẹt nút phím cứng vào thoại

                if (this.registry.get('talkedToFish')) {
                    this.scene.start('MemoryGameScene', { level: 1 });
                } else {
                    this.dialogueBox.startSequence('roomMaster');
                }
            }
        } else {
            if (this.exclamation && this.exclamation.active && !isWon) {
                this.exclamation.setFill('#ffcc00'); // Đứng xa trả về màu vàng
            }
        }

        // // LOGIC NÚT B: Quay lại sảnh
        // if (isActionB) {
        //     joypad.actionB = false; 
        //     this.scene.start('HallwayScene', { fromScene: 'fromMasterRoom' });
        // }
    }
}
