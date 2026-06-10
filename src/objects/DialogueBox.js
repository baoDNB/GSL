export const DIALOGUES = {
    puzzleIntro: [
        { speaker: "You", text: "Ủa, một cuốn sách cổ cũ kỹ đặt giữa bàn? Lại còn phát sáng nữa..." },
        { speaker: "Admin", text: "Bản đồ ma thuật đã kích hoạt! Hãy giải mã ma trận số để mở lối đi bí mật!" },
        { speaker: "You", text: "Trông giống như một câu đố xếp hình ma trận 3x3. Thử sức xem sao!" }
    ],
    foundKey: [
        { speaker: "Kid", text: "Congratulations! You have successfully deciphered the ancient matrix." },
        { speaker: "You", text: "Oh! A [Mystery Key] just fell out of the book! Let's go to the next room." }
    ],
    caConLockedDoor: [
        { speaker: "Kid", text: "You need three keys to enter this room! Go explore the home again and be carefull...." },
    ],
    need_2_keys: [
        { speaker: "Kid", text: "The door still won't budge. You're missing two more keys." }
    ],
    need_1_keys: [
        { speaker: "Kid", text: "Almost there! We just need one more key." }
    ],
    openFridge: [
        { speaker: "You", text: "Hmm it's a calendar." },
        { speaker: "You", text: "Mother's Day" }

    ],
    inspectTable: [
        { speaker: "You", text: "Ooh, someone left me my favorite: Flower! How awesome!" }
    ],
    livingRoomTable: [
        { speaker: "You", text: "Someone left a note on the table. It says:" },
        { speaker: "You", text: "We're playing hide and seek. You have to come find us!" }
    ],
    childTent: [        
        { speaker: "You", text: "Looks cozy, I don't see anyone in there" }
    ],
    roomMaster: [
        { speaker: "You", text: "It's the master bedroom but I don't see anyone in here." }
    ],
    introHouse: [
        { speaker: "Kid", text:"Looks like mom is coming. Let's go hide! " },
        { speaker: "You", text: "I swear I just saw the kid!" },
        { speaker: "You", text: "Hmm, it's looked, let me go through the back."}
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