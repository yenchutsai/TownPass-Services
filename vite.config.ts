import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api/bola-events': {
        target: 'https://bola.gov.taipei',
        changeOrigin: true,
        secure: false,
        rewrite: () => '/OpenData.aspx?SN=B475EA5A93126B2E'
      }
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
});
