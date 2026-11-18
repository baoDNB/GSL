import test from 'node:test';
import assert from 'node:assert/strict';
import { moduleLoader, plain } from './module-loader.mjs';

const load = moduleLoader();
const custom = await load('src/customization.js');

test('text normalization removes control characters, bounds length and restores empty fallback', () => {
    assert.equal(custom.cleanText('\0\n ', 'fallback'), 'fallback');
    assert.equal(custom.cleanText('  abc\tdef ', '', 5), 'abc d');
    assert.equal(custom.cleanText({ text: 'invalid' }, 'fallback'), 'fallback');
});

test('malformed dialogue sequences fall back while empty sequences remain intentional', () => {
    for (const value of [null, {}, 'text', [null, 5, {}, { text: 8 }]]) {
        assert.equal(custom.normalizeDialogueSequence(value, null), null);
    }
    assert.deepEqual(plain(custom.normalizeDialogueSequence([])), []);
    assert.deepEqual(
        plain(
            custom.normalizeDialogueSequence([
                null,
                { text: ' hi ', speaker: 8 },
                { text: '\0\t' },
                { text: 'ok', speaker: ' Kid ' },
            ]),
        ),
        [
            { speaker: 'System', text: 'hi' },
            { speaker: 'Kid', text: 'ok' },
        ],
    );
});

test('oversized custom dialogues are bounded in nodes, speaker and text', () => {
    const nodes = custom.normalizeDialogueSequence(
        Array.from({ length: 250 }, () => ({
            speaker: 's'.repeat(100),
            text: 'x'.repeat(3000),
        })),
    );
    assert.equal(nodes.length, 200);
    assert.equal(nodes[0].speaker.length, 48);
    assert.equal(nodes[0].text.length, 2000);
});

test('metadata only retains recognized nonblank text fields', () => {
    assert.deepEqual(
        plain(
            custom.normalizeGameMeta({
                playerName: ' An ',
                gameTitle: '\0',
                kidName: 42,
                unknown: '<script>',
                gameSubtitle: 'a'.repeat(150),
            }),
        ),
        { playerName: 'An', gameSubtitle: 'a'.repeat(120) },
    );
    for (const value of [null, [], false])
        assert.deepEqual(plain(custom.normalizeGameMeta(value)), {});
});

test('puzzle image URLs permit raster/web sources and reject executable or local schemes', () => {
    for (const url of [
        'javascript:alert(1)',
        'file:///secret',
        'data:image/svg+xml,<svg/>',
        'blob:https://example.com/a',
        'relative.png',
        null,
        'x'.repeat(4 * 1024 * 1024 + 257),
    ]) {
        assert.equal(custom.normalizePuzzleUrl(url), '');
    }
    assert.equal(
        custom.normalizePuzzleUrl('data:image/png;base64,YQ=='),
        'data:image/png;base64,YQ==',
    );
    assert.equal(
        custom.normalizePuzzleUrl(' https://example.com/a.png '),
        'https://example.com/a.png',
    );
});

test('blocked browser storage and invalid JSON safely return null', async () => {
    const blocked = await moduleLoader({
        localStorage: {
            getItem() {
                throw Error('blocked');
            },
        },
    })('src/customization.js');
    assert.equal(blocked.readStoredValue('anything'), null);
    const malformed = await moduleLoader({ localStorage: { getItem: () => '{bad' } })(
        'src/customization.js',
    );
    assert.equal(malformed.readStoredValue('anything'), null);
    assert.equal(malformed.readStoredValue('anything', false), '{bad');
});

test('loading customization rejects prototype keys and uses text-safe title assignment', async () => {
    const window = {};
    const document = {};
    const values = {
        external_game_dialogues:
            '{"__proto__":[{"text":"bad"}],"constructor":[],"foundKey":[{"text":"safe"}],"broken":null}',
        external_game_meta: JSON.stringify({ gameTitle: '<b>My game</b>' }),
        external_puzzle_url: 'javascript:alert(1)',
    };
    const mod = await moduleLoader({
        window,
        document,
        localStorage: { getItem: (key) => values[key] },
    })('src/customization.js');
    mod.loadCustomization();
    assert.deepEqual(Object.keys(window.customGameDialogues), ['foundKey']);
    assert.equal(document.title, '<b>My game</b>');
    assert.equal(window.customPuzzleImageUrl, '');
});
