// Authoring coordinates describe the player's feet in the old 950 × 540 view.
// At the end of this file they are fitted into the 950 × 680 stage using the
// native aspect ratio of each source image. Artwork and collision use one transform.
// Every return spawn is inside the room, clear of both furniture and exit zones.
const exterior = {
    image: 'house',
    bounds: [35, 225, 880, 292],
    blocks: [
        [272, 253, 500, 58],
        [790, 253, 330, 58],
        [781, 398, 96, 26],
        [747, 452, 42, 22],
        [219, 404, 52, 20],
    ],
    spawns: { default: [178, 472], kitchen: [570, 325] },
    facing: { default: 'up', kitchen: 'down' },
    exits: [{ x: 570, y: 278, w: 72, h: 34, to: 'kitchen', arrow: 'up', marker: [570, 268] }],
};
export const ROOMS = {
    house: exterior,
    garden: { ...exterior, spawns: { ...exterior.spawns, default: [570, 325] } },
    kitchen: {
        image: 'kitchen',
        bounds: [90, 95, 780, 428],
        blocks: [
            [478, 169, 715, 92],
            [467, 352, 240, 110],
            [141, 195, 110, 40],
            [141, 336, 106, 26],
            // Tường chắn cạnh dưới nằm sát mép tường Nam, chừa rộng khu vực thảm chùi chân giữa phòng (x=415..535)
            [245, 512, 320, 24],
            [710, 512, 320, 24],
        ],
        spawns: {
            default: [475, 442],
            house: [475, 442],
            garden: [475, 442],
            living: [792, 322],
            trial: [476, 241],
        },
        facing: { default: 'up', house: 'up', garden: 'up', living: 'left', trial: 'down' },
        exits: [
            { x: 475, y: 502, w: 104, h: 34, to: 'garden', arrow: 'down', marker: [475, 484] },
            { x: 851, y: 320, w: 42, h: 112, to: 'living', arrow: 'right', marker: [838, 320] },
        ],
    },
    living: {
        image: 'livingroom',
        bounds: [48, 165, 866, 358],
        blocks: [
            [229, 270, 106, 52],
            [462, 328, 168, 82],
            [270, 462, 204, 50],
            [678, 430, 92, 36],
            [474, 174, 300, 52],
            // Thu gọn hộp va chạm về đúng gốc cây thông & hộp quà để nhân vật đi lách phía sau tán cây được
            [730, 322, 92, 28],
            [100, 354, 58, 34],
            // Stair rails bound a clear flight from its lower landing to the upper exit.
            [818, 252, 8, 144],
            [910, 252, 8, 144],
        ],
        spawns: {
            default: [475, 478],
            kitchen: [112, 420],
            hallway: [865, 348],
            ending: [785, 378],
        },
        facing: { default: 'up', kitchen: 'right', hallway: 'down', ending: 'left' },
        exits: [
            { x: 65, y: 420, w: 38, h: 72, to: 'kitchen', arrow: 'left', marker: [86, 420] },
            {
                x: 865,
                y: 202,
                w: 66,
                h: 40,
                to: 'hallway',
                arrow: 'up',
                marker: [865, 252],
                label: 'Lên tầng 2',
                labelPosition: [865, 218],
            },
        ],
    },
    hallway: {
        image: 'hallway',
        bounds: [53, 243, 842, 274],
        blocks: [
            [111, 430, 116, 170],
            [314, 248, 105, 10],
            [858, 286, 44, 30],
        ],
        spawns: {
            default: [114, 291],
            living: [114, 291],
            gifts: [445, 308],
            bedroom: [715, 308],
            ending: [232, 302],
        },
        facing: { default: 'up', living: 'up', gifts: 'down', bedroom: 'down', ending: 'down' },
        exits: [
            {
                x: 114,
                y: 330,
                w: 72,
                h: 32,
                to: 'living',
                arrow: 'down',
                marker: [114, 348],
                label: 'Xuống tầng 1',
                labelPosition: [114, 382],
            },
            { x: 445, y: 256, w: 72, h: 28, to: 'gifts', arrow: 'up', marker: [445, 249] },
            { x: 715, y: 256, w: 72, h: 28, to: 'bedroom', arrow: 'up', marker: [715, 249] },
        ],
    },
    gifts: {
        image: 'roomchild',
        bounds: [45, 162, 860, 361],
        blocks: [
            [171, 267, 176, 214],
            [772, 267, 176, 214],
            [475, 172, 198, 20],
            [329, 172, 64, 20],
            [621, 172, 64, 20],
            [475, 344, 216, 82],
            [825, 456, 68, 22],
            [152, 514, 380, 24],
            [781, 514, 340, 24],
        ],
        spawns: { default: [475, 468], hallway: [475, 468], trial: [475, 452] },
        facing: { default: 'up', hallway: 'up', trial: 'down' },
        exits: [
            { x: 475, y: 506, w: 112, h: 32, to: 'hallway', arrow: 'down', marker: [475, 490] },
        ],
    },
    bedroom: {
        image: 'roommaster',
        bounds: [65, 175, 820, 348],
        blocks: [
            [311, 248, 274, 182],
            [210, 422, 192, 66],
            [138, 186, 65, 22],
            [484, 186, 65, 22],
            [789, 195, 174, 40],
            [800, 326, 68, 22],
            [210, 520, 330, 24],
            [755, 520, 365, 24],
        ],
        spawns: { default: [475, 470], hallway: [475, 470] },
        facing: { default: 'up', hallway: 'up' },
        exits: [
            { x: 475, y: 508, w: 112, h: 32, to: 'hallway', arrow: 'down', marker: [475, 492] },
        ],
    },
};
export const OBJECTS = {
    house: [
        {
            x: 704,
            y: 451,
            radius: 85,
            marker: [747, 349],
            kind: 'crossing',
            intro: 'crossingIntro',
        },
    ],
    garden: [
        {
            x: 704,
            y: 451,
            radius: 85,
            marker: [747, 349],
            kind: 'crossing',
            intro: 'crossingIntro',
        },
    ],
    kitchen: [
        { x: 446, y: 241, radius: 82, marker: [446, 152], kind: 'baking', intro: 'bakingIntro' },
        // Ghi chú công thức trên cánh dưới tủ lạnh: đồng bộ trạng thái progress.recipe
        {
            x: 185,
            y: 236,
            radius: 85,
            marker: [168, 146],
            dialogue: 'fridgeNote',
            collect: 'recipe',
        },
        { x: 318, y: 242, radius: 82, marker: [318, 118], collect: 'spices' },
    ],
    living: [
        // Căn dấu ! ngay chính giữa đỉnh ngôi sao cây thông Noel (x=730)
        { x: 730, y: 366, radius: 92, marker: [730, 148], dialogue: 'treeNote' },
        { x: 462, y: 336, radius: 115, marker: [462, 257], dialogue: 'familyNote' },
        { x: 145, y: 350, radius: 85, marker: [114, 272], collect: 'lantern' },
    ],
    // Căn dấu ! ngay phía trên vòng nguyệt quế của cánh cửa đỏ phòng đoàn viên
    hallway: [
        { x: 197, y: 279, radius: 80, marker: [197, 115], ending: true },
        { x: 314, y: 283, radius: 80, marker: [314, 182], collect: 'tags' },
    ],
    gifts: [
        { x: 475, y: 404, radius: 96, marker: [475, 285], kind: 'memory', intro: 'memoryIntro' },
    ],
    bedroom: [
        { x: 405, y: 325, radius: 112, marker: [380, 234], dialogue: 'bedroomNote' },
        { x: 744, y: 245, radius: 85, marker: [744, 132], collect: 'ribbon' },
        // Khăn len đặt trên bàn cạnh giường phía phải phòng bố mẹ (khớp 100% với gợi ý trong nhật ký)
        { x: 492, y: 235, radius: 85, marker: [498, 134], collect: 'scarf' },
    ],
};
export const RETURN_ROOM = {
    house: null,
    garden: 'kitchen',
    kitchen: 'garden',
    living: 'kitchen',
    hallway: 'living',
    gifts: 'hallway',
    bedroom: 'hallway',
};

const nativeSizes = {
    house: [730, 390],
    livingroom: [561, 394],
    kitchen: [1402, 1122],
    hallway: [601, 395],
    roomchild: [1413, 1113],
    roommaster: [1434, 1097],
};
export function roomLayout(image) {
    const [iw, ih] = nativeSizes[image === 'roomsecret' ? 'livingroom' : image];
    const scale = Math.min(950 / iw, 680 / ih),
        width = Math.round(iw * scale),
        height = Math.round(ih * scale);
    return { x: Math.floor((950 - width) / 2), y: 680 - height, sx: width / 950, sy: height / 540 };
}
export function roomPoint(image, x, y) {
    const t = roomLayout(image);
    return [t.x + x * t.sx, t.y + y * t.sy];
}
for (const [name, room] of Object.entries(ROOMS)) {
    const t = roomLayout(room.image),
        p = ([x, y]) => [t.x + x * t.sx, t.y + y * t.sy];
    // House and garden share the authoring map, so replace rather than mutate it.
    ROOMS[name] = {
        ...room,
        bounds: [...p(room.bounds), room.bounds[2] * t.sx, room.bounds[3] * t.sy],
        blocks: room.blocks.map(([x, y, w, h]) => [...p([x, y]), w * t.sx, h * t.sy]),
        spawns: Object.fromEntries(
            Object.entries(room.spawns).map(([key, value]) => [key, p(value)]),
        ),
        exits: room.exits.map((exit) => ({
            ...exit,
            x: p([exit.x, exit.y])[0],
            y: p([exit.x, exit.y])[1],
            w: exit.w * t.sx,
            h: exit.h * t.sy,
            marker: p(exit.marker),
            ...(exit.labelPosition ? { labelPosition: p(exit.labelPosition) } : {}),
        })),
    };
    OBJECTS[name] = (OBJECTS[name] || []).map((obj) => ({
        ...obj,
        x: p([obj.x, obj.y])[0],
        y: p([obj.x, obj.y])[1],
        marker: p(obj.marker),
    }));
}
