import Phaser from 'phaser';
import Player from '../objects/Player.js';
import DialogueBox from '../objects/DialogueBox.js';
import ArrowGraphic from '../assets/ArrowGraphic.js';
import UIHelper from '../assets/UIHelper.js';
import { joypad } from '../assets/VirtualJoypad.js'; // Import joypad

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

        this.bedZone = this.add.zone(sw * 0.35, sh * 0.45, 180, 150).setOrigin(0.5);
        this.physics.add.existing(this.bedZone, true);

        this.ArrowHallway = ArrowGraphic.createArrowDown(this, sw * 0.49, sh * 0.9);
        this.tweens.add({
            targets: this.ArrowHallway,
            y: '+=10',
            duration: 500,
            yoyo: true,
            repeat: -1
        });

        this.interactHint = UIHelper.createButtonA(this, 0, 0);

        // Đăng ký các phím vật lý
        this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.keyEsc = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

        this.toHallwayZone = this.add.zone(sw * 0.5, sh - 10, sw * 0.2, 30).setOrigin(0.5);
        this.physics.add.existing(this.toHallwayZone, true);
        this.physics.add.overlap(this.player, this.toHallwayZone, () => {
            this.scene.start('HallwayScene', { fromScene: 'fromMasterRoom' });
        });
    }

    update() {
        if (this.player) this.player.update();

        // Kiểm tra va chạm giường
        this.isPlayerAtBed = this.physics.overlap(this.player, this.bedZone) && !this.registry.get('masterGameWon');
        this.interactHint.setVisible(this.isPlayerAtBed);

        if (this.isPlayerAtBed) {
            this.interactHint.setPosition(this.bedZone.x, this.bedZone.y - 80);
            if (!this.tweens.isTweening(this.interactHint)) {
                this.tweens.add({
                    targets: this.interactHint,
                    y: this.bedZone.y - 90,
                    duration: 500,
                    yoyo: true,
                    repeat: -1
                });
            }
        } else {
            this.tweens.killTweensOf(this.interactHint);
        }

        // GỘP PHÍM BÀN PHÍM VÀ NÚT ẢO
        const isActionA = Phaser.Input.Keyboard.JustDown(this.keyE) || 
                          Phaser.Input.Keyboard.JustDown(this.keySpace) || 
                          joypad.actionA;

        const isActionB = Phaser.Input.Keyboard.JustDown(this.keyEsc) || 
                          joypad.actionB;

        // LOGIC NÚT A: Tương tác với giường (Khi thoại đóng)
        if (isActionA && !this.dialogueBox.isShowing) {
            if (this.isPlayerAtBed) {
                if (this.registry.get('talkedToFish')) {
                    this.scene.start('MemoryGameScene', { level: 1 });
                } else {
                    this.dialogueBox.startSequence('roomMaster');
                }
            }
            joypad.actionA = false; // Reset nút A
        }

        // LOGIC NÚT B: Quay lại (Khi thoại đóng)
        if (isActionB && !this.dialogueBox.isShowing) {
            this.scene.start('HallwayScene', { fromScene: 'fromMasterRoom' });
            joypad.actionB = false; // Reset nút B
        }
    }
}