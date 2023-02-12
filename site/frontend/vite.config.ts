import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import * as path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: [
      { find: '@components', replacement: path.resolve(__dirname, 'src/components') },
      { find: '@hooks', replacement: path.resolve(__dirname, 'src/hooks') },
      { find: '@schemas', replacement: path.resolve(__dirname, 'src/schemas') },
      { find: '@shared', replacement: path.resolve(__dirname, 'src/shared') },
      { find: '@wrappers', replacement: path.resolve(__dirname, 'src/wrappers') },
    ],
  },
  plugins: [react()]
})
