import Player from '../objects/Player.js';
import DialogueBox from '../objects/DialogueBox.js';

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

        // 2. Tạo Player
        this.player = new Player(this, sw * 0.5, sh * 0.9);

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

        if (isNearPuzzy && Phaser.Input.Keyboard.JustDown(this.keyE)) {
            if (this.registry.get('talkedToFish')) {
                this.scene.start('PuzzyRoomScene', { fromScene: 'RoomChildScene' });
            } else {
                // Chưa nói chuyện -> Chỉ hiện thông báo
                this.dialogueBox.startSequence('caConLockedDoor');
            }
        }
    }
}
