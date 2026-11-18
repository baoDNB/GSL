export const PREPARATIONS = {
    recipe: { name: 'Công thức của bà', hint: 'Đọc ghi chú trên tủ lạnh trong bếp.' },
    spices: { name: 'Lọ gia vị', hint: 'Tìm lọ gia vị ở quầy bếp bên trái.' },
    ribbon: { name: 'Cuộn ruy băng', hint: 'Tìm trong tủ bên phải phòng bố mẹ.' },
    tags: { name: 'Thẻ tên quà', hint: 'Xem chiếc bàn nhỏ giữa hành lang tầng trên.' },
    lantern: { name: 'Đèn lồng', hint: 'Tìm ở bàn đèn bên trái phòng khách.' },
    scarf: { name: 'Khăn len', hint: 'Tìm ở bàn cạnh giường phía phải phòng bố mẹ.' },
};

export const TRIALS = {
    baking: {
        needs: ['recipe', 'spices'],
        stages: ['Chuẩn bị bột', 'Trộn theo nhịp', 'Canh lò bánh'],
    },
    memory: { needs: ['ribbon', 'tags'], stages: ['Bốn cặp quà', 'Sáu cặp quà', 'Tám cặp quà'] },
    crossing: {
        needs: ['lantern', 'scarf'],
        stages: ['Qua hiên tuyết', 'Qua vườn thông', 'Đến ngôi sao'],
    },
};

export const missingPreparations = (state, kind) =>
    (TRIALS[kind]?.needs || []).filter((flag) => !state[flag]);
export const canLightTree = (state) => Object.keys(TRIALS).every((flag) => state[flag]);
export const canEnterEnding = (state) => canLightTree(state) && state.treeLit;

export const FOUND_NOTES = {
    spices: 'Mùi quế và gừng thơm như những mùa Noel bà còn đứng bên bếp. Mình xem công thức trên tủ lạnh rồi mang gia vị đến bếp lò nhé.',
    ribbon: 'Cuộn ruy băng đỏ mẹ đã để dành. Những hộp quà trong phòng hai anh em sẽ được buộc nơ thật đẹp.',
    tags: 'Mỗi tấm thẻ có một cái tên thân quen. Mình sẽ viết thật ngay ngắn để món quà nào cũng đến đúng người.',
    lantern:
        'Chiếc đèn vẫn còn ấm. Nó sẽ giúp mình nhìn rõ những tấm ván ngoài sân trong đêm tuyết.',
    scarf: 'Khăn len của bố mềm và dày. Mình quàng khăn thật kín rồi mang hơi ấm ấy theo trên đường tìm ngôi sao.',
};

export const STAGE_STORIES = {
    baking: [
        'Mùi gừng đã quyện vào bột. Bà dặn: bánh ngon bắt đầu từ sự kiên nhẫn. Mình khuấy thật đều để cả nhà cùng thưởng thức nhé.',
        'Bột đã mềm mịn. Ngoài cửa sổ tuyết vẫn rơi, còn căn bếp bắt đầu ấm lên. Giờ chỉ cần canh ba mẻ bánh vừa chín.',
        'Ba mẻ bánh thơm đã sẵn sàng. Mình để một đĩa trên bàn trà: ai về nhà cũng có phần.',
    ],
    memory: [
        'Những món quà đầu tiên đã thành đôi. Mình nhận ra chiếc nơ mẹ thích và ngôi sao hai anh em từng treo cùng nhau.',
        'Thêm những cái tên được viết lên thẻ. Món quà nhỏ cũng trở nên đặc biệt khi mình nhớ đến người nhận.',
        'Tất cả quà đã có người nhận. Một hộp buộc nơ đỏ đang chờ trên bàn trà, mang theo những kỷ niệm của cả nhà.',
    ],
    crossing: [
        'Đã qua hiên nhà! Dấu chân cũ dẫn về phía vườn thông. Mình giữ đèn lồng sát bên và nhìn kỹ lối đi tiếp theo.',
        'Gió trong vườn đã dịu. Phía xa có một ánh sao nhỏ đang chờ; chỉ còn đoạn đường cuối trước khi quay về.',
        'Ánh sao đã theo mình về nhà. Mình đặt đèn lên bàn trà để ánh sáng còn ở lại khi cả nhà quây quần.',
    ],
};

export function familyReflection(state) {
    const nodes = Object.entries(STAGE_STORIES)
        .filter(([kind]) => state[kind])
        .map(([, notes]) => ({ speaker: 'Những điều đã mang về', text: notes[2] }));
    if (!nodes.length) return null;
    nodes.push({
        speaker: 'Lời nhắn của gia đình',
        text: state.ended
            ? 'Cả nhà đã đoàn viên. Bánh, quà và ánh đèn sẽ giữ những kỷ niệm này ở lại; con cứ dạo thêm quanh nhà nhé.'
            : state.treeLit
              ? 'Cây thông đã sáng ấm áp. Cửa đoàn viên bên trái hành lang tầng trên đang mở chờ cả nhà.'
              : canLightTree(state)
                ? 'Ba điều ước đã về đủ. Con đến cây thông để đặt bánh, quà, kẹo rồi ngôi sao nhé.'
                : 'Mỗi việc nhỏ làm căn nhà ấm hơn một chút. Mở nhật ký để tìm điều ước tiếp theo; những chặng đã xong vẫn được giữ lại.',
    });
    return nodes;
}

export function questDescription(state, kind) {
    if (state[kind]) return 'Đã nhận điều ước.';
    const missing = missingPreparations(state, kind);
    if (missing.length) return PREPARATIONS[missing[0]].hint;
    const stage = state.stages[kind];
    return `Chặng ${stage + 1}/3 · ${TRIALS[kind].stages[stage]}`;
}
