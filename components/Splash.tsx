import React, { useEffect, useState } from 'react';

interface SplashProps {
  onComplete: () => void;
}

const Splash: React.FC<SplashProps> = ({ onComplete }) => {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    // Wait for fonts to be ready to prevent "icon change/flash" issue
    // Added timeout race to ensure it loads even if fonts are blocked (e.g. in China)
    const fontReadyPromise = document.fonts.ready;
    const timeoutPromise = new Promise(resolve => setTimeout(resolve, 2000));

    Promise.race([fontReadyPromise, timeoutPromise]).then(() => {
        const t0 = setTimeout(() => setStage(1), 300); // Increased initial delay for stability
        const t1 = setTimeout(() => setStage(2), 3500); // Fade out
        const t2 = setTimeout(() => onComplete(), 4500); // Unmount

        return () => {
          clearTimeout(t0);
          clearTimeout(t1);
          clearTimeout(t2);
        };
    });
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-[100] bg-paper flex items-center justify-center overflow-hidden transition-opacity duration-1000 ${stage === 2 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      <div className="relative flex flex-col items-center">
        
        {/* Ink Spread Effect (Background) */}
        <div className={`absolute w-[400px] h-[400px] bg-black rounded-full mix-blend-multiply filter blur-xl opacity-10 transition-transform duration-[3s] ease-out ${stage >= 1 ? 'scale-100' : 'scale-0'}`}></div>

        {/* Square Seal Container */}
        {/* Changed initial scale from 3 to 1.5 to reduce dramatic layout shifts that might look like glitches */}
        {/* Added will-change-transform for smoother rendering */}
        <div className={`relative w-48 h-48 md:w-64 md:h-64 border-8 border-cinnabar flex items-center justify-center bg-cinnabar/5 rounded-sm shadow-xl transform origin-center transition-all duration-700 cubic-bezier(0.22, 1, 0.36, 1) will-change-transform ${stage >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-150'}`}>
            
            {/* Inner Border with roughness */}
            <div className="absolute inset-3 border border-cinnabar opacity-60 border-dashed"></div>
            
            {/* Main Character - Songti (Serif), Ink Style */}
            {/* Ensure font-serif is applied directly here to override any system defaults immediately */}
            <div className={`text-cinnabar font-serif font-black text-7xl md:text-8xl relative z-10 tracking-[0.2em] flex flex-col items-center justify-center leading-none ${stage >= 1 ? 'animate-ink-bleed' : ''}`}>
               <span className="block mb-2 filter blur-[0.5px]">中</span>
               <span className="block filter blur-[0.5px]">宫</span>
            </div>

            {/* Texture Overlay for Grunge/Ink Effect */}
            <div className="absolute inset-0 bg-paper opacity-40 mix-blend-overlay pointer-events-none" style={{ backgroundImage: 'url(https://www.transparenttextures.com/patterns/black-scales.png)' }}></div>
        </div>

        {/* Subtitle */}
        <div className={`mt-12 text-ink font-serif tracking-[0.8em] text-sm uppercase transition-opacity duration-1000 delay-700 ${stage >= 1 ? 'opacity-100' : 'opacity-0'}`}>
            Zhonggong Tarot
        </div>

        {/* Developer Seal (Small) */}
        <div className={`absolute bottom-12 right-12 opacity-0 transition-opacity duration-1000 delay-1000 ${stage >= 1 ? 'opacity-60' : ''}`}>
             <div className="w-8 h-8 border-2 border-cinnabar bg-cinnabar/10 flex items-center justify-center rotate-3 rounded-full">
                <span className="text-[10px] text-cinnabar font-serif font-bold">如懿</span>
             </div>
        </div>
      </div>
    </div>
  );
};

export default Splash;