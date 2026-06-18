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

        this.spaceKey = scene.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.SPACE
        );

        this.lastDirection = 'down';
        this.isHarvesting = false;
    }

    update() {

        if (this.isHarvesting) {
            this.setVelocity(0);
            return;
        }

        const isLeft = this.cursors.left.isDown || joypad.left;
        const isRight = this.cursors.right.isDown || joypad.right;
        const isUp = this.cursors.up.isDown || joypad.up;
        const isDown = this.cursors.down.isDown || joypad.down;

        const isAction =
            Phaser.Input.Keyboard.JustDown(this.spaceKey);

        const speed = 150;

        let vx = 0;
        let vy = 0;

        if (isLeft) {
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

        if (vec.length() > 0) {
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

        // ======================
        // HARVEST
        // ======================

        if (isAction) {
            this.startHarvest();
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

        this.once(
            Phaser.Animations.Events.ANIMATION_COMPLETE,
            () => {
                this.isHarvesting = false;
            }
        );
    }
}