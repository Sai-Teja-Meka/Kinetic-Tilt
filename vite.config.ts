import { defineConfig } from 'vitest/config'; // CHANGE THIS IMPORT
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  plugins: [
    basicSsl()
  ],
  server: {
    host: true,
    https: true
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
});