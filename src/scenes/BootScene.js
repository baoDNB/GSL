import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        // Khai báo nạp spritesheet đúng kích thước khung hình bạn cung cấp
        this.load.spritesheet('player', 'assets/player.png', {
            frameWidth: 160,
            frameHeight: 233.3
        });
        this.load.image('bedroom_bg', 'assets/bedroom.png');
        this.load.image('kitchen_bg', 'assets/kitchen.png');
        // this.load.audio('rain', 'assets/rain.mp3');
        this.load.image('house_bg', 'assets/house.png');
        this.load.image('livingroom_bg', 'assets/livingroom.png');
        this.load.image('hallway_bg', 'assets/hallway.png');
        this.load.image('roommaster_bg', 'assets/roommaster.png');
        this.load.image('roomchild_bg', 'assets/roomchild.png');
        this.load.image('lavagame_bg','assets/lavagame.png');
        this.load.image('puzzy_bg','assets/puzzyroom.png');
    }

    create() {
        // TẠO ANIMATIONS TRƯỚC KHI ĐỔI MÀN CHƠI
        this.anims.create({
            key: 'walk-down',
            frames: this.anims.generateFrameNumbers('player', { frames: [0, 2] }),
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: 'idle-down',
            frames: [{ key: 'player', frame: 1 }],
            frameRate: 1
        });

        this.anims.create({
            key: 'walk-up',
            frames: this.anims.generateFrameNumbers('player', { frames: [3, 5] }),
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: 'idle-up',
            frames: [{ key: 'player', frame: 4 }],
            frameRate: 1
        });

        this.anims.create({
            key: 'walk-side',
            frames: this.anims.generateFrameNumbers('player', { frames: [6, 8] }),
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: 'idle-side',
            frames: [{ key: 'player', frame: 7 }],
            frameRate: 1
        });

        // Bật âm thanh mưa chạy nền lặp đi lặp lại
        // const rainSound = this.sound.add('rain', { loop: true, volume: 0.3 });
        // rainSound.play();

        // Chuyển màn
        this.scene.start('HallwayScene');
    }
}