import Player from '../objects/Player.js';
import DialogueBox from '../objects/DialogueBox.js';

export default class HallwayScene extends Phaser.Scene {
    constructor() { super('HallwayScene'); }

    init(data) {
        this.spawnDirection = data.fromScene || 'default';
        // Khởi tạo trạng thái ban đầu nếu chưa có
        if (!this.registry.has('visitedMaster')) this.registry.set('visitedMaster', false);
        if (!this.registry.has('visitedChild')) this.registry.set('visitedChild', false);
        if (!this.registry.has('keysFound')) this.registry.set('keysFound', 0);
        if (!this.registry.has('lavaGameWon')) this.registry.set('lavaGameWon', false);
        if (!this.registry.has('talkedToFish')) this.registry.set('talkedToFish', false);
    }

    create() {
        const { width: sw, height: sh } = this.cameras.main;

        // 1. Nền
        let bg = this.add.image(0, 0, 'hallway_bg').setOrigin(0);
        bg.displayWidth = sw;
        bg.displayHeight = sh;

        this.dialogueBox = new DialogueBox(this);
        this.interactKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // 2. Dấu chấm than (Chỉ hiện nếu chưa thắng LavaGame)
        this.bookX = sw * 0.22;
        this.bookY = sh * 0.3;

        let hasVisitedMaster = this.registry.get('visitedMaster');
        let hasVisitedChild = this.registry.get('visitedChild');
        let keysFound = this.registry.get('keysFound') || 0;

        if (!hasVisitedMaster) {
            this.arrowMaster = this.createArrowGraphic(sw * 0.75, sh * 0.4);
            // Bạn vẫn có thể thêm tween cho graphics này
            this.tweens.add({
                targets: this.arrowMaster,
                y: -10, // Di chuyển lên xuống
                duration: 500,
                yoyo: true,
                repeat: -1
            });
        }
        if (!hasVisitedChild) {
            this.arrowChild = this.createArrowGraphic(sw * 0.46, sh * 0.4);
            this.tweens.add({
                targets: this.arrowChild,
                y: -10, // Di chuyển lên xuống
                duration: 500,
                yoyo: true,
                repeat: -1
            });
        }
        if (hasVisitedMaster && hasVisitedChild && keysFound < 3) {
            this.exclamation = this.add.text(this.bookX, this.bookY, '!', {
                fontSize: '28px', fill: '#ffcc00', fontStyle: 'bold', stroke: '#000000', strokeThickness: 4
            }).setOrigin(0.5).setDepth(1005);

            this.tweens.add({ targets: this.exclamation, y: this.bookY - 12, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        }

        // 3. Player
        let sx = (this.spawnDirection === 'fromKitchen') ? sw * 0.9 : sw * 0.5;
        let sy = (this.spawnDirection === 'fromKitchen') ? sh * 0.9 : sh * 0.5;
        this.player = new Player(this, sx, sy);

        // 4. ZONE PHÒNG KHÁCH (Logic điều hướng LavaGame)
        // 2. ZONE PHÒNG KHÁCH (Logic mới theo yêu cầu của bạn)
        this.toLivingRoomZone = this.add.zone(sw * 0.04, sh * 0.8, 50, sh * 0.1).setOrigin(0.5);
        this.physics.add.existing(this.toLivingRoomZone, true);

        this.physics.add.overlap(this.player, this.toLivingRoomZone, () => {
            // 1. Đã thắng LavaGame -> Đi tự do
            if (this.registry.get('lavaGameWon')) {
                this.scene.start('LivingRoomScene', { fromScene: 'fromHallway' });
                return;
            }

            // 2. Chưa thắng Lava: Kiểm tra đã nói chuyện chưa
            if (this.registry.get('talkedToFish')) {
                // Đã nói chuyện + Chưa thắng -> Ép vào game
                this.scene.start('LavaGameScene', { fromScene: 'fromHallway' });
            } else {
                // Chưa nói chuyện -> Hiện thông báo + vào LivingRoom bình thường
                // Thêm kiểm tra: Chỉ hiện nếu người chơi đã vào đủ 2 phòng (ví dụ)
                this.dialogueBox.startSequence('mustTalkToFishFirst');
                this.scene.start('LivingRoomScene', { fromScene: 'fromHallway' });
            }
        });



        // 5. CÁC PHÒNG KHÁC (Giữ nguyên như cũ)
        this.toMasterRoomZone = this.add.zone(sw * 0.75, sh * 0.3, sw * 0.1, 50).setOrigin(0.5);
        this.physics.add.existing(this.toMasterRoomZone, true);
        this.physics.add.overlap(this.player, this.toMasterRoomZone, () => {
            this.registry.set('visitedMaster', true); // Tối đa 2 phòng
            this.scene.start('RoomMasterScene', { fromScene: 'fromHallway' });
        });

        this.toChildRoomZone = this.add.zone(sw * 0.46, sh * 0.3, sw * 0.1, 50).setOrigin(0.5);
        this.physics.add.existing(this.toChildRoomZone, true);
        this.physics.add.overlap(this.player, this.toChildRoomZone, () => {
            this.registry.set('visitedChild', true); // Đánh dấu đã vào phòng Child
            this.scene.start('RoomChildScene', { fromScene: 'fromHallway' });
        });

    }

    update() {
        if (!this.player) return;
        this.player.update();

        // Xử lý tương tác ! tại cửa
        if (this.exclamation && this.exclamation.active) {
            let dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.bookX, this.bookY);
            if (dist < 80) {
                this.exclamation.setFill('#00ff00');
                if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
                    this.handleInteraction();
                }
            } else {
                this.exclamation.setFill('#ffcc00');
            }
        }
    }

    handleInteraction() {
        this.player.setVelocity(0);
        this.player.isTalking = true;

        // Kiểm tra số chìa khóa để hiện thoại
        let keys = this.registry.get('keysFound');
        let msg = (keys === 0) ? 'caConLockedDoor' : `need_${3 - keys}_keys`;

        this.dialogueBox.startSequence(msg, () => {
            this.player.isTalking = false;
            this.registry.set('talkedToFish', true);
        });
    }
    createArrowGraphic(x, y) {
        let graphics = this.add.graphics();
        graphics.fillStyle(0xff0000, 1); // Màu đỏ

        // Vẽ phần thân mũi tên (hình chữ nhật đứng)
        graphics.fillRect(x - 2.5, y, 5, 10);

        // Vẽ phần đầu mũi tên (hình tam giác)
        graphics.fillTriangle(
            x - 7.5, y,     // Đỉnh trái
            x + 7.5, y,     // Đỉnh phải
            x, y - 7.5      // Đỉnh nhọn
        );

        // Thêm viền đen (tùy chọn để giống pixel art hơn)
        graphics.lineStyle(2, 0x000000, 1);
        graphics.strokeRect(x - 2.5, y, 5, 10);
        graphics.strokeTriangle(x - 7.5, y, x + 7.5, y, x, y - 7.5);

        return graphics;
    }
}
