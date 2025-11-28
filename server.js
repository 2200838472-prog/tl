
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const app = express();
const PORT = process.env.PORT || 3001;
const DATA_FILE = path.join(__dirname, 'data.json');

// Admin Credentials
const ADMIN_USERNAME = 'HHyyaa2006';
const ADMIN_PASSWORD = 'HHyyaa2006';

// Middleware
app.use(cors());
app.use(bodyParser.json());

// --- PERSISTENT DATABASE ---
// Structure: { users: { username: { password, points, deviceId, lastZenerDate } }, devices: [] }
let USERS = {}; 
let REGISTERED_DEVICES = new Set(); 

// Load Data
function loadData() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const raw = fs.readFileSync(DATA_FILE, 'utf-8');
            const data = JSON.parse(raw);
            USERS = data.users || {};
            REGISTERED_DEVICES = new Set(data.devices || []);
            console.log(`[DB] Loaded ${Object.keys(USERS).length} users.`);
        }
    } catch (e) {
        console.error("[DB] Load error:", e);
    }
}

// Save Data
function saveData() {
    try {
        const data = {
            users: USERS,
            devices: Array.from(REGISTERED_DEVICES)
        };
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("[DB] Save error:", e);
    }
}

// Initial Load
loadData();

const CODES = {
    'RUYI888': { value: 10, usedBy: [] },
    'VIP2025': { value: 5, usedBy: [] },
    'NEWUSER': { value: 1, usedBy: [] },
    'HYA20061222': { value: 100, usedBy: [] }
};
const ADMIN_SESSIONS = new Set();

// --- API ROUTES ---

// 1. AUTH: Register
app.post('/api/auth/register', (req, res) => {
    const { username, password, deviceId } = req.body;

    if (!username || !password || !deviceId) {
        return res.status(400).json({ success: false, message: 'Missing fields' });
    }

    // Check if username exists
    if (USERS[username]) {
        return res.status(400).json({ success: false, message: '该账号已被注册 (Username taken)' });
    }

    // Check device limit (One account per device)
    if (REGISTERED_DEVICES.has(deviceId)) {
        return res.status(403).json({ success: false, message: '此设备已注册过账号，无法再次注册 (Device limit reached)' });
    }

    // Create User
    USERS[username] = {
        password: password, // In production, hash this!
        points: 2, // Welcome bonus
        deviceId: deviceId,
        lastZenerDate: ''
    };

    REGISTERED_DEVICES.add(deviceId);
    saveData(); // Persist

    console.log(`[REGISTER] New user: ${username} on device ${deviceId}`);

    res.json({ 
        success: true, 
        username: username,
        points: USERS[username].points 
    });
});

// 2. AUTH: Login
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;

    const user = USERS[username];

    if (!user || user.password !== password) {
        return res.status(401).json({ success: false, message: '账号或密码错误 (Invalid credentials)' });
    }

    res.json({ 
        success: true, 
        username: username,
        points: user.points,
        lastZenerDate: user.lastZenerDate
    });
});

// 3. User Info Sync (Reload)
app.post('/api/user/sync', (req, res) => {
    const { username } = req.body;
    const user = USERS[username];

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ 
        success: true, 
        points: user.points,
        lastZenerDate: user.lastZenerDate 
    });
});

// 4. Deduct Point
app.post('/api/user/deduct', (req, res) => {
    const { username } = req.body;
    const user = USERS[username];

    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.points < 1) {
        return res.status(402).json({ success: false, message: '积分不足，请联系如懿充值' });
    }

    user.points -= 1;
    saveData(); // Persist

    res.json({ success: true, points: user.points });
});

// 5. Redeem Code
app.post('/api/user/redeem', (req, res) => {
    const { username, code } = req.body;
    const user = USERS[username];
    const promo = CODES[code];

    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!promo) return res.status(400).json({ success: false, message: '无效的兑换码' });

    if (promo.usedBy.includes(username)) {
       return res.status(400).json({ success: false, message: '此兑换码已使用' });
    }

    user.points += promo.value;
    promo.usedBy.push(username);
    saveData(); // Persist

    res.json({ success: true, points: user.points, added: promo.value });
});

// 6. Daily Zener Reward
app.post('/api/user/zener-reward', (req, res) => {
    const { username } = req.body;
    const user = USERS[username];
    
    if (!user) return res.status(404).json({ error: 'User not found' });

    const today = new Date().toDateString();

    if (user.lastZenerDate === today) {
        return res.status(400).json({ success: false, message: '今日奖励已领取' });
    }

    user.points += 1;
    user.lastZenerDate = today;
    saveData(); // Persist

    res.json({ success: true, points: user.points });
});

// 7. Admin Login
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        const token = 'admin-token-' + Date.now();
        ADMIN_SESSIONS.add(token);
        return res.json({ success: true, token });
    }
    
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
});

// 8. Admin: Manual Add Points
app.post('/api/admin/add-points', (req, res) => {
    const { targetUsername, amount } = req.body;
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token || !ADMIN_SESSIONS.has(token)) {
        return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const user = USERS[targetUsername];
    if (!user) {
        return res.status(404).json({ success: false, message: "用户不存在 (User not found)" });
    }

    const val = parseInt(amount);
    if (isNaN(val)) return res.status(400).json({ success: false, message: "Invalid amount" });

    user.points += val;
    saveData(); // Persist
    
    console.log(`[ADMIN] Added ${val} points to ${targetUsername}`);

    res.json({ success: true, message: `已成功为 ${targetUsername} 添加 ${val} 积分`, newBalance: user.points });
});

// 9. Admin Stats
app.get('/api/admin/stats', (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token || !ADMIN_SESSIONS.has(token)) {
        return res.status(403).json({ error: "Unauthorized" });
    }

    // Calculate stats
    const totalUsers = Object.keys(USERS).length;
    const totalPoints = Object.values(USERS).reduce((acc, u) => acc + u.points, 0);

    res.json({
        totalUsers,
        totalPointsInCirculation: totalPoints,
        serverStatus: 'Online (Persistent)',
        activeCoupons: Object.keys(CODES).length
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Zhonggong Tarot Backend running on port ${PORT}`);
    console.log(`Persistence active: ${DATA_FILE}`);
});
