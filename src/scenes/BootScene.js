import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {

        this.load.spritesheet('player', 'public/assets/Farmer_Generator_Pieces/Character Pieces/Bodies/16x16/Body_9.png', {
            frameWidth: 16,
            frameHeight: 32
        });

        this.load.image('kitchen_bg', 'assets/kitchen.png');
        this.load.image('house_bg', 'assets/house.png');
        this.load.image('livingroom_bg', 'assets/livingroom.png');
        this.load.image('hallway_bg', 'assets/hallway.png');
        this.load.image('roommaster_bg', 'assets/roommaster.png');
        this.load.image('roomchild_bg', 'assets/roomchild.png');
        this.load.image('lavagame_bg', 'assets/lavagame.png');
        this.load.image('puzzy_bg', 'assets/puzzyroom.png');
        this.load.image('bed_bg', 'assets/bed.png');
        this.load.image('roomsecret_bg', 'assets/roomsecret.png');
        this.load.image('key_icon_bg', 'assets/key_icon.png');

        this.load.audio(
            'doorOpenSfx',
            'soundEffects/open_door.mp3'
        );
    }

    create() {

        // =========================
        // IDLE
        // =========================

        this.anims.create({
            key: 'idle-right',
            frames: this.anims.generateFrameNumbers('player', {
                start: 56,
                end: 61
            }),
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: 'idle-up',
            frames: this.anims.generateFrameNumbers('player', {
                start: 62,
                end: 67
            }),
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: 'idle-left',
            frames: this.anims.generateFrameNumbers('player', {
                start: 68,
                end: 73
            }),
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: 'idle-down',
            frames: this.anims.generateFrameNumbers('player', {
                start: 74,
                end: 79
            }),
            frameRate: 8,
            repeat: -1
        });

        // =========================
        // WALK
        // =========================

        this.anims.create({
            key: 'walk-right',
            frames: this.anims.generateFrameNumbers('player', {
                start: 112,
                end: 117
            }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'walk-up',
            frames: this.anims.generateFrameNumbers('player', {
                start: 118,
                end: 123
            }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'walk-left',
            frames: this.anims.generateFrameNumbers('player', {
                start: 124,
                end: 129
            }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'walk-down',
            frames: this.anims.generateFrameNumbers('player', {
                start: 130,
                end: 135
            }),
            frameRate: 10,
            repeat: -1
        });

   
        this.anims.create({
            key: 'harvest-right',
            frames: this.anims.generateFrameNumbers('player', {
                start: 168,
                end: 173
            }),
            frameRate: 12,
            repeat: 0
        });

        this.anims.create({
            key: 'harvest-up',
            frames: this.anims.generateFrameNumbers('player', {
                start: 174,
                end: 179
            }),
            frameRate: 12,
            repeat: 0
        });

        this.anims.create({
            key: 'harvest-left',
            frames: this.anims.generateFrameNumbers('player', {
                start: 180,
                end: 185
            }),
            frameRate: 12,
            repeat: 0
        });

        this.anims.create({
            key: 'harvest-down',
            frames: this.anims.generateFrameNumbers('player', {
                start: 186,
                end: 191
            }),
            frameRate: 12,
            repeat: 0
        });

        this.scene.start('HouseScene');
    }
}