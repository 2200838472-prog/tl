
import React, { useState, useEffect, useRef } from 'react';
import { playSound } from '../utils/soundEngine';

interface HomeProps {
  onNavigate: (page: 'input' | 'learning' | 'chat' | 'rateTest' | 'resources' | 'profile') => void;
  // Zener Props
  zenerProgress: number;
  isZenerRewardClaimed: boolean;
  onZenerWin: () => void;
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
    <div className="bg-white p-8 border border-stone-200 h-full flex flex-col justify-between hover:border-cinnabar transition-colors duration-300 group relative overflow-hidden">
       {/* Daily Progress Indicator */}
       <div className="absolute top-0 right-0 p-2 bg-stone-50 border-b border-l border-stone-200 text-[10px] font-sans font-bold uppercase tracking-wider text-stone-500 z-10">
           {rewardClaimed ? (
               <span className="text-green-600">Task Complete ✓</span>
           ) : (
               <span>Daily: {progress}/20</span>
           )}
       </div>

       <div className="flex justify-between items-start">
          <h3 className="text-2xl font-bold font-serif text-ink">Intuition</h3>
          <span className="text-xs font-sans font-bold text-stone-300 uppercase tracking-widest group-hover:text-cinnabar mt-1">Train</span>
       </div>

       <div className="flex justify-center my-6">
          <div className={`w-20 h-20 flex items-center justify-center text-4xl border-2 transition-all duration-300 ${revealed ? (guess === target ? 'border-cinnabar text-cinnabar' : 'border-stone-300 text-stone-300') : 'border-black text-black'}`}>
             {revealed ? target : '?'}
          </div>
       </div>

       <div className="flex justify-between gap-1">
          {ZENER_SYMBOLS.map(s => (
             <button 
               key={s}
               onClick={() => handleGuess(s)}
               disabled={revealed}
               className={`w-8 h-8 flex items-center justify-center border text-sm font-bold transition-all ${guess === s ? 'bg-black text-white border-black' : 'bg-white text-black border-stone-200 hover:border-cinnabar'}`}
             >
               {s}
             </button>
          ))}
       </div>
    </div>
  );
};

const Home: React.FC<HomeProps> = ({ onNavigate, zenerProgress, isZenerRewardClaimed, onZenerWin }) => {
  return (
    <div className="w-full animate-fade-in pb-12">
      
      {/* Hero Typography */}
      <div className="mb-16 pt-8 border-b-2 border-black pb-12">
         <h2 className="text-8xl md:text-9xl font-serif font-black text-ink tracking-tighter leading-none mb-4">
            ZHONG<br/>GONG.
         </h2>
         <div className="flex flex-col md:flex-row justify-between items-start md:items-end w-full">
            <p className="text-stone-500 font-sans font-bold uppercase tracking-widest text-xs max-w-xs mt-4">
                Align Heaven, Earth, and Man. <br/>Center yourself in the cosmos.
            </p>
            <div className="text-cinnabar text-6xl font-serif mt-4 md:mt-0">
                ⚛
            </div>
         </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-t border-l border-stone-200">
          
          {/* Main Action - Double Width */}
          <div 
            onClick={() => onNavigate('input')}
            className="md:col-span-2 bg-cinnabar p-12 cursor-pointer group relative overflow-hidden flex flex-col justify-between min-h-[300px]"
          >
             <div className="absolute top-4 right-4 text-white/20 text-9xl font-serif group-hover:scale-110 transition-transform duration-700">⟡</div>
             
             <div className="relative z-10">
                <span className="text-white font-sans font-bold text-xs uppercase tracking-[0.3em] border border-white/30 px-3 py-1 inline-block mb-6">Start Here</span>
                <h3 className="text-5xl md:text-6xl font-serif font-bold text-white leading-tight">DIVINATION</h3>
             </div>
             
             <div className="flex items-center gap-4 text-white mt-8">
                <span className="text-xs font-bold uppercase tracking-widest group-hover:mr-2 transition-all">Begin Reading</span>
                <span>→</span>
             </div>
          </div>

          {/* Academy */}
          <div 
            onClick={() => onNavigate('learning')}
            className="bg-white p-10 border-r border-b border-stone-200 cursor-pointer hover:bg-stone-50 transition-colors group flex flex-col justify-between"
          >
             <div>
                <h3 className="text-3xl font-serif font-bold text-ink mb-2">Academy</h3>
                <p className="text-stone-500 text-sm font-sans leading-relaxed">Master the systems of the Tree of Life.</p>
             </div>
             <div className="w-8 h-1 bg-stone-200 group-hover:bg-cinnabar transition-colors mt-8"></div>
          </div>

          {/* Rate Test */}
          <div 
            onClick={() => onNavigate('rateTest')}
            className="bg-white p-10 border-r border-b border-l border-stone-200 cursor-pointer hover:bg-stone-50 transition-colors group flex flex-col justify-between"
          >
             <div>
                <h3 className="text-3xl font-serif font-bold text-ink mb-2">Ordeal</h3>
                <p className="text-stone-500 text-sm font-sans leading-relaxed">Test your wisdom. Ascend the ranks.</p>
             </div>
             <span className="text-4xl text-stone-200 group-hover:text-cinnabar transition-colors self-end">⚔</span>
          </div>

          {/* Widgets */}
          <div className="md:col-span-1 border-r border-b border-stone-200">
             <ZenerGame 
                progress={zenerProgress} 
                rewardClaimed={isZenerRewardClaimed} 
                onWin={onZenerWin} 
             />
          </div>

          {/* Resources & Board Combined */}
          <div className="md:col-span-1 flex flex-col">
              <div 
                onClick={() => onNavigate('resources')}
                className="flex-1 bg-white p-8 border-r border-b border-stone-200 cursor-pointer hover:bg-stone-50 transition-colors flex items-center justify-between group"
              >
                  <span className="font-serif font-bold text-xl text-ink">Resources</span>
                  <span className="text-stone-300 group-hover:text-cinnabar transition-colors">↗</span>
              </div>
              <div 
                onClick={() => onNavigate('chat')}
                className="flex-1 bg-white p-8 border-r border-b border-stone-200 cursor-pointer hover:bg-stone-50 transition-colors flex items-center justify-between group"
              >
                  <span className="font-serif font-bold text-xl text-ink">Public Board</span>
                  <span className="text-stone-300 group-hover:text-cinnabar transition-colors">✎</span>
              </div>
          </div>
      </div>
    </div>
  );
};

export default Home;
