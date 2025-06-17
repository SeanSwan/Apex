// frontend/vite.config.ts - Simple Development Configuration
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // ESLint plugin disabled during development for cleaner experience
    // Uncomment if you want ESLint in Vite:
    // eslint({
    //   include: ['src/**/*.ts', 'src/**/*.tsx', 'src/**/*.js', 'src/**/*.jsx'],
    //   exclude: ['node_modules', 'dist'],
    //   failOnWarning: false,
    //   failOnError: false,
    // }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress certain warnings during build
        if (warning.code === 'UNUSED_EXTERNAL_IMPORT') return;
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
        warn(warning);
      }
    }
  }
});
