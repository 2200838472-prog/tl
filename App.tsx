import React, { useState, useEffect, useRef } from 'react';
import Splash from './components/Splash';
import Footer from './components/Footer';
import CardComponent from './components/CardComponent';
import LearningHub from './components/LearningHub';
import PublicBoard from './components/PublicBoard';
import Home from './components/Home';
import TarotRateTest from './components/TarotRateTest';
import ResourcesZone from './components/ResourcesZone';
import TarotNotes from './components/TarotNotes';
import { DeckSystem, InterpretationMode, DrawnCard, FullReadingResponse } from './types';
import { drawCards } from './utils/tarotEngine';
import { generateInterpretation, generateVisionImage } from './services/deepseekService';
import { ACKNOWLEDGEMENTS } from './constants';
import { playSound } from './utils/soundEngine';

const App: React.FC = () => {
  const [appState, setAppState] = useState<'intro' | 'home' | 'chat' | 'input' | 'shuffling' | 'reading' | 'analyzing' | 'result' | 'thanks' | 'learning' | 'rateTest' | 'resources' | 'notes'>('intro');
  
  // User Inputs
  const [question, setQuestion] = useState('');
  const [deck, setDeck] = useState<DeckSystem>(DeckSystem.WAITE);
  const [mode, setMode] = useState<InterpretationMode>(InterpretationMode.SANCIA);
  
  // Session Data
  const [cards, setCards] = useState<DrawnCard[]>([]);
  const [analysis, setAnalysis] = useState<FullReadingResponse | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isVisionLoading, setIsVisionLoading] = useState(false);
  
  // UI State
  const [revealedCount, setRevealedCount] = useState(0);
  
  // Refs
  const shuffleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Click Ripple Effect
  const [ripples, setRipples] = useState<{x: number, y: number, id: number}[]>([]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
        const id = Date.now();
        setRipples(prev => [...prev, { x: e.clientX, y: e.clientY, id }]);
        setTimeout(() => {
            setRipples(prev => prev.filter(r => r.id !== id));
        }, 600);
    };

    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  // Clean up shuffle timer on unmount
  useEffect(() => {
      return () => {
          if (shuffleTimerRef.current) clearTimeout(shuffleTimerRef.current);
      };
  }, []);

  const handleSplashComplete = () => {
    playSound('chime');
    setAppState('home');
  };

  const handleStartDivination = () => {
    if (!question.trim()) return;
    playSound('click');
    setAppState('shuffling');
    
    // Clear any existing timer
    if (shuffleTimerRef.current) clearTimeout(shuffleTimerRef.current);

    // Shuffle Animation Time
    shuffleTimerRef.current = setTimeout(() => {
      const drawn = drawCards(6, deck);
      setCards(drawn);
      setRevealedCount(0);
      playSound('slide');
      setAppState('reading');
    }, 3000);
  };

  const handleCardClick = (index: number) => {
    if (appState !== 'reading') return;
    // Note: sound is handled in CardComponent via onClick prop
    if (index === revealedCount) {
      setRevealedCount(prev => prev + 1);
    }
  };

  const handleDeckChange = () => {
      playSound('click');
      setDeck(deck === DeckSystem.WAITE ? DeckSystem.THOTH : DeckSystem.WAITE);
  };

  const handleModeChange = () => {
      playSound('click');
      setMode(mode === InterpretationMode.SANCIA ? InterpretationMode.KABBALAH : InterpretationMode.SANCIA);
  };

  const handleNavClick = (target: 'learning' | 'input' | 'chat' | 'home' | 'rateTest' | 'resources' | 'notes' | 'profile') => {
      playSound('click');
      // If user navigates away, cancel any pending shuffle action
      if (shuffleTimerRef.current) clearTimeout(shuffleTimerRef.current);
      
      if (target === 'profile') {
        // Profile support not implemented in this component version
        return;
      }

      setAppState(target);
  };

  const handleRestart = () => {
      playSound('click');
      setAppState('input');
      setQuestion('');
      setCards([]);
      setAnalysis(null);
      setGeneratedImageUrl(null);
      setRevealedCount(0);
  };

  useEffect(() => {
    if (appState === 'reading' && revealedCount === 6) {
      const t = setTimeout(() => {
        setAppState('analyzing');
        playSound('chime'); // Start analysis sound
        performInterpretation();
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [revealedCount, appState]);

  const performInterpretation = async () => {
    try {
      const result = await generateInterpretation({
        question,
        deck,
        mode,
        cards
      });
      setAnalysis(result);
      setAppState('result');
      playSound('reveal');
    } catch (e) {
      console.error(e);
      // Even if AI fails, we have an offline fallback in the service, 
      // but if something critical breaks, we alert.
      alert("Interpretation encountered a cosmic disturbance. Displaying fallback wisdom.");
      setAppState('reading'); // Or handle gracefully
    }
  };

  const handleGenerateVision = async () => {
    playSound('click');
    setIsVisionLoading(true);
    const cardNames = cards.map(c => c.name);
    const url = await generateVisionImage(cardNames, question);
    if (url) {
        setGeneratedImageUrl(url);
        playSound('reveal');
    } else {
        alert("Vision generation is not available with the current energy source (DeepSeek).");
    }
    setIsVisionLoading(false);
  };

  // --- RENDER HELPERS ---

  if (appState === 'intro') {
    return <Splash onComplete={handleSplashComplete} />;
  }

  if (appState === 'learning') {
    return <LearningHub onBack={() => handleNavClick('home')} />;
  }

  if (appState === 'rateTest') {
    return <TarotRateTest onBack={() => handleNavClick('home')} />;
  }

  if (appState === 'resources') {
    return <ResourcesZone onBack={() => handleNavClick('home')} />;
  }

  if (appState === 'notes') {
    return <TarotNotes onBack={() => handleNavClick('home')} />;
  }

  if (appState === 'thanks') {
    return (
      <div className="min-h-screen bg-paper flex flex-col items-center justify-center p-8 animate-fade-in relative overflow-hidden">
         <div className="absolute inset-0 bg-noise opacity-10 pointer-events-none"></div>
         
         <div className="max-w-4xl w-full border-2 border-cinnabar/20 p-8 rounded-sm bg-white/50 backdrop-blur-sm relative my-8">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-paper px-4 border border-cinnabar/20 rounded-full w-12 h-12 flex items-center justify-center shadow-sm">
                <span className="text-2xl text-cinnabar font-serif">⚛</span>
            </div>
            
            <h2 className="text-3xl font-serif text-ink mb-12 font-bold tracking-widest text-center mt-4">致谢名单</h2>
            
            {/* Emojis Grid */}
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 justify-center mb-12">
              {ACKNOWLEDGEMENTS.map((person, i) => (
                <div key={i} className="flex flex-col items-center group">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-stone-200 p-1 bg-white shadow-sm group-hover:border-cinnabar group-hover:scale-110 transition-all duration-300 overflow-hidden relative flex items-center justify-center">
                     <span className="text-3xl md:text-4xl select-none filter drop-shadow-sm transform group-hover:rotate-12 transition-transform">
                        {person.avatarSeed}
                     </span>
                  </div>
                  <span className="mt-3 text-sm font-bold font-serif text-ink">{person.name}</span>
                </div>
              ))}
            </div>
            
            <p className="text-stone-500 text-sm italic font-serif mb-8 text-center border-t border-stone-200 pt-8 w-1/2 mx-auto">
              "感谢所有为我提供灵感与支持的伙伴，<br/>愿星辰指引你们的道路。"
            </p>
            
            <div className="flex justify-center">
              <button 
                onClick={() => handleNavClick('home')}
                className="px-8 py-2 bg-ink text-white font-serif rounded-sm hover:bg-cinnabar transition-colors"
              >
                返回首页
              </button>
            </div>
         </div>
         <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper text-ink font-sans selection:bg-cinnabar selection:text-white pb-24 transition-colors duration-500 relative">
      <div className="fixed inset-0 bg-noise opacity-5 pointer-events-none z-0"></div>
      
      {/* Ripple Effects Container */}
      <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
        {ripples.map(r => (
            <span 
                key={r.id}
                className="absolute w-4 h-4 rounded-full bg-cinnabar/30 animate-ripple transform -translate-x-1/2 -translate-y-1/2"
                style={{ left: r.x, top: r.y }}
            />
        ))}
      </div>

      {/* Header */}
      <nav className="p-4 md:p-6 flex justify-between items-center bg-paper/95 backdrop-blur-sm sticky top-0 z-40 border-b border-stone-200 shadow-sm transition-all">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => handleNavClick('home')}>
            <div className="w-8 h-8 bg-cinnabar text-white flex items-center justify-center rounded-sm font-serif font-black text-xl shadow-sm group-hover:bg-cinnabarDim transition-colors">
              中
            </div>
            <div className="hidden md:block">
              <h1 className="font-serif text-lg tracking-widest text-ink font-bold">中宫塔罗</h1>
              <span className="text-[9px] text-stone-400 uppercase tracking-widest block leading-none">Zhonggong Tarot</span>
            </div>
        </div>
        
        {/* Top Right Actions */}
        <div className="flex gap-2 md:gap-4 items-center">
           <button 
             onClick={() => handleNavClick('input')}
             className={`px-3 py-1.5 md:px-5 md:py-2 rounded-sm text-xs md:text-sm font-serif font-bold tracking-wide transition-all ${appState === 'input' ? 'bg-ink text-white shadow-md' : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-ink'}`}
           >
             占卜 (Divination)
           </button>
           
           <button 
             onClick={() => handleNavClick('learning')}
             className="px-3 py-1.5 md:px-5 md:py-2 rounded-sm text-xs md:text-sm font-serif font-bold tracking-wide transition-all bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-ink"
           >
             书院 (Academy)
           </button>

           <button 
                onClick={() => handleNavClick('chat')}
                className={`w-8 h-8 flex items-center justify-center rounded-full border transition-all ${appState === 'chat' ? 'border-cinnabar text-cinnabar' : 'border-stone-200 text-stone-400 hover:text-cinnabar hover:border-cinnabar'}`}
                title="Message Board"
            >
                ✎
            </button>

           {appState === 'home' && (
             <button 
               onClick={() => setAppState('thanks')}
               className="ml-2 w-8 h-8 flex items-center justify-center rounded-full border border-stone-200 text-stone-400 hover:text-cinnabar hover:border-cinnabar transition-all"
               title="Acknowledgments"
             >
               ♥
             </button>
           )}

           {appState !== 'home' && appState !== 'chat' && (
              <div className="hidden lg:block text-[10px] text-cinnabar border border-cinnabar px-2 py-1 rounded-sm font-serif tracking-wider uppercase">
                 {deck} • {mode === InterpretationMode.SANCIA ? 'Triad' : 'Tree'}
              </div>
           )}
        </div>
      </nav>

      {/* Main Content Area - Dynamic Width based on View */}
      <main className={`container mx-auto px-4 py-8 min-h-[70vh] flex flex-col items-center justify-center relative z-10 transition-all duration-300 ${appState === 'home' || appState === 'chat' ? 'max-w-5xl' : 'max-w-2xl'}`}>
        
        {/* HOME / DASHBOARD */}
        {appState === 'home' && (
            <Home 
                onNavigate={handleNavClick} 
                zenerProgress={0}
                isZenerRewardClaimed={false}
                onZenerWin={() => {}}
            />
        )}

        {/* PUBLIC BOARD */}
        {appState === 'chat' && <PublicBoard />}

        {/* INPUT STATE */}
        {appState === 'input' && (
          <div className="w-full space-y-10 animate-slide-up">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-serif text-ink font-light">Ask the Oracle</h2>
              <div className="w-16 h-0.5 bg-cinnabar mx-auto"></div>
              <p className="text-stone-500 text-sm font-serif italic">"Silence the mind, let the heart speak."</p>
            </div>

            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What is your heart seeking?"
              className="w-full bg-transparent border-b-2 border-stone-300 p-4 text-center text-xl text-ink placeholder:text-stone-300 focus:outline-none focus:border-cinnabar transition-all font-serif"
            />

            <div className="grid grid-cols-2 gap-6">
               {/* Deck Toggle */}
               <button 
                 onClick={handleDeckChange}
                 className="group p-6 border border-stone-200 bg-white/50 rounded-lg hover:border-cinnabar transition-all duration-300 flex flex-col items-center shadow-sm hover:shadow-md active:scale-95"
               >
                 <span className="text-[10px] text-stone-400 uppercase tracking-widest mb-2 group-hover:text-cinnabar">Tarot System</span>
                 <span className="font-serif text-lg text-ink font-bold">{deck === DeckSystem.WAITE ? '韦特 (Waite)' : '透特 (Thoth)'}</span>
               </button>

               {/* Mode Toggle */}
               <button 
                 onClick={handleModeChange}
                 className="group p-6 border border-stone-200 bg-white/50 rounded-lg hover:border-cinnabar transition-all duration-300 flex flex-col items-center shadow-sm hover:shadow-md active:scale-95"
               >
                 <span className="text-[10px] text-stone-400 uppercase tracking-widest mb-2 group-hover:text-cinnabar">Model</span>
                 <span className="font-serif text-lg text-ink font-bold">{mode === InterpretationMode.SANCIA ? '天地人 (Triad)' : '卡巴拉 (Tree)'}</span>
               </button>
            </div>

            <button
              onClick={handleStartDivination}
              disabled={!question}
              className={`w-full py-4 rounded-lg font-serif font-bold text-lg tracking-widest transition-all duration-300 shadow-lg ${question ? 'bg-cinnabar text-white hover:bg-red-800 transform hover:-translate-y-1 active:translate-y-0' : 'bg-stone-200 text-stone-400 cursor-not-allowed'}`}
            >
              START DIVINATION
            </button>
          </div>
        )}

        {/* SHUFFLING STATE */}
        {appState === 'shuffling' && (
          <div className="flex flex-col items-center justify-center space-y-12 animate-fade-in">
            {/* Chaotic Shuffle Animation */}
            <div className="relative w-32 h-52">
                {[...Array(5)].map((_, i) => (
                    <div 
                        key={i}
                        className="absolute inset-0 bg-cinnabarDim rounded-lg border border-gold/30 shadow-xl"
                        style={{
                            animation: `shuffle ${0.5 + i * 0.1}s infinite ease-in-out alternate`,
                            transformOrigin: 'bottom center',
                            zIndex: i
                        }}
                    ></div>
                ))}
            </div>
            
            <div className="text-center space-y-2">
                <p className="text-cinnabar font-serif text-xl tracking-widest animate-pulse">Shuffling the Cosmos...</p>
                <style>{`
                    @keyframes shuffle {
                        0% { transform: translateX(0) rotate(0); }
                        25% { transform: translateX(-20px) rotate(-5deg); }
                        50% { transform: translateX(20px) rotate(5deg); }
                        75% { transform: translateY(-10px) rotate(2deg); }
                        100% { transform: translateY(0) rotate(0); }
                    }
                `}</style>
            </div>
          </div>
        )}

        {/* READING STATE (Card Reveal) */}
        {appState === 'reading' && (
          <div className="w-full flex flex-col items-center space-y-8 animate-fade-in">
            <h3 className="text-2xl font-serif text-ink tracking-widest">Tap to Reveal Your Fate</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
               {cards.map((card, idx) => (
                  <div key={card.id} className="flex justify-center">
                    <CardComponent
                      card={card}
                      isRevealed={idx < revealedCount}
                      onClick={() => handleCardClick(idx)}
                      style={{ 
                          transitionDelay: `${idx * 100}ms`,
                          opacity: idx <= revealedCount ? 1 : 0.8
                      }}
                    />
                  </div>
               ))}
            </div>
            
            <div className="h-4 w-full bg-stone-100 rounded-full overflow-hidden mt-8 max-w-xs">
              <div 
                className="h-full bg-cinnabar transition-all duration-500 ease-out"
                style={{ width: `${(revealedCount / 6) * 100}%` }}
              ></div>
            </div>
            <p className="text-stone-400 text-xs font-serif uppercase tracking-widest">{revealedCount} / 6 Revealed</p>
          </div>
        )}

        {/* ANALYZING STATE */}
        {appState === 'analyzing' && (
          <div className="flex flex-col items-center justify-center space-y-8 animate-fade-in">
             <div className="w-24 h-24 relative">
                <div className="absolute inset-0 border-4 border-stone-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-cinnabar rounded-full border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-4xl animate-pulse">
                   🔮
                </div>
             </div>
             <div className="text-center">
               <h3 className="text-2xl font-serif text-ink mb-2">Consulting the Oracle</h3>
               <p className="text-stone-500 italic">Interpreting patterns through the lens of {mode === InterpretationMode.SANCIA ? 'Heaven, Earth, and Man' : 'the Kabbalistic Tree'}.</p>
             </div>
          </div>
        )}

        {/* RESULT STATE */}
        {appState === 'result' && analysis && (
          <div className="w-full animate-fade-in space-y-12 pb-12">
             
             {/* Result Header */}
             <div className="text-center space-y-4 border-b border-stone-200 pb-8">
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-ink">{analysis.summary}</h2>
                <p className="text-cinnabar font-serif italic text-lg max-w-2xl mx-auto">"{analysis.synthesis}"</p>
             </div>

             {/* Cards & Interpretations */}
             <div className="space-y-16">
                {analysis.cardInterpretations.map((interp, idx) => {
                   const card = cards.find(c => c.id === interp.cardId);
                   if (!card) return null;

                   return (
                     <div key={card.id} className="flex flex-col md:flex-row gap-8 items-center md:items-start group hover:bg-white/40 p-6 rounded-lg transition-colors border border-transparent hover:border-stone-100">
                        {/* Card Visual */}
                        <div className="flex-shrink-0 transform group-hover:scale-105 transition-transform duration-500">
                           <CardComponent card={card} isRevealed={true} className="pointer-events-none" />
                           <div className="mt-4 text-center">
                              <span className="block font-bold text-ink font-serif">{card.nameZh}</span>
                              <span className="block text-xs text-stone-500 uppercase tracking-wider">{card.isUpright ? 'Upright' : 'Reversed'}</span>
                           </div>
                        </div>

                        {/* Text Analysis */}
                        <div className="flex-1 space-y-4 text-left">
                           <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-cinnabar text-white flex items-center justify-center text-xs font-serif font-bold">{idx + 1}</span>
                              <h4 className="text-xl font-bold text-ink font-serif">{interp.coreMeaning}</h4>
                           </div>
                           
                           <div className="grid md:grid-cols-2 gap-6">
                              <div className="bg-white/60 p-4 rounded-sm border-l-2 border-stone-300">
                                 <h5 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Context Analysis</h5>
                                 <p className="font-serif text-stone-700 leading-relaxed text-sm">{interp.contextAnalysis}</p>
                              </div>
                              <div className="bg-white/60 p-4 rounded-sm border-l-2 border-cinnabar">
                                 <h5 className="text-xs font-bold text-cinnabar uppercase tracking-widest mb-2">Action Advice</h5>
                                 <p className="font-serif text-stone-700 leading-relaxed text-sm">{interp.actionAdvice}</p>
                              </div>
                           </div>
                        </div>
                     </div>
                   );
                })}
             </div>

             {/* Vision Generation Section */}
             <div className="flex flex-col items-center space-y-6 pt-12 border-t border-stone-200">
                 {!generatedImageUrl ? (
                     <div className="text-center space-y-4">
                        <h3 className="text-2xl font-serif text-ink">Manifest Vision</h3>
                        <p className="text-stone-500 italic">"Give form to the unseen forces."</p>
                        <button 
                          onClick={handleGenerateVision}
                          disabled={isVisionLoading}
                          className="px-8 py-3 bg-stone-800 text-white font-serif tracking-widest hover:bg-cinnabar disabled:opacity-50 transition-colors shadow-lg"
                        >
                          {isVisionLoading ? 'Manifesting...' : 'GENERATE INK ART'}
                        </button>
                     </div>
                 ) : (
                     <div className="space-y-4 animate-fade-in text-center">
                        <h3 className="text-xl font-serif text-ink mb-4">The Vision</h3>
                        <div className="p-2 bg-white border border-stone-200 shadow-xl inline-block transform rotate-1">
                            <img src={generatedImageUrl} alt="Tarot Vision" className="max-w-md w-full rounded-sm filter sepia-[0.3] contrast-125" />
                        </div>
                        <p className="text-xs text-stone-400 uppercase tracking-widest mt-2">AI Generated • Ink Style</p>
                     </div>
                 )}
             </div>

             {/* Action Buttons */}
             <div className="flex justify-center gap-6 pt-8">
                 <button 
                   onClick={handleRestart}
                   className="px-8 py-3 border border-stone-300 text-stone-500 font-serif font-bold tracking-widest hover:border-ink hover:text-ink transition-all"
                 >
                   NEW READING
                 </button>
                 <button 
                   onClick={() => handleNavClick('home')}
                   className="px-8 py-3 bg-ink text-white font-serif font-bold tracking-widest hover:bg-cinnabar transition-all shadow-md"
                 >
                   RETURN HOME
                 </button>
             </div>
          </div>
        )}
        
      </main>

      <Footer />
    </div>
  );
};

export default App;