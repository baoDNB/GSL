import { PREPARATIONS, TRIALS, canLightTree, questDescription } from './campaign.js';

const SAVE_KEY = 'gsl_christmas_v1';
export const FLAGS = ['baking', 'memory', 'crossing'];
export const freshState = () => ({
    started: true,
    baking: false,
    memory: false,
    crossing: false,
    ended: false,
    treeLit: false,
    ...Object.fromEntries(Object.keys(PREPARATIONS).map((flag) => [flag, false])),
    stages: { baking: 0, memory: 0, crossing: 0 },
    location: 'living',
});
export function hydrateState(saved) {
    if (!saved || saved.started !== true) return null;
    const state = freshState();
    for (const key of Object.keys(state)) {
        if (typeof state[key] === 'boolean') state[key] = saved[key] === true;
    }
    for (const kind of FLAGS) {
        const stage = saved.stages?.[kind];
        state.stages[kind] = state[kind]
            ? 3
            : Number.isInteger(stage)
              ? Math.max(0, Math.min(2, stage))
              : 0;
    }
    // Existing completed saves retain their ending after the campaign extension.
    if (state.ended) state.treeLit = true;
    if (
        ['house', 'garden', 'kitchen', 'living', 'hallway', 'gifts', 'bedroom'].includes(
            saved.location,
        )
    )
        state.location = saved.location;
    return state;
}
export function completeStage(state, kind) {
    if (!FLAGS.includes(kind) || !state || state[kind] === true) return false;
    if (!state.stages || typeof state.stages !== 'object') state.stages = {};
    const stage = state.stages[kind];
    const previous = Number.isInteger(stage) ? Math.max(0, Math.min(2, stage)) : 0;
    state.stages[kind] = previous + 1;
    state[kind] = state.stages[kind] === 3;
    return state[kind];
}
export function loadState() {
    try {
        const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
        return hydrateState(saved);
    } catch {
        return null;
    }
}
export const countRewards = (state) => FLAGS.filter((flag) => state[flag] === true).length;
export function saveState(state) {
    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(state));
        return true;
    } catch {
        return null;
    }
}
export function updateJournal(state) {
    const count = countRewards(state);
    const prepKeys = Object.keys(PREPARATIONS);
    const prepCount = prepKeys.filter((key) => state[key]).length;
    document.querySelector('#progress-count').textContent = `${count} / 3`;
    document.querySelector('#wish-count').textContent = `${count} / 3 · Đồ: ${prepCount} / 6`;
    document.querySelector('#progress-fill').style.width = `${(count / 3) * 100}%`;
    FLAGS.forEach((flag) => {
        const item = document.querySelector(`[data-quest="${flag}"]`);
        if (!item) return;
        item.classList.toggle('done', state[flag]);
        item.querySelector('.quest-check').textContent = state[flag] ? '✓' : '○';
        item.querySelector('p').textContent = questDescription(state, flag);
        const body = item.querySelector('div');
        let prepRow = body.querySelector('.prep-items');
        if (!prepRow) {
            prepRow = document.createElement('div');
            prepRow.className = 'prep-items';
            body.insertBefore(prepRow, body.querySelector('small'));
        }
        const needs = TRIALS[flag]?.needs || [];
        prepRow.replaceChildren(
            ...needs.map((key) => {
                const badge = document.createElement('span');
                badge.className = state[key] ? 'prep-badge collected' : 'prep-badge';
                badge.dataset.prep = key;
                badge.textContent = `${state[key] ? '✓' : '○'} ${PREPARATIONS[key].name}`;
                return badge;
            }),
        );
    });
    document.querySelector('#objective').textContent = state.ended
        ? '“Phép màu đẹp nhất là được ở bên những người mình yêu thương.”'
        : state.treeLit
          ? 'Cây thông đã sáng! Mở cửa đoàn viên bên trái hành lang tầng trên.'
          : canLightTree(state)
            ? 'Mang ba điều ước về cây thông trong phòng khách để thắp sáng.'
            : `Tìm đồ chuẩn bị và hoàn thành ba chặng ở mỗi thử thách. Đã tìm ${prepCount}/6 món đồ.`;
}
