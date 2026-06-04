export const DIALOGUES = {
    puzzleIntro: [
        { speaker: "Bạn", text: "Ủa, một cuốn sách cổ cũ kỹ đặt giữa bàn? Lại còn phát sáng nữa..." },
        { speaker: "Hệ thống", text: "Bản đồ ma thuật đã kích hoạt! Hãy giải mã ma trận số để mở lối đi bí mật!" },
        { speaker: "Bạn", text: "Trông giống như một câu đố xếp hình ma trận 3x3. Thử sức xem sao!" }
    ],
    foundKey: [
        { speaker: "Hệ thống", text: "Chúc mừng! Bạn đã giải mã thành công ma trận cổ." },
        { speaker: "Bạn", text: "Ồ! Một chiếc [Chìa khóa bí ẩn] vừa rơi ra từ cuốn sách! Đi qua phòng tiếp theo thôi." }
    ],
    caConLockedDoor: [
        { speaker: "Cá Con", text: "Cửa này bị khóa chặt rồi... Hình như cần phải tìm đủ 3 chiếc chìa khóa mới mở được." },
        { speaker: "Cá Con", text: "Mình phải đi tìm quanh các phòng xem sao, không thể cứ đứng đây mãi được!" }
    ],
    need_2_keys: [
        { speaker: "Hệ thống", text: "Cửa vẫn không nhúc nhích. Bạn còn thiếu 2 chiếc chìa khóa nữa." }
    ],
    need_1_key: [
        { speaker: "Hệ thống", text: "Sắp được rồi! Chỉ còn thiếu 1 chiếc chìa khóa nữa thôi." }
    ]
};

export default class DialogueBox {
    constructor(scene) {
        this.scene = scene;

        // Vẽ hộp thoại thô nằm ở nửa dưới màn hình
        this.box = scene.add.rectangle(480, 500, 900, 140, 0x000000, 0.8)
            .setOrigin(0.5).setStrokeStyle(2, 0xffffff).setDepth(1000);

        this.text = scene.add.text(60, 450, '', {
            fontSize: '20px',
            color: '#ffffff',
            wordWrap: { width: 680 },
            fontFamily: 'monospace'
        }).setDepth(1001);

        this.hide();
    }

    // Hàm gọi chuỗi hội thoại mới
    startSequence(key, onComplete) {
        // Kiểm tra thông minh: Nếu truyền vào một mảng thoại tự định nghĩa thì dùng luôn, 
        // nếu truyền vào một "key" (chuỗi dạng 'intro') thì bốc từ kho DIALOGUES ra.
        if (typeof key === 'object' && Array.isArray(key)) {
            this.dialogues = key;
        } else {
            this.dialogues = DIALOGUES[key];
        }

        this.onComplete = onComplete;
        this.index = 0;

        this.box.setVisible(true);
        this.text.setVisible(true);

        // Đăng ký click chuột để qua câu tiếp theo
        this.scene.input.on('pointerdown', this.nextNode, this);
        this.showNode();
    }

    showNode() {
        if (this.dialogues && this.index < this.dialogues.length) {
            let node = this.dialogues[this.index];
            this.text.setText(`${node.speaker}: ${node.text}`);
        } else {
            this.hide();
            if (this.onComplete) this.onComplete();
        }
    }

    nextNode() {
        this.index++;
        this.showNode();
    }

    hide() {
        this.scene.input.off('pointerdown', this.nextNode, this);
        this.box.setVisible(false);
        this.text.setVisible(false);
    }
}