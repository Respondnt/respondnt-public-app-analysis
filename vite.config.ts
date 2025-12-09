import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, mkdirSync, readdirSync, existsSync, Dirent } from 'fs'
import { join } from 'path'

// Helper function to recursively copy directory
function copyDir(src: string, dest: string): void {
    mkdirSync(dest, { recursive: true })
    const entries: Dirent[] = readdirSync(src, { withFileTypes: true })

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
            closeBundle(): void {
                // Copy data files to dist after build
                const dataDir = join(process.cwd(), 'data')
                const distDataDir = join(process.cwd(), 'dist', 'data')

                // Copy all subdirectories (breakdowns, attack_paths, initial_access)
                copyDir(dataDir, distDataDir)
                
                // Copy index.html to 404.html for GitHub Pages SPA routing
                // This ensures that direct navigation to routes like /app/box works
                const indexPath = join(process.cwd(), 'dist', 'index.html')
                const notFoundPath = join(process.cwd(), 'dist', '404.html')
                if (existsSync(indexPath)) {
                    copyFileSync(indexPath, notFoundPath)
                }
            }
        } as Plugin
    ],
    base: '/',
    publicDir: 'public',
})

