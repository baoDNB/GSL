// Keep browser storage and user-authored content outside the scene mechanics.
export function cleanText(value, fallback = '', max = 1000) {
    if (typeof value !== 'string') return fallback;
    return (
        value
            .replace(/[\u0000-\u001f\u007f]/g, ' ')
            .trim()
            .slice(0, max) || fallback
    );
}

export function normalizeDialogueSequence(value, fallback = []) {
    if (!Array.isArray(value)) return fallback;
    const nodes = value.slice(0, 200).flatMap((node) => {
        if (!node || typeof node !== 'object' || typeof node.text !== 'string') return [];
        const text = cleanText(node.text, '', 2000);
        return text ? [{ speaker: cleanText(node.speaker, 'System', 48), text }] : [];
    });
    return value.length && !nodes.length ? fallback : nodes;
}

export function normalizeGameMeta(value) {
    const limits = { gameTitle: 80, gameSubtitle: 120, playerName: 48, kidName: 48, adminName: 48 };
    const meta = {};
    if (!value || typeof value !== 'object' || Array.isArray(value)) return meta;
    for (const [key, max] of Object.entries(limits)) {
        const text = cleanText(value[key], '', max);
        if (text) meta[key] = text;
    }
    return meta;
}

export function normalizePuzzleUrl(value) {
    if (typeof value !== 'string' || value.length > 4 * 1024 * 1024 + 256) return '';
    const url = value.trim();
    // Uploaded raster images and explicit web URLs only; never executable or local-file schemes.
    if (/^data:image\/(?:png|jpeg|webp|gif|bmp);base64,[a-z\d+/=\s]+$/i.test(url)) return url;
    try {
        const parsed = new URL(url);
        return ['https:', 'http:'].includes(parsed.protocol) ? parsed.href : '';
    } catch {
        return '';
    }
}

export function readStoredValue(key, json = true) {
    try {
        const raw = globalThis.localStorage?.getItem(key);
        return json ? JSON.parse(raw || 'null') : raw;
    } catch {
        return null;
    }
}

export function loadCustomization() {
    const dialogues = readStoredValue('external_game_dialogues');
    const safeDialogues = {};
    if (dialogues && typeof dialogues === 'object' && !Array.isArray(dialogues)) {
        for (const [key, value] of Object.entries(dialogues)) {
            if (['__proto__', 'constructor', 'prototype'].includes(key)) continue;
            const nodes = normalizeDialogueSequence(value, null);
            if (nodes) safeDialogues[key] = nodes;
        }
    }
    window.customGameDialogues = safeDialogues;
    window.customGameMeta = normalizeGameMeta(readStoredValue('external_game_meta'));
    window.customPuzzleImageUrl = normalizePuzzleUrl(readStoredValue('external_puzzle_url', false));
    if (window.customGameMeta.gameTitle) document.title = window.customGameMeta.gameTitle;
}
