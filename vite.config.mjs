import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
    base: './',
    build: {
        rollupOptions: {
            input: {
                main: resolve(import.meta.dirname, 'index.html'),
                game: resolve(import.meta.dirname, 'game.html'),
                christmas: resolve(import.meta.dirname, 'christmas.html'),
            },
        },
    },
});
