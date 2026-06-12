import Player from '../objects/Player.js';
import DialogueBox from '../objects/DialogueBox.js';
import { joypad } from '../assets/VirtualJoypad.js'; // 1. IMPORT JOYPAD ẢO

export default class PuzzyRoomScene extends Phaser.Scene {
    constructor() {
        super('PuzzyRoomScene');
    }

    init(data) {
        this.spawnDirection = data.fromScene || 'default';
    }

    create() {
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;

        this.gameActive = false; // Trạng thái mini-game xếp hình

        // 1. Thêm nền phòng
        let bg = this.add.image(0, 0, 'puzzy_bg').setOrigin(0);
        bg.displayWidth = screenWidth;
        bg.displayHeight = screenHeight;

        // 2. Tạo Player
        this.player = new Player(this, screenWidth * 0.77, screenHeight * 0.3);

        // 3. Khởi tạo hộp thoại DialogueBox
        this.dialogueBox = new DialogueBox(this);

        this.bookX = screenWidth * 0.43;
        this.bookY = screenHeight * 0.5;

        this.exclamation = this.add.text(this.bookX, this.bookY, '!', {
            fontSize: '28px',
            fill: '#ffcc00',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(1005);

        // Hiệu ứng nhấp nhô cho dấu !
        this.tweens.add({
            targets: this.exclamation,
            y: this.bookY - 12,
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // 5. Đăng ký phím cứng hành động
        this.interactKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.hasInteracted = false;

        // KHAI BÁO CÁC PHÍM ĐIỀU KHIỂN CHO GAME XẾP HÌNH
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.cameras.main.fadeIn(1200, 0, 0, 0);

    }

    startPuzzleGame() {
        if (this.gameActive) return;
        this.gameActive = true;

        if (this.player && typeof this.player.setVelocity === 'function') {
            this.player.setVelocity(0, 0);
        }

        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;

        // Tạo container quản lý vị trí tuyệt đối
        this.puzzleContainer = this.add.container(0, 0).setDepth(2000);

        let puzzleBg = this.add.rectangle(centerX, centerY, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.85);
        let puzzleBoard = this.add.rectangle(centerX, centerY, 310, 310, 0x2c3e50).setStrokeStyle(4, 0xf1c40f);

        let puzzleTitle = this.add.text(centerX, centerY - 220, '🧩 NUMBER MATRIX PUZZLE 🧩', { fontSize: '22px', color: '#f1c40f', fontWeight: 'bold' }).setOrigin(0.5);
        let puzzleGuide = this.add.text(centerX, centerY + 220, 'Use Mouse, WASD, Arrow Keys, or Joypad to move!', { fontSize: '14px', color: '#ffffff' }).setOrigin(0.5);
        this.puzzleContainer.add([puzzleBg, puzzleBoard, puzzleTitle, puzzleGuide]);

        this.correctOrder = [0, 1, 2, 3, 4, 5, 6, 7, 8];
        this.boardState = [...this.correctOrder];
        this.tiles = {};

        this.emptyIndex = 8;
        this.shuffleBoard();

        const tileSize = 96;

        for (let i = 0; i < 9; i++) {
            let val = i;
            let tile = this.add.container(0, 0);

            let bgRect = this.add.rectangle(0, 0, tileSize - 6, tileSize - 6, 0xd35400);
            let textNum = this.add.text(0, 0, (val + 1).toString(), { fontSize: '24px', color: '#ffffff', fontWeight: 'bold' }).setOrigin(0.5);

            tile.add([bgRect, textNum]);

            tile.setInteractive(new Phaser.Geom.Rectangle(-tileSize / 2, -tileSize / 2, tileSize, tileSize), Phaser.Geom.Rectangle.Contains);
            tile.tileValue = val;

            tile.on('pointerdown', () => {
                this.onTileClicked(tile);
            });

            if (val === 8) {
                tile.setVisible(false);
            }

            this.tiles[val] = tile;
            this.puzzleContainer.add(tile);
        }

        this.updateTilePositionsImmediately();
    }

    shuffleBoard() {
        for (let i = 0; i < 40; i++) {
            let validMoves = [];
            let row = Math.floor(this.emptyIndex / 3);
            let col = this.emptyIndex % 3;

            if (row > 0) validMoves.push(this.emptyIndex - 3);
            if (row < 2) validMoves.push(this.emptyIndex + 3);
            if (col > 0) validMoves.push(this.emptyIndex - 1);
            if (col < 2) validMoves.push(this.emptyIndex + 1);

            let randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
            let temp = this.boardState[this.emptyIndex];
            this.boardState[this.emptyIndex] = this.boardState[randomMove];
            this.boardState[randomMove] = temp;
            this.emptyIndex = randomMove;
        }
    }

    onTileClicked(gameObject) {
        if (!this.gameActive || gameObject.tileValue === undefined || gameObject.tileValue === 8) return;

        let clickedValue = gameObject.tileValue;
        let clickedIndex = this.boardState.indexOf(clickedValue);
        let cRow = Math.floor(clickedIndex / 3);
        let cCol = clickedIndex % 3;
        let eRow = Math.floor(this.emptyIndex / 3);
        let eCol = this.emptyIndex % 3;

        if ((Math.abs(cRow - eRow) + Math.abs(cCol - eCol)) === 1) {
            this.moveTile(clickedIndex);
        }
    }

    handleKeyboardInputs() {
        if (!this.gameActive) return;

        let eRow = Math.floor(this.emptyIndex / 3);
        let eCol = this.emptyIndex % 3;
        let targetIndex = -1;

        // --- ĐỒNG BỘ ĐIỀU HƯỚNG MA TRẬN SỐ (Bàn phím + Joypad ảo) ---
        const moveUp = Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.keyW) || joypad.up;
        const moveDown = Phaser.Input.Keyboard.JustDown(this.cursors.down) || Phaser.Input.Keyboard.JustDown(this.keyS) || joypad.down;
        const moveLeft = Phaser.Input.Keyboard.JustDown(this.cursors.left) || Phaser.Input.Keyboard.JustDown(this.keyA) || joypad.left;
        const moveRight = Phaser.Input.Keyboard.JustDown(this.cursors.right) || Phaser.Input.Keyboard.JustDown(this.keyD) || joypad.right;

        if (moveUp) {
            if (eRow < 2) targetIndex = this.emptyIndex + 3;
            joypad.up = false; // Reset trạng thái nút ảo
        }
        else if (moveDown) {
            if (eRow > 0) targetIndex = this.emptyIndex - 3;
            joypad.down = false;
        }
        else if (moveLeft) {
            if (eCol < 2) targetIndex = this.emptyIndex + 1;
            joypad.left = false;
        }
        else if (moveRight) {
            if (eCol > 0) targetIndex = this.emptyIndex - 1;
            joypad.right = false;
        }

        if (targetIndex !== -1) {
            this.moveTile(targetIndex);
        }
    }

    moveTile(tileIndex) {
        let tileValue = this.boardState[tileIndex];
        this.boardState[this.emptyIndex] = tileValue;
        this.boardState[tileIndex] = 8;
        this.emptyIndex = tileIndex;
        this.updateTilePositionsImmediately();
        this.checkPuzzleWin();
    }

    updateTilePositionsImmediately() {
        const tileSize = 96;
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;

        const startX = centerX - tileSize;
        const startY = centerY - tileSize;

        for (let i = 0; i < 9; i++) {
            let val = this.boardState[i];
            if (this.tiles[val]) {
                let row = Math.floor(i / 3);
                let col = i % 3;
                let targetX = startX + col * tileSize;
                let targetY = startY + row * tileSize;

                this.tweens.add({
                    targets: this.tiles[val],
                    x: targetX,
                    y: targetY,
                    duration: 120,
                    ease: 'Cubic.easeOut'
                });
            }
        }
    }

    checkPuzzleWin() {
        let isWin = this.boardState.every((val, index) => val === this.correctOrder[index]);
        if (isWin) {
            this.gameActive = false;

            this.time.delayedCall(400, () => {
                this.destroyPuzzleUI();

                // CẬP NHẬT CHÌA KHÓA VÀO REGISTRY
                let currentKeys = this.registry.get('keysFound') || 0;
                if (!this.registry.get('puzzyRoomWon')) {
                    this.registry.set('keysFound', currentKeys + 1);
                    this.registry.set('puzzyRoomWon', true);
                }

                // Hiện hộp thoại nhận chìa khóa
                if (this.player) this.player.isTalking = true;

                // Xóa bộ đệm nút ảo và phím kẹt trước khi vào thoại win để tránh trôi chữ
                joypad.actionA = false;
                this.input.keyboard.resetKeys();

                this.dialogueBox.startSequence('foundKey', () => {
                    if (this.player) this.player.isTalking = false;
                    this.scene.start('RoomChildScene', { fromScene: 'PuzzyRoomScene' });
                });
            });
        }
    }

    destroyPuzzleUI() {
        this.gameActive = false;
        if (this.puzzleContainer) this.puzzleContainer.destroy();
    }

    update() {
        // --- ĐỒNG BỘ NÚT HÀNH ĐỘNG A ---
        const isActionA = Phaser.Input.Keyboard.JustDown(this.interactKey) || joypad.actionA;

        // 1. Nếu đang chơi game xếp hình, quét phím ma trận và chặn di chuyển nhân vật
        if (this.gameActive) {
            this.handleKeyboardInputs();
            return;
        }

        // 2. ƯU TIÊN CHẶN ĐẦU KHI ĐANG THOẠI: Bấm nút A/SPACE để tua thoại câu tiếp theo
        if (this.player && this.player.isTalking) {
            if (isActionA) {
                joypad.actionA = false; // Xóa tín hiệu lặp frame ảo
                if (this.dialogueBox && this.dialogueBox.visible) {
                    this.dialogueBox.next(); // Đồng bộ sử dụng hàm .next()
                }
            }
            return;
        }

        // 3. Logic đi bộ tự do và quét khoảng cách tương tác vật thể
        if (this.player) {
            this.player.update();

            let distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.bookX, this.bookY);

            if (distance < 80 && !this.hasInteracted) {
                if (this.exclamation && this.exclamation.active) {
                    this.exclamation.setFill('#00ff00'); // Đổi màu xanh báo hiệu
                }

                // Nhấn nút hành động để bắt đầu kích hoạt mở màn
                if (isActionA) {
                    joypad.actionA = false; // Xóa tín hiệu nút ảo
                    this.hasInteracted = true;
                    if (this.exclamation) this.exclamation.destroy();

                    if (this.player.body) {
                        this.player.setVelocity(0);
                        this.player.isTalking = true;
                    }

                    // Xóa phím kẹt tránh đè lệnh vào thoại
                    this.input.keyboard.resetKeys();

                    // Gọi hội thoại mở đầu từ file DialogueBox.js
                    this.dialogueBox.startSequence('puzzleIntro', () => {
                        // Đóng hội thoại xong thì bật mini game xếp hình luôn
                        this.startPuzzleGame();
                    });
                }
            } else {
                if (this.exclamation && this.exclamation.active) {
                    this.exclamation.setFill('#ffcc00'); // Trở lại màu vàng
                }
            }
        }
    }
}