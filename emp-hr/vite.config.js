import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',  // to listen on all interfaces
    allowedHosts: ['empeople.esromagica.in', 'localhost'], // allow your domain and localhost
    port: 5173, // your port
  },
});