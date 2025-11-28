
import React, { useState, useEffect, useRef } from 'react';
import { playSound } from '../utils/soundEngine';

interface HomeProps {
  onNavigate: (page: 'input' | 'learning' | 'chat' | 'rateTest' | 'resources' | 'profile') => void;
  // Zener Props
  zenerProgress: number;
  isZenerRewardClaimed: boolean;
  onZenerWin: () => void;
  // User Props
  points: number;
  userId: string;
}

const ZENER_SYMBOLS = ['○', '+', '≈', '□', '☆'];

interface ZenerGameProps {
    progress: number;
    rewardClaimed: boolean;
    onWin: () => void;
}

const ZenerGame: React.FC<ZenerGameProps> = ({ progress, rewardClaimed, onWin }) => {
  const [target, setTarget] = useState('');
  const [guess, setGuess] = useState('');
  const [revealed, setRevealed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    pickNewTarget();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const pickNewTarget = () => {
    const s = ZENER_SYMBOLS[Math.floor(Math.random() * ZENER_SYMBOLS.length)];
    setTarget(s);
    setRevealed(false);
    setGuess('');
  };

  const handleGuess = (s: string) => {
    if (revealed) return;
    setGuess(s);
    setRevealed(true);
    
    if (s === target) {
      playSound('chime');
      onWin(); // Increment progress in App
    } else {
      playSound('click');
    }
    
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(pickNewTarget, 1500);
  };

  return (
    <div className="bg-white p-6 border-r border-b border-stone-200 h-full flex flex-col justify-between hover:bg-stone-50 transition-colors duration-300 group relative overflow-hidden">
       {/* Daily Progress Indicator */}
       <div className="absolute top-0 right-0 p-2 bg-stone-50 border-b border-l border-stone-200 text-[9px] font-sans font-bold uppercase tracking-wider text-stone-500 z-10">
           {rewardClaimed ? (
               <span className="text-green-600">Done ✓</span>
           ) : (
               <span>{progress}/20</span>
           )}
       </div>

       <div className="flex justify-between items-start">
          <h3 className="text-xl font-bold font-serif text-ink">Intuition</h3>
          <span className="text-[10px] font-sans font-bold text-stone-300 uppercase tracking-widest group-hover:text-cinnabar mt-1">Train</span>
       </div>

       <div className="flex justify-center my-4">
          <div className={`w-16 h-16 flex items-center justify-center text-3xl border-2 transition-all duration-300 ${revealed ? (guess === target ? 'border-cinnabar text-cinnabar' : 'border-stone-300 text-stone-300') : 'border-black text-black'}`}>
             {revealed ? target : '?'}
          </div>
       </div>

       <div className="flex justify-between gap-1">
          {ZENER_SYMBOLS.map(s => (
             <button 
               key={s}
               onClick={() => handleGuess(s)}
               disabled={revealed}
               className={`w-6 h-6 flex items-center justify-center border text-xs font-bold transition-all ${guess === s ? 'bg-black text-white border-black' : 'bg-white text-black border-stone-200 hover:border-cinnabar'}`}
             >
               {s}
             </button>
          ))}
       </div>
    </div>
  );
};

const Home: React.FC<HomeProps> = ({ onNavigate, zenerProgress, isZenerRewardClaimed, onZenerWin, points, userId }) => {
  return (
    <div className="w-full animate-fade-in pb-12">
      
      {/* Hero Typography */}
      <div className="mb-12 pt-4 border-b-2 border-black pb-8">
         <h2 className="text-8xl md:text-9xl font-serif font-black text-ink tracking-tighter leading-none mb-4">
            ZHONG<br/>GONG.
         </h2>
         <div className="flex flex-col md:flex-row justify-between items-start md:items-end w-full">
            <p className="text-stone-500 font-sans font-bold uppercase tracking-widest text-xs max-w-xs mt-4">
                Align Heaven, Earth, and Man. <br/>Center yourself in the cosmos.
            </p>
            <div className="text-cinnabar text-6xl font-serif mt-4 md:mt-0 animate-pulse-slow">
                ⚛
            </div>
         </div>
      </div>

      {/* Bento Grid Layout - 2 Rows, 3 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-t border-l border-stone-200 shadow-sm">
          
          {/* 1. Main Action: Divination (Col 1-2, Row 1) */}
          <div 
            onClick={() => onNavigate('input')}
            className="md:col-span-2 bg-cinnabar p-10 cursor-pointer group relative overflow-hidden flex flex-col justify-between min-h-[280px]"
          >
             <div className="absolute top-4 right-4 text-white/20 text-9xl font-serif group-hover:scale-110 transition-transform duration-700 select-none">⟡</div>
             
             <div className="relative z-10">
                <span className="text-white font-sans font-bold text-[10px] uppercase tracking-[0.3em] border border-white/30 px-3 py-1 inline-block mb-6">Start Here</span>
                <h3 className="text-5xl font-serif font-bold text-white leading-tight">DIVINATION</h3>
             </div>
             
             <div className="flex items-center gap-4 text-white mt-8">
                <span className="text-xs font-bold uppercase tracking-widest group-hover:mr-2 transition-all">Begin Reading</span>
                <span>→</span>
             </div>
          </div>

          {/* 2. User Status Module (Col 3, Row 1) - Replaces Old Academy Slot */}
          <div 
            onClick={() => onNavigate('profile')}
            className="bg-stone-100 p-8 border-r border-b border-stone-200 cursor-pointer hover:bg-white transition-colors group flex flex-col justify-between relative overflow-hidden"
          >
             <div className="absolute top-0 right-0 w-24 h-24 bg-stone-200 rounded-full -mr-12 -mt-12 opacity-50 group-hover:scale-125 transition-transform duration-500"></div>

             <div className="relative z-10">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-bold font-sans uppercase tracking-widest text-stone-500">My Account</h3>
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                </div>
                
                <div className="text-5xl font-serif font-bold text-ink mb-1 group-hover:text-cinnabar transition-colors">{points}</div>
                <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Points Balance</div>
             </div>

             <div className="relative z-10 mt-6 border-t border-stone-200 pt-4">
                <div className="text-[10px] font-mono text-stone-500 mb-2 truncate">ID: {userId}</div>
                <div className="text-xs font-bold text-ink uppercase tracking-wider group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                    Manage / Redeem <span>→</span>
                </div>
             </div>
          </div>

          {/* 3. Academy (Col 1, Row 2) */}
          <div 
            onClick={() => onNavigate('learning')}
            className="bg-white p-8 border-r border-b border-stone-200 cursor-pointer hover:bg-stone-50 transition-colors group flex flex-col justify-between h-full"
          >
             <div>
                <h3 className="text-2xl font-serif font-bold text-ink mb-2">Academy</h3>
                <p className="text-stone-500 text-xs font-sans leading-relaxed">Master the Tree of Life & Triad.</p>
             </div>
             <div className="w-8 h-1 bg-stone-200 group-hover:bg-cinnabar transition-colors mt-6"></div>
          </div>

          {/* 4. Public Board (Col 2, Row 2) */}
          <div 
            onClick={() => onNavigate('chat')}
            className="bg-white p-8 border-r border-b border-stone-200 cursor-pointer hover:bg-stone-50 transition-colors flex flex-col justify-between group h-full"
          >
              <div>
                <h3 className="text-2xl font-serif font-bold text-ink mb-2">Board</h3>
                <p className="text-stone-500 text-xs font-sans leading-relaxed">Leave a whisper to the void.</p>
              </div>
              <span className="text-2xl text-stone-300 group-hover:text-cinnabar transition-colors self-end">✎</span>
          </div>

          {/* 5. Zener Widget (Col 3, Row 2) */}
          <div className="md:col-span-1 border-r border-b border-stone-200">
             <ZenerGame 
                progress={zenerProgress} 
                rewardClaimed={isZenerRewardClaimed} 
                onWin={onZenerWin} 
             />
          </div>

      </div>
      
      {/* Footer Text */}
      <div className="mt-8 text-center">
          <button 
             onClick={() => onNavigate('rateTest')} 
             className="text-[10px] text-stone-400 font-bold uppercase tracking-widest hover:text-cinnabar transition-colors border-b border-transparent hover:border-cinnabar pb-0.5"
          >
              Enter the Ordeal of Wisdom
          </button>
      </div>
    </div>
  );
};

export default Home;
