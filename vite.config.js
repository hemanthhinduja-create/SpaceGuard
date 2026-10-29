import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Keep the catalogue as a real, same-origin JSON request, even in production.
  build: { assetsInlineLimit: 0 },
  // Dev: forward /api to the Express server so the browser sees one origin (cookies just work).
  server: { proxy: { '/api': 'http://localhost:4000' } },
});
