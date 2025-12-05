import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, mkdirSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

// Helper function to recursively copy directory
function copyDir(src, dest) {
    mkdirSync(dest, { recursive: true })
    const entries = readdirSync(src, { withFileTypes: true })

    for (const entry of entries) {
        const srcPath = join(src, entry.name)
        const destPath = join(dest, entry.name)

        if (entry.isDirectory()) {
            copyDir(srcPath, destPath)
        } else if (entry.isFile() && entry.name.endsWith('.json')) {
            copyFileSync(srcPath, destPath)
        }
    }
}

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

                // Copy all subdirectories (breakdowns, attack_paths, initial_access)
                copyDir(dataDir, distDataDir)
            }
        }
    ],
    base: '/',
    publicDir: 'public',
})

