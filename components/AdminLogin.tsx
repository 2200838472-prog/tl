
import React, { useState, useEffect } from 'react';
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
        const res = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        
        if (data.success) {
            playSound('chime');
            localStorage.setItem('admin_token', data.token);
            onLoginSuccess();
        } else {
            setError("Invalid credentials");
        }
    } catch (err) {
        setError("Access Denied. Connection Failed.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-4 animate-fade-in relative">
       <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
           <div className="text-[20rem] font-serif text-cinnabar font-bold">🔒</div>
       </div>

       <div className="max-w-md w-full bg-white p-8 border border-stone-200 shadow-xl relative z-10">
           <div className="text-center mb-8">
               <div className="w-12 h-12 bg-cinnabar text-white mx-auto flex items-center justify-center font-serif font-bold text-xl mb-4 rounded-sm">
                   中
               </div>
               <h2 className="text-2xl font-serif font-bold text-ink">Admin Console</h2>
           </div>

           <form onSubmit={handleLogin} className="space-y-6">
               <div className="space-y-1">
                   <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Admin ID</label>
                   <input 
                     type="text" 
                     value={username}
                     onChange={e => setUsername(e.target.value)}
                     className="w-full border-b border-stone-200 py-2 font-serif text-ink bg-transparent focus:outline-none focus:border-cinnabar transition-colors"
                   />
               </div>
               <div className="space-y-1">
                   <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Passkey</label>
                   <input 
                     type="password" 
                     value={password}
                     onChange={e => setPassword(e.target.value)}
                     className="w-full border-b border-stone-200 py-2 font-serif text-ink bg-transparent focus:outline-none focus:border-cinnabar transition-colors"
                   />
               </div>
               {error && <div className="text-xs text-cinnabar font-serif italic text-center">{error}</div>}
               <button 
                 type="submit"
                 disabled={loading}
                 className="w-full py-3 bg-ink text-white font-sans text-xs font-bold uppercase tracking-widest hover:bg-cinnabar transition-colors"
               >
                   {loading ? 'Authenticating...' : 'Access System'}
               </button>
           </form>
           <div className="mt-8 text-center">
               <button onClick={onBack} className="text-xs text-stone-400 font-bold uppercase tracking-widest hover:text-ink">
                   ← Return
               </button>
           </div>
       </div>
    </div>
  );
};

export const AdminDashboard: React.FC<{onLogout: () => void}> = ({ onLogout }) => {
    const [stats, setStats] = useState<any>(null);
    const [targetUser, setTargetUser] = useState('');
    const [pointsToAdd, setPointsToAdd] = useState('');
    const [opMessage, setOpMessage] = useState('');

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        const token = localStorage.getItem('admin_token');
        try {
            const res = await fetch('/api/admin/stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setStats(data);
        } catch(e) {}
    };

    const handleAddPoints = async () => {
        if (!targetUser || !pointsToAdd) return;
        setOpMessage('Processing...');
        const token = localStorage.getItem('admin_token');
        try {
            const res = await fetch('/api/admin/add-points', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ targetUsername: targetUser, amount: pointsToAdd })
            });
            const data = await res.json();
            if (data.success) {
                setOpMessage(data.message);
                setTargetUser('');
                setPointsToAdd('');
                fetchStats(); // Refresh stats
            } else {
                setOpMessage(`Error: ${data.message}`);
            }
        } catch(e) {
            setOpMessage("Network Error");
        }
    };

    return (
        <div className="min-h-screen bg-stone-50 p-8 animate-fade-in font-serif">
            <div className="max-w-6xl mx-auto">
                <header className="flex justify-between items-center mb-12 border-b border-stone-200 pb-6">
                    <h1 className="text-3xl font-bold text-ink">System Monitor</h1>
                    <button onClick={onLogout} className="px-6 py-2 border border-stone-300 text-xs font-bold uppercase hover:bg-ink hover:text-white">Logout</button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    <div className="bg-white p-6 border border-stone-200 shadow-sm">
                        <div className="text-xs text-stone-400 uppercase tracking-widest mb-2">Total Users</div>
                        <div className="text-2xl font-bold text-ink">{stats?.totalUsers || '-'}</div>
                    </div>
                    <div className="bg-white p-6 border border-stone-200 shadow-sm">
                        <div className="text-xs text-stone-400 uppercase tracking-widest mb-2">Total Points Issued</div>
                        <div className="text-2xl font-bold text-ink">{stats?.totalPointsInCirculation || '-'}</div>
                    </div>
                    <div className="bg-white p-6 border border-stone-200 shadow-sm">
                        <div className="text-xs text-stone-400 uppercase tracking-widest mb-2">Server Status</div>
                        <div className="text-sm text-green-600 font-bold">{stats?.serverStatus || 'Offline'}</div>
                    </div>
                </div>

                <div className="bg-white border border-stone-200 p-8 max-w-lg">
                    <h3 className="text-xl font-bold text-ink mb-6">User Management (Add Points)</h3>
                    <div className="space-y-4">
                        <input 
                            type="text" 
                            placeholder="Target Username"
                            value={targetUser}
                            onChange={e => setTargetUser(e.target.value)}
                            className="w-full border p-2 text-sm"
                        />
                        <input 
                            type="number" 
                            placeholder="Points Amount"
                            value={pointsToAdd}
                            onChange={e => setPointsToAdd(e.target.value)}
                            className="w-full border p-2 text-sm"
                        />
                        <button 
                            onClick={handleAddPoints}
                            className="w-full bg-cinnabar text-white py-2 font-bold uppercase text-xs"
                        >
                            Add Points
                        </button>
                        {opMessage && <div className="text-xs text-stone-500 mt-2">{opMessage}</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
