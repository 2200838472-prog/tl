
import React, { useState } from 'react';
import { playSound } from '../utils/soundEngine';

interface AuthModalProps {
    onClose: () => void;
    onLoginSuccess: (username: string, points: number, lastZenerDate: string) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose, onLoginSuccess }) => {
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const getDeviceId = () => {
        let did = localStorage.getItem('zg_device_id');
        if (!did) {
            did = 'DEV-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            localStorage.setItem('zg_device_id', did);
        }
        return did;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (!username || !password) {
            setError("请输入账号和密码");
            return;
        }

        setLoading(true);
        playSound('click');

        const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
        const payload: any = { username, password };

        if (mode === 'register') {
            payload.deviceId = getDeviceId();
        }

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (data.success) {
                playSound('chime');
                onLoginSuccess(data.username, data.points, data.lastZenerDate || '');
                onClose();
            } else {
                playSound('click'); // Error sound
                setError(data.message || '操作失败');
            }
        } catch (err) {
            setError("服务器连接失败 (Connection Error)");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] bg-paper/95 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
            <div className="max-w-md w-full bg-white p-8 border border-cinnabar shadow-2xl relative">
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 text-stone-400 hover:text-cinnabar"
                >
                    ✕
                </button>

                <div className="text-center mb-8">
                    <h2 className="text-3xl font-serif font-bold text-ink mb-2">
                        {mode === 'login' ? '用户登录' : '注册账号'}
                    </h2>
                    <p className="text-xs text-stone-400 uppercase tracking-widest">
                        {mode === 'login' ? 'Access Your Soul Record' : 'Create New Identity'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Username</label>
                        <input 
                            type="text" 
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            className="w-full border-b-2 border-stone-200 py-2 font-serif text-ink bg-transparent focus:outline-none focus:border-cinnabar transition-colors text-lg"
                            placeholder="账号"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Password</label>
                        <input 
                            type="password" 
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full border-b-2 border-stone-200 py-2 font-serif text-ink bg-transparent focus:outline-none focus:border-cinnabar transition-colors text-lg"
                            placeholder="密码"
                        />
                    </div>

                    {error && (
                        <div className="text-xs text-white bg-cinnabar p-2 text-center font-bold">
                            {error}
                        </div>
                    )}
                    
                    {mode === 'register' && (
                        <p className="text-[10px] text-stone-400 text-center">
                            注意：同一设备只能注册一个账号。
                        </p>
                    )}

                    <button 
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-ink text-white font-serif font-bold tracking-[0.2em] hover:bg-cinnabar disabled:opacity-50 transition-colors shadow-lg"
                    >
                        {loading ? 'PROCESSING...' : (mode === 'login' ? 'LOGIN' : 'REGISTER')}
                    </button>
                </form>

                <div className="mt-8 text-center border-t border-stone-100 pt-6">
                    <button 
                        onClick={() => {
                            setMode(mode === 'login' ? 'register' : 'login');
                            setError('');
                        }}
                        className="text-xs text-stone-500 font-bold uppercase tracking-widest hover:text-cinnabar transition-colors"
                    >
                        {mode === 'login' ? 'Need an account? Register →' : 'Have an account? Login →'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuthModal;
