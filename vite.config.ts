
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // Load env file based on `mode` in the current working directory.
    const env = loadEnv(mode, (process as any).cwd(), '');
    
    const deepseekKey = env.DEEPSEEK_API_KEY || 'sk-3c0c5f5063fa47d6a07f73692db9482e';

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: 'http://localhost:3001',
            changeOrigin: true,
            secure: false,
          }
        }
      },
      plugins: [react()],
      define: {
        'process.env.DEEPSEEK_API_KEY': JSON.stringify(deepseekKey),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || '')
      },
      resolve: {
        alias: {
          '@': path.resolve((process as any).cwd()), 
        }
      }
    };
});
