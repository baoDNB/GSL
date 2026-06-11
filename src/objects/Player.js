import Phaser from 'phaser';
import { joypad } from '../assets/VirtualJoypad.js';

export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'player', 0)

        scene.add.existing(this)
        scene.physics.add.existing(this)

        this.setScale(0.4)
        this.setCollideWorldBounds(true)

        // --- THÊM 2 DÒNG NÀY ĐỂ FIX LỖI VA CHẠM KHUNG HÌNH SCALE ---
        // Đặt lại kích thước khung va chạm bằng đúng kích thước hiển thị thực tế
        this.body.setSize(this.width * 0.3, this.height * 0.25);
        this.body.setOffset(this.width * 0.35, this.height * 0.6);

        this.cursors = scene.input.keyboard.createCursorKeys()
    }

    update() {
        // ... Giữ nguyên toàn bộ logic di chuyển, anims.play() bên dưới của bạn ...
        const speed = 150;
        this.setVelocity(0);
        let isMoving = false;

        if (this.cursors.left.isDown) {
            this.setVelocityX(-speed);
            this.anims.play('walk-side', true);
            this.setFlipX(false);
            this.lastDirection = 'left';
            isMoving = true;
        }
        else if (this.cursors.right.isDown) {
            this.setVelocityX(speed);
            this.anims.play('walk-side', true);
            this.setFlipX(true);
            this.lastDirection = 'right';
            isMoving = true;
        }

        if (this.cursors.up.isDown) {
            this.setVelocityY(-speed);
            this.anims.play('walk-up', true);
            this.lastDirection = 'up';
            isMoving = true;
        }
        else if (this.cursors.down.isDown) {
            this.setVelocityY(speed);
            this.anims.play('walk-down', true);
            this.lastDirection = 'down';
            isMoving = true;
        }

        if (!isMoving) {
            if (this.lastDirection === 'up') this.anims.play('idle-up', true);
            else if (this.lastDirection === 'down') this.anims.play('idle-down', true);
            else if (this.lastDirection === 'left') { this.setFlipX(false); this.anims.play('idle-side', true); }
            else if (this.lastDirection === 'right') { this.setFlipX(true); this.anims.play('idle-side', true); }
        }
        const isLeft = this.cursors.left.isDown || joypad.left;
        const isRight = this.cursors.right.isDown || joypad.right;
        const isUp = this.cursors.up.isDown || joypad.up;
        const isDown = this.cursors.down.isDown || joypad.down;
        const isAction = Phaser.Input.Keyboard.JustDown(this.scene.input.keyboard.addKey('SPACE')) || joypad.actionA;

        // Ví dụ xử lý di chuyển cơ bản:
        if (isLeft) {
            this.setVelocityX(-160);
            this.anims.play('left', true);
        } else if (isRight) {
            this.setVelocityX(160);
            this.anims.play('right', true);
        } else {
            this.setVelocityX(0);
        }

        if (isUp) {
            this.setVelocityY(-160);
            // this.anims.play('up', true);
        } else if (isDown) {
            this.setVelocityY(160);
            // this.anims.play('down', true);
        } else {
            this.setVelocityY(0);
        }

        // Nếu bấm nút A (tương tác với cửa/đồ vật)
        if (isAction) {
            console.log("Thực hiện thao tác A (Mở cửa, nói chuyện...)");
        }
    }

}