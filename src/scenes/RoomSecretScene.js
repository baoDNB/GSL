import Player from '../objects/Player.js';
// 1. IMPORT THÊM DIALOGUEBOX
import DialogueBox from '../objects/DialogueBox.js';

export default class RoomSecretScene extends Phaser.Scene {
    constructor() {
        super('RoomSecretScene');
    }

    create() {
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;

        // 1. Thêm nền sân vườn
        let bg = this.add.image(0, 0, 'roomsecret_bg').setOrigin(0);
        bg.displayWidth = screenWidth;
        bg.displayHeight = screenHeight;

        // Khởi tạo Dialogue Box để chạy thoại trước
        this.dialogueBox = new DialogueBox(this);
        const startX = screenWidth * 0.5;
        const startY = screenHeight * 0.88;

        this.player = new Player(this, startX, startY);

        // Thiết lập trạng thái đang thoại cho Player (để đứng im)
        this.player.isTalking = true;

        // Tọa độ các điểm nút để nhân vật đi vào nhà
        this.stepsX = screenWidth * 0.6;
        this.stepsY = screenHeight * 0.72;
        this.doorX = screenWidth * 0.6;
        this.doorY = screenHeight * 0.42;

        this.cameras.main.fadeIn(1200, 0, 0, 0);


    }

    // Hàm xử lý chuỗi di chuyển tự động sau khi đọc thoại xong


    update() {


        if (this.player) this.player.update();
    }
}