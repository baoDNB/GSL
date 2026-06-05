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

        this.add.text(sw / 2, 50, `CẤP ĐỘ ${this.currentLevel}/3`, {
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

        this.statusText = this.add.text(sw / 2, sh - 50, 'Dùng mũi tên để di chuyển, [E] hoặc [SPACE] để lật!', {
            fontSize: '20px', fill: '#ffffff', fontStyle: 'bold',
            shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 4, fill: true },
            fontFamily: 'monospace'
        }).setOrigin(0.5);
    }

    update() {
        // Điều hướng
        if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) this.selected.col = Math.max(0, this.selected.col - 1);
        else if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) this.selected.col = Math.min(this.config.cols - 1, this.selected.col + 1);
        else if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) this.selected.row = Math.max(0, this.selected.row - 1);
        else if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) this.selected.row = Math.min(Math.ceil(this.cards.length / this.config.cols) - 1, this.selected.row + 1);

        // Update khung vàng
        const index = this.selected.row * this.config.cols + this.selected.col;
        if (this.cards[index]) this.selectionRect.setPosition(this.cards[index].x, this.cards[index].y);

        // Lật bài
        if (Phaser.Input.Keyboard.JustDown(this.keyE) || Phaser.Input.Keyboard.JustDown(this.keySpace)) {
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
        if (this.currentLevel < 3) this.scene.restart({ level: this.currentLevel + 1 });
        else {
            this.registry.set('masterGameWon', true);
            this.registry.set('keysFound', (this.registry.get('keysFound') || 0) + 1);
            this.scene.start('HallwayScene', { fromScene: 'MemoryGameScene' });
        }
    }
}