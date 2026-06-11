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
        // 1. GỘP CHUNG SỰ KIỆN TỪ BÀN PHÍM VÀ NÚT ẢO (JOYPAD)
        const isLeft = this.cursors.left.isDown || joypad.left;
        const isRight = this.cursors.right.isDown || joypad.right;
        const isUp = this.cursors.up.isDown || joypad.up;
        const isDown = this.cursors.down.isDown || joypad.down;
        const isAction = Phaser.Input.Keyboard.JustDown(this.scene.input.keyboard.addKey('SPACE')) || joypad.actionA;

        // 2. KHỞI TẠO VẬN TỐC VÀ TRẠNG THÁI
        const speed = 150;
        this.setVelocity(0); // Mặc định dừng lại nếu không bấm phím
        let isMoving = false;

        // 3. XỬ LÝ DI CHUYỂN NGANG (TRÁI / PHẢI)
        if (isLeft) {
            this.setVelocityX(-speed);
            this.anims.play('walk-side', true);
            this.setFlipX(false);
            this.lastDirection = 'left';
            isMoving = true;
        }
        else if (isRight) {
            this.setVelocityX(speed);
            this.anims.play('walk-side', true);
            this.setFlipX(true);
            this.lastDirection = 'right';
            isMoving = true;
        }

        // 4. XỬ LÝ DI CHUYỂN DỌC (LÊN / XUỐNG)
        if (isUp) {
            this.setVelocityY(-speed);
            this.anims.play('walk-up', true);
            this.lastDirection = 'up';
            isMoving = true;
        }
        else if (isDown) {
            this.setVelocityY(speed);
            this.anims.play('walk-down', true);
            this.lastDirection = 'down';
            isMoving = true;
        }

        // 5. XỬ LÝ ĐỨNG YÊN (IDLE) KHI KHÔNG DI CHUYỂN
        if (!isMoving) {
            if (this.lastDirection === 'up') this.anims.play('idle-up', true);
            else if (this.lastDirection === 'down') this.anims.play('idle-down', true);
            else if (this.lastDirection === 'left') {
                this.setFlipX(false);
                this.anims.play('idle-side', true);
            }
            else if (this.lastDirection === 'right') {
                this.setFlipX(true);
                this.anims.play('idle-side', true);
            }
        }
    }

}