import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // Load env file based on `mode` in the current working directory.
    const env = loadEnv(mode, (process as any).cwd(), '');
    
    // Use the key from env, or fallback to the provided key
    const deepseekKey = env.DEEPSEEK_API_KEY || 'sk-3c0c5f5063fa47d6a07f73692db9482e';

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        // Expose env vars to the client
        'process.env.DEEPSEEK_API_KEY': JSON.stringify(deepseekKey),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || '')
      },
      resolve: {
        alias: {
          '@': path.resolve((process as any).cwd()), // Use process.cwd() instead of __dirname for ESM
        }
      }
    };
});