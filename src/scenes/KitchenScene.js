import DialogueBox from '../objects/DialogueBox.js';
import Player from '../objects/Player.js';

// Bộ từ điển lời thoại phòng bếp - Tích hợp cốt truyện chuỗi mật mã hộp đồ chơi


export default class KitchenScene extends Phaser.Scene {
    constructor() {
        super('KitchenScene');
    }
    init(data) {
        // Nhận dữ liệu từ Phòng Khách truyền sang
        this.spawnDirection = data.fromScene || 'default';
    }
    create() {
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;

        // Nền phòng bếp
        let bg = this.add.image(0, 0, 'kitchen_bg').setOrigin(0);
        bg.displayWidth = screenWidth;
        bg.displayHeight = screenHeight;


        // ==========================================
        // CÁC VÙNG CẢN / TƯƠNG TÁC (GIỮ NGUYÊN TỌA ĐỘ PHẦN CỨNG)
        // ==========================================
        this.obstacles = this.physics.add.staticGroup();

        let topWall = this.add.zone(0, 0, screenWidth, screenHeight * 0.25).setOrigin(0);
        this.obstacles.add(topWall);

        this.fridgeZone = this.add.zone(screenWidth * 0.15, screenHeight * 0.12, screenWidth * 0.1, screenHeight * 0.2).setOrigin(0);
        this.obstacles.add(this.fridgeZone);

        let microwaveObstacle = this.add.zone(screenWidth * 0.25, screenHeight * 0.17, screenWidth * 0.15, screenHeight * 0.15).setOrigin(0);
        this.obstacles.add(microwaveObstacle);

        this.toasterZone = this.add.zone(screenWidth * 0.4, screenHeight * 0.17, screenWidth * 0.4, screenHeight * 0.2).setOrigin(0);
        this.obstacles.add(this.toasterZone);

        let cabinetObstacle = this.add.zone(screenWidth * 0.09, screenHeight * 0.35, screenWidth * 0.08, screenHeight * 0.28).setOrigin(0);
        this.obstacles.add(cabinetObstacle);

        this.tableZone = this.add.zone(screenWidth * 0.36, screenHeight * 0.5, screenWidth * 0.25, screenHeight * 0.2).setOrigin(0);
        this.obstacles.add(this.tableZone);

        // Khởi tạo Player & NPC
        this.player = new Player(this, 900, 290);



        // Cửa phụ ra phòng khách
        this.toLivingroomZone = this.add.zone(screenWidth * 0.5, screenHeight * 0.87, screenWidth * 0.1, 40).setOrigin(0.5);
        this.physics.add.existing(this.toLivingroomZone, true); // True = Static Body (đứng im)

        this.physics.add.overlap(this.player, this.toLivingroomZone, () => {
            this.scene.start('LivingRoomScene', { fromScene: 'fromKitchen' });
        });


        this.dialogueBox = new DialogueBox(this);
        this.physics.add.collider(this.player, this.obstacles);

        this.physics.world.setBounds(100, 45, screenWidth - 200, screenHeight - 130);
        if (this.player.body) {
            this.player.setCollideWorldBounds(true);
        }

        // ==========================================
        // UI: NÚT TƯƠNG TÁC (CHỮ A ĐỎ)
        // ==========================================
        this.interactIcon = this.add.container(0, 0);
        let circle = this.add.graphics();
        circle.fillStyle(0xe74c3c, 1);
        circle.fillCircle(0, 0, 15);
        circle.lineStyle(2, 0x000000, 1);
        circle.strokeCircle(0, 0, 15);

        let textA = this.add.text(0, 0, 'A', {
            fontSize: '16px',
            color: '#ffffff',
            fontWeight: 'bold',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        this.interactIcon.add([circle, textA]);
        this.interactIcon.setVisible(false);
        this.interactIcon.setDepth(100);

        // ==========================================
        // UI: DẤU CHẤM THAN GỢI Ý (!) MÀU VÀNG
        // ==========================================
        this.hintIcon = this.add.text(0, 0, '!', {
            fontSize: '40px',
            color: '#f1c40f',
            fontWeight: 'bold',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);
        this.hintIcon.setDepth(99);
        this.hintIcon.setVisible(false);

        this.tweens.add({
            targets: this.hintIcon,
            y: '-=10',
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Cài đặt phím bấm
        this.keyE = this.input.keyboard.addKey('E');
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keyW = this.input.keyboard.addKey('W');
        this.keyA = this.input.keyboard.addKey('A');
        this.keyS = this.input.keyboard.addKey('S');
        this.keyD = this.input.keyboard.addKey('D');

        this.questStep = 0;
        this.gameActive = false;
        this.isTalking = false;

        this.input.on('gameobjectdown', this.onTileClicked, this);

        // Kiểm tra xem phòng bếp đã cấp mã số chưa để tránh reset quest khi re-enter scene
        if (this.registry.get('code_digit_1') !== null) {
            this.questStep = 5; // Trạng thái đã hoàn thành xong nhiệm vụ tại đây
        }

        // Thoại mở đầu
        if (this.questStep === 0 && this.dialogueBox && typeof this.dialogueBox.startSequence === 'function') {
            this.isTalking = true;
            this.dialogueBox.startSequence('kitchenIntro', () => {
                this.questStep = 0;
                this.isTalking = false;
            });
        }
    }

    isNear(zone) {
        if (!zone) return false;
        const zoneCenterX = zone.x + (zone.width / 2);
        const zoneCenterY = zone.y + (zone.height / 2);
        const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, zoneCenterX, zoneCenterY);
        return distance <= 150;
    }

    // ==========================================
    // MINI-GAME XẾP Ô HÌNH BÁNH NGỌT 3X3
    // ==========================================
    startPuzzleGame() {
        if (this.gameActive) return;
        this.gameActive = true;

        this.interactIcon.setVisible(false);
        this.hintIcon.setVisible(false);

        if (this.player && typeof this.player.setVelocity === 'function') {
            this.player.setVelocity(0, 0);
        }

        this.puzzleContainer = this.add.container(0, 0);
        let puzzleBg = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.85);
        let puzzleBoard = this.add.rectangle(400, 300, 310, 310, 0x2c3e50).setStrokeStyle(4, 0xf1c40f);
        let puzzleTitle = this.add.text(400, 80, '🧩 SẮP XẾP BÁNH NGỌT 🧩', { fontSize: '22px', color: '#f1c40f', fontWeight: 'bold' }).setOrigin(0.5);
        let puzzleGuide = this.add.text(400, 520, 'Dùng Chuột hoặc WASD / Phím mũi tên để xếp hình!', { fontSize: '14px', color: '#ffffff' }).setOrigin(0.5);

        this.puzzleContainer.add([puzzleBg, puzzleBoard, puzzleTitle, puzzleGuide]);

        this.correctOrder = [0, 1, 2, 3, 4, 5, 6, 7, 8];
        this.boardState = [...this.correctOrder];
        this.tiles = {};

        this.emptyIndex = 8;
        this.shuffleBoard();

        const tileSize = 95;

        for (let i = 0; i < 9; i++) {
            let val = i;
            let tile = this.add.container(0, 0);
            let bgRect = this.add.rectangle(tileSize / 2, tileSize / 2, tileSize - 4, tileSize - 4, 0xd35400);
            let textNum = this.add.text(tileSize / 2, tileSize / 2, (val + 1).toString(), { fontSize: '20px', color: '#ffffff', fontWeight: 'bold' }).setOrigin(0.5);

            tile.add([bgRect, textNum]);
            tile.setInteractive(new Phaser.Geom.Rectangle(0, 0, tileSize, tileSize), Phaser.Geom.Rectangle.Contains);
            tile.tileValue = val;

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

    onTileClicked(pointer, gameObject) {
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
        let eRow = Math.floor(this.emptyIndex / 3);
        let eCol = Math.floor(this.emptyIndex % 3);
        let targetIndex = -1;

        if (Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.keyW)) {
            if (eRow < 2) targetIndex = this.emptyIndex + 3;
        }
        else if (Phaser.Input.Keyboard.JustDown(this.cursors.down) || Phaser.Input.Keyboard.JustDown(this.keyS)) {
            if (eRow > 0) targetIndex = this.emptyIndex - 3;
        }
        else if (Phaser.Input.Keyboard.JustDown(this.cursors.left) || Phaser.Input.Keyboard.JustDown(this.keyA)) {
            if (eCol < 2) targetIndex = this.emptyIndex + 1;
        }
        else if (Phaser.Input.Keyboard.JustDown(this.cursors.right) || Phaser.Input.Keyboard.JustDown(this.keyD)) {
            if (eCol > 0) targetIndex = this.emptyIndex - 1;
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
        const tileSize = 95;
        const startX = 400 - (tileSize * 1.5);
        const startY = 300 - (tileSize * 1.5);

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
                    duration: 100,
                    ease: 'Linear'
                });
            }
        }
    }

    checkPuzzleWin() {
        let isWin = this.boardState.every((val, index) => val === this.correctOrder[index]);
        if (isWin) {
            this.gameActive = false;
            this.time.delayedCall(300, () => {
                this.destroyPuzzleUI();
                this.isTalking = true;

                this.dialogueBox.startSequence(KITCHEN_DIALOGUES.puzzleSuccess, () => {
                    this.questStep = 3;
                    this.isTalking = false;
                });
            });
        }
    }

    destroyPuzzleUI() {
        this.gameActive = false;
        if (this.puzzleContainer) this.puzzleContainer.destroy();
    }

    update() {
        if (this.gameActive) {
            if (this.player && typeof this.player.setVelocity === 'function') {
                this.player.setVelocity(0, 0);
            }
            this.handleKeyboardInputs();
            return;
        }

        if (this.isTalking) {
            if (this.player && typeof this.player.setVelocity === 'function') {
                this.player.setVelocity(0, 0);
            }
            this.hintIcon.setVisible(false);
            this.interactIcon.setVisible(false);
            return;
        }

        if (this.player && typeof this.player.update === 'function') {
            this.player.update();
        }

        // Kiểm tra xem có đứng gần cửa về phòng ngủ không
        let nearBackDoor = this.isNear(this.backToBedroomZone);

        // ==========================================
        // LOGIC TỰ ĐỘNG XỬ LÝ DẤU HÌNH (!) VÀ NÚT (A)
        // ==========================================
        let targetZone = null;

        if (this.questStep === 0) targetZone = this.fridgeZone;
        else if (this.questStep === 1) targetZone = this.toasterZone;
        else if (this.questStep === 3) targetZone = this.tableZone;

        if (targetZone) {
            let zoneCenterX = targetZone.x + (targetZone.width / 2);
            let zoneCenterY = targetZone.y + (targetZone.height / 2);

            if (this.isNear(targetZone)) {
                this.hintIcon.setVisible(false);
                this.interactIcon.setPosition(this.player.x, this.player.y - 50);
                this.interactIcon.setVisible(true);
            } else {
                this.interactIcon.setVisible(false);
                this.hintIcon.setPosition(zoneCenterX, zoneCenterY - 40);
                this.hintIcon.setVisible(true);
            }
        } else if (nearBackDoor) {
            // Hiển thị nút tương tác A nếu đứng gần cửa về phòng ngủ
            this.interactIcon.setPosition(this.player.x, this.player.y - 50);
            this.interactIcon.setVisible(true);
            this.hintIcon.setVisible(false);
        } else {
            this.hintIcon.setVisible(false);
            this.interactIcon.setVisible(false);
        }

        // ==========================================
        // XỬ LÝ NHẤN PHÍM E TƯƠNG TÁC
        // ==========================================
        if (this.keyE && Phaser.Input.Keyboard.JustDown(this.keyE)) {

            // HÀNH ĐỘNG: Đi qua cửa quay về phòng ngủ
            if (nearBackDoor) {
                this.isTalking = true;
                this.player.setVelocity(0);
                this.scene.start('BedroomScene');
                return;
            }

            // 1. Tủ lạnh
            if (this.questStep === 0 && this.isNear(this.fridgeZone)) {
                this.isTalking = true;
                this.dialogueBox.startSequence(KITCHEN_DIALOGUES.fridgeCollect, () => {
                    this.questStep = 1;
                    this.isTalking = false;
                });
            }

            // 2. Lò nướng
            else if (this.questStep === 1 && this.isNear(this.toasterZone)) {
                this.startPuzzleGame();
            }

            // 3. Bàn ăn
            else if (this.questStep === 3 && this.isNear(this.tableZone)) {
                this.isTalking = true;
                this.dialogueBox.startSequence(KITCHEN_DIALOGUES.tablePlace, () => {
                    this.questStep = 4;
                    this.isTalking = false;
                });
            }

            // 4. Báo cáo với Mẹ -> NHẬN CHỮ SỐ MẬT MÃ ĐẦU TIÊN

        }
    }
}