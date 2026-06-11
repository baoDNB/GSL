import Player from '../objects/Player.js';
import DialogueBox from '../objects/DialogueBox.js';
import ArrowGraphic from '../assets/ArrowGraphic.js';
import { joypad } from '../assets/VirtualJoypad.js'; // 1. IMPORT JOYPAD

export default class HallwayScene extends Phaser.Scene {
    constructor() { super('HallwayScene'); }

    init(data) {
        this.spawnDirection = (data && data.fromScene) ? data.fromScene : 'default';

        // Bảo toàn trạng thái visitedMaster, không bị reset về false
        let isMasterVisited = (this.spawnDirection === 'fromMasterRoom' || this.spawnDirection === 'MemoryGameScene' || this.registry.get('visitedMaster') === true);
        this.registry.set('visitedMaster', isMasterVisited);

        let isChildVisited = (this.spawnDirection === 'fromChildRoom' || this.registry.get('visitedChild') === true);
        this.registry.set('visitedChild', isChildVisited);

        if (!this.registry.has('keysFound')) this.registry.set('keysFound', 0);
        if (!this.registry.has('lavaGameWon')) this.registry.set('lavaGameWon', false);
        if (!this.registry.has('talkedToFish')) this.registry.set('talkedToFish', false);
        if (!this.registry.has('masterGameWon')) this.registry.set('masterGameWon', false);
        if (!this.registry.has('talkedToMasterEvent')) this.registry.set('talkedToMasterEvent', false);
    }

    create() {
        const { width: sw, height: sh } = this.cameras.main;

        // 1. Nền
        let bg = this.add.image(0, 0, 'hallway_bg').setOrigin(0);
        bg.displayWidth = sw;
        bg.displayHeight = sh;

        this.dialogueBox = new DialogueBox(this);

        this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.keyEsc = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

        // 2. Dấu chấm than (Chỉ hiện nếu chưa thắng LavaGame)
        this.bookX = sw * 0.22;
        this.bookY = sh * 0.3;

        let hasVisitedMaster = this.registry.get('visitedMaster');
        let hasVisitedChild = this.registry.get('visitedChild');
        let isLavaWon = this.registry.get('lavaGameWon');
        let keysFound = this.registry.get('keysFound') || 0;

        // SỬA LỖI 2: Tạo chuyển động lên xuống chính xác cho Graphics bằng cách dùng yoyo kèm thay đổi giá trị thuộc tính x/y gốc
        if (!hasVisitedMaster) {
            this.arrowMaster = ArrowGraphic.createArrow(this, sw * 0.75, sh * 0.4);
            this.tweens.add({
                targets: this.arrowMaster,
                y: this.arrowMaster.y - 10, // Di chuyển nhích lên trên 10 pixel từ vị trí gốc
                duration: 500,
                yoyo: true,
                repeat: -1
            });
        }
        if (!hasVisitedChild) {
            this.arrowChild = ArrowGraphic.createArrow(this, sw * 0.46, sh * 0.4);
            this.tweens.add({
                targets: this.arrowChild,
                y: this.arrowChild.y - 10,
                duration: 500,
                yoyo: true,
                repeat: -1
            });
        }


        // mũi tên xuống phòng khách hoặc chơi lava
        this.arrowLivingRoom = ArrowGraphic.createArrow(this, sw * 0.05, sh * 0.9);
        this.tweens.add({
            targets: this.arrowLivingRoom,
            y: this.arrowLivingRoom.y - 10,
            duration: 500,
            yoyo: true,
            repeat: -1
        });

        if (hasVisitedMaster && hasVisitedChild && keysFound < 3) {
            this.exclamation = this.add.text(this.bookX, this.bookY, '!', {
                fontSize: '28px', fill: '#ffcc00', fontStyle: 'bold', stroke: '#000000', strokeThickness: 4
            }).setOrigin(0.5).setDepth(1005);

            this.tweens.add({ targets: this.exclamation, y: this.bookY - 12, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        }
        else if (keysFound >= 3) {
            // Gọi hàm tạo mũi tên có sẵn của bạn, truyền thêm màu xanh lá (0x00ff00) nếu thích rực rỡ
            this.arrowExit = ArrowGraphic.createArrow(this, this.bookX, this.bookY - 40, 0x00ff00);

            // Thêm hiệu ứng nhấp nhô giống các mũi tên khác của bạn
            this.tweens.add({
                targets: this.arrowExit,
                y: this.arrowExit.y - 10,
                duration: 500,
                yoyo: true,
                repeat: -1
            });
        }

        // 3. Vị trí xuất hiện của Player
        let spawnX = sw * 0.1;
        let spawnY = sh * 0.78;

        if (this.spawnDirection === 'LivingRoomScene') {
            spawnX = sw * 0.1;
            spawnY = sh * 0.78;
        }
        else if (this.spawnDirection === 'fromChildRoom') {
            spawnX = sw * 0.47;
            spawnY = sh * 0.35;
        }
        else if (this.spawnDirection === 'fromMasterRoom' || this.spawnDirection === 'MemoryGameScene') {
            spawnX = sw * 0.75;
            spawnY = sh * 0.35;
        }
        this.player = new Player(this, spawnX, spawnY);
        this.obstacles = this.physics.add.staticGroup();

        this.wall = this.add.zone(sw * 0.01, sh * 0.3, sw * 0.15, sh * 0.4).setOrigin(0);
        this.obstacles.add(this.wall);


        // 4. ZONE PHÒNG KHÁCH (Lava Game)
        this.toLivingRoomZone = this.add.zone(sw * 0.04, sh * 0.8, 50, sh * 0.1).setOrigin(0.5);
        this.physics.add.existing(this.toLivingRoomZone, true);

        this.physics.add.overlap(this.player, this.toLivingRoomZone, () => {
            if (this.toLivingRoomZone.body) this.toLivingRoomZone.body.enable = false;

            if (this.registry.get('lavaGameWon')) {
                this.scene.start('LivingRoomScene', { fromScene: 'fromHallway' });
                return;
            }

            if (this.registry.get('talkedToFish')) {
                this.scene.start('LavaGameScene', { fromScene: 'fromHallway' });
            } else {
                this.dialogueBox.startSequence('mustTalkToFishFirst', () => {
                    this.scene.start('LivingRoomScene', { fromScene: 'fromHallway' });
                });
            }
        });

        this.toMasterRoomZone = this.add.zone(sw * 0.75, sh * 0.3, sw * 0.1, 50).setOrigin(0.5);
        this.physics.add.existing(this.toMasterRoomZone, true);

        this.physics.add.overlap(this.player, this.toMasterRoomZone, () => {
            if (this.toMasterRoomZone.body) this.toMasterRoomZone.body.enable = false;

            // Chạm cửa sảnh là bốc thẳng người chơi vào trong phòng Master ngắm cảnh luôn
            this.scene.start('RoomMasterScene', { fromScene: 'fromHallway' });
        });

        this.toSecretRoomZone = this.add.zone(sw * 0.21, sh * 0.3, sw * 0.1, 50).setOrigin(0.5);
        this.physics.add.existing(this.toSecretRoomZone, true);

        this.physics.add.overlap(this.player, this.toSecretRoomZone, () => {
            // Kiểm tra xem đã đủ 3 chìa khóa chưa
            let keysFound = this.registry.get('keysFound') || 0;

            // Nếu đủ chìa khóa (cũng là lúc dấu ! biến mất và mũi tên xanh hiện ra)
            if (keysFound >= 3) {
                // Tắt body để hàm này không bị chạy lặp lại nhiều lần
                if (this.toSecretRoomZone.body) this.toSecretRoomZone.body.enable = false;

                // Gọi hàm chạy hội thoại chiến thắng, hàm này chạy xong sẽ tự chuyển cảnh
                this.handleEscape();
            }
            else {
                // Nếu CHƯA đủ chìa khóa mà cố tình lao vào cửa:
                // 1. Đẩy Player lùi xuống một chút để không bị dính chặt vào Zone
                this.player.y += 15;

                // 2. Tự động gọi hàm báo cửa đang khóa/còn thiếu chìa
                if (!this.player.isTalking) {
                    this.handleInteraction();
                }
            }
        });


        // 6. ZONE PHÒNG TRẺ EM (Child Room)
        this.toChildRoomZone = this.add.zone(sw * 0.46, sh * 0.3, sw * 0.1, 50).setOrigin(0.5);
        this.physics.add.existing(this.toChildRoomZone, true);
        this.physics.add.overlap(this.player, this.toChildRoomZone, () => {
            if (this.toChildRoomZone.body) this.toChildRoomZone.body.enable = false;
            this.registry.set('visitedChild', true);
            this.scene.start('RoomChildScene', { fromScene: 'fromHallway' });
        });
        this.physics.world.setBounds(50, 175, sw - 200, sh - 200);
        if (this.player.body) {
            this.player.setCollideWorldBounds(true);
        }
        this.physics.add.collider(this.player, this.obstacles);

    }

    update() {
        if (!this.player) return;
        this.player.update();
        const isActionA = Phaser.Input.Keyboard.JustDown(this.keyE) ||
            Phaser.Input.Keyboard.JustDown(this.keySpace) ||
            joypad.actionA;

        const isActionB = Phaser.Input.Keyboard.JustDown(this.keyEsc) ||
            joypad.actionB;

        let keysFound = this.registry.get('keysFound') || 0;

        // Xử lý tương tác ! tại cửa
        if (this.exclamation && this.exclamation.active && !this.dialogueBox.isShowing) {
            let dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.bookX, this.bookY);
            if (dist < 80) {
                this.exclamation.setFill('#00ff00');
                if (isActionA) {
                    this.handleInteraction();
                }
            } else {
                this.exclamation.setFill('#ffcc00');
            }
        }
        if (!this.dialogueBox.isShowing) {
            if (this.physics.overlap(this.player, this.toLivingRoomZone)) {
                if (this.registry.get('lavaGameWon')) {
                    this.scene.start('LivingRoomScene', { fromScene: 'fromHallway' });
                } else if (this.registry.get('talkedToFish')) {
                    this.scene.start('LavaGameScene', { fromScene: 'fromHallway' });
                } else {
                    this.dialogueBox.startSequence('mustTalkToFishFirst', () => {
                        this.scene.start('LivingRoomScene', { fromScene: 'fromHallway' });
                    });
                }
            }
            if (this.physics.overlap(this.player, this.toMasterRoomZone)) {
                this.scene.start('RoomMasterScene', { fromScene: 'fromHallway' });
            }
            if (this.physics.overlap(this.player, this.toChildRoomZone)) {
                this.registry.set('visitedChild', true);
                this.scene.start('RoomChildScene', { fromScene: 'fromHallway' });
            }
            if (this.physics.overlap(this.player, this.toSecretRoomZone)) {
                if ((this.registry.get('keysFound') || 0) >= 3) this.handleEscape();
                else this.handleInteraction();
            }
        }

        // Reset nút ảo
        if (isActionA) joypad.actionA = false;
        if (isActionB) joypad.actionB = false;
        // if (keysFound >= 3) {
        //     let distToExit = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.bookX, this.bookY);
        //     if (distToExit < 80) {
        //         if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
        //             this.handleEscape(); // Gọi hàm xử lý thắng cuộc (bạn thêm hàm này ở dưới cùng file nhé)
        //         }
        //     }
        // }
    }

    handleInteraction() {
        if (this.player.isTalking) return; // Tránh bấm lặp khi đang thoại
        this.player.setVelocity(0);
        this.player.isTalking = true;

        let keys = this.registry.get('keysFound') || 0;
        let msg = (keys === 0) ? 'caConLockedDoor' : `need_${3 - keys}_keys`;

        this.dialogueBox.startSequence(msg, () => {
            this.player.isTalking = false;
            this.registry.set('talkedToFish', true);
        });
    }
    handleEscape() {
        if (this.player.isTalking) return;
        this.player.setVelocity(0);
        this.player.isTalking = true;

        const victoryDialogue = [
            { speaker: "You", text: "Cả 3 chiếc chìa khóa đều khớp hoàn hảo vào ổ!" },
            { speaker: "You", text: "Cánh cửa bí mật đang từ từ mở ra... Cuối cùng mình cũng đã thoát rồi!" }
        ];

        this.dialogueBox.startSequence(victoryDialogue, () => {
            this.player.isTalking = false;

            // Chuyển sang cảnh RoomSecretScene sau khi xong hội thoại
            this.scene.start('RoomSecretScene', { fromScene: 'fromHallway' });
        });
    }
}
