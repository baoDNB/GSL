import Player from '../objects/Player.js';
import Phaser from 'phaser';
// 1. IMPORT THÊM DIALOGUEBOX
import DialogueBox from '../objects/DialogueBox.js';
import { joypad } from '../assets/VirtualJoypad.js';

export default class HouseScene extends Phaser.Scene {
    constructor() {
        super('HouseScene');
    }

    create() {
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;

        // 1. Thêm nền sân vườn
        let bg = this.add.image(0, 0, 'house_bg').setOrigin(0);
        bg.displayWidth = screenWidth;
        bg.displayHeight = screenHeight;

        // Khởi tạo Dialogue Box để chạy thoại trước
        this.dialogueBox = new DialogueBox(this);

        // Mặc định bật cờ khóa di chuyển để Player không bị trượt vật lý
        this.isAutoWalking = true;

        // 2. Tạo Player đứng đúng vị trí góc dưới bên trái vỉa hè
        const startX = screenWidth * 0.18; 
        const startY = screenHeight * 0.88; 

        this.player = new Player(this, startX, startY);
        this.player.lastDirection = 'up';
        this.playPlayerAnim('idle-up');

        // Thiết lập trạng thái đang thoại cho Player (để đứng im)
        this.player.isTalking = true;

        // Tọa độ các điểm nút để nhân vật đi vào nhà
        this.stepsX = screenWidth * 0.6;
        this.stepsY = screenHeight * 0.72;
        this.doorX = screenWidth * 0.6;
        this.doorY = screenHeight * 0.42;

        // ==========================================================
        // KÍCH HOẠT CHUỖI THOẠI TRƯỚC KHI ĐI VÀO NHÀ
        // ==========================================================
        // Bạn nhớ thêm key 'introHouse' này vào file kịch bản DIALOGUES của bạn nhé
        this.showStartQuestIntro();
    }

    showStartQuestIntro() {
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;
        const centerX = screenWidth / 2;
        const centerY = screenHeight / 2;

        this.startMenuActive = true;
        this.startMenuKeys = this.input.keyboard.addKeys({
            e: Phaser.Input.Keyboard.KeyCodes.E,
            up: Phaser.Input.Keyboard.KeyCodes.UP,
            down: Phaser.Input.Keyboard.KeyCodes.DOWN,
            w: Phaser.Input.Keyboard.KeyCodes.W,
            s: Phaser.Input.Keyboard.KeyCodes.S
        });

        const introContainer = this.add.container(0, 0).setDepth(3000);
        const overlay = this.add.rectangle(centerX, centerY, screenWidth, screenHeight, 0x000000, 0.42);
        const topText = this.add.text(centerX, 58, 'READY PLAYER U', {
            fontSize: '20px',
            color: '#ffe066',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 5,
            fontFamily: 'monospace'
        }).setOrigin(0.5);
        const badgeGlow = this.add.circle(centerX, centerY - 70, 54, 0x2f80ed, 0.68)
            .setStrokeStyle(4, 0xffd84d, 0.95);
        const crown = this.add.text(centerX, centerY - 116, '♛ ♛ ♛', {
            fontSize: '18px',
            color: '#ffd84d',
            stroke: '#000000',
            strokeThickness: 5,
            fontFamily: 'monospace'
        }).setOrigin(0.5);
        const badgeText = this.add.text(centerX, centerY - 70, 'DAD', {
            fontSize: '26px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 6,
            fontFamily: 'monospace'
        }).setOrigin(0.5);
        const ribbon = this.add.rectangle(centerX, centerY - 52, 170, 28, 0xffc43d, 1)
            .setStrokeStyle(3, 0x7a3f00);
        const ribbonText = this.add.text(centerX, centerY - 52, 'BEST DAD EVER', {
            fontSize: '16px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4,
            fontFamily: 'monospace'
        }).setOrigin(0.5);
        const title = this.add.text(centerX, centerY + 18, 'LEGENDARY DAD', {
            fontSize: '30px',
            color: '#ffe066',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 7,
            fontFamily: 'monospace'
        }).setOrigin(0.5);
        const subtitle = this.add.text(centerX, centerY + 48, 'THE ULTIMATE CHALLENGE', {
            fontSize: '14px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4,
            fontFamily: 'monospace'
        }).setOrigin(0.5);
        const startButton = this.add.rectangle(centerX, centerY + 118, 260, 30, 0x4f79a8, 1)
            .setStrokeStyle(2, 0x89a9cf)
            .setInteractive({ useHandCursor: true });
        const startText = this.add.text(centerX, centerY + 118, 'START QUEST', {
            fontSize: '17px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4,
            fontFamily: 'monospace'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        const homeButton = this.add.rectangle(centerX, centerY + 158, 260, 30, 0x4f79a8, 1)
            .setStrokeStyle(2, 0x89a9cf)
            .setInteractive({ useHandCursor: true });
        const homeText = this.add.text(centerX, centerY + 158, 'HOME', {
            fontSize: '17px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4,
            fontFamily: 'monospace'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        const selector = this.add.text(centerX - 150, centerY + 118, '>', {
            fontSize: '20px',
            color: '#ffe066',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4,
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        introContainer.add([
            overlay, topText, badgeGlow, crown, badgeText, ribbon, ribbonText,
            title, subtitle, startButton, startText, homeButton, homeText, selector
        ]);
        introContainer.setAlpha(0);
        introContainer.setScale(0.96);
        this.startMenuContainer = introContainer;
        this.startMenuSelected = 0;
        this.startMenuItems = [
            { button: startButton, text: startText, y: centerY + 118 },
            { button: homeButton, text: homeText, y: centerY + 158 }
        ];
        this.startMenuSelector = selector;
        this.updateStartMenuSelection();

        this.tweens.add({
            targets: introContainer,
            alpha: 1,
            scale: 1,
            duration: 360,
            ease: 'Back.easeOut'
        });

        this.tweens.add({
            targets: startButton,
            alpha: 0.72,
            duration: 520,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        startButton.on('pointerdown', () => this.beginQuestFromMenu());
        startText.on('pointerdown', () => this.beginQuestFromMenu());
        startButton.on('pointerover', () => {
            this.startMenuSelected = 0;
            this.updateStartMenuSelection();
        });
        startText.on('pointerover', () => {
            this.startMenuSelected = 0;
            this.updateStartMenuSelection();
        });
        homeText.on('pointerdown', () => {
            this.goHomeFromMenu();
        });
        homeButton.on('pointerdown', () => {
            this.goHomeFromMenu();
        });
        homeText.on('pointerover', () => {
            this.startMenuSelected = 1;
            this.updateStartMenuSelection();
        });
        homeButton.on('pointerover', () => {
            this.startMenuSelected = 1;
            this.updateStartMenuSelection();
        });
    }

    updateStartMenuSelection() {
        if (!this.startMenuItems || !this.startMenuSelector) return;

        this.startMenuItems.forEach((item, index) => {
            const selected = index === this.startMenuSelected;
            item.text.setColor(selected ? '#ffe066' : '#ffffff');
            item.text.setScale(selected ? 1.08 : 1);

            if (item.button) {
                item.button.setFillStyle(selected ? 0x6fa0d3 : 0x4f79a8, 1);
                item.button.setStrokeStyle(2, selected ? 0xffe066 : 0x89a9cf);
            }
        });

        this.startMenuSelector.setY(this.startMenuItems[this.startMenuSelected].y);
    }

    moveStartMenuSelection(direction) {
        this.startMenuSelected = Phaser.Math.Wrap(this.startMenuSelected + direction, 0, this.startMenuItems.length);
        this.updateStartMenuSelection();
    }

    selectStartMenuItem() {
        if (this.startMenuSelected === 0) {
            this.beginQuestFromMenu();
        } else {
            this.goHomeFromMenu();
        }
    }

    goHomeFromMenu() {
        window.location.href = 'index.html';
    }

    beginQuestFromMenu() {
        if (!this.startMenuActive) return;
        this.startMenuActive = false;
        joypad.actionA = false;

        this.tweens.add({
            targets: this.startMenuContainer,
            alpha: 0,
            scale: 1.04,
            duration: 260,
            ease: 'Sine.easeIn',
            onComplete: () => {
                if (this.startMenuContainer) this.startMenuContainer.destroy();
                this.startIntroDialogue();
            }
        });
    }

    startIntroDialogue() {
        this.dialogueBox.startSequence('introHouse', () => {
            this.player.isTalking = false;
            this.startAutoWalk();
        });
    }

    // Hàm xử lý chuỗi di chuyển tự động sau khi đọc thoại xong
    startAutoWalk() {
        this.player.isTalking = false;
        this.player.lastDirection = 'right';

        // Bước 1: Đi chéo từ vỉa hè đến trước bậc tam cấp
        this.tweens.add({
            targets: this.player,
            x: this.stepsX,
            y: this.stepsY,
            duration: 1800,
            ease: 'Linear',
            onStart: () => {
                this.playPlayerAnim('walk-right');
            },
            onComplete: () => {
                this.player.lastDirection = 'up';
                this.playPlayerAnim('walk-up');

                // Bước 2: Đi thẳng từ bậc tam cấp khuất vào cánh cửa đen
                this.tweens.add({
                    targets: this.player,
                    x: this.doorX,
                    y: this.doorY,
                    duration: 800,
                    ease: 'Linear',
                    onComplete: () => {
                        this.playPlayerAnim('idle-up');

                        // Khi đã bước hẳn vào cửa đen, làm tối màn hình và chuyển cảnh
                        this.cameras.main.fadeOut(400, 0, 0, 0);

                        this.cameras.main.once('camerafadeoutcomplete', () => {
                            this.scene.start('KitchenScene');
                        });
                    }
                });
            }
        });
    }

    playPlayerAnim(key) {
        if (this.player && this.player.anims && this.anims.exists(key)) {
            this.player.anims.play(key, true);
        }
    }

    update() {
        if (this.startMenuActive) {
            const moveUp = Phaser.Input.Keyboard.JustDown(this.startMenuKeys.up) ||
                Phaser.Input.Keyboard.JustDown(this.startMenuKeys.w) ||
                joypad.up;
            const moveDown = Phaser.Input.Keyboard.JustDown(this.startMenuKeys.down) ||
                Phaser.Input.Keyboard.JustDown(this.startMenuKeys.s) ||
                joypad.down;
            const wantsSelect = Phaser.Input.Keyboard.JustDown(this.startMenuKeys.e) || joypad.actionA;

            if (moveUp) {
                this.moveStartMenuSelection(-1);
                joypad.up = false;
            } else if (moveDown) {
                this.moveStartMenuSelection(1);
                joypad.down = false;
            }

            if (wantsSelect) {
                this.selectStartMenuItem();
            }

            return;
        }

        // Khóa hoàn toàn quyền bấm phím của người chơi khi đang trong chế độ tự động đi / đang thoại
        if (this.isAutoWalking || (this.player && this.player.isTalking)) {
            if (this.player && this.player.body) {
                this.player.setVelocity(0); // Triệt tiêu hoàn toàn vận tốc vật lý
            }
            return;
        }

        if (this.player) this.player.update();
    }
}
