import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const backendTarget = 'http://localhost:8000';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: 'localhost',
    port: 3000,
    proxy: {
      '/crud': { target: backendTarget, changeOrigin: true },
      '/auth': { target: backendTarget, changeOrigin: true },
      '/institutes': { target: backendTarget, changeOrigin: true },
      '/roles': { target: backendTarget, changeOrigin: true },
      '/employees': { target: backendTarget, changeOrigin: true },
      '/uploads': { target: backendTarget, changeOrigin: true },
      '/document-sequence': { target: backendTarget, changeOrigin: true },
      '/generated-documents': { target: backendTarget, changeOrigin: true },
      '/admission-inquiries': { target: backendTarget, changeOrigin: true },
      '/student-details': { target: backendTarget, changeOrigin: true },
      '/student_admission_details': { target: backendTarget, changeOrigin: true },
      '/promote_student': { target: backendTarget, changeOrigin: true },
      '/upload-institute-logo': { target: backendTarget, changeOrigin: true },
    },
  },
});
