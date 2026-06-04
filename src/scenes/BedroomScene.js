import Player from '../objects/Player.js';
import DialogueBox from '../objects/DialogueBox.js';

// Bộ từ điển lời thoại cục bộ cho phòng ngủ được cập nhật theo logic Hộp đồ chơi 4 chữ số
const BEDROOM_DIALOGUES = {
    intro: 'intro', 
    needMoreDigits: (d1, d2, d3, d4) => [
        { speaker: "Bạn", text: "Chiếc hộp đồ chơi cũ bám đầy bụi của mình đang bị khóa chặt dưới gầm giường." },
        { speaker: "Hệ thống", text: `Ổ khóa yêu cầu mã số gồm 4 chữ số. Hiện tại bạn đã thu thập được:\n[ ${d1 || '?'} ] [ ${d2 || '?'} ] [ ${d3 || '?'} ] [ ${d4 || '?'} ]` },
        { speaker: "Bạn", text: "Vẫn chưa đủ mã số để mở... Mình phải đi ra ngoài tìm kiếm manh mối ở các phòng khác thôi." }
    ],
    openSuccess: (d1, d2, d3, d4) => [
        { speaker: "Bạn", text: `Nhập chuỗi mật mã hoàn chỉnh đã gom đủ: [ ${d1} ] [ ${d2} ] [ ${d3} ] [ ${d4} ]` },
        { speaker: "Hệ thống", text: "CẠCH... Ổ khóa cũ bung ra! Chiếc hộp đồ chơi đã được mở hoàn toàn." },
        { speaker: "Bạn", text: "Tuyệt vời! Cuối cùng cũng tìm lại được đống đồ chơi kỷ niệm ngày xưa rồi!" },
        { speaker: "Hệ thống", text: "CHÚC MỪNG BẠN ĐÃ HOÀN THÀNH XUỐNG TRÒ CHƠI!" }
    ],
    nothingHereDesk: [
        { speaker: "Bạn", text: "Góc bàn máy tính gọn gàng, không có manh mối mật mã nào ở đây cả." }
    ],
    nothingHereCloset: [
        { speaker: "Bạn", text: "Chỉ có đống quần áo bừa bộn chưa dọn... Chẳng có số mật mã nào giấu ở đây đâu." }
    ]
};

export default class BedroomScene extends Phaser.Scene {
    constructor() { super('BedroomScene'); }

    create() {
        // 1. NẠP BACKGROUND PHÒNG NGỦ CHÍNH THỨC
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;

        let bg = this.add.image(0, 0, 'bedroom_bg').setOrigin(0);
        bg.displayWidth = screenWidth;
        bg.displayHeight = screenHeight;

        this.add.text(40, 40, "Bedroom", { fontSize: '32px', color: '#ffffff', fontFamily: 'monospace' });

        // ==========================================
        // KHU VỰC TẠO CÁC VÙNG CẢN ẨN (OBSTACLES) - GIỮ NGUYÊN CHỈ SỐ
        // ==========================================
        this.obstacles = this.physics.add.staticGroup();

        // 1.1. Cản bức tường phía trên
        let topWall = this.add.zone(0, 0, screenWidth, screenHeight * 0.35).setOrigin(0);
        this.obstacles.add(topWall);

        // 1.2. Cản cái Bàn học / Máy tính
        this.deskZone = this.add.zone(screenWidth * 0.15, screenHeight * 0.37, screenWidth * 0.25, screenHeight * 0.1).setOrigin(0);
        this.obstacles.add(this.deskZone);

        // 1.3. Cản Giỏ đồ / Tủ quần áo bừa bộn góc trái dưới
        this.closetZone = this.add.zone(screenWidth * 0.03, screenHeight * 0.75, screenWidth * 0.2, screenHeight * 0.24).setOrigin(0);
        this.obstacles.add(this.closetZone);

        // 1.4. Cản chiếc Giường góc phải dưới
        this.bedZone = this.add.zone(screenWidth * 0.68, screenHeight * 0.62, screenWidth * 0.28, screenHeight * 0.2).setOrigin(0);
        this.obstacles.add(this.bedZone);


        // ==========================================
        // KHU VỰC VÙNG TƯƠNG TÁC (DOOR) - GIỮ NGUYÊN CHỈ SỐ
        // ==========================================
        this.doorZone = this.add.zone(screenWidth * 0.88, screenHeight * 0.24, screenWidth * 0.08, screenHeight * 0.5).setOrigin(0);
        
        this.add.text(screenWidth * 0.85, screenHeight * 0.2, "[ Exit Door ]", { 
            fontSize: '14px', 
            fill: '#ffffff',
            backgroundColor: '#000000aa', 
            padding: { x: 5, y: 2 }
        });

        // Gán dữ liệu tên trực tiếp vào Zone để dễ quản lý
        this.bedZone.setData('name', 'bed');
        this.deskZone.setData('name', 'desk');
        this.closetZone.setData('name', 'closet');

        // Mảng chứa các điểm tìm kiếm để chúng ta duyệt vòng lặp quét khoảng cách
        this.allSpots = [this.bedZone, this.deskZone, this.closetZone];

        // ==========================================
        // KHỞI TẠO PLAYER VÀ CẤU HÌNH VẬT LÝ KẾT NỐI - GIỮ NGUYÊN CHỈ SỐ
        // ==========================================
        this.player = new Player(this, screenWidth * 0.5, screenHeight * 0.6);
        
        if (this.player.setOrigin) {
            this.player.setOrigin(0.5, 1);
        }

        if (this.player.body && this.player.body.setSize) {
            this.player.body.setSize(80, 140);   
            this.player.body.setOffset(40, 60);  
        }

        this.physics.world.setBounds(0, 0, screenWidth, screenHeight);
        if (this.player.body) {
            this.player.setCollideWorldBounds(true);
        }

        this.physics.add.collider(this.player, this.obstacles);

        // Khởi tạo các ô lưu trữ 4 chữ số mật mã trên hệ thống Registry của Phaser (nếu chưa có)
        if (!this.registry.has('code_digit_1')) this.registry.set('code_digit_1', null);
        if (!this.registry.has('code_digit_2')) this.registry.set('code_digit_2', null);
        if (!this.registry.has('code_digit_3')) this.registry.set('code_digit_3', null);
        if (!this.registry.has('code_digit_4')) this.registry.set('code_digit_4', null);

        // BIẾN QUẢN LÝ TRẠNG THÁI & PHÍM BẤM
        this.canMove = false; 

        this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

        // ==========================================
        // TỰ VẼ NÚT A ĐỎ ĐÈ LÊN ĐẦU NHÂN VẬT - GIỮ NGUYÊN
        // ==========================================
        this.interactIcon = this.add.container(0, 0);
        
        let circle = this.add.graphics();
        circle.fillStyle(0xe74c3c, 1);     
        circle.fillCircle(0, 0, 15);        
        circle.lineStyle(2, 0x000000, 1);   
        circle.strokeCircle(0, 0, 15);

        let textA = this.add.text(0, 0, 'A', { 
            fontSize: '16px', 
            color: '#ffffff', 
            fontWeight: 'bold', 
            fontFamily: 'Arial' 
        }).setOrigin(0.5);

        this.interactIcon.add([circle, textA]);
        this.interactIcon.setVisible(false);
        this.interactIcon.setDepth(999); 

        // KHỞI TẠO HỘP THOẠI & PHÁT CHUỖI THOẠI ĐẦU GAME
        this.dialogueBox = new DialogueBox(this);

        this.dialogueBox.startSequence('intro', () => {
            this.canMove = true;
        });
    }

    // Hàm tính khoảng cách chính xác từ tâm Zone đến người chơi - GIỮ NGUYÊN CHỈ SỐ
    isNear(zone) {
        if (!zone) return false;
        const zoneCenterX = zone.x + (zone.width / 2);
        const zoneCenterY = zone.y + (zone.height / 2);
        const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, zoneCenterX, zoneCenterY);
        return distance <= 160; 
    }

    update() {
        if (!this.canMove) {
            this.player.setVelocity(0);
            this.interactIcon.setVisible(false); 
            return;
        }

        // Cập nhật di chuyển cho nhân vật
        this.player.update();

        // Kiểm tra xem hiện tại người chơi đang đứng gần điểm nào nhất
        let currentSpot = null;
        for (let spot of this.allSpots) {
            if (this.isNear(spot)) {
                currentSpot = spot;
                break;
            }
        }

        // Kiểm tra xem người chơi có đang đứng gần Cửa phòng không
        let currentDoor = this.isNear(this.doorZone);

        // LOGIC HIỂN THỊ / ẨN NÚT A TỰ ĐỘNG THEO KHOẢNG CÁCH - GIỮ NGUYÊN
        if ((currentSpot || currentDoor) && !(this.dialogueBox && this.dialogueBox.isActive)) {
            this.interactIcon.setPosition(this.player.x, this.player.y - 150); 
            this.interactIcon.setVisible(true);
        } else {
            this.interactIcon.setVisible(false);
        }

        // --- XỬ LÝ SỰ KIỆN KHI BẤM PHÍM E TƯƠNG TÁC ---
        if (Phaser.Input.Keyboard.JustDown(this.keyE)) {

            // TRƯỜNG HỢP 1: Đứng gần các đồ vật trong phòng
            if (currentSpot) {
                this.canMove = false;
                this.player.setVelocity(0);
                this.interactIcon.setVisible(false);

                let spotName = currentSpot.getData('name');

                // Nếu kiểm tra Giường (Nơi đặt hộp đồ chơi cũ)
                if (spotName === 'bed') {
                    let d1 = this.registry.get('code_digit_1');
                    let d2 = this.registry.get('code_digit_2');
                    let d3 = this.registry.get('code_digit_3');
                    let d4 = this.registry.get('code_digit_4');

                    let count = 0;
                    if (d1 !== null) count++; 
                    if (d2 !== null) count++; 
                    if (d3 !== null) count++; 
                    if (d4 !== null) count++;

                    // Nếu chưa thu thập đủ 4 số từ 4 phòng/mini-game khác
                    if (count < 4) {
                        this.dialogueBox.startSequence(BEDROOM_DIALOGUES.needMoreDigits(d1, d2, d3, d4), () => { 
                            this.canMove = true; 
                        });
                    } else {
                        // Đã gom đủ cả 4 số! Giải mã thành công
                        this.dialogueBox.startSequence(BEDROOM_DIALOGUES.openSuccess(d1, d2, d3, d4), () => { 
                            this.canMove = true; 
                        });
                    }
                } 
                // Nếu kiểm tra Bàn học
                else if (spotName === 'desk') {
                    this.dialogueBox.startSequence(BEDROOM_DIALOGUES['nothingHereDesk'], () => { this.canMove = true; });
                } 
                // Nếu kiểm tra Tủ quần áo
                else if (spotName === 'closet') {
                    this.dialogueBox.startSequence(BEDROOM_DIALOGUES['nothingHereCloset'], () => { this.canMove = true; });
                }
            }

            // TRƯỜNG HỢP 2: Đang đứng trước cửa phòng để đi ra ngoài thám hiểm các Scene khác
            else if (currentDoor) {
                this.canMove = false;
                this.player.setVelocity(0);
                this.interactIcon.setVisible(false);

                // Cửa mở tự do, chuyển tiếp sang KitchenScene (hoặc HallwayScene tùy bạn phân phối mạch cửa)
                this.scene.start('KitchenScene');
            }
        }
    }
}