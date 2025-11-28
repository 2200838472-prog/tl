
import React, { useState } from 'react';
import { playSound } from '../utils/soundEngine';

interface AdminLoginProps {
  onBack: () => void;
  onLoginSuccess: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onBack, onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    playSound('click');

    try {
        // In a real deployment, fetch('/api/admin/login', ...)
        // For this demo environment, we simulate the backend response:
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (username === 'admin' && password === 'admin123') {
            playSound('chime');
            onLoginSuccess();
        } else {
            throw new Error("Invalid credentials");
        }
    } catch (err) {
        setError("Access Denied. Identity Unverified.");
        playSound('click');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-4 animate-fade-in relative">
       {/* Background Seal */}
       <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
           <div className="text-[20rem] font-serif text-cinnabar font-bold">🔒</div>
       </div>

       <div className="max-w-md w-full bg-white p-8 border border-stone-200 shadow-xl relative z-10">
           
           <div className="text-center mb-8">
               <div className="w-12 h-12 bg-cinnabar text-white mx-auto flex items-center justify-center font-serif font-bold text-xl mb-4 rounded-sm">
                   中
               </div>
               <h2 className="text-2xl font-serif font-bold text-ink">Admin Console</h2>
               <p className="text-xs text-stone-400 uppercase tracking-widest mt-2">Restricted Access</p>
           </div>

           <form onSubmit={handleLogin} className="space-y-6">
               <div className="space-y-1">
                   <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Operator ID</label>
                   <input 
                     type="text" 
                     value={username}
                     onChange={e => setUsername(e.target.value)}
                     className="w-full border-b border-stone-200 py-2 font-serif text-ink bg-transparent focus:outline-none focus:border-cinnabar transition-colors"
                     placeholder="Enter ID"
                   />
               </div>

               <div className="space-y-1">
                   <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Passkey</label>
                   <input 
                     type="password" 
                     value={password}
                     onChange={e => setPassword(e.target.value)}
                     className="w-full border-b border-stone-200 py-2 font-serif text-ink bg-transparent focus:outline-none focus:border-cinnabar transition-colors"
                     placeholder="••••••••"
                   />
               </div>

               {error && (
                   <div className="text-xs text-cinnabar font-serif italic text-center bg-red-50 p-2 border-l-2 border-cinnabar">
                       {error}
                   </div>
               )}

               <button 
                 type="submit"
                 disabled={loading}
                 className="w-full py-3 bg-ink text-white font-sans text-xs font-bold uppercase tracking-widest hover:bg-cinnabar transition-colors disabled:opacity-50"
               >
                   {loading ? 'Authenticating...' : 'Access System'}
               </button>
           </form>

           <div className="mt-8 text-center">
               <button 
                 onClick={onBack}
                 className="text-xs text-stone-400 font-bold uppercase tracking-widest hover:text-ink transition-colors"
               >
                   ← Return to Public Terminal
               </button>
           </div>
       </div>
    </div>
  );
};

export const AdminDashboard: React.FC<{onLogout: () => void}> = ({ onLogout }) => (
    <div className="min-h-screen bg-stone-50 p-8 animate-fade-in font-serif">
        <div className="max-w-6xl mx-auto">
            <header className="flex justify-between items-center mb-12 border-b border-stone-200 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-ink">System Monitor</h1>
                    <span className="text-xs text-cinnabar font-bold uppercase tracking-widest">● Backend Online</span>
                </div>
                <button onClick={onLogout} className="px-6 py-2 border border-stone-300 text-xs font-bold uppercase tracking-widest hover:bg-ink hover:text-white transition-colors">
                    Logout
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="bg-white p-6 border border-stone-200 shadow-sm">
                    <div className="text-xs text-stone-400 uppercase tracking-widest mb-2">API Status</div>
                    <div className="text-2xl font-bold text-ink">DeepSeek V3</div>
                    <div className="text-sm text-green-600 mt-1">Operational</div>
                </div>
                <div className="bg-white p-6 border border-stone-200 shadow-sm">
                    <div className="text-xs text-stone-400 uppercase tracking-widest mb-2">Total Readings</div>
                    <div className="text-2xl font-bold text-ink">1,243</div>
                    <div className="text-sm text-stone-400 mt-1">+12 today</div>
                </div>
                <div className="bg-white p-6 border border-stone-200 shadow-sm">
                    <div className="text-xs text-stone-400 uppercase tracking-widest mb-2">Server Load</div>
                    <div className="text-2xl font-bold text-ink">12%</div>
                    <div className="w-full bg-stone-100 h-1 mt-2">
                        <div className="bg-cinnabar h-full w-[12%]"></div>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-stone-200 p-8 min-h-[400px]">
                <h3 className="text-xl font-bold text-ink mb-6">Recent System Logs</h3>
                <div className="space-y-3 font-mono text-sm text-stone-600">
                    <div className="flex gap-4"><span className="text-stone-400">10:42:15</span> <span>[INFO] New Tarot Reading initiated (Mode: Kabbalah)</span></div>
                    <div className="flex gap-4"><span className="text-stone-400">10:40:22</span> <span>[INFO] Admin Login attempt from 192.168.1.1</span></div>
                    <div className="flex gap-4"><span className="text-stone-400">10:38:05</span> <span>[API] DeepSeek Response generated (1.2s)</span></div>
                    <div className="flex gap-4"><span className="text-stone-400">10:35:11</span> <span>[INFO] User accessed Learning Hub</span></div>
                </div>
            </div>
        </div>
    </div>
);

export default AdminLogin;
