import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
base: '/wellfit-app/',
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage', 'firebase/analytics'],
          'gemini': ['@google/generative-ai'],
          'pdf': ['html2canvas', 'jspdf'],
          'router': ['react-router-dom'],
          'icons': ['lucide-react'],
        },
      },
    },
  },
})
