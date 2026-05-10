import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  const root = __dirname;
  return {
    root,
    publicDir: path.join(root, '../public'),
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
        manifest: {
          name: 'Jungle Chama',
          short_name: 'JungleApp',
          description: 'Hardware Shop & Chama Management Platform',
          theme_color: '#00D100',
          background_color: '#ffffff',
          display: 'standalone',
          icons: [
            {
              src: 'vite.svg',
              sizes: 'any',
              type: 'image/svg+xml'
            }
          ]
        }
      })
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(root, '.'),
      },
    },
    server: {
      root,
      host: '0.0.0.0',
      port: 3000,
      strictPort: true,
      allowedHosts: ['.ngrok-free.app', '.ngrok-free.dev', 'localhost'],
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: {
        ignored: ['**/.wwebjs_auth/**', '**/.wwebjs_cache/**'],
      },
    },
    build: {
      outDir: path.join(root, '../dist'),
    },
  };
});
