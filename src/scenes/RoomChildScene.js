import Player from '../objects/Player.js';
import DialogueBox from '../objects/DialogueBox.js';
import UIHelper from '../assets/UIHelper.js';
import ArrowGraphic from '../assets/ArrowGraphic.js';

export default class RoomChildScene extends Phaser.Scene {
    constructor() { super('RoomChildScene'); }

    init(data) {
        this.spawnDirection = data.fromScene || 'default';
    }

    create() {
        const sw = this.cameras.main.width;
        const sh = this.cameras.main.height;

        // 1. Nền
        let bg = this.add.image(0, 0, 'roomchild_bg').setOrigin(0);
        bg.displayWidth = sw;
        bg.displayHeight = sh;

        this.dialogueBox = new DialogueBox(this);
        this.interactHint = UIHelper.createButtonA(this, 0, 0);
        // 2. Tạo Player
        let spawnX = sw * 0.53;
        let spawnY = sh * 0.53;

        if (this.spawnDirection === 'fromHallway') {
            spawnX = sw * 0.5;
            spawnY = sh * 0.9;
        }
        this.player = new Player(this, spawnX, spawnY);

        this.ArrowHallway = ArrowGraphic.createArrowDown(this, sw * 0.49, sh * 0.9);
        this.tweens.add({
            targets: this.ArrowHallway,
            y: '+=10',
            duration: 500,
            yoyo: true,
            repeat: -1
        });



        // 3. Vùng chạm lên Hành Lang (Giữ nguyên)
        this.toHallwayZone = this.add.zone(sw * 0.48, sh, sw * 0.18, sh * 0.05).setOrigin(0.5);
        this.physics.add.existing(this.toHallwayZone, true);
        this.physics.add.overlap(this.player, this.toHallwayZone, () => {
            this.scene.start('HallwayScene', { fromScene: 'fromChildRoom' });
        });

        // 4. Vùng tương tác với Lều (PuzzyRoom)
        // Đặt tại vị trí chiếc lều trong image_8c6561.jpg
        this.puzzyZone = this.add.zone(sw * 0.5, sh * 0.5, 150, 150).setOrigin(0.5);
        this.physics.add.existing(this.puzzyZone, true);

        // Phím E để vào phòng
        this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    }


    // Trong RoomChildScene.js

    update() {
        if (this.player) this.player.update();

        let isNearPuzzy = this.physics.overlap(this.player, this.puzzyZone);

        // 1. Ẩn/Hiện nút A
        this.interactHint.setVisible(isNearPuzzy);

        // 2. Cập nhật vị trí nút A bay trên đầu lều
        if (isNearPuzzy) {
            this.interactHint.setPosition(this.puzzyZone.x, this.puzzyZone.y - 80);

            // Thêm tween nếu muốn nó bay nhẹ (chỉ chạy 1 lần khi bắt đầu near)
            if (!this.tweens.isTweening(this.interactHint)) {
                this.tweens.add({
                    targets: this.interactHint,
                    y: this.puzzyZone.y - 90,
                    duration: 500,
                    yoyo: true,
                    repeat: -1
                });
            }
        } else {
            this.tweens.killTweensOf(this.interactHint);
        }

        // 3. Logic phím E
        if (isNearPuzzy && Phaser.Input.Keyboard.JustDown(this.keyE)) {
            if (this.registry.get('talkedToFish')) {
                this.scene.start('PuzzyRoomScene', { fromScene: 'RoomChildScene' });
            } else {
                this.dialogueBox.startSequence('caConLockedDoor');
            }
        }
    }
}
