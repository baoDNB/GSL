import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import vm from 'node:vm';

// Vite consumes ES modules in this CommonJS package. Execute the actual source
// without rewriting it or changing the browser application's package type.
export function moduleLoader(globals = {}, mocks = {}) {
    const context = vm.createContext({ URL, console, ...globals });
    const cache = new Map();
    async function make(identifier) {
        if (cache.has(identifier)) return cache.get(identifier);
        const module = new vm.SourceTextModule(await readFile(new URL(identifier), 'utf8'), {
            context,
            identifier,
        });
        cache.set(identifier, module);
        return module;
    }
    async function linker(specifier, parent) {
        if (Object.hasOwn(mocks, specifier)) {
            const exports = mocks[specifier];
            return new vm.SyntheticModule(
                Object.keys(exports),
                function () {
                    for (const [key, value] of Object.entries(exports)) this.setExport(key, value);
                },
                { context, identifier: `mock:${specifier}` },
            );
        }
        return make(new URL(specifier, parent.identifier).href);
    }
    return async (file) => {
        const module = await make(pathToFileURL(resolve(file)).href);
        if (module.status === 'unlinked') await module.link(linker);
        if (module.status === 'linked') await module.evaluate();
        return module.namespace;
    };
}

export const plain = (value) => JSON.parse(JSON.stringify(value));

export class Events {
    constructor() {
        this.listeners = new Map();
    }
    on(name, callback, context) {
        const entries = this.listeners.get(name) || [];
        entries.push({ callback, context });
        this.listeners.set(name, entries);
        return this;
    }
    once(name, callback, context) {
        const once = (...args) => {
            this.off(name, once);
            callback.apply(context, args);
        };
        return this.on(name, once);
    }
    off(name, callback, context) {
        this.listeners.set(
            name,
            (this.listeners.get(name) || []).filter(
                (entry) => entry.callback !== callback || entry.context !== context,
            ),
        );
        return this;
    }
    emit(name, ...args) {
        for (const entry of [...(this.listeners.get(name) || [])]) {
            entry.callback.apply(entry.context, args);
        }
    }
    count(name) {
        return (this.listeners.get(name) || []).length;
    }
    addEventListener(name, callback) {
        this.on(name, callback);
    }
    removeEventListener(name, callback) {
        this.off(name, callback);
    }
}

export function shape() {
    const proxy = new Proxy(
        { visible: true, text: '' },
        {
            get(target, key) {
                if (key in target) return target[key];
                return (...args) => {
                    if (key === 'setVisible') target.visible = args[0];
                    if (key === 'setText') target.text = args[0];
                    return proxy;
                };
            },
        },
    );
    return proxy;
}
