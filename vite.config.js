// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/sujandailyplannerweb/',   // 👈 must match GitHub repo name
});
