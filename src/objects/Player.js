import Phaser from 'phaser';
import { joypad } from '../assets/VirtualJoypad.js';

export default class Player extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y) {
        super(scene, x, y, 'player', 74);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setScale(3);
        this.setCollideWorldBounds(true);

        this.body.setSize(this.width * 0.3, this.height * 0.25);
        this.body.setOffset(this.width * 0.35, this.height * 0.6);

        this.cursors = scene.input.keyboard.createCursorKeys();

        this.lastDirection = 'down';
        this.isHarvesting = false;
        this.isTalking = false;
    }

    update() {

        if (this.isTalking) {
            this.setVelocity(0);

            switch (this.lastDirection) {
                case 'right':
                    this.anims.play('idle-right', true);
                    break;

                case 'left':
                    this.anims.play('idle-left', true);
                    break;

                case 'up':
                    this.anims.play('idle-up', true);
                    break;

                case 'down':
                default:
                    this.anims.play('idle-down', true);
                    break;
            }

            return;
        }

        if (this.isHarvesting) {
            this.setVelocity(0);
            return;
        }

        const stickX = joypad.axisX || 0;
        const stickY = joypad.axisY || 0;
        const isUsingStick = Math.abs(stickX) > 0.05 || Math.abs(stickY) > 0.05;
        const isLeft = this.cursors.left.isDown || (!isUsingStick && joypad.left);
        const isRight = this.cursors.right.isDown || (!isUsingStick && joypad.right);
        const isUp = this.cursors.up.isDown || (!isUsingStick && joypad.up);
        const isDown = this.cursors.down.isDown || (!isUsingStick && joypad.down);

        const speed = 150;

        let vx = 0;
        let vy = 0;

        if (isUsingStick) {
            vx = stickX * speed;
            vy = stickY * speed;

            if (Math.abs(stickX) > Math.abs(stickY)) {
                this.lastDirection = stickX > 0 ? 'right' : 'left';
            } else {
                this.lastDirection = stickY > 0 ? 'down' : 'up';
            }
        }
        else if (isLeft) {
            vx = -speed;
            this.lastDirection = 'left';
        }
        else if (isRight) {
            vx = speed;
            this.lastDirection = 'right';
        }

        if (isUp) {
            vy = -speed;
            this.lastDirection = 'up';
        }
        else if (isDown) {
            vy = speed;
            this.lastDirection = 'down';
        }

        const vec = new Phaser.Math.Vector2(vx, vy);

        if (!isUsingStick && vec.length() > 0) {
            vec.normalize().scale(speed);
        }

        this.setVelocity(vec.x, vec.y);

        // ======================
        // WALK / IDLE
        // ======================

        if (vec.length() > 0) {

            switch (this.lastDirection) {

                case 'right':
                    this.anims.play('walk-right', true);
                    break;

                case 'left':
                    this.anims.play('walk-left', true);
                    break;

                case 'up':
                    this.anims.play('walk-up', true);
                    break;

                case 'down':
                    this.anims.play('walk-down', true);
                    break;
            }

        } else {

            switch (this.lastDirection) {

                case 'right':
                    this.anims.play('idle-right', true);
                    break;

                case 'left':
                    this.anims.play('idle-left', true);
                    break;

                case 'up':
                    this.anims.play('idle-up', true);
                    break;

                case 'down':
                    this.anims.play('idle-down', true);
                    break;
            }
        }

    }

    startHarvest() {

        this.isHarvesting = true;

        this.setVelocity(0);

        let animKey = 'harvest-down';

        switch (this.lastDirection) {

            case 'right':
                animKey = 'harvest-right';
                break;

            case 'left':
                animKey = 'harvest-left';
                break;

            case 'up':
                animKey = 'harvest-up';
                break;

            case 'down':
                animKey = 'harvest-down';
                break;
        }

        this.anims.play(animKey);

        this.scene.time.delayedCall(550, () => {
            this.isHarvesting = false;
        });

        this.once(
            Phaser.Animations.Events.ANIMATION_COMPLETE,
            () => {
                this.isHarvesting = false;
            }
        );
    }
}
