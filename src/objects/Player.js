import Phaser from 'phaser'

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
    }
}