import {
    PARTS,
    HAIR_TYPES,
    HAIR_COLORS,
    NOEL_OUTFITS,
    NOEL_HATS,
    NOEL_PRESETS,
    DEFAULT_PROFILE,
    getProfile,
    setProfile,
    assetPath,
} from './profile.js';
import { loadGameFonts } from './fonts.js';

const $ = (selector) => document.querySelector(selector);
let draft = structuredClone(getProfile()),
    active = 'outfit',
    direction = 0,
    previewVersion = 0;
const directions = [
    { label: 'Trước', frame: 74 },
    { label: 'Trái', frame: 68 },
    { label: 'Sau', frame: 62 },
    { label: 'Phải', frame: 56 },
];
const cache = new Map();
const failedAssets = new Set();
const layerOrder = ['body', 'eyes', 'outfit', 'hairstyle', 'accessory'];
const noelLabels = {
    Outfit_Noel_Santa: 'Áo Noel cổ điển',
    Outfit_Noel_Holly: 'Áo khoác rừng thông',
    Outfit_Noel_Elf: 'Yếm chú lùn',
    Outfit_Noel_Cocoa: 'Gile cacao',
    Outfit_Noel_Frost: 'Áo khoác sương tuyết',
    Outfit_Noel_Knit: 'Áo len mùa đông',
    Accessory_Noel_Red: 'Mũ Noel đỏ',
    Accessory_Noel_Green: 'Mũ Noel xanh lá',
    Accessory_Noel_Wine: 'Mũ Noel đỏ rượu',
    Accessory_Noel_Blue: 'Mũ Noel xanh tuyết',
};
const words = {
    Balding: 'Hói',
    Long: 'Dài',
    Short: 'Ngắn',
    Tuft: 'Chỏm',
    Unkept: 'Rối',
    Blonde: 'Vàng',
    Blonde_Ash: 'Vàng tro',
    Blue: 'Xanh dương',
    Brown_Ash: 'Nâu tro',
    Brown_Dark: 'Nâu đậm',
    Brown_Hazel: 'Nâu hạt dẻ',
    Brown_Light: 'Nâu nhạt',
    Gray: 'Xám',
    Orange: 'Cam',
    Green: 'Xanh lá',
    Red: 'Đỏ',
    Violet: 'Tím',
    Black: 'Đen',
    Yellow: 'Vàng',
    Brown: 'Nâu',
    Braces: 'Áo dây',
    Dungarees: 'Yếm',
    Laborer: 'Áo khoác',
    Vest: 'Áo gile',
    Straw_Hat: 'Mũ rơm',
    Bamboo_Hat: 'Nón tre',
    Gas_Mask: 'Mặt nạ',
    Dull: 'Trầm',
    Cyan: 'Xanh ngọc',
};
function label(file) {
    if (!file) return 'Không dùng';
    if (noelLabels[file.replace(/\.png$/, '')]) return noelLabels[file.replace(/\.png$/, '')];
    if (file.startsWith('Body_')) return `Tông da ${file.match(/\d+/)[0]}`;
    let name = file.replace(/^(Hairstyle|Outfit|Eyes|Accessory)_|\.png$/g, '');
    for (const [key, value] of Object.entries(words).sort((a, b) => b[0].length - a[0].length))
        name = name.replaceAll(key, value);
    return name.replaceAll('_', ' ');
}
function load(key, file) {
    const src = assetPath(key, file);
    if (!src) return Promise.resolve(null);
    if (!cache.has(src))
        cache.set(
            src,
            new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    failedAssets.delete(src);
                    loadStatus();
                    resolve(img);
                };
                img.onerror = () => {
                    cache.delete(src);
                    failedAssets.add(src);
                    loadStatus();
                    resolve(null);
                };
                img.src = src;
            }),
        );
    return cache.get(src);
}
function loadStatus() {
    const failed = failedAssets.size;
    $('#wardrobe-load-state').textContent = failed
        ? 'Một số ảnh chưa tải được. Bấm “Tải lại ảnh” để thử lại.'
        : 'Đủ 5 kiểu tóc × 9 màu · 19 bộ đồ · 12 phụ kiện';
    $('#retry-wardrobe').hidden = !failed;
}
function drawFrame(ctx, img, frame) {
    if (img) {
        const columns = Math.floor(img.width / 16);
        ctx.drawImage(
            img,
            (frame % columns) * 16,
            Math.floor(frame / columns) * 32,
            16,
            32,
            0,
            0,
            16,
            32,
        );
    }
}
async function characterImages(character) {
    return Promise.all(layerOrder.map((key) => load(key, character[key])));
}
function paint(ctx, images, frame) {
    ctx.clearRect(0, 0, 16, 32);
    ctx.imageSmoothingEnabled = false;
    images.forEach((img) => drawFrame(ctx, img, frame));
}
async function preview() {
    const version = ++previewVersion;
    const images = await characterImages(draft.character);
    if (version !== previewVersion) return;
    paint($('#noel-character-preview').getContext('2d'), images, directions[direction].frame);
    $('#preview-facing').textContent = `Hướng ${directions[direction].label.toLowerCase()}`;
}
function thumbnail(button, character) {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 32;
    canvas.setAttribute('aria-hidden', 'true');
    button.append(canvas);
    button.dataset.preview = 'loading';
    characterImages(character).then((images) => {
        paint(canvas.getContext('2d'), images, 74);
        const failed = layerOrder.some((key, index) => character[key] && !images[index]);
        button.dataset.preview = failed ? 'error' : 'ready';
        if (failed) {
            const message = document.createElement('small');
            message.className = 'preview-error';
            message.textContent = 'Chưa tải đủ ảnh';
            button.append(message);
        }
    });
}
function refresh() {
    draft.santaHat = NOEL_HATS.includes(draft.character.accessory);
    $('#santa-hat').checked = draft.santaHat;
    renderPresets();
    renderOptions();
    preview();
}
function select(key, file) {
    draft.character[key] = file;
    refresh();
}
function option(group, key, file) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'look-option';
    button.setAttribute('aria-label', label(file));
    button.setAttribute('aria-pressed', String(draft.character[key] === file));
    if (file) {
        const character = { ...draft.character, [key]: file };
        // Show the entire person; remove the hat while comparing hair/eye styles.
        if (key === 'hairstyle' || key === 'eyes') character.accessory = '';
        thumbnail(button, character);
    } else {
        const empty = document.createElement('span');
        empty.className = 'empty-look';
        empty.textContent = '∅';
        button.append(empty);
    }
    const caption = document.createElement('span');
    caption.textContent = label(file);
    button.append(caption);
    button.addEventListener('click', () => select(key, file));
    group.append(button);
}
function renderPresets() {
    const group = $('#noel-presets');
    group.replaceChildren();
    for (const preset of NOEL_PRESETS) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'look-option preset-option';
        button.setAttribute('aria-label', `Phối bộ ${preset.label}`);
        button.setAttribute(
            'aria-pressed',
            String(
                draft.character.outfit === preset.outfit &&
                    draft.character.accessory === preset.accessory,
            ),
        );
        thumbnail(button, {
            ...draft.character,
            outfit: preset.outfit,
            accessory: preset.accessory,
        });
        const caption = document.createElement('span');
        caption.textContent = preset.label;
        button.append(caption);
        button.addEventListener('click', () => {
            draft.character.outfit = preset.outfit;
            draft.character.accessory = preset.accessory;
            refresh();
        });
        group.append(button);
    }
}
function heading(panel, text) {
    const h = document.createElement('h4');
    h.textContent = text;
    panel.append(h);
}
function group(panel, key, files) {
    const grid = document.createElement('div');
    grid.className = 'look-grid';
    files.forEach((file) => option(grid, key, file));
    panel.append(grid);
}
function renderOptions() {
    const panel = $('#noel-character-options');
    panel.replaceChildren();
    if (active === 'hairstyle') {
        const current = draft.character.hairstyle.match(/^Hairstyle_(\w+?)_(.+)\.png$/),
            type = current?.[1] || 'Short',
            color = current?.[2] || 'Brown_Dark';
        const types = document.createElement('div');
        types.className = 'look-grid';
        ['', ...HAIR_TYPES.map((t) => `Hairstyle_${t}_${color}.png`)].forEach((file) =>
            option(types, 'hairstyle', file),
        );
        panel.append(types);
        if (draft.character.hairstyle) {
            heading(panel, 'Màu tóc · Xem trước tóc không đội mũ');
            const colors = document.createElement('div');
            colors.className = 'look-grid';
            HAIR_COLORS.forEach((c) => option(colors, 'hairstyle', `Hairstyle_${type}_${c}.png`));
            panel.append(colors);
        }
    } else if (active === 'outfit' || active === 'accessory') {
        const seasonal = active === 'outfit' ? NOEL_OUTFITS : NOEL_HATS;
        heading(panel, active === 'outfit' ? 'Bộ sưu tập Giáng sinh' : 'Mũ Noel · 4 màu');
        group(panel, active, seasonal);
        heading(panel, active === 'outfit' ? 'Tủ đồ GSL · 13 bộ gốc' : 'Phụ kiện GSL · 8 mẫu gốc');
        group(panel, active, [
            '',
            ...PARTS[active].files.filter((file) => !seasonal.includes(file)),
        ]);
    } else group(panel, active, [...(PARTS[active].optional ? [''] : []), ...PARTS[active].files]);
}
function renderTabs() {
    const tabs = $('#noel-character-tabs');
    tabs.replaceChildren();
    for (const [key, part] of Object.entries(PARTS)) {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = part.label;
        button.setAttribute('role', 'tab');
        button.setAttribute('aria-selected', String(active === key));
        button.setAttribute('aria-controls', 'noel-character-options');
        button.id = `look-tab-${key}`;
        button.tabIndex = active === key ? 0 : -1;
        button.addEventListener('click', () => {
            active = key;
            renderTabs();
            renderOptions();
            $(`#look-tab-${key}`).focus();
        });
        button.addEventListener('keydown', (e) => {
            if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
            e.preventDefault();
            const keys = Object.keys(PARTS),
                i = keys.indexOf(active);
            active =
                e.key === 'Home'
                    ? keys[0]
                    : e.key === 'End'
                      ? keys.at(-1)
                      : keys[(i + (e.key === 'ArrowRight' ? 1 : keys.length - 1)) % keys.length];
            renderTabs();
            renderOptions();
            $(`#look-tab-${active}`).focus();
        });
        tabs.append(button);
    }
    $('#noel-character-options').setAttribute('aria-labelledby', `look-tab-${active}`);
}
function populate() {
    $('#noel-title').value = draft.gameTitle;
    $('#noel-name').value = draft.playerName;
    $('#noel-message').value = draft.message;
    renderTabs();
    refresh();
    loadStatus();
}
let starting = false;
function fitGameViewport() {
    const console = $('.console');
    const stage = $('#game');
    let frame;
    const fit = () => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
            if (document.fullscreenElement || $('#play-screen').hidden) return;
            // Include the real heading, toolbar, controls and page footer. A fixed
            // 190px allowance clipped the stage on shorter desktop windows.
            const top = stage.getBoundingClientRect().top + window.scrollY;
            const footer = $('.console-footer').getBoundingClientRect().height;
            const pageFooter = $('.page-footer').getBoundingClientRect().height;
            const height = Math.max(200, window.innerHeight - top - footer - pageFooter - 14);
            console.style.setProperty(
                '--game-fit-width',
                `${Math.floor((height * 950) / 680) + 2}px`,
            );
        });
    };
    const observer = new ResizeObserver(fit);
    for (const selector of [
        '.masthead',
        '.page-heading',
        '.console-bar',
        '.console-footer',
        '.page-footer',
    ]) {
        observer.observe($(selector));
    }
    window.addEventListener('resize', fit);
    document.addEventListener('fullscreenchange', fit);
    fit();
}
async function play() {
    if (starting) return;
    starting = true;
    $('#intro-screen').hidden = true;
    $('#play-screen').hidden = false;
    $('#setup-nav').hidden = true;
    $('#game-actions').hidden = false;
    $('#game').tabIndex = 0;
    $('#game').focus({ preventScroll: true });
    const url = new URL(location.href);
    url.searchParams.set('play', '1');
    url.hash = '';
    history.replaceState(null, '', url);
    window.scrollTo(0, 0);
    fitGameViewport();
    try {
        await loadGameFonts();
        await import('./main.js');
    } catch {
        starting = false;
        $('#intro-screen').hidden = false;
        $('#play-screen').hidden = true;
        $('#setup-nav').hidden = false;
        $('#game-actions').hidden = true;
        $('#setup-status').textContent = 'Chưa tải được game. Bạn thử lại nhé.';
    }
}
$('#noel-setup-form').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!e.currentTarget.reportValidity()) return;
    draft = {
        ...draft,
        gameTitle: $('#noel-title').value,
        playerName: $('#noel-name').value,
        message: $('#noel-message').value,
    };
    setProfile(draft);
    play();
});
$('#play-demo').addEventListener('click', play);
$('#rotate-character').addEventListener('click', () => {
    direction = (direction + 1) % directions.length;
    preview();
});
$('#santa-hat').addEventListener('change', (e) => {
    draft.character.accessory = e.target.checked ? NOEL_HATS[0] : '';
    refresh();
});
$('#reset-character').addEventListener('click', () => {
    draft.character = structuredClone(DEFAULT_PROFILE.character);
    refresh();
});
$('#retry-wardrobe').addEventListener('click', () => {
    for (const src of failedAssets) cache.delete(src);
    failedAssets.clear();
    refresh();
    loadStatus();
});
populate();
if (new URLSearchParams(location.search).get('play') === '1') play();
