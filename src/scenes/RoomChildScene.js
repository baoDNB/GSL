import Phaser from 'phaser';
import Player from '../objects/Player.js';
import DialogueBox from '../objects/DialogueBox.js';
import UIHelper from '../assets/UIHelper.js';
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
        this.interactHint = UIHelper.createButtonA(this, 0, 0);

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

        this.physics.world.setBounds(20, 180, sw - 50, sh - 190);
        if (this.player.body) {
            this.player.setCollideWorldBounds(true);
        }

        this.toHallwayZone = this.add.zone(sw * 0.48, sh, sw * 0.18, sh * 0.05).setOrigin(0.5);
        this.physics.add.existing(this.toHallwayZone, true);
        this.physics.add.overlap(this.player, this.toHallwayZone, () => {
            this.scene.start('HallwayScene', { fromScene: 'fromChildRoom' });
        });

        this.puzzyZone = this.add.zone(sw * 0.5, sh * 0.5, 150, 150).setOrigin(0.5);
        this.physics.add.existing(this.puzzyZone, true);

        // --- KHỞI TẠO CÁC PHÍM BẤM BÀN PHÍM TẠI SCENE NÀY ---
        this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.keyEsc = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    }

    update() {
        if (this.player) this.player.update();

        let isNearPuzzy = this.physics.overlap(this.player, this.puzzyZone);
        this.interactHint.setVisible(isNearPuzzy);

        if (isNearPuzzy) {
            this.interactHint.setPosition(this.puzzyZone.x, this.puzzyZone.y - 80);

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

        // --- GỘP SỰ KIỆN NÚT ẢO VÀ BÀN PHÍM ---
        const isActionA = Phaser.Input.Keyboard.JustDown(this.keyE) ||
            Phaser.Input.Keyboard.JustDown(this.keySpace) ||
            joypad.actionA;

        const isActionB = Phaser.Input.Keyboard.JustDown(this.keyEsc) ||
            joypad.actionB;

        // XỬ LÝ NÚT A (Khi lại gần lều)
        // XỬ LÝ NÚT A (Tương tác vật thể HOẶC Tắt thoại)
        if (isActionA && !this.dialogueBox.isShowing) {
            if (isNearPuzzy) {
                if (this.registry.get('talkedToFish')) {
                    this.scene.start('PuzzyRoomScene', { fromScene: 'RoomChildScene' });
                } else {
                    this.dialogueBox.startSequence('childTent');
                }
            }

            // Xóa sự kiện ảo
            joypad.actionA = false;
        }

        // XỬ LÝ NÚT B (Quay lại sảnh)
        if (isActionB && !this.dialogueBox.isShowing) {
            this.scene.start('HallwayScene', { fromScene: 'fromChildRoom' });
            joypad.actionB = false;
        }
    }
}