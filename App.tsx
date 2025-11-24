
import React, { useState, useEffect, useRef } from 'react';
import Splash from './components/Splash';
import Footer from './components/Footer';
import CardComponent from './components/CardComponent';
import LearningHub from './components/LearningHub';
import { DeckSystem, InterpretationMode, DrawnCard, FullReadingResponse } from './types';
import { drawCards } from './utils/tarotEngine';
import { generateInterpretation, generateVisionImage } from './services/geminiService';
import { ACKNOWLEDGEMENTS } from './constants';
import { playSound } from './utils/soundEngine';

const App: React.FC = () => {
  const [appState, setAppState] = useState<'intro' | 'input' | 'shuffling' | 'reading' | 'analyzing' | 'result' | 'thanks' | 'learning'>('intro');
  
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

  const handleSplashComplete = () => {
    playSound('chime');
    setAppState('input');
  };

  const handleStartDivination = () => {
    if (!question.trim()) return;
    playSound('click');
    setAppState('shuffling');
    
    // Shuffle Animation Time
    setTimeout(() => {
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

  const handleNavClick = (target: 'learning' | 'input') => {
      playSound('click');
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
      alert("Interpretation failed. Please check your network or API key.");
      setAppState('reading');
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
    }
    setIsVisionLoading(false);
  };

  // --- RENDER HELPERS ---

  if (appState === 'intro') {
    return <Splash onComplete={handleSplashComplete} />;
  }

  if (appState === 'learning') {
    return <LearningHub onBack={() => handleNavClick('input')} />;
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
                onClick={() => handleNavClick('input')}
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
      <nav className="p-6 flex justify-between items-center bg-paper/80 backdrop-blur-sm sticky top-0 z-40 border-b border-stone-200 shadow-sm transition-all">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleNavClick('input')}>
            <div className="w-8 h-8 bg-cinnabar text-white flex items-center justify-center rounded-sm font-serif font-black text-xl shadow-sm hover:bg-cinnabarDim transition-colors">
              中
            </div>
            <h1 className="font-serif text-lg tracking-widest text-ink font-bold hidden md:block">中宫塔罗</h1>
        </div>
        
        {/* Top Right Actions */}
        <div className="flex gap-4 items-center">
           {appState === 'input' && (
             <button 
               onClick={() => setAppState('thanks')}
               className="text-stone-400 hover:text-cinnabar text-xs font-serif font-bold tracking-wide transition-colors"
             >
               致谢
             </button>
           )}
           {appState === 'input' && (
             <button 
               onClick={() => handleNavClick('learning')}
               className="text-stone-500 hover:text-cinnabar text-sm font-serif font-bold tracking-wide transition-colors"
             >
               书院 (Learning)
             </button>
           )}
           {appState !== 'intro' && (
              <div className="text-[10px] text-cinnabar border border-cinnabar px-2 py-0.5 rounded-full font-serif tracking-wider uppercase hidden md:block">
                 {deck} • {mode === InterpretationMode.SANCIA ? 'Triad' : 'Tree'}
              </div>
           )}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="container mx-auto px-4 py-8 max-w-2xl min-h-[70vh] flex flex-col items-center justify-center relative z-10">
        
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
          </div>
        )}

        {/* ANALYZING STATE */}
        {appState === 'analyzing' && (
            <div className="flex flex-col items-center justify-center space-y-12 animate-fade-in py-12">
                {/* Mystical Loader */}
                <div className="relative w-48 h-48">
                    <div className="absolute inset-0 border border-cinnabar/10 rounded-full animate-[spin_10s_linear_infinite]"></div>
                    <div className="absolute inset-4 border border-gold/20 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
                    <div className="absolute inset-8 border border-ink/10 rounded-full animate-[spin_20s_linear_infinite]"></div>
                    
                    {/* Pulsing Core */}
                    <div className="absolute inset-0 flex items-center justify-center">
                         <div className="w-24 h-24 bg-cinnabar/5 rounded-full blur-xl animate-pulse"></div>
                         <div className="w-16 h-16 bg-gold/10 rounded-full blur-md animate-bounce"></div>
                         <span className="relative z-10 text-4xl text-ink/80 font-serif font-bold animate-pulse">?</span>
                    </div>
                </div>
                
                <div className="text-center space-y-2">
                   <h3 className="text-2xl font-serif text-ink tracking-widest">Interpreting Signs</h3>
                   <div className="flex gap-1 justify-center">
                      <div className="w-1 h-1 bg-cinnabar rounded-full animate-bounce delay-0"></div>
                      <div className="w-1 h-1 bg-cinnabar rounded-full animate-bounce delay-100"></div>
                      <div className="w-1 h-1 bg-cinnabar rounded-full animate-bounce delay-200"></div>
                   </div>
                   <p className="text-stone-500 font-serif italic text-sm mt-4">Consulting the {deck} Oracle...</p>
                </div>
            </div>
        )}

        {/* RESULT STATE */}
        {appState === 'result' && analysis && (
           <div className="w-full space-y-12 animate-slide-up pb-12">
              {/* Summary Header */}
              <div className="text-center space-y-4 border-b border-cinnabar/20 pb-8">
                  <h2 className="text-3xl font-serif font-bold text-ink">{question}</h2>
                  <p className="text-lg font-serif text-stone-600 leading-relaxed italic max-w-xl mx-auto">
                      "{analysis.summary}"
                  </p>
                  
                  {/* Vision Generation Button */}
                  {!generatedImageUrl && (
                      <button 
                        onClick={handleGenerateVision}
                        disabled={isVisionLoading}
                        className="mt-4 px-6 py-2 border border-cinnabar text-cinnabar text-xs tracking-widest hover:bg-cinnabar hover:text-white transition-all disabled:opacity-50 font-serif"
                      >
                         {isVisionLoading ? 'Manifesting Vision...' : 'Generate Ink Vision'}
                      </button>
                  )}
                  {generatedImageUrl && (
                      <div className="mt-8 animate-fade-in flex justify-center">
                          <img src={generatedImageUrl} alt="Vision" className="w-64 h-64 object-cover rounded-sm shadow-xl border-4 border-white" />
                      </div>
                  )}
              </div>

              {/* Cards Analysis */}
              <div className="space-y-12">
                  {analysis.cardInterpretations.map((interp, idx) => {
                      const card = cards.find(c => c.id === interp.cardId);
                      return (
                          <div key={interp.cardId} className="bg-white/60 p-6 md:p-8 rounded-lg shadow-sm border border-stone-100 flex flex-col md:flex-row gap-8 items-start hover:border-cinnabar/30 transition-colors">
                              {/* Left: Card Visual */}
                              <div className="w-full md:w-1/3 flex flex-col items-center">
                                  <CardComponent card={card} isRevealed={true} className="pointer-events-none transform scale-90 md:scale-100" />
                                  <div className="mt-4 text-center">
                                      <span className="block font-bold text-ink font-serif">{card?.nameZh}</span>
                                      <span className="block text-xs text-stone-400 uppercase tracking-widest">{card?.name}</span>
                                      <span className={`inline-block mt-2 px-2 py-0.5 text-[10px] rounded border ${card?.isUpright ? 'border-stone-300 text-stone-500' : 'border-cinnabar text-cinnabar'}`}>
                                          {card?.isUpright ? '正位 Upright' : '逆位 Reversed'}
                                      </span>
                                  </div>
                              </div>

                              {/* Right: Text */}
                              <div className="w-full md:w-2/3 space-y-6">
                                  <div>
                                      <h4 className="text-cinnabar font-bold text-sm uppercase tracking-widest mb-1">Core Meaning</h4>
                                      <p className="text-ink font-serif leading-relaxed">{interp.coreMeaning}</p>
                                  </div>
                                  <div>
                                      <h4 className="text-stone-400 font-bold text-sm uppercase tracking-widest mb-1">Interpretation</h4>
                                      <p className="text-stone-700 font-serif leading-relaxed text-sm md:text-base">{interp.contextAnalysis}</p>
                                  </div>
                                  <div className="bg-stone-50 p-4 rounded border-l-2 border-cinnabar">
                                      <h4 className="text-ink font-bold text-xs uppercase tracking-widest mb-1">Action</h4>
                                      <p className="text-stone-600 font-serif italic text-sm">{interp.actionAdvice}</p>
                                  </div>
                              </div>
                          </div>
                      );
                  })}
              </div>

              {/* Final Synthesis */}
              <div className="bg-ink text-paper p-8 md:p-12 rounded-sm shadow-xl text-center space-y-6 relative overflow-hidden">
                  <div className="absolute inset-0 bg-paper-texture opacity-10"></div>
                  <h3 className="text-2xl font-serif text-gold tracking-widest relative z-10">The Oracle Speaks</h3>
                  <div className="w-12 h-0.5 bg-gold/50 mx-auto relative z-10"></div>
                  <p className="text-lg md:text-xl font-serif leading-loose relative z-10 text-stone-200">
                      {analysis.synthesis}
                  </p>
                  
                  <button 
                    onClick={handleRestart}
                    className="mt-8 px-8 py-3 border border-gold/50 text-gold hover:bg-gold hover:text-ink transition-all font-serif tracking-widest text-sm relative z-10"
                  >
                      New Reading
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
