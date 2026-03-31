import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/// <reference types="vitest/config" />

export default defineConfig({
  plugins: [react()],
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    globals: true,
  },
  server: {
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-d3': ['d3-hierarchy', 'd3-selection', 'd3-zoom'],
        },
      },
    },
  },
});
