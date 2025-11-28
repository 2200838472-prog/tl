
import React, { useState } from 'react';
import { playSound } from '../utils/soundEngine';
import { COPYRIGHT_TEXT } from '../constants';

interface UserProfileProps {
  onBack: () => void;
  points: number;
  onRedeem: (code: string) => boolean; // returns success
}

const UserProfile: React.FC<UserProfileProps> = ({ onBack, points, onRedeem }) => {
  const [redeemCode, setRedeemCode] = useState('');
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);

  const handleRedeemSubmit = () => {
      if (!redeemCode.trim()) return;
      playSound('click');
      
      const success = onRedeem(redeemCode.trim());
      if (success) {
          setMessage({ text: 'Points Added Successfully', type: 'success' });
          playSound('chime');
          setRedeemCode('');
      } else {
          setMessage({ text: 'Invalid or Expired Code', type: 'error' });
      }

      setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="min-h-screen bg-paper text-ink font-serif pb-20 flex flex-col animate-fade-in">
      {/* Header */}
      <nav className="p-6 sticky top-0 z-40 bg-paper/95 backdrop-blur-sm border-b border-stone-200 flex items-center justify-between">
         <div className="flex items-center gap-3 cursor-pointer group" onClick={onBack}>
            <div className="w-8 h-8 border border-cinnabar text-cinnabar flex items-center justify-center rounded-sm group-hover:bg-cinnabar group-hover:text-white transition-colors font-serif font-bold">
               ←
            </div>
            <h1 className="font-bold text-lg tracking-widest text-ink font-serif">个人中心</h1>
         </div>
         <div className="text-[10px] text-stone-400 uppercase tracking-widest border border-stone-200 px-3 py-1 rounded-full">
            Account
         </div>
      </nav>

      <main className="flex-1 container mx-auto px-4 py-12 max-w-2xl">
         
         {/* Balance Card */}
         <div className="bg-white border-2 border-cinnabar p-8 mb-12 text-center relative overflow-hidden shadow-sm">
             <div className="absolute -right-8 -top-8 text-cinnabar/5 text-9xl font-serif font-bold pointer-events-none">⚛</div>
             
             <div className="text-xs font-bold text-stone-400 uppercase tracking-[0.2em] mb-4">Current Balance</div>
             <div className="text-8xl font-serif font-bold text-ink mb-2">{points}</div>
             <div className="text-sm font-serif text-cinnabar tracking-widest uppercase">Credits</div>

             <div className="w-12 h-1 bg-stone-100 mx-auto mt-8"></div>
         </div>

         {/* Actions Grid */}
         <div className="grid gap-8">
             
             {/* Recharge Info */}
             <div className="bg-stone-50 p-6 border border-stone-200 flex items-start gap-4">
                 <div className="w-12 h-12 bg-white border border-stone-200 flex items-center justify-center text-2xl shadow-sm flex-shrink-0">
                    💎
                 </div>
                 <div>
                     <h3 className="text-lg font-bold font-serif text-ink mb-1">获取积分 (Recharge)</h3>
                     <p className="text-sm text-stone-500 font-serif leading-relaxed mb-3">
                         积分用于开启高阶占卜。如需充值，请联系管理员。
                     </p>
                     <div className="inline-block bg-white border border-cinnabar/30 px-4 py-2 text-sm font-bold text-cinnabar">
                         如懿 [vx: A1222H2221Y]
                     </div>
                 </div>
             </div>

             {/* Redeem Code */}
             <div className="bg-white p-6 border border-stone-200">
                 <h3 className="text-lg font-bold font-serif text-ink mb-4 flex items-center gap-2">
                     <span>🎟️</span> 兑换码 (Redeem)
                 </h3>
                 <div className="flex gap-2">
                     <input 
                        type="text" 
                        value={redeemCode}
                        onChange={(e) => setRedeemCode(e.target.value)}
                        placeholder="Enter Code..."
                        className="flex-1 border-b-2 border-stone-200 py-2 font-sans font-bold text-ink focus:outline-none focus:border-cinnabar transition-colors bg-transparent placeholder:font-normal placeholder:text-stone-300"
                     />
                     <button 
                        onClick={handleRedeemSubmit}
                        disabled={!redeemCode}
                        className="px-6 bg-ink text-white text-xs font-bold uppercase tracking-widest hover:bg-cinnabar disabled:opacity-50 transition-colors"
                     >
                         Apply
                     </button>
                 </div>
                 {message && (
                     <div className={`mt-4 text-xs font-bold uppercase tracking-widest p-2 ${message.type === 'success' ? 'text-green-600 bg-green-50' : 'text-cinnabar bg-red-50'}`}>
                         {message.text}
                     </div>
                 )}
             </div>

             {/* Daily Task Info */}
             <div className="bg-white p-6 border border-stone-200 opacity-80">
                 <h3 className="text-lg font-bold font-serif text-ink mb-2 flex items-center gap-2">
                     <span>👁️</span> 每日修炼 (Daily Training)
                 </h3>
                 <p className="text-sm text-stone-500 font-serif">
                     在首页完成20次直觉测试(Zener Game)可获得1积分。
                     <br/>
                     <span className="text-xs text-stone-400 uppercase tracking-wider mt-1 block">Limit: Once per day per account.</span>
                 </p>
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
