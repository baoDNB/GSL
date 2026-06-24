import Phaser from 'phaser';

const CHARACTER_BASE_PATH = 'assets/Farmer_Generator_Pieces/Character Pieces';

const CHARACTER_ASSETS = {
    bodies: [
        'Body_1.png', 'Body_2.png', 'Body_3.png', 'Body_4.png', 'Body_5.png',
        'Body_6.png', 'Body_7.png', 'Body_8.png', 'Body_9.png'
    ],
    outfits: [
        'Outfit_Braces_Brown.png', 'Outfit_Braces_Green.png', 'Outfit_Braces_Orange.png',
        'Outfit_Dungarees_Black.png', 'Outfit_Dungarees_Green.png', 'Outfit_Dungarees_Red.png',
        'Outfit_Dungarees_Violet.png', 'Outfit_Laborer_Blue.png', 'Outfit_Laborer_Red.png',
        'Outfit_Laborer_Violet.png', 'Outfit_Vest_Brown.png', 'Outfit_Vest_Brown_Light.png',
        'Outfit_Vest_Yellow.png'
    ],
    hairstyles: [
        'Hairstyle_Balding_Blonde.png', 'Hairstyle_Balding_Blonde_Ash.png', 'Hairstyle_Balding_Blue.png',
        'Hairstyle_Balding_Brown_Ash.png', 'Hairstyle_Balding_Brown_Dark.png', 'Hairstyle_Balding_Brown_Hazel.png',
        'Hairstyle_Balding_Brown_Light.png', 'Hairstyle_Balding_Gray.png', 'Hairstyle_Balding_Orange.png',
        'Hairstyle_Long_Blonde.png', 'Hairstyle_Long_Blonde_Ash.png', 'Hairstyle_Long_Blue.png',
        'Hairstyle_Long_Brown_Ash.png', 'Hairstyle_Long_Brown_Dark.png', 'Hairstyle_Long_Brown_Hazel.png',
        'Hairstyle_Long_Brown_Light.png', 'Hairstyle_Long_Gray.png', 'Hairstyle_Long_Orange.png',
        'Hairstyle_Short_Blonde.png', 'Hairstyle_Short_Blonde_Ash.png', 'Hairstyle_Short_Blue.png',
        'Hairstyle_Short_Brown_Ash.png', 'Hairstyle_Short_Brown_Dark.png', 'Hairstyle_Short_Brown_Hazel.png',
        'Hairstyle_Short_Brown_Light.png', 'Hairstyle_Short_Gray.png', 'Hairstyle_Short_Orange.png',
        'Hairstyle_Tuft_Blonde.png', 'Hairstyle_Tuft_Blonde_Ash.png', 'Hairstyle_Tuft_Blue.png',
        'Hairstyle_Tuft_Brown_Ash.png', 'Hairstyle_Tuft_Brown_Dark.png', 'Hairstyle_Tuft_Brown_Hazel.png',
        'Hairstyle_Tuft_Brown_Light.png', 'Hairstyle_Tuft_Gray.png', 'Hairstyle_Tuft_Orange.png',
        'Hairstyle_Unkept_Blonde.png', 'Hairstyle_Unkept_Blonde_Ash.png', 'Hairstyle_Unkept_Blue.png',
        'Hairstyle_Unkept_Brown_Ash.png', 'Hairstyle_Unkept_Brown_Dark.png', 'Hairstyle_Unkept_Brown_Hazel.png',
        'Hairstyle_Unkept_Brown_Light.png', 'Hairstyle_Unkept_Gray.png', 'Hairstyle_Unkept_Orange.png'
    ],
    eyes: ['Eyes_Blue.png', 'Eyes_Brown.png', 'Eyes_Gray.png', 'Eyes_Green.png', 'Eyes_Orange.png'],
    accessories: [
        'Accessory_Bamboo_Hat_Brown.png', 'Accessory_Bamboo_Hat_Brown_Dull.png', 'Accessory_Gas_Mask.png',
        'Accessory_Straw_Hat_Black.png', 'Accessory_Straw_Hat_Cyan.png', 'Accessory_Straw_Hat_Green.png',
        'Accessory_Straw_Hat_Red.png', 'Accessory_Straw_Hat_Violet.png'
    ]
};

const DEFAULT_CHARACTER = {
    body: 'Body_1.png',
    hairstyle: '',
    outfit: '',
    eyes: '',
    accessory: ''
};

function pickAllowed(value, allowed, fallback) {
    if (value === '') {
        return '';
    }

    return allowed.includes(value) ? value : fallback;
}

export default class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {

        this.characterSelection = this.getCharacterSelection();

        this.load.image('player_template_layer', `${CHARACTER_BASE_PATH}/Bodies/16x16/${DEFAULT_CHARACTER.body}`);

        if (this.characterSelection.body) {
            this.load.image('player_body_layer', `${CHARACTER_BASE_PATH}/Bodies/16x16/${this.characterSelection.body}`);
        }

        if (this.characterSelection.eyes) {
            this.load.image('player_eyes_layer', `${CHARACTER_BASE_PATH}/Eyes/16x16/${this.characterSelection.eyes}`);
        }

        if (this.characterSelection.outfit) {
            this.load.image('player_outfit_layer', `${CHARACTER_BASE_PATH}/Outfits/16x16/${this.characterSelection.outfit}`);
        }

        if (this.characterSelection.hairstyle) {
            this.load.image('player_hair_layer', `${CHARACTER_BASE_PATH}/Hairstyles/16x16/${this.characterSelection.hairstyle}`);
        }

        if (this.characterSelection.accessory) {
            this.load.image('player_accessory_layer', `${CHARACTER_BASE_PATH}/Accessories/16x16/${this.characterSelection.accessory}`);
        }
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


    getCharacterSelection() {
        let saved = {};

        try {
            saved = JSON.parse(localStorage.getItem('external_character_assets')) || {};
        } catch (e) {
            saved = {};
        }

        if (
            saved.body === 'Body_9.png' &&
            saved.hairstyle === 'Hairstyle_Short_Brown_Dark.png' &&
            saved.outfit === 'Outfit_Laborer_Blue.png' &&
            saved.eyes === 'Eyes_Brown.png' &&
            !saved.accessory
        ) {
            saved = {};
        }

        return {
            body: pickAllowed(saved.body, CHARACTER_ASSETS.bodies, DEFAULT_CHARACTER.body),
            hairstyle: pickAllowed(saved.hairstyle !== undefined ? saved.hairstyle : saved.hair, CHARACTER_ASSETS.hairstyles, DEFAULT_CHARACTER.hairstyle),
            outfit: pickAllowed(saved.outfit, CHARACTER_ASSETS.outfits, DEFAULT_CHARACTER.outfit),
            eyes: pickAllowed(saved.eyes, CHARACTER_ASSETS.eyes, DEFAULT_CHARACTER.eyes),
            accessory: pickAllowed(saved.accessory, CHARACTER_ASSETS.accessories, DEFAULT_CHARACTER.accessory)
        };
    }

    buildPlayerTexture() {
        const layerKeys = [];

        if (this.characterSelection.body) layerKeys.push('player_body_layer');
        if (this.characterSelection.eyes) layerKeys.push('player_eyes_layer');
        if (this.characterSelection.outfit) layerKeys.push('player_outfit_layer');
        if (this.characterSelection.hairstyle) layerKeys.push('player_hair_layer');
        if (this.characterSelection.accessory) layerKeys.push('player_accessory_layer');

        const source = this.textures.get('player_template_layer').getSourceImage();
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        canvas.width = source.width;
        canvas.height = source.height;

        layerKeys.forEach(key => {
            context.drawImage(this.textures.get(key).getSourceImage(), 0, 0);
        });

        if (this.textures.exists('player')) {
            this.textures.remove('player');
        }

        this.textures.addSpriteSheet('player', canvas, {
            frameWidth: 16,
            frameHeight: 32
        });
    }

    create() {

        this.buildPlayerTexture();

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
