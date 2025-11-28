
import React, { useState } from 'react';
import { playSound } from '../utils/soundEngine';
import { COPYRIGHT_TEXT } from '../constants';

interface UserProfileProps {
  onBack: () => void;
  points: number;
  userId: string;
  refreshData: () => void;
  onLogout?: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ onBack, points, userId, refreshData, onLogout }) => {
  const [redeemCode, setRedeemCode] = useState('');
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);

  const handleRedeemSubmit = async () => {
      if (!redeemCode.trim()) return;
      playSound('click');
      
      try {
          const res = await fetch('/api/user/redeem', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username: userId, code: redeemCode.trim() })
          });
          const data = await res.json();
          
          if (data.success) {
              setMessage({ text: `Success! +${data.added} Points`, type: 'success' });
              playSound('chime');
              setRedeemCode('');
              refreshData(); // Sync parent state
          } else {
              setMessage({ text: data.message || 'Invalid Code', type: 'error' });
          }
      } catch (e) {
          setMessage({ text: 'Connection Failed', type: 'error' });
      }

      setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="min-h-screen bg-paper text-ink font-serif pb-20 flex flex-col animate-fade-in">
      <nav className="p-6 sticky top-0 z-40 bg-paper/95 backdrop-blur-sm border-b border-stone-200 flex items-center justify-between">
         <div className="flex items-center gap-3 cursor-pointer group" onClick={onBack}>
            <div className="w-8 h-8 border border-cinnabar text-cinnabar flex items-center justify-center rounded-sm group-hover:bg-cinnabar group-hover:text-white transition-colors font-serif font-bold">
               ←
            </div>
            <h1 className="font-bold text-lg tracking-widest text-ink font-serif">个人主账号</h1>
         </div>
         <div className="flex items-center gap-2">
            <div className="text-[10px] text-stone-400 uppercase tracking-widest border border-stone-200 px-3 py-1 rounded-full">
                Member Center
            </div>
            {onLogout && (
                <button 
                    onClick={onLogout}
                    className="text-[10px] text-white bg-stone-400 hover:bg-cinnabar px-3 py-1 rounded-full uppercase tracking-widest transition-colors"
                >
                    Logout
                </button>
            )}
         </div>
      </nav>

      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
         
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            
            <div className="md:col-span-2 bg-white border border-stone-200 p-8 flex items-center gap-6 shadow-sm relative overflow-hidden group hover:border-stone-300 transition-colors">
                <div className="absolute top-0 right-0 w-32 h-32 bg-stone-50 rounded-full -mr-16 -mt-16 z-0 group-hover:scale-110 transition-transform duration-700"></div>
                
                <div className="w-20 h-20 rounded-full bg-stone-100 border-2 border-white shadow-sm flex items-center justify-center text-3xl relative z-10 flex-shrink-0">
                    🧙‍♂️
                </div>
                
                <div className="relative z-10">
                    <h2 className="text-2xl font-serif font-bold text-ink mb-1">Mystic Seeker</h2>
                    <p className="text-xs font-sans text-stone-400 uppercase tracking-widest mb-3">
                        Account: <span className="text-ink font-bold">{userId}</span>
                    </p>
                    <div className="flex gap-2">
                         <span className="px-2 py-0.5 bg-stone-100 text-stone-500 text-[10px] font-bold uppercase tracking-wider rounded-sm border border-stone-200">
                             Registered
                         </span>
                    </div>
                </div>
            </div>

            <div className="bg-cinnabar text-white p-8 border border-cinnabar shadow-lg flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute -right-6 -bottom-8 text-white/10 text-9xl font-serif font-bold pointer-events-none group-hover:scale-105 transition-transform duration-700">⚛</div>
                
                <div className="relative z-10">
                    <div className="flex justify-between items-start">
                        <div className="text-[10px] font-bold opacity-80 uppercase tracking-widest">Points Balance</div>
                        <div className="text-xl opacity-80">💎</div>
                    </div>
                    
                    <div className="text-6xl font-serif font-bold mt-4 mb-2">{points}</div>
                    
                    <div className="w-full h-px bg-white/20 my-2"></div>
                    <div className="text-[10px] font-bold opacity-80 uppercase tracking-widest">1 Point = 1 Action</div>
                </div>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             
             <div className="bg-white p-6 border border-stone-200 hover:border-cinnabar transition-colors duration-300 shadow-sm">
                 <div className="flex items-center gap-3 mb-4">
                     <span className="text-2xl">⚡</span>
                     <h3 className="text-lg font-bold font-serif text-ink">获取积分 (Recharge)</h3>
                 </div>
                 <p className="text-sm text-stone-500 font-serif leading-relaxed mb-6">
                     如需获取更多积分开启高阶智慧，请联系管理员。
                     <br/>
                     <span className="font-bold text-cinnabar text-lg">获得积分请联系如懿</span>
                 </p>
                 <div className="bg-stone-50 border border-stone-200 p-4 flex justify-between items-center">
                     <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">Contact</span>
                     <span className="text-sm font-serif font-bold text-cinnabar select-all">如懿 [vx: A1222H2221Y]</span>
                 </div>
             </div>

             <div className="bg-white p-6 border border-stone-200 hover:border-cinnabar transition-colors duration-300 shadow-sm">
                 <div className="flex items-center gap-3 mb-4">
                     <span className="text-2xl">🎟️</span>
                     <h3 className="text-lg font-bold font-serif text-ink">积分兑换 (Redeem)</h3>
                 </div>
                 
                 <div className="space-y-4">
                     <div className="flex gap-2">
                         <input 
                            type="text" 
                            value={redeemCode}
                            onChange={(e) => setRedeemCode(e.target.value)}
                            placeholder="ENTER CODE"
                            className="flex-1 border-2 border-stone-100 bg-stone-50 px-4 py-2 font-mono text-sm font-bold text-ink focus:outline-none focus:border-cinnabar transition-colors uppercase placeholder:normal-case"
                         />
                         <button 
                            onClick={handleRedeemSubmit}
                            disabled={!redeemCode}
                            className="px-6 bg-ink text-white text-xs font-bold uppercase tracking-widest hover:bg-cinnabar disabled:opacity-50 transition-colors"
                         >
                             Claim
                         </button>
                     </div>
                     
                     <div className="h-6">
                        {message && (
                            <div className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${message.type === 'success' ? 'text-green-600' : 'text-cinnabar'}`}>
                                <span>{message.type === 'success' ? '✓' : '✕'}</span>
                                {message.text}
                            </div>
                        )}
                     </div>
                 </div>
             </div>

             <div className="md:col-span-2 bg-stone-50 p-6 border border-stone-200 flex items-center justify-between opacity-90 hover:opacity-100 transition-opacity">
                 <div className="flex gap-4 items-center">
                     <div className="w-10 h-10 bg-white border border-stone-200 rounded-full flex items-center justify-center text-xl">
                         👁️
                     </div>
                     <div>
                        <h3 className="text-sm font-bold font-serif text-ink">每日直觉修炼 (Daily Task)</h3>
                        <p className="text-xs text-stone-500 mt-1">每日完成20次直觉修炼可获得1积分。每天限定一个账号一次。</p>
                     </div>
                 </div>
                 <div className="text-xs font-bold text-stone-400 uppercase tracking-widest border border-stone-200 px-3 py-1 bg-white rounded-full">
                     Reward: +1 Point
                 </div>
             </div>

         </div>
      </main>

      <div className="fixed bottom-0 w-full bg-paper/90 backdrop-blur-sm border-t border-stone-200 p-2 z-50">
        <p className="text-center text-[10px] text-stone-400 font-serif tracking-widest">
            {COPYRIGHT_TEXT}
        </p>
      </div>
    </div>
  );
};

export default UserProfile;
