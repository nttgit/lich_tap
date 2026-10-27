import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

export default defineConfig(({ mode }) => ({
  plugins: [preact()],
  define: { __DEMO__: JSON.stringify(mode === 'demo') },
  build: { target: 'es2020' },
}));
