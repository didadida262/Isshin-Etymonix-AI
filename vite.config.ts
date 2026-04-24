import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// @ts-ignore
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
