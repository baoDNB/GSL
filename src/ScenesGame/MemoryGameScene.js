import DialogueBox from '../objects/DialogueBox.js';
import { joypad } from '../assets/VirtualJoypad.js'; // 1. IMPORT JOYPAD ẢO
import Phaser from 'phaser';

export default class MemoryGameScene extends Phaser.Scene {
    constructor() { super('MemoryGameScene'); }

    init(data) {
        let lv = data && data.level ? parseInt(data.level) : 1;
        this.currentLevel = (!isNaN(lv) && lv >= 1 && lv <= 3) ? lv : 1;

        const levelConfig = {
            1: { pairs: 2, cols: 2, spaceX: 140, spaceY: 180, fontSize: '48px' },
            2: { pairs: 4, cols: 4, spaceX: 110, spaceY: 150, fontSize: '40px' },
            3: { pairs: 6, cols: 4, spaceX: 95, spaceY: 130, fontSize: '30px' }
        };

        this.config = levelConfig[this.currentLevel];
        this.totalPairs = this.config.pairs;
        this.totalCards = this.totalPairs * 2;
        this.selectedCards = [];
        this.matchedPairs = 0;
        this.canFlip = true;
        this.selected = { row: 0, col: 0 };
        this.cards = [];

        // Biến cờ kiểm soát trạng thái đang hội thoại
        this.isInDialogue = false;
    }

    create() {
        const sw = this.cameras.main.width;
        const sh = this.cameras.main.height;

        // 1. Background
        let bg = this.add.image(0, 0, 'bed_bg').setOrigin(0);
        bg.setDisplaySize(sw, sh);

        // 2. Input Setup
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        this.add.text(sw / 2, 50, `LEVEL ${this.currentLevel}/3`, {
            fontSize: '32px', fill: '#ffffff', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 6, fontFamily: 'monospace'
        }).setOrigin(0.5);

        // 3. Grid setup
        let cardValues = [];
        for (let i = 1; i <= this.totalPairs; i++) cardValues.push(i, i);
        Phaser.Utils.Array.Shuffle(cardValues);

        const cols = this.config.cols;
        const spacingX = this.config.spaceX;
        const spacingY = this.config.spaceY;
        const totalRows = Math.ceil(this.totalCards / cols);
        const startX = sw / 2 - ((cols - 1) * spacingX) / 2;
        const startY = sh / 2 - ((totalRows - 1) * spacingY) / 2 + 25;

        for (let i = 0; i < this.totalCards; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = startX + (col * spacingX);
            const y = startY + (row * spacingY);

            // Card
            const cardBack = this.add.rectangle(x, y, 85, 110, 0x1a252f).setStrokeStyle(4, 0xffffff);
            const cardFront = this.add.text(x, y, cardValues[i].toString(), {
                fontSize: this.config.fontSize, fill: '#ffffff', fontStyle: 'bold'
            }).setOrigin(0.5).setVisible(false);

            cardBack.cardValue = cardValues[i];
            cardBack.cardFrontText = cardFront;
            cardBack.isFlipped = false;
            this.cards.push(cardBack);
        }

        // 4. Selection Rect
        this.selectionRect = this.add.rectangle(0, 0, 95, 120, 0xffff00, 0.2)
            .setStrokeStyle(6, 0xffff00).setDepth(100);

        this.statusText = this.add.text(sw / 2, sh - 50, '', {
            fontSize: '20px', fill: '#ffffff', fontStyle: 'bold',
            shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 4, fill: true },
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        // 5. Khởi tạo hệ thống DialogueBox
        this.dialogueBox = new DialogueBox(this);
    }

    update() {
        // --- ĐỒNG BỘ NÚT HÀNH ĐỘNG A ---
        const isActionA = Phaser.Input.Keyboard.JustDown(this.keyE) || 
                          Phaser.Input.Keyboard.JustDown(this.keySpace) ||
                          joypad.actionA;

        // ƯU TIÊN CHẶN ĐẦU: Nếu đang hiện thoại, bấm nút A để tua thoại và thoát xử lý game ngay
        if (this.isInDialogue) {
            if (isActionA) {
                joypad.actionA = false; // Xóa ngay tín hiệu joypad lặp frame
                this.dialogueBox.next(); // Sử dụng hàm .next() đồng bộ
            }
            return;
        }

        // --- ĐỒNG BỘ ĐIỀU HƯỚNG DI CHUYỂN KHUNG CHỌN (Phím mũi tên + Joypad ảo) ---
        const moveLeft = Phaser.Input.Keyboard.JustDown(this.cursors.left) || joypad.left;
        const moveRight = Phaser.Input.Keyboard.JustDown(this.cursors.right) || joypad.right;
        const moveUp = Phaser.Input.Keyboard.JustDown(this.cursors.up) || joypad.up;
        const moveDown = Phaser.Input.Keyboard.JustDown(this.cursors.down) || joypad.down;

        if (moveLeft) {
            this.selected.col = Math.max(0, this.selected.col - 1);
            joypad.left = false; // Reset trạng thái nút ảo
        } else if (moveRight) {
            this.selected.col = Math.min(this.config.cols - 1, this.selected.col + 1);
            joypad.right = false;
        } else if (moveUp) {
            this.selected.row = Math.max(0, this.selected.row - 1);
            joypad.up = false;
        } else if (moveDown) {
            this.selected.row = Math.min(Math.ceil(this.cards.length / this.config.cols) - 1, this.selected.row + 1);
            joypad.down = false;
        }

        // Cập nhật vị trí khung vàng chọn bài theo ô được chọn
        const index = this.selected.row * this.config.cols + this.selected.col;
        if (this.cards[index]) this.selectionRect.setPosition(this.cards[index].x, this.cards[index].y);

        // --- XỬ LÝ LẬT BÀI KHI ẤN NÚT HÀNH ĐỘNG ---
        if (isActionA) {
            joypad.actionA = false; // Reset trạng thái nút ảo
            if (this.cards[index]) this.handleFlip(this.cards[index]);
        }
    }

    handleFlip(card) {
        if (!this.canFlip || card.isFlipped) return;
        card.setFillStyle(0xe67e22);
        card.cardFrontText.setVisible(true);
        card.isFlipped = true;
        this.selectedCards.push(card);
        if (this.selectedCards.length === 2) this.checkMatch();
    }

    checkMatch() {
        this.canFlip = false;
        const [card1, card2] = this.selectedCards;
        if (card1.cardValue === card2.cardValue) {
            card1.setFillStyle(0x3e5c3b); // Màu xanh chăn giường
            card2.setFillStyle(0x3e5c3b);
            this.selectedCards = []; this.matchedPairs++; this.canFlip = true;
            if (this.matchedPairs === this.totalPairs) this.time.delayedCall(500, () => this.nextLevel());
        } else {
            this.time.delayedCall(800, () => {
                card1.setFillStyle(0x1a252f); card2.setFillStyle(0x1a252f);
                card1.cardFrontText.setVisible(false); card2.cardFrontText.setVisible(false);
                card1.isFlipped = false; card2.isFlipped = false;
                this.selectedCards = []; this.canFlip = true;
            });
        }
    }

    nextLevel() {
        if (this.currentLevel < 3) {
            this.scene.restart({ level: this.currentLevel + 1 });
        } else {
            // Khi thắng Level 3 hoàn toàn: Kích hoạt trạng thái hội thoại trước khi đổi cảnh
            this.isInDialogue = true;
            this.canFlip = false;
            this.selectionRect.setVisible(false); // Ẩn khung vàng chọn bài để nhìn thoại rõ hơn
            
            // Thay đổi dòng trạng thái hướng dẫn người chơi
            this.statusText.setText('Press [E], [SPACE] or Button A to continue...');

            // Clear luôn bộ nhớ đệm bàn phím và nút ảo của frame hiện tại để tránh dính nút ngay lập tức
            joypad.actionA = false;
            this.input.keyboard.resetKeys();

            this.dialogueBox.startSequence('foundKey', () => {
                // Hàm callback chạy sau khi kết thúc toàn bộ đoạn thoại
                this.isInDialogue = false;
                this.registry.set('masterGameWon', true);
                this.registry.set('keysFound', (this.registry.get('keysFound') || 0) + 1);

                this.playKeyRewardEffect(() => {
                    this.scene.start('HallwayScene', { fromScene: 'MemoryGameScene' });
                });
            });
        }
    }

    playKeyRewardEffect(onComplete) {
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;
        const rewardContainer = this.add.container(centerX, centerY).setDepth(2600);
        const overlay = this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.55);
        const glow = this.add.circle(0, -16, 58, 0xf1c40f, 0.28);
        const ring = this.add.circle(0, -16, 72, 0xf1c40f, 0).setStrokeStyle(3, 0xf1c40f, 0.9);
        const key = this.add.image(0, -18, 'key_icon_bg').setScale(0.18).setAngle(-18);
        const title = this.add.text(0, 70, 'KEY ACQUIRED', {
            fontSize: '22px',
            color: '#ffe066',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 5
        }).setOrigin(0.5);

        const sparklePoints = [
            [-84, -58], [82, -62], [-70, 38], [76, 34], [0, -96], [0, 26]
        ];
        const sparkles = sparklePoints.map(([x, y], index) => {
            const sparkle = this.add.star(x, y, 5, 4, 11, 0xffffff, 0.95)
                .setScale(0)
                .setAngle(index * 24);
            rewardContainer.add(sparkle);

            this.tweens.add({
                targets: sparkle,
                scale: { from: 0, to: 1 },
                alpha: { from: 0.2, to: 0 },
                angle: sparkle.angle + 120,
                duration: 650,
                delay: index * 80,
                ease: 'Sine.easeOut'
            });

            return sparkle;
        });

        rewardContainer.add([overlay, glow, ring, key, title]);
        rewardContainer.setAlpha(0);
        rewardContainer.setScale(0.7);

        this.tweens.add({
            targets: rewardContainer,
            alpha: 1,
            scale: 1,
            duration: 260,
            ease: 'Back.easeOut'
        });

        this.tweens.add({
            targets: key,
            y: -34,
            angle: 14,
            scale: 0.26,
            duration: 620,
            yoyo: true,
            repeat: 1,
            ease: 'Sine.easeInOut'
        });

        this.tweens.add({
            targets: ring,
            scale: { from: 0.55, to: 1.35 },
            alpha: { from: 1, to: 0 },
            duration: 900,
            repeat: 1,
            ease: 'Sine.easeOut'
        });

        this.tweens.add({
            targets: glow,
            scale: { from: 0.75, to: 1.25 },
            alpha: { from: 0.45, to: 0.15 },
            duration: 520,
            yoyo: true,
            repeat: 2,
            ease: 'Sine.easeInOut'
        });

        this.time.delayedCall(1650, () => {
            this.tweens.add({
                targets: rewardContainer,
                alpha: 0,
                scale: 0.92,
                duration: 240,
                ease: 'Sine.easeIn',
                onComplete: () => {
                    sparkles.forEach((sparkle) => sparkle.destroy());
                    rewardContainer.destroy();
                    if (onComplete) onComplete();
                }
            });
        });
    }
}
