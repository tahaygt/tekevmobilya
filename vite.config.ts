import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    // ✅ Custom domain (www.byevmobilya.com) için ŞART
    base: '/',

    plugins: [react()],

    server: {
      port: 3000,
      host: true, // 0.0.0.0 yerine bu daha temiz
    },

    define: {
      // ⚠️ Not: Frontend'de gizli anahtar OLMAZ
      // Ama mevcut yapını bozmamak için aynen bırakıyorum
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './'),
      },
    },
  };
});
