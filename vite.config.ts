/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

// Nome do repositório no GitHub, usado como base path no GitHub Pages.
const REPO_NAME = 'Assistente-Imperial-2030'
const base = process.env.NODE_ENV === 'production' ? `/${REPO_NAME}/` : '/'

export default defineConfig({
  base,
  resolve: process.env.NODE_ENV === 'test'
    ? {
        alias: {
          'virtual:pwa-register/react': fileURLToPath(
            new URL('./src/test/pwaRegisterMock.ts', import.meta.url),
          ),
        },
      }
    : undefined,
  plugins: [
    react(),
    tailwindcss(),
    ...(process.env.NODE_ENV === 'test' ? [] : [VitePWA({
      registerType: 'prompt',
      manifest: {
        name: 'Imperial 2030 — Assistente',
        short_name: 'Imperial 2030',
        description: 'Livro-caixa para partidas de Imperial 2030.',
        lang: 'pt-BR',
        start_url: base,
        scope: base,
        display: 'standalone',
        orientation: 'landscape',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        icons: [{ src: 'icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png,ico}'] },
    })]),
  ],
  test: { globals: true, environment: 'jsdom', setupFiles: './src/setupTests.ts' },
})
