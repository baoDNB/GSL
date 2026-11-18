import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const code = await readFile(new URL('../../src/christmas/maps.js', import.meta.url), 'utf8');
const { ROOMS, OBJECTS } = await import(
    `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`
);
// Arcade feet occupy a 24 × 24 box. Search actual free space rather than
// merely checking that the declared destination exists.
const free = (room, x, y) => {
    const [bx, by, bw, bh] = room.bounds;
    return (
        x >= bx + 12 &&
        x <= bx + bw - 12 &&
        y >= by + 12 &&
        y <= by + bh - 12 &&
        !room.blocks.some(
            ([cx, cy, w, h]) => Math.abs(x - cx) < w / 2 + 12 && Math.abs(y - cy) < h / 2 + 12,
        )
    );
};
let checked = 0;
for (const [name, room] of Object.entries(ROOMS)) {
    for (const [entry, start] of Object.entries(room.spawns)) {
        assert(free(room, ...start), `${name} spawn from ${entry} intersects furniture/wall`);
        assert(
            !room.exits.some(
                (d) => Math.abs(start[0] - d.x) < d.w / 2 && Math.abs(start[1] - d.y) < d.h / 2,
            ),
            `${name} spawn immediately exits`,
        );
        const queue = [start],
            visited = new Set([start.join(',')]);
        for (let i = 0; i < queue.length; i++) {
            const [x, y] = queue[i];
            for (const [dx, dy] of [
                [5, 0],
                [-5, 0],
                [0, 5],
                [0, -5],
            ]) {
                const p = [x + dx, y + dy],
                    key = p.join(',');
                if (!visited.has(key) && free(room, ...p)) {
                    visited.add(key);
                    queue.push(p);
                }
            }
        }
        for (const d of room.exits) {
            assert(ROOMS[d.to], `${name} destination ${d.to} missing`);
            const canonical = (key) => (key === 'house' ? 'garden' : key);
            const reverse = ROOMS[d.to].exits.find(
                (exit) => canonical(exit.to) === canonical(name),
            );
            const opposite = { up: 'down', down: 'up', left: 'right', right: 'left' };
            assert(reverse, `${name} -> ${d.to} has no return door`);
            assert.equal(
                reverse.arrow,
                opposite[d.arrow],
                `${name} -> ${d.to}: mismatched doorway direction`,
            );
            assert.equal(
                ROOMS[d.to].facing?.[name] || ROOMS[d.to].facing?.default,
                d.arrow,
                `${name} -> ${d.to}: player faces the wrong way on arrival`,
            );
            assert(
                ROOMS[d.to].spawns[name] || ROOMS[d.to].spawns.default,
                `${d.to} return spawn missing`,
            );
            assert(
                queue.some(([x, y]) => Math.abs(x - d.x) < d.w / 2 && Math.abs(y - d.y) < d.h / 2),
                `${name} from ${entry}: door to ${d.to} unreachable`,
            );
            checked++;
        }
        for (const obj of OBJECTS[name] || []) {
            assert(
                queue.some(([x, y]) => Math.hypot(x - obj.x, y - obj.y) < (obj.radius || 75)),
                `${name} from ${entry}: object unreachable`,
            );
            checked++;
        }
    }
}
console.log(
    `Verified ${checked} door/object routes with 24px feet across ${Object.keys(ROOMS).length} room variants.`,
);
