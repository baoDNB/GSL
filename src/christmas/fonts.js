export async function loadGameFonts() {
    if (!document.fonts) return;
    let timeout;
    try {
        // Canvas keeps the font used at creation, so load Vietnamese glyphs before Phaser starts.
        await Promise.race([
            Promise.all([
                ...[400, 500, 600, 700].map((weight) =>
                    document.fonts.load(`${weight} 17px "Be Vietnam Pro"`, 'Đường về nhà ước'),
                ),
                document.fonts.load('400 40px "VT323"', 'Đường về nhà ước'),
            ]),
            new Promise((resolve) => (timeout = setTimeout(resolve, 2500))),
        ]);
    } catch {
        // System fallbacks keep the game playable if a font file cannot be loaded.
    } finally {
        clearTimeout(timeout);
    }
}
