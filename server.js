import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Conditional import for node-fetch to support older Node versions if needed,
// though Vercel environment usually has global fetch in Node 18+.
// We use a try-catch to allow using global fetch if available.
let fetch;
if (typeof globalThis.fetch === 'function') {
    fetch = globalThis.fetch;
} else {
    // Dynamic import to avoid build issues if node-fetch is missing in some envs
    try {
        const module = await import('node-fetch');
        fetch = module.default;
    } catch (e) {
        console.warn("Native fetch not found and node-fetch import failed.");
    }
}

// Helper for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const app = express();
const PORT = process.env.PORT || 3001;
// Prioritize env var, then fallback
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'sk-3c0c5f5063fa47d6a07f73692db9482e';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

// Middleware
app.use(cors());
app.use(express.json());

// --- MOCK DATABASE (In-Memory) ---
// Note: On Vercel, this memory resets on every redeploy or cold start.
const ADMIN_SESSIONS = new Set();

// --- API ROUTES ---

// 1. Admin Login
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    
    if (username === 'admin' && password === ADMIN_PASSWORD) {
        const token = 'mock-jwt-token-' + Date.now();
        ADMIN_SESSIONS.add(token);
        return res.json({ success: true, token });
    }
    
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
});

// 2. DeepSeek Proxy: Interpretation
// Matches Vercel rewrite rules (/api/(.*) -> /api/index.js -> app)
app.post('/api/deepseek/interpret', async (req, res) => {
    const { messages, maxTokens, jsonMode } = req.body;
    
    if (!messages) {
        return res.status(400).json({ error: "Messages required" });
    }

    if (!fetch) {
        return res.status(500).json({ error: "Server fetch capability missing" });
    }

    try {
        const response = await fetch(DEEPSEEK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: messages,
                temperature: 0.7,
                max_tokens: maxTokens || 3000,
                stream: false,
                response_format: jsonMode ? { type: 'json_object' } : undefined
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("DeepSeek API Error:", errorText);
            return res.status(response.status).json({ error: `Upstream API Error: ${errorText}` });
        }

        const data = await response.json();
        
        // DeepSeek response structure validation
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            console.error("Invalid Upstream Response:", data);
            return res.status(502).json({ error: "Invalid response from AI provider" });
        }

        // Return just the content to match expected format
        res.json({ content: data.choices[0].message.content });

    } catch (error) {
        console.error("Backend Proxy Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// 3. Admin Stats
app.get('/api/admin/stats', (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token || !ADMIN_SESSIONS.has(token)) {
        return res.status(403).json({ error: "Unauthorized" });
    }

    res.json({
        totalReadings: 1243 + Math.floor(Math.random() * 100),
        activeUsers: 42 + Math.floor(Math.random() * 10),
        serverStatus: 'Online',
        environment: process.env.VERCEL ? 'Vercel Serverless' : 'Local Node'
    });
});

// --- STATIC FILE SERVING (Local Only) ---
// On Vercel, static files are handled by the Output API, so we skip this.
if (!process.env.VERCEL) {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      // Don't intercept API calls
      if (req.path.startsWith('/api')) {
          return res.status(404).json({ error: "Not Found" });
      }
      res.sendFile(path.join(__dirname, 'dist/index.html'));
    });
}

// --- STARTUP LOGIC ---
// Export the app for Vercel Serverless
export default app;

// Start the server directly if running locally (node server.js)
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    app.listen(PORT, () => {
        console.log(`Zhonggong Tarot Server running on port ${PORT}`);
    });
}