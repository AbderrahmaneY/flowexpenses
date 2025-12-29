import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'node',
        setupFiles: ['./tests/setup.ts'],
        globals: true,
        fileParallelism: false, // Avoid DB locking issues with SQLite in parallel
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
