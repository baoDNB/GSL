export const PROFILE_KEY = 'gsl_christmas_profile_v1';
export const HAIR_TYPES = ['Balding', 'Long', 'Short', 'Tuft', 'Unkept'];
export const HAIR_COLORS = [
    'Blonde',
    'Blonde_Ash',
    'Blue',
    'Brown_Ash',
    'Brown_Dark',
    'Brown_Hazel',
    'Brown_Light',
    'Gray',
    'Orange',
];
export const NOEL_OUTFITS = ['Santa', 'Holly', 'Elf', 'Cocoa', 'Frost', 'Knit'].map(
    (name) => `Outfit_Noel_${name}.png`,
);
export const NOEL_HATS = ['Red', 'Green', 'Wine', 'Blue'].map(
    (name) => `Accessory_Noel_${name}.png`,
);
export const NOEL_PRESETS = [
    { label: 'Noel cổ điển', outfit: NOEL_OUTFITS[0], accessory: NOEL_HATS[0] },
    { label: 'Rừng thông', outfit: NOEL_OUTFITS[1], accessory: NOEL_HATS[1] },
    { label: 'Chú lùn gói quà', outfit: NOEL_OUTFITS[2], accessory: NOEL_HATS[1] },
    { label: 'Đêm cacao', outfit: NOEL_OUTFITS[3], accessory: NOEL_HATS[2] },
    { label: 'Sương tuyết', outfit: NOEL_OUTFITS[4], accessory: NOEL_HATS[3] },
    { label: 'Áo len mùa đông', outfit: NOEL_OUTFITS[5], accessory: NOEL_HATS[0] },
];
export const PARTS = {
    body: {
        label: 'Màu da',
        folder: 'Bodies',
        files: Array.from({ length: 9 }, (_, i) => `Body_${i + 1}.png`),
    },
    hairstyle: {
        label: 'Kiểu tóc',
        folder: 'Hairstyles',
        files: HAIR_TYPES.flatMap((type) =>
            HAIR_COLORS.map((color) => `Hairstyle_${type}_${color}.png`),
        ),
        optional: true,
    },
    outfit: {
        label: 'Trang phục',
        folder: 'Outfits',
        files: [
            ...NOEL_OUTFITS,
            ...[
                'Braces_Brown',
                'Braces_Green',
                'Braces_Orange',
                'Dungarees_Black',
                'Dungarees_Green',
                'Dungarees_Red',
                'Dungarees_Violet',
                'Laborer_Blue',
                'Laborer_Red',
                'Laborer_Violet',
                'Vest_Brown',
                'Vest_Brown_Light',
                'Vest_Yellow',
            ].map((name) => `Outfit_${name}.png`),
        ],
        optional: true,
    },
    eyes: {
        label: 'Màu mắt',
        folder: 'Eyes',
        files: ['Blue', 'Brown', 'Gray', 'Green', 'Orange'].map((color) => `Eyes_${color}.png`),
        optional: true,
    },
    accessory: {
        label: 'Phụ kiện',
        folder: 'Accessories',
        files: [
            ...NOEL_HATS,
            ...[
                'Bamboo_Hat_Brown',
                'Bamboo_Hat_Brown_Dull',
                'Gas_Mask',
                'Straw_Hat_Black',
                'Straw_Hat_Cyan',
                'Straw_Hat_Green',
                'Straw_Hat_Red',
                'Straw_Hat_Violet',
            ].map((name) => `Accessory_${name}.png`),
        ],
        optional: true,
    },
};
export const DEFAULT_PROFILE = {
    gameTitle: 'Noel: Đường Về Nhà',
    playerName: 'An',
    message: 'Chúc mọi người một Giáng sinh an lành. Mình cùng thắp sáng cây thông nào!',
    santaHat: true,
    character: {
        body: 'Body_3.png',
        hairstyle: 'Hairstyle_Short_Brown_Dark.png',
        outfit: NOEL_OUTFITS[0],
        eyes: 'Eyes_Brown.png',
        accessory: NOEL_HATS[0],
    },
};
const clean = (value, fallback, max) =>
    (typeof value === 'string'
        ? value
              .replace(/[\u0000-\u001f\u007f]/g, ' ')
              .trim()
              .slice(0, max)
        : '') || fallback;
export function normalizeProfile(value) {
    const saved = value && typeof value === 'object' ? value : {};
    const character = Object.fromEntries(
        Object.entries(PARTS).map(([key, part]) => {
            const file = saved.character?.[key];
            return [
                key,
                part.files.includes(file) || (part.optional && file === '')
                    ? file
                    : DEFAULT_PROFILE.character[key],
            ];
        }),
    );
    // Migrate the old floating-hat toggle into an actual accessory layer.
    if (saved.santaHat !== false && saved.character?.accessory === undefined)
        character.accessory = NOEL_HATS[0];
    if (saved.santaHat === false && saved.character?.accessory === undefined)
        character.accessory = '';
    return {
        gameTitle: clean(saved.gameTitle, DEFAULT_PROFILE.gameTitle, 40),
        playerName: clean(saved.playerName, DEFAULT_PROFILE.playerName, 24),
        message: clean(saved.message, DEFAULT_PROFILE.message, 180),
        santaHat: NOEL_HATS.includes(character.accessory),
        character,
    };
}
export function assetPath(key, file) {
    if (!file || !Object.hasOwn(PARTS, key) || !PARTS[key].files.includes(file)) return '';
    return [...NOEL_OUTFITS, ...NOEL_HATS].includes(file)
        ? `assets/christmas/characters/${file}`
        : `assets/Farmer_Generator_Pieces/Character Pieces/${PARTS[key].folder}/16x16/${file}`;
}
let current;
export function getProfile() {
    if (current) return current;
    let saved;
    // Session storage is the fallback when a browser blocks persistent storage.
    for (const kind of ['sessionStorage', 'localStorage']) {
        try {
            const raw = globalThis[kind]?.getItem(PROFILE_KEY);
            if (raw) {
                saved = JSON.parse(raw);
                break;
            }
        } catch {}
    }
    if (!saved) {
        try {
            const original = JSON.parse(
                globalThis.localStorage?.getItem('external_character_assets'),
            );
            if (original && typeof original === 'object')
                saved = { character: original, santaHat: !original.accessory };
        } catch {}
    }
    return (current = normalizeProfile(saved));
}
export function setProfile(value) {
    current = normalizeProfile(value);
    let persisted = false;
    try {
        localStorage.setItem(PROFILE_KEY, JSON.stringify(current));
        persisted = true;
    } catch {
        try {
            sessionStorage.setItem(PROFILE_KEY, JSON.stringify(current));
        } catch {}
    }
    if (persisted) {
        try {
            sessionStorage.removeItem(PROFILE_KEY);
        } catch {}
    }
    return persisted;
}
