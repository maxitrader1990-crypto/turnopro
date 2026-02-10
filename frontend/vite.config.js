import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            devOptions: {
                enabled: true
            },
            includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'logo-192.png', 'logo-512.png'],
            manifest: {
                name: 'Maestros del Estilo',
                short_name: 'Maestros',
                description: 'Sistema de Gestión de Turnos para Barberías',
                theme_color: '#000000',
                background_color: '#000000',
                display: 'standalone',
                orientation: 'portrait',
                start_url: '/',
                scope: '/',
                icons: [
                    {
                        src: 'logo-192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: 'logo-512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    },
                    {
                        src: 'logo-512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable'
                    }
                ]
            }
        })
    ]
})
