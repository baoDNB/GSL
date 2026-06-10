import Player from '../objects/Player.js';
import DialogueBox from '../objects/DialogueBox.js';
import ArrowGraphic from '../assets/ArrowGraphic.js';
import UIHelper from '../assets/UIHelper.js';

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

        // 1. Thêm nền phòng Master
        let bg = this.add.image(0, 0, 'roommaster_bg').setOrigin(0);
        bg.displayWidth = sw;
        bg.displayHeight = sh;

        this.dialogueBox = new DialogueBox(this);
        // 2. Tạo nhân vật ở vị trí gần cửa đi vào (mépt dưới màn hình)
        this.player = new Player(this, sw * 0.5, sh * 0.82);
        this.player.setDepth(10);

        // ==========================================================
        // 3. TỰ TẠO VÙNG KHÔNG GIAN CẠNH GIƯỜNG (BED ZONE)
        // ==========================================================
        // Tạo một vùng bao quanh khu vực chiếc giường (Nằm ở góc giữa-trái màn hình)
        this.bedZone = this.add.zone(sw * 0.35, sh * 0.45, 180, 150).setOrigin(0.5);
        this.physics.add.existing(this.bedZone, true); // Kích hoạt vật lý tĩnh

        this.ArrowHallway = ArrowGraphic.createArrowDown(this, sw * 0.49, sh * 0.9);
        this.tweens.add({
            targets: this.ArrowHallway,
            y: '+=10',
            duration: 500,
            yoyo: true,
            repeat: -1
        });

        // 1. Khởi tạo nút "A" (Đảm bảo đã gọi UIHelper.createButtonA ở trên)
        this.interactHint = UIHelper.createButtonA(this, 0, 0);

        // 2. Phím E
        this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

        // 3. Xử lý va chạm
        this.physics.add.overlap(this.player, this.bedZone, () => {
            // Chỉ cần đánh dấu trạng thái, việc hiển thị để update() lo
            if (!this.registry.get('masterGameWon')) {
                this.isPlayerAtBed = true;
            }
        });

        // ==========================================================
        // 4. VÙNG VA CHẠM ĐỂ ĐI RA CỬA (QUAY LẠI SẢNH HÀNH LANG)
        // ==========================================================
        this.toHallwayZone = this.add.zone(sw * 0.5, sh - 10, sw * 0.2, 30).setOrigin(0.5);
        this.physics.add.existing(this.toHallwayZone, true);

        this.physics.add.overlap(this.player, this.toHallwayZone, () => {
            if (this.toHallwayZone.body) this.toHallwayZone.body.enable = false;
            this.scene.start('HallwayScene', { fromScene: 'fromMasterRoom' });
        });
    }

    update() {
        if (this.player) this.player.update();

        // Cập nhật hiển thị nút A
        this.interactHint.setVisible(this.isPlayerAtBed);

        if (this.isPlayerAtBed) {
            // Đặt nút A phía trên giường
            this.interactHint.setPosition(this.bedZone.x, this.bedZone.y - 80);

            // Thêm hiệu ứng bay nhẹ nếu chưa có tween
            if (!this.tweens.isTweening(this.interactHint)) {
                this.tweens.add({
                    targets: this.interactHint,
                    y: this.bedZone.y - 90,
                    duration: 500,
                    yoyo: true,
                    repeat: -1
                });
            }

            // Logic nhấn phím E
            if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
                if (this.registry.get('talkedToFish')) {
                    this.scene.start('MemoryGameScene', { level: 1 });
                } else {
                    this.dialogueBox.startSequence('roomMaster');
                }
            }
        } else {
            // Dừng tween khi không ở gần
            this.tweens.killTweensOf(this.interactHint);
        }

        // Reset lại trạng thái
        this.isPlayerAtBed = false;
    }
}