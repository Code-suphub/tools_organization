import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        port: 3000,
        open: true,
        allowedHosts: ["mac.api.camellia.ac.cn"]
    },
    build: {
        outDir: 'dist',
        sourcemap: true
    }
})
