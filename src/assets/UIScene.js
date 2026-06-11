import Phaser from 'phaser';

export default class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene', active: false });
    }

    preload() {
        this.load.image('key_icon', 'assets/key_icon.png'); 
    }

    create() {
        const sw = this.cameras.main.width;
        const sh = this.cameras.main.height;
        
        // Định vị UI nằm vừa vặn trong khu vực phòng chơi (tránh dải đen)
        const uiX = sw - 120;
        const uiY = sh * 0.35; 

        this.uiContainer = this.add.container(uiX, uiY).setDepth(9999);
        this.keyUiIcon = this.add.image(0, 0, 'key_icon').setOrigin(0.5).setScale(0.8); 
        
        let keysFound = this.registry.get('keysFound') || 0;
        this.keyUiText = this.add.text(25, 0, `${keysFound}/3`, {
            fontSize: '24px', fill: '#ffffff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 4
        }).setOrigin(0, 0.5);

        this.uiContainer.add([this.keyUiIcon, this.keyUiText]);

        // Tự động đổi số realtime khi nhặt được chìa ở các phòng khác
        this.registry.events.on('changedata-keysFound', (parent, value) => {
            if (this.keyUiText) this.keyUiText.setText(`${value}/3`);
        });
    }
}