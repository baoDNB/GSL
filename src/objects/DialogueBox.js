import Phaser from 'phaser';
import { joypad } from '../assets/VirtualJoypad.js'; // Bắt buộc import phím ảo vào đây

const DEFAULT_DIALOGUES = {
    puzzleIntro: [
        { speaker: "You", text: "Huh, an old, ancient book left in the middle of the table? And it's glowing..." },
        { speaker: "Admin", text: "The magic map has been activated! Decipher the number matrix to reveal the secret passage!" },
        { speaker: "You", text: "Looks like a 3x3 matrix sliding puzzle. Let's give it a shot!" }
    ],
    foundKey: [
        { speaker: "Kid", text: "Congratulations! You have successfully deciphered the ancient matrix." },
        { speaker: "You", text: "Oh! A [Mystery Key] just fell out of the book! Let's go to the next room." }
    ],
    caConLockedDoor: [
        { speaker: "Kid", text: "You need three keys to enter this room! Go explore the home again and be careful...." },
    ],
    need_2_keys: [
        { speaker: "Kid", text: "The door still won't budge. You're missing two more keys." }
    ],
    need_1_keys: [
        { speaker: "Kid", text: "Almost there! We just need one more key." }
    ],
    openFridge: [
        { speaker: "You", text: "Hmm it's a calendar." },
        { speaker: "You", text: "Father's Day" }
    ],
    inspectTable: [
        { speaker: "You", text: "Ooh, someone left me my favorite: Flower! How awesome!" }
    ],
    livingRoomTable: [
        { speaker: "You", text: "Someone left a note on the table. It says:" },
        { speaker: "You", text: "We're playing hide and seek. You have to come find us!" }
    ],
    childTent: [
        { speaker: "You", text: "Looks cozy, I don't see anyone in there" }
    ],
    roomMaster: [
        { speaker: "You", text: "It's the master bedroom but I don't see anyone in here." }
    ],
    introHouse: [
        { speaker: "Kid", text: "Looks like mom is coming. Let's go hide!" },
        { speaker: "You", text: "I swear I just saw the kid!" },
        { speaker: "You", text: "Hmm, it's locked, let me go through the back." }
    ],
    victoryDialogue: [
        { speaker: "You", text: "All three keys fit perfectly into the lock!" },
        { speaker: "You", text: "The secret door is slowly opening... I'm finally free!" }
    ],
    finalRoom: [
        { speaker: "You", text: "So this is the hidden room..." },
        { speaker: "Kid", text: "You found us! We knew you could solve every clue." },
        { speaker: "You", text: "Three keys, three trials, and one very strange house." },
        { speaker: "Kid", text: "The game is over now. Thank you for playing with us." },
        { speaker: "You", text: "Let's go home." }
    ]
};

export const DIALOGUES = (typeof window !== 'undefined' && window.customGameDialogues)
    ? window.customGameDialogues
    : DEFAULT_DIALOGUES;

export default class DialogueBox {
    constructor(scene) {
        this.scene = scene;
        this.isShowing = false; // Biến kiểm tra xem thoại có đang mở không
        this.visible = false;
        this.lastAdvanceFrame = -1;

        // Đăng ký phím bàn phím
        this.keyE = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

        // Vẽ hộp thoại thô nằm ở nửa dưới màn hình
        this.box = scene.add.rectangle(480, 500, 900, 140, 0x000000, 0.8)
            .setOrigin(0.5).setStrokeStyle(2, 0xffffff).setDepth(1000);

        this.text = scene.add.text(60, 450, '', {
            fontSize: '30px',
            color: '#ffffff',
            wordWrap: { width: 680 },
            fontFamily: 'monospace'
        }).setDepth(1001);

        // TỰ ĐỘNG LẮNG NGHE VÒNG LẶP UPDATE CỦA SCENE
        this.scene.events.on('update', this.update, this);

        this.hide();
    }

    startSequence(key, onComplete) {
        if (this.isShowing) return; // Tránh mở chồng chéo khi bấm phím nhanh

        if (typeof key === 'object' && Array.isArray(key)) {
            this.dialogues = key;
        } else {
            this.dialogues = DIALOGUES[key];
        }

        this.onComplete = onComplete;
        this.index = 0;
        this.isShowing = true;
        this.visible = true;
        this.lockPlayer();

        this.box.setVisible(true);
        this.text.setVisible(true);

        // Vẫn giữ click chuột (cho PC/chuột)
        this.scene.input.on('pointerdown', this.nextNode, this);
        this.showNode();
    }

    showNode() {
        if (this.dialogues && this.index < this.dialogues.length) {
            let node = this.dialogues[this.index];
            this.text.setText(`${node.speaker}: ${node.text}`);
        } else {
            this.hide();
            if (this.onComplete) this.onComplete();
        }
    }

    nextNode() {
        const currentFrame = this.scene.game.loop.frame;
        if (this.lastAdvanceFrame === currentFrame) return;
        this.lastAdvanceFrame = currentFrame;

        this.index++;
        this.showNode();
    }

    next() {
        this.nextNode();
    }

    hide() {
        this.isShowing = false;
        this.visible = false;
        this.scene.input.off('pointerdown', this.nextNode, this);
        this.box.setVisible(false);
        this.text.setVisible(false);
        this.scene.actionBlockedUntil = this.scene.time.now + 250;
        this.unlockPlayer();
        joypad.actionA = false;

    }

    lockPlayer() {
        if (!this.scene.player) return;

        this.scene.player.isTalking = true;
        if (this.scene.player.body) {
            this.scene.player.setVelocity(0, 0);
        }
    }

    unlockPlayer() {
        if (!this.scene.player) return;

        this.scene.player.isTalking = false;
        if (this.scene.player.body) {
            this.scene.player.setVelocity(0, 0);
        }
    }

    update() {
        // Nếu hộp thoại không hiện, bỏ qua không làm gì cả
        if (!this.isShowing) return;

        // Bắt sự kiện nút A hoặc phím E
        const isActionA = Phaser.Input.Keyboard.JustDown(this.keyE) ||
            joypad.actionA;

        if (isActionA) {
            this.nextNode(); // Chuyển câu

            // Ép tắt nút Joypad để không bị lặp phím liên tục
            joypad.actionA = false;
        }
    }
}
