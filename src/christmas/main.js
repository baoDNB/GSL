import Phaser from 'phaser';
import BootScene from '../scenes/BootScene.js';
import story from './story-spec.json';
import { Controls } from './controls.js';
import {
    freshState,
    loadState,
    saveState,
    countRewards,
    updateJournal,
    completeStage,
} from './state.js';
import {
    PREPARATIONS,
    TRIALS,
    missingPreparations,
    canLightTree,
    canEnterEnding,
    FOUND_NOTES,
    STAGE_STORIES,
    familyReflection,
} from './campaign.js';
import { trialOverlay } from './trial-overlay.js';
import { roomKeepsakes, roomOccluders } from './room-feedback.js';
import {
    W,
    H,
    FONT,
    DISPLAY_FONT,
    text,
    button,
    background,
    warmLight,
    star,
    burst,
} from './art.js';
import { ROOMS, OBJECTS, RETURN_ROOM, roomPoint } from './maps.js';
import { getProfile, assetPath } from './profile.js';

const profile = getProfile();
document.title = `${profile.gameTitle} · GSL`;
const gameHeading = document.querySelector('#game-heading');
if (gameHeading) {
    const colonIndex = profile.gameTitle.indexOf(':');
    if (colonIndex !== -1) {
        const prefix = profile.gameTitle.slice(0, colonIndex + 1) + ' ';
        const emphasis = document.createElement('em');
        emphasis.textContent = profile.gameTitle.slice(colonIndex + 1).trim();
        gameHeading.replaceChildren(document.createTextNode(prefix), emphasis);
    } else {
        gameHeading.textContent = profile.gameTitle;
    }
}
document
    .querySelector('#game')
    .setAttribute(
        'aria-label',
        `${profile.gameTitle}. Dùng WASD hoặc phím mũi tên để di chuyển, E để tương tác.`,
    );

let progress = loadState() || freshState();
let hasSave = Boolean(loadState());
const titles = {
    house: 'Sân nhà mùa đông',
    living: 'Phòng khách',
    kitchen: 'Căn bếp ấm áp',
    hallway: 'Hành lang tầng trên',
    gifts: 'Phòng của hai anh em',
    bedroom: 'Phòng bố mẹ',
    garden: 'Sân nhà mùa đông',
};
const doorTitles = {
    garden: 'Sân nhà',
    kitchen: 'Căn bếp',
    living: 'Phòng khách',
    hallway: 'Tầng trên',
    gifts: 'Hai anh em',
    bedroom: 'Bố mẹ',
};
const interactionTitles = {
    crossing: 'Thử thách đường tuyết',
    baking: 'Cùng nướng bánh',
    memory: 'Ghép những món quà',
    fridgeNote: 'Đọc ghi chú trên tủ lạnh',
    treeNote: 'Ngắm cây thông Noel',
    familyNote: 'Đọc lời nhắn gia đình',
    bedroomNote: 'Đọc lá thư của bố mẹ',
};

// Nhãn chỉ đường tại các cửa: tắt viền chữ (strokeThickness = 0) trên nền hộp tối
// để chữ tiếng Việt cỡ nhỏ hiển thị sắc nét, không bị bít nét.
function wayfindingLabel(scene, x, y, label) {
    return text(
        scene,
        Phaser.Math.Clamp(x, 85, W - 85),
        Phaser.Math.Clamp(y, 24, H - 18),
        label,
        13,
        '#fff0c8',
    )
        .setOrigin(0.5)
        .setStroke('#142a25', 0)
        .setFontStyle('600')
        .setBackgroundColor('#17362fdd')
        .setPadding(9, 5)
        .setDepth(2);
}
function stairDirection(scene, x, y, direction) {
    // Draw the stair cue in pixels so it stays legible without arrow font glyphs.
    const cue = scene.add.graphics({ x, y }).setDepth(890);
    cue.fillStyle(0x17362f, 0.95).fillRect(-14, -14, 28, 28);
    cue.lineStyle(1, 0xd7b774).strokeRect(-14, -14, 28, 28);
    cue.fillStyle(0xffdf80);
    const sign = direction === 'down' ? -1 : 1;
    for (const [rx, ry, rw, rh] of [
        [-2, -10, 4, 3],
        [-5, -7, 10, 3],
        [-8, -4, 16, 3],
        [-2, -1, 4, 11],
    ])
        cue.fillRect(rx, sign === 1 ? ry : -ry - rh, rw, rh);
    return cue;
}
const roomImages = Object.fromEntries(
    Object.entries(ROOMS).map(([key, room]) => [key, `${room.image}_winter`]),
);
const UI_Y = (H - 540) / 2;
function centerInterface(scene, start) {
    return scene.add.container(0, UI_Y, scene.children.list.slice(start)).setDepth(100);
}

class ChristmasBoot extends BootScene {
    constructor() {
        super();
        this.sys.settings.key = 'ChristmasBoot';
    }
    getCharacterSelection() {
        return profile.character;
    }
    preload() {
        text(this, W / 2, H / 2, 'Đang chuẩn bị một chút phép màu…', 18).setOrigin(0.5);
        const bar = this.add.rectangle(275, 315, 0, 4, 0xd7b774).setOrigin(0, 0.5);
        this.load.on('progress', (value) => (bar.width = 400 * value));
        this.characterSelection = this.getCharacterSelection();
        const pieces = 'assets/Farmer_Generator_Pieces/Character Pieces';
        this.load.image('player_template_layer', `${pieces}/Bodies/16x16/Body_1.png`);
        for (const [key, texture] of Object.entries({
            body: 'player_body_layer',
            eyes: 'player_eyes_layer',
            outfit: 'player_outfit_layer',
            hairstyle: 'player_hair_layer',
            accessory: 'player_accessory_layer',
        })) {
            const path = assetPath(key, this.characterSelection[key]);
            if (path) this.load.image(texture, path);
        }
        for (const room of [
            'house',
            'livingroom',
            'kitchen',
            'roomchild',
            'hallway',
            'roommaster',
            'roomsecret',
        ]) {
            const revision = '20261028-3items-v1';
            this.load.image(`${room}_winter`, `assets/christmas/pixel/${room}.png?v=${revision}`);
            this.load.image(`${room}_fg`, `assets/christmas/pixel/${room}-fg.png?v=${revision}`);
        }
    }
    create() {
        this.buildPlayerTexture();
        this.textures.get('player').setFilter(Phaser.Textures.FilterMode.NEAREST);
        for (const room of [
            'house',
            'livingroom',
            'kitchen',
            'roomchild',
            'hallway',
            'roommaster',
            'roomsecret',
        ]) {
            this.textures.get(`${room}_winter`).setFilter(Phaser.Textures.FilterMode.NEAREST);
            this.textures.get(`${room}_fg`)?.setFilter(Phaser.Textures.FilterMode.NEAREST);
        }
        for (const [kind, base] of [
            ['idle', 56],
            ['walk', 112],
        ]) {
            ['right', 'up', 'left', 'down'].forEach((direction, index) =>
                this.anims.create({
                    key: `${kind}-${direction}`,
                    frames: this.anims.generateFrameNumbers('player', {
                        start: base + index * 6,
                        end: base + index * 6 + 5,
                    }),
                    frameRate: kind === 'walk' ? 10 : 7,
                    repeat: -1,
                }),
            );
        }
        document.querySelector('#loading')?.remove();
        updateJournal(progress);
        this.scene.start('ChristmasTitle');
    }
}

class StoryScene extends Phaser.Scene {
    setup(label, { hideWishHud = false } = {}) {
        this.controls = new Controls(this);
        this.dialogue = null;
        this.changing = false;
        this.cooldown = 0;
        document.querySelector('#location-label').textContent = label.toUpperCase();
        document.querySelector('.wish-hud').hidden = hideWishHud;
        this.cameras.main.fadeIn(240, 15, 33, 28);
    }
    go(key, data = {}) {
        if (this.changing) return;
        this.changing = true;
        this.controls.clear();
        this.player?.setVelocity(0);
        this.cameras.main.fadeOut(180, 15, 33, 28);
        this.time.delayedCall(185, () => this.scene.start(key, data));
    }
    talk(key, onDone) {
        if (this.dialogue) return;
        this.player?.setVelocity(0);
        this.controls.clear();
        const original = typeof key === 'string' ? story.dialogues[key] : key;
        const nodes = original.map((node, index) => ({
            speaker: node.speaker === 'An' ? profile.playerName : node.speaker,
            text:
                key === 'finalRoom' && index === original.length - 1
                    ? profile.message
                    : node.text.replace(/\bAn\b/g, () => profile.playerName),
        }));
        const panel = this.add.container(0, 0).setDepth(3000);
        const box = this.add
            .rectangle(W / 2, H - 89, 894, 144, 0x112e28, 0.98)
            .setStrokeStyle(2, 0xc7ab71)
            .setInteractive();
        const speaker = text(this, 56, H - 141, '', 14, '#e5c786').setFontStyle('bold');
        const content = text(this, 56, H - 112, '', 17).setWordWrapWidth(834);
        const hint = text(this, 894, H - 35, 'E / CHẠM ĐỂ TIẾP TỤC  ▸', 11, '#b2c1a5').setOrigin(
            1,
            0.5,
        );
        panel.add([box, speaker, content, hint]);
        this.dialogue = { nodes, index: 0, panel, box, speaker, content, hint, onDone };
        this.scale.on('resize', this.layoutDialogue, this);
        this.events.once('shutdown', () => this.scale.off('resize', this.layoutDialogue, this));
        box.on('pointerdown', () => this.nextDialogue());
        this.renderDialogue();
    }
    renderDialogue() {
        const d = this.dialogue,
            node = d.nodes[d.index];
        d.speaker.setText(node.speaker.toUpperCase());
        d.content.setText(node.text);
        this.layoutDialogue();
    }
    layoutDialogue() {
        const d = this.dialogue;
        if (!d) return;
        // Keep dialogue readable when the whole 950px stage is scaled down on phones.
        const compact = this.game.canvas.getBoundingClientRect().width < 600;
        d.speaker.setFontSize(compact ? 26 : 14);
        d.content.setFontSize(compact ? 30 : 17);
        d.hint.setFontSize(compact ? 20 : 11);
        const height = Math.min(
            H - 45,
            Math.max(compact ? 300 : 144, d.content.height + (compact ? 110 : 80)),
        );
        const top = H - 17 - height;
        d.box.setSize(894, height).setPosition(W / 2, top + height / 2);
        d.speaker.y = top + 14;
        d.content.y = top + (compact ? 58 : 44);
    }
    nextDialogue() {
        const d = this.dialogue;
        if (!d) return;
        if (++d.index < d.nodes.length) this.renderDialogue();
        else {
            this.scale.off('resize', this.layoutDialogue, this);
            d.panel.destroy();
            this.dialogue = null;
            this.controls.clear();
            this.cooldown = this.time.now + 220;
            d.onDone?.();
        }
    }
    handleModal(input) {
        if (this.changing) return true;
        if (this.dialogue) {
            if (input.action) this.nextDialogue();
            return true;
        }
        return this.time.now < this.cooldown;
    }
}

class ChristmasTitle extends StoryScene {
    constructor() {
        super('ChristmasTitle');
    }
    create() {
        this.setup(titles.house);
        background(this, 'house_winter', true);
        const uiStart = this.children.list.length;
        this.add
            .rectangle(302, 270, 495, H - 58, 0x102b25, 0.94)
            .setStrokeStyle(1, 0xc6ad73, 0.5)
            .setDepth(50);
        text(this, 90, 72, 'G S L   /   C H R I S T M A S   S T O R I E S', 11, '#d0b677').setDepth(
            110,
        );
        text(this, 90, 101, 'NOEL', 48)
            .setDepth(110)
            .setFontFamily(DISPLAY_FONT)
            .setFontStyle('normal');
        const title = text(
            this,
            90,
            161,
            profile.gameTitle.replace(/^Noel:\s*/i, ''),
            40,
            '#efd294',
        )
            .setWordWrapWidth(400)
            .setLineSpacing(2)
            .setDepth(110)
            .setFontFamily(DISPLAY_FONT)
            .setFontStyle('normal');
        for (let size = 40; title.height > 76 && size > 18; ) title.setFontSize(--size);
        text(
            this,
            90,
            249,
            `Một ngôi nhà quen. Một đêm đầy phép màu.\nCùng ${profile.playerName} tìm ba điều ước và mang ánh sáng Giáng sinh trở về với gia đình.`,
            14,
            '#c6d3bb',
        )
            .setWordWrapWidth(400)
            .setLineSpacing(4)
            .setDepth(110);
        this.selection = 0;
        const options = [];
        if (hasSave) options.push({ label: 'TIẾP TỤC CHUYẾN ĐI', run: () => this.begin(false) });
        options.push({
            label: hasSave ? 'BẮT ĐẦU CHUYẾN ĐI MỚI' : 'BẮT ĐẦU CHUYẾN ĐI',
            run: () => this.begin(true),
        });
        this.options = options;
        this.menuButtons = options.map((option, i) =>
            button(this, 304, 340 + i * 55, option.label, option.run, 390, 0x28493b),
        );
        this.selector = text(this, 97, 340, '›', 24, '#f9d888').setOrigin(0.5).setDepth(150);
        this.menuButtons.forEach((menu, index) => menu.on('focus', () => this.selectOption(index)));
        this.selectOption(0);
        text(
            this,
            90,
            451,
            '↑ ↓ CHỌN    E BẮT ĐẦU    ·    CÓ ĐIỀU KHIỂN CẢM ỨNG',
            11,
            '#9cb398',
        ).setDepth(110);
        text(this, 90, 477, 'Một câu chuyện nhỏ dành cho mùa đoàn viên.', 12, '#9cb398').setDepth(
            110,
        );
        centerInterface(this, uiStart);
    }
    selectOption(index) {
        this.selection = index;
        this.selector.y = 340 + index * 55;
        this.menuButtons.forEach((menu, i) => menu.setSelected(i === index));
    }
    begin(isNew) {
        if (this.changing) return;
        if (isNew) {
            progress = freshState();
            hasSave = true;
            saveState(progress);
            updateJournal(progress);
        }
        this.go('ChristmasWorld', { room: isNew ? 'house' : progress.location, intro: isNew });
    }
    update() {
        const i = this.controls.read();
        if (this.changing) return;
        if (i.down || i.up) {
            const step = i.down ? 1 : -1;
            this.selectOption((this.selection + step + this.options.length) % this.options.length);
        }
        if (i.action) this.options[this.selection].run();
    }
}

class ChristmasWorld extends StoryScene {
    constructor() {
        super('ChristmasWorld');
    }
    init(data) {
        this.room = ROOMS[data.room] ? data.room : 'living';
        this.from = data.from;
        this.intro = data.intro;
        this.welcome = data.welcome;
    }
    create() {
        this.setup(titles[this.room]);
        background(this, roomImages[this.room], ['house', 'garden'].includes(this.room));
        this.map = ROOMS[this.room];
        this.spots = [];
        this.blocks = this.physics.add.staticGroup();
        this.prompt = text(this, W / 2, H - 33, '', 14)
            .setOrigin(0.5)
            .setStroke('#142a25', 0)
            .setFontStyle('600')
            .setDepth(1000)
            .setBackgroundColor('#14352fee')
            .setPadding(12, 7)
            .setVisible(false);
        const [x, y] = this.map.spawns[this.from] || this.map.spawns.default;
        this.player = this.physics.add
            .sprite(x, y - 27, 'player', 74)
            .setScale(3)
            .setDepth(y);
        this.footShadow = this.add.ellipse(x, y, 35, 12, 0x14251b, 0.3).setDepth(y - 1);
        this.player.body.setSize(8, 8).setOffset(4, 21);
        this.player.setCollideWorldBounds(true);
        this.physics.world.setBounds(...this.map.bounds);
        this.direction = this.map.facing?.[this.from] || this.map.facing?.default || 'up';
        this.player.play(`idle-${this.direction}`);
        this.physics.add.collider(this.player, this.blocks);
        this.buildRoom();
        this.time.delayedCall(200, () => {
            if (this.intro) this.talk('openingIntro');
            else if (this.welcome) this.talk('welcome');
        });
        updateJournal(progress);
        progress.location = this.room;
        saveState(progress);
    }
    block(x, y, w, h) {
        const zone = this.add.zone(x, y, w, h);
        this.blocks.add(zone);
        return zone;
    }
    spot(object) {
        const [mx, my] = object.marker;
        const sign = text(this, mx, my, '!', 30, '#ffdd58')
            .setOrigin(0.5)
            .setDepth(900)
            .setFontStyle('bold');
        sign.setInteractive({ useHandCursor: true });
        sign.on('pointerdown', () => {
            if (this.nearby?.object === object && !this.dialogue && !this.changing)
                this.interact(object);
        });
        const completed =
            (object.kind && progress[object.kind]) || (object.collect && progress[object.collect]);
        if (completed) sign.setVisible(false);
        this.tweens.add({
            targets: sign,
            y: my - 10,
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });
        this.spots.push({ x: object.x, y: object.y, radius: object.radius || 75, sign, object });
    }
    travel(room) {
        this.go('ChristmasWorld', {
            room,
            from: this.room,
            welcome: this.room === 'house' && room === 'kitchen',
        });
    }
    launchTrial(kind, intro) {
        if (progress[kind]) return this.talk('already');
        const missing = missingPreparations(progress, kind);
        if (missing.length)
            return this.talk([
                {
                    speaker: 'Chuẩn bị chuyến đi',
                    text: missing.map((key) => PREPARATIONS[key].hint).join(' '),
                },
            ]);
        this.talk(intro, () => this.go('ChristmasTrial', { kind, returnRoom: this.room }));
    }
    collectItem(key, object) {
        progress[key] = true;
        saveState(progress);
        updateJournal(progress);
        this.spots.find((spot) => spot.object === object)?.sign.setVisible(false);
        const prop = this.collectibleProps?.[key];
        if (prop) {
            this.tweens.add({
                targets: prop,
                y: prop.y - 14,
                alpha: 0,
                duration: 220,
                onComplete: () => prop.destroy(),
            });
            delete this.collectibleProps[key];
        }
        const saveLabel = document.querySelector('#save-label');
        if (saveLabel && PREPARATIONS[key]) {
            saveLabel.textContent = `ĐÃ NHẶT · ${PREPARATIONS[key].name.toUpperCase()}`;
        }
    }
    interact(object) {
        if (object.dialogue === 'fridgeNote') {
            this.talk('fridgeNote', () => this.collectItem('recipe', object));
            return;
        }
        if (object.collect) {
            const item = PREPARATIONS[object.collect];
            if (progress[object.collect])
                return this.talk([
                    { speaker: profile.playerName, text: `${item.name} đã nằm trong túi rồi.` },
                ]);
            this.talk(
                [
                    {
                        speaker: item.name,
                        text: FOUND_NOTES[object.collect],
                    },
                ],
                () => this.collectItem(object.collect, object),
            );
        } else if (object.kind) this.launchTrial(object.kind, object.intro);
        else if (object.ending) {
            if (!canEnterEnding(progress))
                this.talk(canLightTree(progress) ? 'treeLocked' : 'locked');
            else this.go('ChristmasEnding');
        } else if (object.dialogue === 'treeNote' && progress.treeLit) {
            this.talk('treeDone');
        } else if (object.dialogue === 'treeNote' && canLightTree(progress) && !progress.treeLit) {
            this.talk('lightsIntro', () =>
                this.go('ChristmasTrial', { kind: 'lights', returnRoom: 'living' }),
            );
        } else if (object.dialogue === 'familyNote' && familyReflection(progress)) {
            this.talk(familyReflection(progress));
        } else this.talk(object.dialogue);
    }
    buildRoom() {
        this.occluders = roomOccluders(this, this.room);
        this.collectibleProps = roomKeepsakes(this, this.room, progress);
        this.map.blocks.forEach((rect) => this.block(...rect));
        (OBJECTS[this.room] || []).forEach((object) => this.spot(object));
        this.doors = this.map.exits.map((exit) => {
            const [mx, my] = exit.marker;
            const symbol = { up: '↑', down: '↓', left: '←', right: '→' }[exit.arrow];
            const marker = exit.labelPosition
                ? stairDirection(this, mx, my, exit.arrow)
                : text(this, mx, my, symbol, 26, '#ffdf80').setOrigin(0.5).setDepth(890);
            // Đặt nhãn cửa dưới (down) nằm dưới mũi tên ngay tại bậu cửa để không đè lên nhân vật;
            // đặt nhãn cửa trên (up) nằm phía trên mũi tên để không che sàn hoặc bậc cầu thang.
            const labelOffset = exit.arrow === 'down' ? -28 : exit.arrow === 'up' ? -30 : 28;
            const [lx, ly] = exit.labelPosition || [mx, my + labelOffset];
            const label = wayfindingLabel(this, lx, ly, exit.label || doorTitles[exit.to]);
            this.tweens.add({
                targets: marker,
                y: my - 6,
                duration: 650,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
            });
            return { ...exit, marker, label };
        });
        this.doorReadyAt = this.time.now + 650;
        if (this.room === 'hallway') {
            // Đặt nhãn tiến độ cửa đoàn viên thẳng hàng ngang với nhãn của 2 cửa phòng ngủ bên cạnh
            const [x, y] = roomPoint('hallway', 197, 226);
            wayfindingLabel(this, x, y, `Đoàn viên · ${countRewards(progress)}/3`);
        }
        if (this.room === 'living' && progress.treeLit) {
            const treeTopDepth = Math.round(roomPoint('livingroom', 730, 322)[1]) + 2;
            const glow = warmLight(this, ...roomPoint('livingroom', 730, 207)).setDepth(
                treeTopDepth,
            );
            this.tweens.add({ targets: glow, alpha: 0.26, duration: 1700, yoyo: true, repeat: -1 });
            for (const [index, [bx, by]] of [
                [725, 205],
                [709, 235],
                [743, 249],
                [696, 276],
                [730, 290],
                [763, 281],
            ].entries()) {
                const [x, y] = roomPoint('livingroom', bx, by);
                const bulb = this.add
                    .rectangle(x, y, 5, 5, [0xffe3a1, 0xef947c, 0xc1dca2][index % 3])
                    .setDepth(treeTopDepth + 1);
                this.tweens.add({
                    targets: bulb,
                    alpha: 0.4,
                    duration: 850 + index * 120,
                    yoyo: true,
                    repeat: -1,
                });
            }
        }
    }
    update() {
        if (!this.controls) return;
        const input = this.controls.read();
        this.player.setDepth(this.player.y);
        this.footShadow.setPosition(this.player.x, this.player.y + 27).setDepth(this.player.y - 1);
        if (this.handleModal(input)) {
            this.player.setVelocity(0);
            this.player.play(`idle-${this.direction}`, true);
            this.prompt.setVisible(false);
            return;
        }
        if (input.back) {
            const target = RETURN_ROOM[this.room];
            target ? this.travel(target) : this.go('ChristmasTitle');
            return;
        }
        const feet = this.player.body.center;
        if (this.time.now > this.doorReadyAt) {
            const toward = {
                up: input.y < 0,
                down: input.y > 0,
                left: input.x < 0,
                right: input.x > 0,
            };
            const moving = Boolean(input.x || input.y);
            const exit = this.doors.find(
                (d) =>
                    Math.abs(feet.x - d.x) < d.w / 2 &&
                    Math.abs(feet.y - d.y) < d.h / 2 &&
                    (toward[d.arrow] ||
                        input.action ||
                        (moving &&
                            Math.abs(feet.x - d.x) < d.w * 0.38 &&
                            Math.abs(feet.y - d.y) < d.h * 0.38)),
            );
            if (exit) {
                this.travel(exit.to);
                return;
            }
        }
        let nearby = null,
            distance = Infinity;
        for (const spot of this.spots) {
            const d = Phaser.Math.Distance.Between(feet.x, feet.y, spot.x, spot.y);
            if (d < spot.radius && d < distance) {
                nearby = spot;
                distance = d;
            }
            const signColor = d < spot.radius ? '#9bed96' : '#ffdd58';
            if (spot.sign.style.color !== signColor) spot.sign.setColor(signColor);
        }
        this.nearby = nearby;
        this.prompt.setVisible(Boolean(nearby));
        // Tự động ẩn mũi tên và nhãn cửa dưới giữa màn hình khi thanh gợi ý tương tác (E · ...) đang bật
        for (const door of this.doors) {
            const overlapsPrompt =
                Boolean(nearby) && door.arrow === 'down' && Math.abs(door.marker.x - W / 2) < 140;
            door.marker.setVisible(!overlapsPrompt);
            door.label.setVisible(!overlapsPrompt);
        }
        if (nearby) {
            const object = nearby.object;
            const label = object.ending
                ? canEnterEnding(progress)
                    ? 'Mở cửa đoàn viên'
                    : canLightTree(progress)
                      ? 'Về cây thông phòng khách để thắp sáng'
                      : `Cửa đoàn viên · Cần đủ 3 điều ước (${countRewards(progress)}/3)`
                : object.collect
                  ? `${progress[object.collect] ? 'Đã lấy' : 'Lấy'} ${PREPARATIONS[object.collect].name.toLowerCase()}`
                  : object.dialogue === 'treeNote' && canLightTree(progress) && !progress.treeLit
                    ? 'Thắp sáng cây thông'
                    : interactionTitles[object.kind || object.dialogue];
            this.prompt.setText(`E  ·  ${label}`);
        }
        if (input.action && nearby) {
            this.interact(nearby.object);
            return;
        }
        const movementLength = Math.hypot(input.x, input.y);
        const speed = movementLength ? 174 / movementLength : 0;
        this.player.setVelocity(input.x * speed, input.y * speed);
        if (input.x || input.y) {
            this.direction =
                Math.abs(input.x) > 0
                    ? input.x > 0
                        ? 'right'
                        : 'left'
                    : input.y > 0
                      ? 'down'
                      : 'up';
            this.player.play(`walk-${this.direction}`, true);
        } else this.player.play(`idle-${this.direction}`, true);
    }
}

class ChristmasTrial extends StoryScene {
    constructor() {
        super('ChristmasTrial');
    }
    init(data) {
        this.kind = data.kind;
        this.returnRoom = data.returnRoom || 'living';
        this.round = Math.min(2, progress.stages[this.kind] || 0);
    }
    create() {
        this.setup(
            {
                baking: 'Thử thách · Hơi ấm sẻ chia',
                memory: 'Thử thách · Món quà ký ức',
                crossing: 'Thử thách · Ánh sao dẫn đường',
                lights: 'Nghi thức · Thắp sáng cây thông',
            }[this.kind],
            { hideWishHud: true },
        );
        background(this, roomImages[this.returnRoom], this.kind === 'crossing');
        this.add.rectangle(W / 2, H / 2, W, H, 0x102d27, 0.86).setDepth(30);
        const uiStart = this.children.list.length;
        this.trialPanel = this.add
            .rectangle(W / 2, 270, 856, 460, 0x183b31, 0.98)
            .setStrokeStyle(1, 0x9e9d6c)
            .setDepth(40);
        this.board = this.add.container(0, 0).setDepth(50);
        this.cells = [];
        this.selected = 0;
        this.busy = false;
        this.won = false;
        this.failed = false;
        this.stageCleared = false;
        this.overlay = null;
        const names = {
            baking: ['01 / HƠI ẤM SẺ CHIA', 'Mẻ bánh của bà'],
            memory: ['02 / MÓN QUÀ KÝ ỨC', 'Những hộp quà bí mật'],
            crossing: ['03 / ÁNH SAO DẪN ĐƯỜNG', 'Lối đi trong tuyết'],
            lights: ['04 / ĐÊM ĐOÀN VIÊN', 'Thắp sáng cây thông'],
        };
        this.trialEyebrow = text(this, 88, 64, names[this.kind][0], 10, '#d6ba79').setDepth(60);
        this.trialTitle = text(this, 88, 94, names[this.kind][1], 27)
            .setDepth(60)
            .setFontStyle('bold');
        this.trialBack = button(this, 796, 78, '↶ TRỞ VỀ', () => this.leave(), 122, 0x294d3c);
        this.status = text(this, 88, 144, '', 13, '#bacbb0').setDepth(60);
        if (TRIALS[this.kind])
            this.stageLabel = text(this, 850, 114, `CHẶNG ${this.round + 1} / 3`, 12, '#efd194')
                .setOrigin(1, 0)
                .setDepth(60);
        this.detail = text(this, W / 2, 458, 'MŨI TÊN  ·  E CHỌN  ·  HOẶC CHẠM', 10, '#a9bc9e')
            .setOrigin(0.5)
            .setDepth(60);
        const already = progress[this.kind];
        if (!already) {
            if (this.kind === 'baking') this.buildBaking();
            if (this.kind === 'memory') this.buildMemory();
            if (this.kind === 'crossing') this.buildCrossing();
            if (this.kind === 'lights') this.buildLights();
        }
        this.trialInterface = centerInterface(this, uiStart);
        this.boardLayout = this.board.list.map((item) => ({
            item,
            y: item.y,
            height: item.height,
            fontSize: item.style?.fontSize,
            scaleX: item.scaleX,
            scaleY: item.scaleY,
        }));
        this.layoutTrial();
        this.scale.on('resize', this.layoutTrial, this);
        this.events.once('shutdown', () => this.scale.off('resize', this.layoutTrial, this));
        if (already) {
            this.won = true;
            this.rewardOverlay(true);
        }
    }
    layoutTrial() {
        const compact = this.game.canvas.getBoundingClientRect().width < 600;
        this.trialInterface.y = compact ? 0 : UI_Y;
        this.trialPanel
            .setPosition(W / 2, compact ? H / 2 : 270)
            .setSize(856, compact ? H - 24 : 460);
        this.trialEyebrow.setFontSize(compact ? 18 : 10);
        this.trialEyebrow.y = compact ? 24 : 64;
        this.trialTitle.setFontSize(compact ? 32 : 27);
        this.trialTitle.y = compact ? 62 : 94;
        this.stageLabel
            ?.setPosition(compact ? 88 : 850, compact ? 116 : 114)
            .setOrigin(compact ? 0 : 1, 0)
            .setFontSize(compact ? 20 : 12);
        this.trialBack.setLayout(
            796,
            compact ? 118 : 78,
            compact ? 188 : 122,
            compact ? 64 : 42,
            compact ? 22 : 14,
        );
        this.status.setFontSize(compact ? 26 : 13).setWordWrapWidth(770);
        this.status.y = compact ? 164 : 144;
        this.detail.setFontSize(compact ? 22 : 10).setY(compact ? 648 : 458);
        for (const entry of this.boardLayout) {
            const { item, y, height, fontSize, scaleX, scaleY } = entry;
            const memory = compact && this.kind === 'memory';
            item.y =
                compact && item.type !== 'Container' ? 258 + (y - 195) * (memory ? 1.35 : 1.18) : y;
            if (memory && item === this.memoryProgress) item.y = 586;
            if (fontSize)
                item.setFontSize(
                    compact ? Math.max(24, parseFloat(fontSize)) : parseFloat(fontSize),
                );
            else if (item.type === 'Rectangle')
                item.setSize(item.width, compact ? height * (memory ? 1.35 : 1.18) : height);
            else if (item.type === 'Graphics')
                item.setScale(scaleX * (memory ? 1.5 : 1), scaleY * (memory ? 1.5 : 1));
            if (item.input?.hitArea?.setTo) item.input.hitArea.setTo(0, 0, item.width, item.height);
        }
        this.ovenButton?.setLayout(
            W / 2,
            compact ? 550 : 420,
            compact ? 600 : 320,
            compact ? 96 : 42,
            compact ? 28 : 14,
        );
    }
    leave() {
        this.go('ChristmasWorld', { room: this.returnRoom, from: 'trial' });
    }
    cell(x, y, w, h, callback) {
        const box = this.add
            .rectangle(x, y, w, h, 0x355343)
            .setStrokeStyle(1, 0x698166)
            .setInteractive({ useHandCursor: true });
        box.on('pointerdown', callback);
        this.board.add(box);
        this.cells.push(box);
        return box;
    }
    boardText(x, y, value, size = 16, color = '#fff0cf') {
        const t = text(this, x, y, value, size, color).setOrigin(0.5);
        this.board.add(t);
        return t;
    }
    icon(x, y, kind, scale = 1) {
        const g = this.add.graphics({ x, y }).setScale(scale);
        this.board.add(g);
        if (kind === 0) {
            g.fillStyle(0xd1b878).fillRect(-20, -18, 40, 39);
            g.fillStyle(0xeee2b7).fillRect(-17, -17, 34, 33);
            g.fillStyle(0x9d7860).fillRect(-12, -4, 24, 14);
            g.fillStyle(0xe4ca83).fillRect(-3, -2, 6, 10);
        }
        if (kind === 1) {
            g.fillStyle(0xd8ded0).fillRect(-19, -17, 38, 34);
            g.fillStyle(0xe9eee1).fillRect(-15, -14, 30, 25);
            g.fillStyle(0xc16a57).fillRect(-19, 12, 38, 8);
            g.fillStyle(0xadc5bf).fillRect(-5, -10, 10, 18);
        }
        if (kind === 2) {
            g.fillStyle(0xd3a948).fillRect(-24, -10, 48, 29);
            g.fillStyle(0xf0d27a).fillRect(-24, -18, 48, 27);
            g.fillStyle(0xffe6a7).fillRect(-18, -14, 34, 12);
        }
        if (kind === 3) {
            g.fillStyle(0xb8824c)
                .fillCircle(0, -18, 10)
                .fillRect(-9, -9, 18, 32)
                .fillRect(-20, -3, 40, 9)
                .fillRect(-15, 16, 10, 16)
                .fillRect(5, 16, 10, 16);
            g.fillStyle(0xffe7bb)
                .fillRect(-5, -21, 2, 2)
                .fillRect(4, -21, 2, 2)
                .fillRect(-1, -3, 3, 3)
                .fillRect(-1, 6, 3, 3);
        }
        if (kind === 4) {
            g.fillStyle(0xb95347).fillRect(-22, -16, 44, 36);
            g.fillStyle(0xe5d29b)
                .fillRect(-3, -17, 6, 38)
                .fillRect(-24, -14, 48, 7)
                .fillRect(-12, -25, 10, 9)
                .fillRect(3, -25, 10, 9);
        }
        if (kind === 5) {
            star(g, 0, 0, 28);
            g.fillStyle(0xfff0bb).fillRect(-3, -10, 5, 13);
        }
        if (kind === 6) {
            g.lineStyle(8, 0xeee6c9)
                .beginPath()
                .moveTo(-5, 25)
                .lineTo(-5, -16)
                .lineTo(1, -25)
                .lineTo(13, -25)
                .lineTo(19, -18)
                .lineTo(19, -7)
                .strokePath();
            g.lineStyle(4, 0xbf5a49)
                .beginPath()
                .moveTo(-9, 17)
                .lineTo(-1, 11)
                .moveTo(-9, 1)
                .lineTo(-1, -5)
                .moveTo(-1, -20)
                .lineTo(5, -26)
                .moveTo(12, -25)
                .lineTo(19, -18)
                .strokePath();
        }
        if (kind === 7) {
            g.fillStyle(0x88a97e).fillTriangle(0, -29, -23, 13, 23, 13).fillRect(-5, 12, 10, 12);
            g.fillStyle(0xf3da9c).fillRect(-8, -5, 5, 5).fillRect(6, 7, 5, 5);
            star(g, 0, -30, 7);
        }
        return g;
    }
    buildBaking() {
        if (this.round === 2) return this.buildOven();
        this.recipe = this.round === 0 ? [0, 2, 1, 3] : [0, 1, 0, 1, 2, 3, 2, 3];
        this.step = 0;
        this.ingredients =
            this.round === 0 ? ['BỘT', 'ĐƯỜNG', 'BƠ', 'GỪNG'] : ['TRÁI', 'PHẢI', 'LÊN', 'XUỐNG'];
        this.status.setText(
            this.round === 0
                ? 'Chuẩn bị bột theo công thức của bà.'
                : 'Trộn bột: chọn hướng khuấy theo dãy mũi tên.',
        );
        this.boardText(
            W / 2,
            205,
            this.recipe
                .map((i) => (this.round ? ['←', '→', '↑', '↓'][i] : this.ingredients[i]))
                .join(this.round ? '   ·   ' : ' → '),
            this.round ? 15 : 18,
            '#efd194',
        );
        for (let i = 0; i < 4; i++) {
            const x = 205 + i * 180;
            this.cell(x, 322, 150, 160, () => this.chooseBaking(i));
            if (this.round === 0) this.icon(x, 304, i, 1.2);
            else this.boardText(x, 300, ['←', '→', '↑', '↓'][i], 48);
            this.boardText(x, 370, this.ingredients[i], 13);
        }
        this.bakingProgress = this.boardText(
            W / 2,
            422,
            `Đã thực hiện 0 / ${this.recipe.length} bước`,
            12,
            '#b8caac',
        );
        this.highlight();
    }
    chooseBaking(index) {
        if (this.busy || this.won || this.failed || this.changing) return;
        this.selected = index;
        if (index !== this.recipe[this.step]) {
            this.fail(
                'Mình thử lại chặng này nhé!',
                'Nhìn dãy hướng dẫn phía trên. Những chặng đã xong vẫn được giữ lại.',
            );
            return;
        }
        this.step++;
        this.bakingProgress.setText(`Đã thực hiện ${this.step} / ${this.recipe.length} bước`);
        this.status.setText(
            this.step === this.recipe.length
                ? 'Xong rồi!'
                : `Bước tiếp theo: ${this.ingredients[this.recipe[this.step]]}.`,
        );
        if (this.step === this.recipe.length) this.complete();
        else this.highlight();
    }
    buildOven() {
        this.ovenHits = 0;
        this.status.setText('Canh lò: nhấn E khi kim nằm trong vùng xanh. Lấy đủ 3 mẻ bánh.');
        this.boardText(W / 2, 218, 'VÀNG NHẠT       VỪA CHÍN       QUÁ LỬA', 16, '#efd194');
        this.board.add(this.add.rectangle(W / 2, 300, 550, 42, 0x735645));
        this.board.add(this.add.rectangle(486, 300, 110, 42, 0x6b9666).setStrokeStyle(2, 0xc8dfa5));
        this.ovenNeedle = this.add.rectangle(200, 300, 6, 64, 0xffe7ac);
        this.board.add(this.ovenNeedle);
        this.bakingProgress = this.boardText(W / 2, 366, '0 / 3 mẻ bánh chín vàng', 16);
        this.ovenButton = button(this, W / 2, 420, 'E · LẤY BÁNH RA', () => this.checkOven(), 320);
        this.board.add(this.ovenButton);
    }
    checkOven() {
        if (this.busy || this.won || this.failed || this.changing) return;
        if (this.ovenNeedle.x < 431 || this.ovenNeedle.x > 541) {
            this.fail(
                'Bánh chưa vừa lửa!',
                'Chờ kim đi vào vùng xanh rồi lấy bánh ra. Chỉ cần thử lại chặng canh lò.',
            );
            return;
        }
        this.ovenHits++;
        this.bakingProgress.setText(`${this.ovenHits} / 3 mẻ bánh chín vàng`);
        if (this.ovenHits === 3) this.complete();
        else {
            this.busy = true;
            this.time.delayedCall(550, () => (this.busy = false));
        }
    }
    buildLights() {
        this.lightStep = 0;
        this.status.setText('Theo lời nhắn của mẹ để đặt bốn món đồ dưới cây thông.');
        this.boardText(W / 2, 205, 'BÁNH  →  QUÀ  →  KẸO  →  SAO', 20, '#efd194');
        [3, 4, 6, 5].forEach((icon, i) => {
            const x = 205 + i * 180;
            this.cell(x, 322, 150, 145, () => this.chooseLight(i));
            this.icon(x, 310, icon, 1.1);
            this.boardText(x, 370, ['BÁNH', 'QUÀ', 'KẸO', 'SAO'][i], 13);
        });
        this.lightProgress = this.boardText(W / 2, 422, '0 / 4 ánh đèn', 15);
        this.highlight();
    }
    chooseLight(index) {
        if (this.busy || this.won || this.failed || this.changing) return;
        if (index !== this.lightStep) {
            this.status.setText(
                'Chưa đúng thứ tự. Ánh đèn đã thắp vẫn được giữ; thử món tiếp theo nhé!',
            );
            return;
        }
        this.cells[index].setFillStyle(0x638452);
        this.lightStep++;
        this.lightProgress.setText(`${this.lightStep} / 4 ánh đèn`);
        if (this.lightStep === 4) this.complete();
    }
    buildMemory() {
        this.pairs = [4, 6, 8][this.round];
        this.status.setText(
            `Ghép ${this.pairs} cặp quà. Không giới hạn lượt, chặng trước đã được lưu.`,
        );
        const icons = [4, 5, 6, 7, 0, 1, 2, 3].slice(0, this.pairs);
        this.deck = Phaser.Utils.Array.Shuffle(icons.flatMap((kind) => [kind, kind]));
        this.flipped = [];
        this.matched = new Set();
        this.matches = 0;
        this.turns = 0;
        this.cardFaces = [];
        this.cardBacks = [];
        const rows = this.deck.length / 4;
        const pitch = 220 / rows;
        for (let i = 0; i < this.deck.length; i++) {
            const x = 235 + (i % 4) * 160,
                y = 195 + pitch / 2 + Math.floor(i / 4) * pitch;
            this.cell(x, y, 134, pitch - 8, () => {
                this.selected = i;
                this.flip(i);
            });
            this.cardFaces.push(
                this.icon(
                    x,
                    y,
                    this.deck[i],
                    rows === 4 ? 0.54 : rows === 3 ? 0.72 : 0.9,
                ).setVisible(false),
            );
            this.cardBacks.push(this.boardText(x, y, '✦', rows === 4 ? 25 : 32, '#bdad75'));
        }
        this.memoryProgress = this.boardText(
            W / 2,
            432,
            `0 / ${this.pairs} cặp · 0 lượt`,
            12,
            '#b8caac',
        );
        this.highlight();
    }
    flip(index) {
        if (
            this.busy ||
            this.won ||
            this.changing ||
            this.matched.has(index) ||
            this.flipped.includes(index)
        )
            return;
        this.cardFaces[index].setVisible(true);
        this.cardBacks[index].setVisible(false);
        this.flipped.push(index);
        this.highlight();
        if (this.flipped.length < 2) return;
        this.turns++;
        const [a, b] = this.flipped;
        if (this.deck[a] === this.deck[b]) {
            this.matched.add(a);
            this.matched.add(b);
            this.flipped = [];
            this.matches++;
            this.status.setText(
                `Tìm thấy rồi! Bạn đã ghép được ${this.matches} / ${this.pairs} cặp quà.`,
            );
            this.cells[a].setFillStyle(0x526d43);
            this.cells[b].setFillStyle(0x526d43);
            this.memoryProgress.setText(
                `${this.matches} / ${this.pairs} cặp  ·  ${this.turns} lượt`,
            );
            if (this.matches === this.pairs) this.complete();
        } else {
            this.busy = true;
            this.status.setText('Chưa giống nhau. Hãy nhớ vị trí rồi thử cặp khác!');
            this.time.delayedCall(950, () => {
                [a, b].forEach((i) => {
                    this.cardFaces[i].setVisible(false);
                    this.cardBacks[i].setVisible(true);
                });
                this.flipped = [];
                this.busy = false;
                this.memoryProgress.setText(
                    `${this.matches} / ${this.pairs} cặp  ·  ${this.turns} lượt`,
                );
                this.highlight();
            });
        }
    }
    buildCrossing() {
        this.pathColumns = 6 + this.round;
        this.pathRows = this.round === 2 ? 4 : 3;
        this.path = [1];
        for (let c = 1; c < this.pathColumns; c++)
            this.path.push(
                Phaser.Math.Clamp(
                    this.path[c - 1] + Phaser.Math.Between(-1, 1),
                    0,
                    this.pathRows - 1,
                ),
            );
        this.column = 0;
        this.selected = 1;
        this.preview = true;
        this.busy = true;
        this.status.setText(
            `Ghi nhớ ${this.pathColumns} cột ván vàng. Lối đi ẩn sau ${5 + this.round} giây…`,
        );
        this.boardText(95, 302, 'ĐI\n→', 13, '#e2d091');
        this.boardText(854, 302, '★\nĐÍCH', 13, '#e2d091');
        for (let row = 0; row < this.pathRows; row++)
            for (let col = 0; col < this.pathColumns; col++) {
                const index = row * this.pathColumns + col,
                    x = 160 + col * (630 / (this.pathColumns - 1)),
                    y = 224 + row * (180 / (this.pathRows - 1));
                this.cell(
                    x,
                    y,
                    this.pathColumns === 8 ? 76 : 88,
                    this.pathRows === 4 ? 48 : 64,
                    () => this.stepOn(col, row),
                );
                const mark = this.boardText(x, y, '', 21, '#ffe5a5');
                mark.setText(row === this.path[col] ? '◆' : '·');
                this.cells[index].mark = mark;
            }
        this.crossingProgress = this.boardText(
            W / 2,
            432,
            `Đứng bên trái → đi lần lượt qua ${this.pathColumns} cột`,
            12,
            '#b8caac',
        );
        this.paintPath();
        this.time.delayedCall(5000 + this.round * 1000, () => {
            this.preview = false;
            this.busy = false;
            this.status.setText('Chọn một tấm ván ở cột sáng. ↑ ↓ chọn hàng · E bước.');
            this.paintPath();
        });
    }
    paintPath() {
        for (let row = 0; row < this.pathRows; row++)
            for (let col = 0; col < this.pathColumns; col++) {
                const cell = this.cells[row * this.pathColumns + col],
                    safe = row === this.path[col],
                    passed = col < this.column && safe;
                cell.setFillStyle(
                    this.preview && safe ? 0x8b7950 : passed ? 0x557449 : 0x345349,
                ).setStrokeStyle(
                    col === this.column && !this.preview ? 2 : 1,
                    col === this.column ? 0xe7c780 : 0x668276,
                );
                cell.mark.setText(
                    this.preview && safe
                        ? '◆'
                        : passed
                          ? '✓'
                          : col === this.column && row === this.selected
                            ? '●'
                            : '·',
                );
                if (!this.preview && col === this.column && row === this.selected)
                    cell.setFillStyle(0x716444);
            }
    }
    stepOn(col, row) {
        if (this.busy || this.won || this.failed || this.changing || col !== this.column) return;
        this.selected = row;
        if (row !== this.path[col]) {
            this.fail(
                'Úi, tuyết mềm quá!',
                'An đã quay về đầu đường an toàn.\nHãy nhìn kỹ các tấm ván vàng rồi thử lại nhé.',
            );
            return;
        }
        this.column++;
        this.crossingProgress.setText(`Đã qua ${this.column} / ${this.pathColumns} cột`);
        if (this.column === this.pathColumns) this.complete();
        else {
            this.selected = this.path[col];
            this.paintPath();
        }
    }
    highlight() {
        this.cells.forEach((cell, i) =>
            cell.setStrokeStyle(
                i === this.selected ? 3 : 1,
                i === this.selected ? 0xf1d792 : 0x698166,
            ),
        );
    }
    fail(title, description) {
        this.failed = true;
        this.controls.clear();
        this.overlay = trialOverlay(this, {
            title,
            body: description,
            action: 'E · THỬ LẠI',
            onAction: () => this.retry(),
        });
    }
    retry() {
        if (this.changing) return;
        this.controls.clear();
        this.scene.restart({ kind: this.kind, returnRoom: this.returnRoom });
    }
    complete() {
        if (this.won) return;
        this.won = true;
        this.busy = true;
        this.controls.clear();
        if (this.kind === 'lights') progress.treeLit = true;
        else this.stageCleared = !completeStage(progress, this.kind);
        hasSave = true;
        const saved = saveState(progress);
        updateJournal(progress);
        document.querySelector('#save-label').textContent = saved
            ? this.stageCleared
                ? 'ĐÃ LƯU CHẶNG'
                : 'ĐÃ LƯU ĐIỀU ƯỚC'
            : 'PHIÊN NÀY CHƯA LƯU ĐƯỢC';
        burst(this, W / 2, 240);
        this.time.delayedCall(550, () =>
            this.stageCleared ? this.stageOverlay() : this.rewardOverlay(),
        );
    }
    stageOverlay() {
        this.overlay = trialOverlay(this, {
            title: `ĐÃ XONG CHẶNG ${this.round + 1} / 3`,
            body: STAGE_STORIES[this.kind][this.round],
            count: `Tiếp theo: ${TRIALS[this.kind].stages[this.round + 1]} · Đã lưu`,
            action: 'E · SANG CHẶNG TIẾP THEO',
            onAction: () => this.retry(),
        });
        this.cooldown = this.time.now + 300;
    }
    rewardOverlay(already = false) {
        const names = {
            baking: 'Hơi ấm sẻ chia',
            memory: 'Món quà ký ức',
            crossing: 'Ánh sao dẫn đường',
            lights: 'Cây thông đã sáng!',
        };
        this.overlay = trialOverlay(this, {
            title: names[this.kind],
            body: already
                ? 'Điều ước này đã ở trong túi của bạn.'
                : this.kind === 'lights'
                  ? 'Cửa đoàn viên bên trái hành lang tầng trên đã mở.'
                  : STAGE_STORIES[this.kind][2],
            count: `${countRewards(progress)} / 3 ĐIỀU ƯỚC ĐÃ THU THẬP`,
            action: this.kind === 'lights' ? 'E · VỀ PHÒNG KHÁCH' : 'E · MANG ĐIỀU ƯỚC VỀ',
            onAction: () => this.leave(),
        });
        this.cooldown = this.time.now + 300;
    }
    update() {
        if (!this.controls) return;
        const i = this.controls.read();
        if (this.handleModal(i)) return;
        if (i.back) {
            this.leave();
            return;
        }
        if (this.failed) {
            if (i.action) this.retry();
            return;
        }
        if (this.won) {
            if (this.overlay && i.action) this.stageCleared ? this.retry() : this.leave();
            return;
        }
        if (this.kind === 'baking' && this.round === 2) {
            this.ovenNeedle.x = 475 + Math.sin(this.time.now / 800) * 275;
            if (!this.busy && i.action) this.checkOven();
            return;
        }
        if (this.busy) return;
        if (this.kind === 'baking') {
            if (i.left) this.selected = (this.selected + 3) % 4;
            if (i.right) this.selected = (this.selected + 1) % 4;
            this.highlight();
            if (i.action) this.chooseBaking(this.selected);
        } else if (this.kind === 'memory') {
            const length = this.deck.length;
            if (i.left) this.selected = (this.selected + length - 1) % length;
            if (i.right) this.selected = (this.selected + 1) % length;
            if (i.up) this.selected = (this.selected + length - 4) % length;
            if (i.down) this.selected = (this.selected + 4) % length;
            this.highlight();
            if (i.action) this.flip(this.selected);
        } else if (this.kind === 'lights') {
            if (i.left) this.selected = (this.selected + 3) % 4;
            if (i.right) this.selected = (this.selected + 1) % 4;
            this.highlight();
            if (i.action) this.chooseLight(this.selected);
        } else {
            if (i.up) this.selected = (this.selected + this.pathRows - 1) % this.pathRows;
            if (i.down) this.selected = (this.selected + 1) % this.pathRows;
            this.paintPath();
            if (i.action) this.stepOn(this.column, this.selected);
        }
    }
}

class ChristmasEnding extends StoryScene {
    constructor() {
        super('ChristmasEnding');
    }
    create() {
        this.setup('Căn phòng Giáng sinh');
        this.finished = false;
        if (!canEnterEnding(progress)) {
            this.go('ChristmasWorld', { room: 'hallway', from: 'ending' });
            return;
        }
        background(this, 'roomsecret_winter');
        this.add.rectangle(W / 2, H / 2, W, H, 0x0b271f, 0.24).setDepth(400);
        this.time.delayedCall(350, () => this.talk('finalRoom', () => this.celebrate()));
    }
    celebrate() {
        progress.ended = true;
        saveState(progress);
        updateJournal(progress);
        this.finished = true;
        this.add
            .rectangle(W / 2, H - 104, 846, 180, 0x12362d, 0.96)
            .setStrokeStyle(2, 0xd5bc7d)
            .setDepth(500);
        text(this, W / 2, H - 181, '✦  BA ĐIỀU ƯỚC · MỘT GIÁNG SINH  ✦', 11, '#d9bd7b')
            .setOrigin(0.5)
            .setDepth(501);
        text(this, W / 2, H - 151, 'Giáng sinh an lành!', 30, '#ffe0a1')
            .setOrigin(0.5)
            .setDepth(501)
            .setFontFamily(DISPLAY_FONT);
        text(
            this,
            W / 2,
            H - 104,
            'Cây thông đã sáng. Những món quà đã sẵn sàng.\nVà điều ước đẹp nhất… là được ở bên nhau.',
            15,
        )
            .setOrigin(0.5)
            .setAlign('center')
            .setDepth(501);
        button(
            this,
            W / 2,
            H - 45,
            'E · DẠO CHƠI THÊM',
            () => this.go('ChristmasWorld', { room: 'hallway', from: 'ending' }),
            330,
        ).setDepth(502);
        this.time.addEvent({
            delay: 650,
            loop: true,
            callback: () =>
                burst(this, Phaser.Math.Between(120, 850), Phaser.Math.Between(70, 300)),
        });
    }
    update() {
        const i = this.controls.read();
        if (this.handleModal(i)) return;
        if ((this.finished && i.action) || i.back)
            this.go('ChristmasWorld', { room: 'hallway', from: 'ending' });
    }
}

const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: W,
    height: H,
    backgroundColor: '#142e27',
    pixelArt: true,
    antialias: false,
    roundPixels: true,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, autoRound: true },
    physics: { default: 'arcade', arcade: { gravity: { y: 0 }, debug: false } },
    scene: [ChristmasBoot, ChristmasTitle, ChristmasWorld, ChristmasTrial, ChristmasEnding],
    input: { activePointers: 3 },
});
// Read-only game reference also makes canvas behavior inspectable during local QA.
window.christmasGame = game;
// CSS fitting and font loading can resize the parent after Phaser handles the
// window event. Refresh from the parent bounds so the canvas cannot stay cropped.
const stageResizeObserver = new ResizeObserver(() => {
    game.scale.getParentBounds();
    game.scale.refresh();
});
stageResizeObserver.observe(document.querySelector('#game'));
game.events.once(Phaser.Core.Events.DESTROY, () => stageResizeObserver.disconnect());
document.querySelector('#journal-toggle').addEventListener('click', () => {
    const journal = document.querySelector('.journal'),
        toggle = document.querySelector('#journal-toggle');
    journal.hidden = !journal.hidden;
    toggle.setAttribute('aria-expanded', String(!journal.hidden));
});
document.querySelector('#home').addEventListener('click', () => {
    const active = game.scene.getScenes(true)[0];
    if (active?.sys.settings.key === 'ChristmasBoot') return;
    active?.controls?.clear();
    active?.scene.start('ChristmasTitle');
});
document.querySelectorAll('#fullscreen, #exit-fullscreen').forEach((toggle) =>
    toggle.addEventListener('click', async () => {
        try {
            if (document.fullscreenElement) await document.exitFullscreen();
            else await document.querySelector('.console').requestFullscreen();
        } catch {
            document.querySelector('#save-label').textContent = 'TOÀN MÀN HÌNH CHƯA KHẢ DỤNG';
        }
    }),
);
let audioContext,
    musicTimer,
    muted = true,
    noteIndex = 0;
// A quiet, locally synthesized holiday melody. No audio download is required.
const melody = [
    76, 76, 76, 0, 76, 76, 76, 0, 76, 79, 72, 74, 76, 0, 0, 0, 77, 77, 77, 77, 77, 76, 76, 76, 76,
    74, 74, 76, 74, 0, 79, 0,
];
function playNote() {
    if (!audioContext || muted || document.hidden) return;
    const midi = melody[noteIndex++ % melody.length];
    if (!midi) return;
    const oscillator = audioContext.createOscillator(),
        gain = audioContext.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = 440 * 2 ** ((midi - 69) / 12);
    gain.gain.setValueAtTime(0, audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(0.055, audioContext.currentTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.48);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.5);
}
document.querySelector('#sound').addEventListener('click', async () => {
    const sound = document.querySelector('#sound');
    try {
        audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
        await audioContext.resume();
        muted = !muted;
        clearInterval(musicTimer);
        if (!muted) {
            playNote();
            musicTimer = setInterval(playNote, 310);
        }
        sound.setAttribute('aria-pressed', String(!muted));
        sound.setAttribute('aria-label', muted ? 'Bật nhạc' : 'Tắt nhạc');
        sound.querySelector('span').textContent = muted ? 'Nhạc: tắt' : 'Nhạc: bật';
    } catch {
        sound.querySelector('span').textContent = 'Nhạc chưa khả dụng';
    }
});
