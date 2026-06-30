import Phaser from 'phaser';

export default class UIScene extends Phaser.Scene {
    constructor() { super({ key: 'UIScene', active: false }); }


    create() {
        const { width, height } = this.cameras.main;

        // 1. Dòng chữ số lượng
        this.keyUiText = this.add.text(25, 0, `${this.registry.get('keysFound') || 0}/3`, {
            fontSize: '20px', fill: '#fff', fontStyle: 'bold', stroke: '#000', strokeThickness: 4
        }).setOrigin(0, 0.5);

        // 2. Bóng của chìa khoá (ép về đúng 30x30 pixel)
        const keyShadow = this.add.image(2, 2, 'key_icon_bg')
            .setOrigin(0.5)
            .setDisplaySize(70, 70)  // Dùng lệnh này để ép kích thước tuyệt đối
            .setTint(0x000000)
            .setAlpha(0.5);

        // 3. Biểu tượng chìa khoá chính (cũng ép về 30x30 pixel)
        const keyIcon = this.add.image(0, 0, 'key_icon_bg')
            .setOrigin(0.5)
            .setDisplaySize(70, 70); // Ép kích thước bằng với bóng

        // 4. Gom vào Container và đặt ở góc trên bên phải màn hình
        // Mình đổi uiY thành height * 0.1 để UI nằm tít trên cao cho gọn
        this.add.container(width - 80, height * 0.1, [
            keyShadow, keyIcon, this.keyUiText
        ]).setDepth(9999);

        // Lắng nghe sự kiện
        this.registry.events.on('changedata-keysFound', (_, value) => this.keyUiText.setText(`${value}/3`));
    }
}