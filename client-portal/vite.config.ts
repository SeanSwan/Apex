import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Enable Fast Refresh for better development experience
      fastRefresh: true,
      // Include .tsx files in Fast Refresh
      include: '**/*.{jsx,tsx}',
      // Babel configuration for better performance
      babel: {
        plugins: [
          // Remove PropTypes in production for smaller bundles
          ...(process.env.NODE_ENV === 'production' ? [['babel-plugin-react-remove-properties', { properties: ['data-testid'] }]] : [])
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/styles': path.resolve(__dirname, './src/styles')
    }
  },
  server: {
    port: 5173, // Use standard Vite port for consistency
    host: true, // Allow external connections
    cors: true,
    proxy: {
      // Proxy API calls to backend server
      '/api': {
        target: 'http://localhost:5001', // Updated to match current backend port
        changeOrigin: true,
        secure: false,
        timeout: 30000,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log(`[CLIENT-PORTAL] Proxying ${req.method} ${req.url} to backend`);
          });
          proxy.on('error', (err, req) => {
            console.error(`[CLIENT-PORTAL] Proxy error for ${req.url}:`, err.message);
          });
        }
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: process.env.NODE_ENV === 'development',
    minify: 'esbuild',
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for core React dependencies
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // UI chunk for component libraries and icons
          ui: ['@heroicons/react', 'react-hot-toast', 'lucide-react'],
          // API chunk for data fetching
          api: ['axios'],
          // Auth chunk for authentication logic
          auth: [],
          // Dashboard chunk for dashboard components
          dashboard: [],
          // Incidents chunk for incident management
          incidents: [],
          // Evidence chunk for evidence management
          evidence: []
        },
        // Optimize chunk naming for caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop().replace('.tsx', '').replace('.ts', '') : 'chunk';
          return `assets/[name]-[hash].js`;
        },
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          let extType = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            extType = 'images';
          } else if (/woff|woff2|eot|ttf|otf/i.test(extType)) {
            extType = 'fonts';
          }
          return `assets/${extType}/[name]-[hash][extname]`;
        }
      },
      // External dependencies (if needed for micro-frontend architecture)
      external: [],
      // Tree shaking configuration
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        unknownGlobalSideEffects: false
      }
    },
    // Build optimization
    chunkSizeWarningLimit: 1000,
    assetsInlineLimit: 4096,
    // CSS code splitting
    cssCodeSplit: true,
    // Enable/disable CSS minification
    cssMinify: true,
    // Report compressed file sizes
    reportCompressedSize: true,
    // Write bundle to disk even if there are errors
    emptyOutDir: true
  },
  define: {
    __CLIENT_PORTAL__: true,
    __DEV__: process.env.NODE_ENV === 'development',
    __PROD__: process.env.NODE_ENV === 'production',
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0')
  },
  css: {
    devSourcemap: true,
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";`
      }
    }
  },
  // Environment variables configuration
  envPrefix: 'VITE_',
  
  // Development optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      '@heroicons/react/24/outline',
      '@heroicons/react/24/solid',
      'react-hot-toast',
      'lucide-react'
    ],
    exclude: ['fsevents'],
    // Force optimization of problematic dependencies
    force: process.env.NODE_ENV === 'development'
  },
  
  // Security headers for development
  preview: {
    port: 3002,
    host: true,
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy': "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
    }
  },
  
  // Worker support for better performance
  worker: {
    format: 'es'
  },
  
  // JSON imports
  json: {
    namedExports: true,
    stringify: false
  },
  
  // Logging configuration
  logLevel: process.env.NODE_ENV === 'production' ? 'error' : 'info'
});
