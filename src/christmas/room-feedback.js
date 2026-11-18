import { roomLayout, roomPoint } from './maps.js';

// Căn tọa độ về lưới pixel 2×2 của khung 950×680 để mọi nét vẽ động khớp khít với nền nướng sẵn.
const snap2 = (v) => Math.round(v / 2) * 2;

function makePixelProp(scene, image, ax, ay, depth = 3) {
    const [px, py] = roomPoint(image, ax, ay);
    const g = scene.add.graphics({ x: snap2(px), y: snap2(py) }).setDepth(depth);
    const pxRect = (x, y, w, h, color) => {
        g.fillStyle(color, 1).fillRect(x * 2, y * 2, w * 2, h * 2);
    };
    return { g, pxRect };
}

/**
 * Vẽ các vật phẩm nhiệm vụ có thể nhặt (chỉ hiển thị khi chưa nhặt: !state[key])
 * và các kỷ vật sau khi hoàn thành thử thách trên bàn trà phòng khách.
 */
export function roomKeepsakes(scene, room, state) {
    const collectibles = {};

    if (room === 'kitchen') {
        // 1. Công thức của bà (recipe) dán trên cánh dưới tủ lạnh
        if (!state.recipe) {
            const { g, pxRect } = makePixelProp(scene, 'kitchen', 168, 198, 4);
            pxRect(-5, -6, 11, 14, 0xa99a87);
            pxRect(-4, -5, 9, 12, 0xf8e8c3);
            pxRect(-2, -7, 4, 2, 0xbd525b);
            pxRect(-3, -1, 7, 1, 0xb58347);
            pxRect(-3, 2, 6, 1, 0xb58347);
            pxRect(-3, 5, 5, 1, 0xb58347);
            collectibles.recipe = g;
        }
        // 2. Hai lọ gia vị (spices) trên mặt quầy bếp bên trái
        if (!state.spices) {
            const { g, pxRect } = makePixelProp(scene, 'kitchen', 318, 152, 4);
            for (const dx of [-9, 8]) {
                pxRect(dx - 4, -6, 9, 12, 0x68482e);
                pxRect(dx - 3, -5, 7, 10, 0xb58c45);
                pxRect(dx - 4, -8, 9, 2, 0x883a4c);
                pxRect(dx - 3, -7, 7, 1, 0xbd525b);
                pxRect(dx - 2, -2, 5, 4, 0xe5d4ae);
                pxRect(dx - 1, -1, 3, 1, 0x883a4c);
            }
            collectibles.spices = g;
        }
    }

    if (room === 'living') {
        // 3. Đèn lồng (lantern) đặt trên bàn đèn bên trái phòng khách
        if (!state.lantern) {
            const tableDepth = Math.round(roomPoint('livingroom', 100, 358)[1]) + 2;
            const { g, pxRect } = makePixelProp(scene, 'livingroom', 114, 326, tableDepth);
            pxRect(-4, 4, 9, 2, 0x53463b);
            pxRect(-4, -6, 9, 10, 0x493326);
            pxRect(-5, -5, 11, 2, 0xb58c45);
            pxRect(-5, 2, 11, 2, 0xb58c45);
            pxRect(-3, -3, 7, 5, 0xe2ba67);
            pxRect(-2, -2, 5, 3, 0xffdf91);
            pxRect(-1, -1, 3, 2, 0xfaf6e6);
            pxRect(-2, -8, 5, 2, 0x68482e);
            pxRect(-1, -10, 3, 2, 0xb58c45);
            collectibles.lantern = g;
        }

        // Kỷ vật đặt lên bàn trà sau khi hoàn thành từng cụm thử thách (nằm trên lớp occluder bàn trà)
        const coffeeDepth = Math.round(roomPoint('livingroom', 462, 342)[1]) + 2;
        const prop = (x, y) => {
            const [px, py] = roomPoint('livingroom', x, y);
            return scene.add.graphics({ x: snap2(px), y: snap2(py) }).setDepth(coffeeDepth);
        };
        if (state.baking) {
            const g = prop(420, 344);
            g.fillStyle(0x67463a).fillRect(-18, -4, 36, 14);
            g.fillStyle(0xf4e4bd).fillRect(-18, -6, 36, 12);
            for (const x of [-10, 2]) {
                g.fillStyle(0xb87947).fillRect(x, -10, 10, 10);
                g.fillStyle(0xf3d191).fillRect(x + 2, -8, 6, 4);
                g.fillStyle(0x704336).fillRect(x + 4, -6, 2, 2);
            }
        }
        if (state.memory) {
            const g = prop(462, 344);
            g.fillStyle(0x673a3b).fillRect(-14, -14, 28, 24);
            g.fillStyle(0xb95347).fillRect(-14, -18, 28, 22);
            g.fillStyle(0xe5cf8e).fillRect(-2, -18, 4, 28).fillRect(-14, -14, 28, 4);
            g.fillRect(-10, -24, 8, 6).fillRect(2, -24, 8, 6);
        }
        if (state.crossing) {
            const g = prop(504, 344);
            g.fillStyle(0x694c37).fillRect(-10, -28, 20, 38).fillRect(-6, -36, 12, 4);
            g.fillStyle(0xc49a58).fillRect(-12, -28, 24, 4).fillRect(-12, 6, 24, 4);
            g.fillStyle(0xf3d790).fillRect(-6, -22, 12, 24);
            g.fillStyle(0xffefb5).fillRect(-2, -16, 4, 14);
        }
    }

    if (room === 'hallway') {
        // 4. Thẻ tên quà (tags) trên chiếc bàn nhỏ giữa hành lang tầng trên
        if (!state.tags) {
            const { g, pxRect } = makePixelProp(scene, 'hallway', 314, 212, 4);
            pxRect(-6, -3, 12, 7, 0x493326);
            pxRect(-5, -2, 10, 5, 0xf8e8c3);
            pxRect(-5, -2, 3, 5, 0xbd525b);
            pxRect(-1, 0, 5, 1, 0x946537);
            pxRect(0, -1, 2, 1, 0x355646);
            pxRect(-8, -1, 3, 2, 0xe2ba67);
            collectibles.tags = g;
        }
    }

    if (room === 'bedroom') {
        // 5. Cuộn ruy băng (ribbon) trên mặt tủ gỗ bên phải phòng bố mẹ
        if (!state.ribbon) {
            const { g, pxRect } = makePixelProp(scene, 'roommaster', 744, 160, 4);
            pxRect(-6, -4, 12, 7, 0x493326);
            pxRect(-5, -3, 10, 5, 0xe2ba67);
            pxRect(-3, -3, 6, 5, 0xbd525b);
            pxRect(-3, -2, 6, 1, 0xdc8173);
            pxRect(2, 2, 5, 3, 0x883a4c);
            pxRect(3, 3, 4, 2, 0xbd525b);
            collectibles.ribbon = g;
        }
        // 6. Khăn len (scarf) xếp gọn trên bàn cạnh giường phía phải phòng bố mẹ
        if (!state.scarf) {
            const { g, pxRect } = makePixelProp(scene, 'roommaster', 498, 162, 4);
            pxRect(-6, -4, 12, 8, 0x502a40);
            pxRect(-5, -3, 10, 6, 0xbd525b);
            pxRect(-5, -2, 10, 1, 0xdc8173);
            pxRect(-3, -3, 1, 6, 0xe2ba67);
            pxRect(2, -3, 1, 6, 0xe2ba67);
            pxRect(1, 2, 5, 5, 0x883a4c);
            pxRect(2, 2, 3, 4, 0xbd525b);
            pxRect(1, 6, 1, 2, 0xf8e8c3);
            pxRect(3, 6, 1, 2, 0xf8e8c3);
            pxRect(5, 6, 1, 2, 0xf8e8c3);
            collectibles.scarf = g;
        }
    }

    return collectibles;
}

// Danh sách các vùng cắt vật thể cao (tọa độ thiết kế 950×540: [x0, y0, x1, y1, depthY])
// để tạo hiệu ứng che khuất trước/sau (Y-sorting) chuẩn xác với chân nhân vật.
const OCCLUDER_SLICES = {
    house: [
        [170, 365, 265, 425, 404], // Xe trượt tuyết gỗ bên trái
        [275, 360, 360, 420, 403], // Bụi thông phủ tuyết tiền cảnh trái
        [695, 165, 865, 412, 398], // Cây thông lớn ngoài sân
        [700, 330, 795, 468, 452], // Người tuyết
        [810, 430, 895, 490, 475], // Bụi thông phủ tuyết tiền cảnh phải
    ],
    living: [
        [155, 195, 295, 305, 286], // Ghế bành đơn góc trên-trái
        [55, 265, 148, 380, 358], // Bàn đèn bên trái
        [360, 240, 565, 380, 336], // Bàn trà tròn giữa phòng
        [150, 395, 395, 500, 476], // Ghế sofa dài 3 chỗ
        [615, 385, 745, 465, 438], // Đôn đệm tròn (ottoman)
        [645, 130, 812, 375, 322], // Cây thông Noel & các hộp quà dưới tán cây
    ],
    kitchen: [
        [75, 265, 210, 360, 342], // Tủ chén thấp bên trái
        [325, 235, 610, 425, 375], // Bàn ăn lớn & ghế giữa bếp
    ],
    hallway: [
        [45, 260, 185, 515, 490], // Lan can gỗ bảo vệ giếng cầu thang
        [815, 225, 900, 305, 290], // Giỏ mây đựng chăn góc phải
    ],
    gifts: [
        [65, 140, 275, 395, 365], // Giường đơn bên trái (thành chân giường)
        [668, 140, 878, 395, 365], // Giường đơn bên phải (thành chân giường)
        [350, 260, 600, 400, 365], // Bàn gói quà ở giữa phòng
        [775, 335, 875, 475, 456], // Cây thông nhỏ góc dưới-phải
    ],
    bedroom: [
        [155, 130, 468, 360, 335], // Giường đôi lớn (thành chân giường)
        [100, 365, 320, 465, 442], // Ghế băng bọc nệm cuối giường
        [695, 175, 865, 360, 328], // Cây thông phòng ngủ & hộp quà
    ],
};

export function roomOccluders(scene, room) {
    const canonical = room === 'garden' ? 'house' : room;
    const slices = OCCLUDER_SLICES[canonical] || [];
    const imageName = {
        house: 'house',
        living: 'livingroom',
        kitchen: 'kitchen',
        hallway: 'hallway',
        gifts: 'roomchild',
        bedroom: 'roommaster',
    }[canonical];
    if (!imageName) return [];
    const texKey = `${imageName}_fg`;
    if (!scene.textures.exists(texKey)) return [];
    const t = roomLayout(imageName);
    return slices.map(([ax0, ay0, ax1, ay1, depthY]) => {
        const cx = Math.max(0, Math.floor(t.x + ax0 * t.sx));
        const cy = Math.max(0, Math.floor(t.y + ay0 * t.sy));
        const cw = Math.min(950 - cx, Math.ceil((ax1 - ax0) * t.sx));
        const ch = Math.min(680 - cy, Math.ceil((ay1 - ay0) * t.sy));
        const [, stageDepthY] = roomPoint(imageName, (ax0 + ax1) / 2, depthY);
        return scene.add
            .image(0, 0, texKey)
            .setOrigin(0, 0)
            .setCrop(cx, cy, cw, ch)
            .setDepth(Math.round(stageDepthY));
    });
}
