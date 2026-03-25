import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [
    svelte(),
    {
      name: 'fix-asset-paths',
      closeBundle() {
        // Fix absolute paths in HTML files to relative paths
        const htmlFiles = ['index.html', 'dialog.html'];
        
        htmlFiles.forEach(fileName => {
          try {
            const filePath = resolve(__dirname, 'dist', fileName);
            let content = readFileSync(filePath, 'utf-8');
            // Replace /assets/ with ./assets/
            content = content.replace(/src="\/assets\//g, 'src="./assets/');
            content = content.replace(/href="\/assets\//g, 'href="./assets/');
            writeFileSync(filePath, content, 'utf-8');
            console.log(`✅ Fixed asset paths in ${fileName}`);
          } catch (err) {
            console.warn(`⚠️ Could not fix asset paths in ${fileName}:`, err.message);
          }
        });
      }
    }
  ],
  server: {
    port: 5173
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        dialog: resolve(__dirname, 'dialog.html')
      },
      output: {
        // Ensure assets use relative paths
        assetFileNames: 'assets/[name].[ext]',
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js'
      }
    },
    // Use relative paths for assets so they work when loaded from file:// protocol
    base: './',
    // Ensure absolute paths are converted to relative
    assetsInlineLimit: 0
  }
});

