import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, mkdirSync, readdirSync } from 'fs'
import { join } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-data-files',
      closeBundle() {
        // Copy data files to dist after build
        const dataDir = join(process.cwd(), 'data')
        const distDataDir = join(process.cwd(), 'dist', 'data')
        mkdirSync(distDataDir, { recursive: true })
        
        const files = readdirSync(dataDir)
        files.forEach(file => {
          if (file.endsWith('.json')) {
            copyFileSync(join(dataDir, file), join(distDataDir, file))
          }
        })
      }
    }
  ],
  base: '/respondnt-public-app-analysis/',
  publicDir: 'public',
})

