import React, { useState, useEffect, useRef } from 'react';
import Splash from './Splash';
import Footer from './Footer';
import CardComponent from './CardComponent';
import LearningHub from './LearningHub';
import PublicBoard from './PublicBoard';
import Home from './Home';
import TarotRateTest from './TarotRateTest';
import ResourcesZone from './ResourcesZone';
import AdminLogin, { AdminDashboard } from './AdminLogin';
import UserProfile from './UserProfile';
import { DeckSystem, InterpretationMode, DrawnCard, FullReadingResponse } from '../types';
import { drawCards } from '../utils/tarotEngine';
import { generateInterpretation } from '../services/deepseekService';
import { ACKNOWLEDGEMENTS } from '../constants';
import { playSound } from '../utils/soundEngine';

const App: React.FC = () => {
  const [appState, setAppState] = useState<'intro' | 'home' | 'chat' | 'input' | 'shuffling' | 'reading' | 'analyzing' | 'result' | 'thanks' | 'learning' | 'rateTest' | 'resources' | 'adminLogin' | 'adminDashboard' | 'userProfile'>('intro');
  
  // User Inputs
  const [question, setQuestion] = useState('');
  const [deck, setDeck] = useState<DeckSystem>(DeckSystem.WAITE);
  const [mode, setMode] = useState<InterpretationMode>(InterpretationMode.SANCIA);
  
  // Session Data
  const [cards, setCards] = useState<DrawnCard[]>([]);
  const [analysis, setAnalysis] = useState<FullReadingResponse | null>(null);
  
  // UI State
  const [revealedCount, setRevealedCount] = useState(0);
  
  // User Account & Points System
  const [points, setPoints] = useState<number>(0);
  const [zenerProgress, setZenerProgress] = useState<number>(0);
  const [lastZenerDate, setLastZenerDate] = useState<string>('');

  // Refs
  const shuffleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load User Data
  useEffect(() => {
    const savedPoints = localStorage.getItem('zg_user_points');
    if (savedPoints) setPoints(parseInt(savedPoints, 10));
    else {
        // First time bonus? Let's give 1 free point
        setPoints(1);
        localStorage.setItem('zg_user_points', '1');
    }

    const savedZener = localStorage.getItem('zg_user_zener');
    if (savedZener) {
        const parsed = JSON.parse(savedZener);
        // Check if date is today
        if (parsed.date === new Date().toDateString()) {
            setZenerProgress(parsed.count);
            setLastZenerDate(parsed.date);
        } else {
            // New day, reset progress
            setZenerProgress(0);
            setLastZenerDate(new Date().toDateString());
        }
    } else {
        setLastZenerDate(new Date().toDateString());
    }
  }, []);

  // Save User Data
  useEffect(() => {
     localStorage.setItem('zg_user_points', points.toString());
  }, [points]);

  useEffect(() => {
     localStorage.setItem('zg_user_zener', JSON.stringify({
         date: lastZenerDate,
         count: zenerProgress
     }));
  }, [zenerProgress, lastZenerDate]);


  // Logic: Handle Zener Win (Daily Task)
  const handleZenerWin = () => {
      // Check if already claimed for today (progress >= 20)
      if (zenerProgress >= 20) return;

      const newProgress = zenerProgress + 1;
      setZenerProgress(newProgress);

      if (newProgress === 20) {
          // Reward!
          setPoints(prev => prev + 1);
          playSound('chime');
          alert("每日直觉修炼完成！获得1积分。");
      }
  };

  // Logic: Redeem Code
  const handleRedeemCode = (code: string): boolean => {
      // Simple hardcoded codes
      if (code === 'HYA20061222') {
          // Check if already used? For simplicity in this demo, we allow it (or user can abuse it, strictly usually requires backend)
          // To prevent simple spam, maybe we just add 10 points.
          setPoints(prev => prev + 10);
          return true;
      }
      return false;
  };


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
    
    // COST CHECK
    if (points < 1) {
        playSound('click');
        alert("积分不足 (Insufficient Points)。\n请联系如懿获取积分，或完成每日直觉修炼。");
        return;
    }

    // DEDUCT POINT
    setPoints(prev => prev - 1);

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

  const handleNavClick = (target: 'learning' | 'input' | 'chat' | 'home' | 'rateTest' | 'resources' | 'profile') => {
      playSound('click');
      // If user navigates away, cancel any pending shuffle action
      if (shuffleTimerRef.current) clearTimeout(shuffleTimerRef.current);
      
      if (target === 'profile') {
          setAppState('userProfile');
      } else {
          setAppState(target);
      }
  };

  const handleRestart = () => {
      playSound('click');
      setAppState('input');
      setQuestion('');
      setCards([]);
      setAnalysis(null);
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
      alert("无法连接到DeepSeek神谕。请检查网络或配置，稍后再试。");
      setAppState('reading');
    }
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

  if (appState === 'userProfile') {
      return (
        <UserProfile 
            onBack={() => handleNavClick('home')} 
            points={points}
            onRedeem={handleRedeemCode}
        />
      );
  }

  if (appState === 'adminLogin') {
      return <AdminLogin onBack={() => handleNavClick('home')} onLoginSuccess={() => setAppState('adminDashboard')} />;
  }

  if (appState === 'adminDashboard') {
      return <AdminDashboard onLogout={() => handleNavClick('home')} />;
  }

  if (appState === 'thanks') {
    return (
      <div className="min-h-screen bg-paper flex flex-col items-center justify-center p-8 animate-fade-in relative overflow-hidden">
         <div className="max-w-4xl w-full border border-stone-200 p-12 bg-white relative my-8 text-center">
            <h2 className="text-4xl font-serif text-ink mb-12 font-bold tracking-tight">ACKNOWLEDGMENTS</h2>
            
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8 justify-center mb-16">
              {ACKNOWLEDGEMENTS.map((person, i) => (
                <div key={i} className="flex flex-col items-center group">
                  <div className="w-16 h-16 rounded-full bg-stone-50 flex items-center justify-center group-hover:bg-cinnabar transition-colors duration-300">
                     <span className="text-2xl filter grayscale group-hover:grayscale-0 transition-all">
                        {person.avatarSeed}
                     </span>
                  </div>
                  <span className="mt-4 text-xs font-bold font-sans tracking-widest text-ink">{person.name}</span>
                </div>
              ))}
            </div>
            
            <div className="flex justify-center">
              <button 
                onClick={() => handleNavClick('home')}
                className="px-10 py-3 bg-ink text-white font-sans text-xs font-bold tracking-[0.2em] hover:bg-cinnabar transition-colors"
              >
                RETURN HOME
              </button>
            </div>
         </div>
         <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper text-ink font-sans selection:bg-cinnabar selection:text-white pb-24 transition-colors duration-500 relative">
      
      {/* Header - International Style: Clean, Functional */}
      <nav className="px-6 py-6 flex justify-between items-center bg-paper sticky top-0 z-40 border-b-2 border-cinnabar/10">
        <div className="flex items-center gap-4 cursor-pointer group" onClick={() => handleNavClick('home')}>
            <div className="w-10 h-10 bg-cinnabar text-white flex items-center justify-center font-serif font-black text-2xl">
              中
            </div>
            <div className="flex flex-col">
              <h1 className="font-serif text-xl tracking-widest text-ink font-bold leading-none">中宫塔罗</h1>
              <span className="text-[10px] text-stone-400 font-sans font-bold uppercase tracking-[0.2em] mt-1">Zhonggong Tarot</span>
            </div>
        </div>
        
        {/* Navigation Links */}
        <div className="flex items-center gap-8">
           <div className="hidden md:flex gap-6">
                <button 
                    onClick={() => handleNavClick('input')}
                    className={`text-xs font-bold tracking-[0.15em] uppercase hover:text-cinnabar transition-colors ${appState === 'input' ? 'text-cinnabar' : 'text-stone-400'}`}
                >
                    Divination
                </button>
                <button 
                    onClick={() => handleNavClick('learning')}
                    className="text-xs font-bold tracking-[0.15em] uppercase hover:text-cinnabar transition-colors text-stone-400"
                >
                    Academy
                </button>
           </div>
           
           <div className="h-6 w-px bg-stone-200 hidden md:block"></div>

           <button 
                onClick={() => handleNavClick('profile')}
                className="text-xl transition-colors text-stone-400 hover:text-cinnabar"
                title="User Profile"
            >
                👤
            </button>

           <button 
                onClick={() => handleNavClick('chat')}
                className={`text-xl transition-colors ${appState === 'chat' ? 'text-cinnabar' : 'text-stone-400 hover:text-cinnabar'}`}
                title="Message Board"
            >
                ✎
            </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className={`container mx-auto px-6 py-12 flex flex-col items-center justify-center relative z-10 transition-all duration-300 ${appState === 'home' ? 'max-w-6xl' : 'max-w-5xl'}`}>
        
        {/* HOME / DASHBOARD */}
        {appState === 'home' && (
            <Home 
                onNavigate={handleNavClick} 
                zenerProgress={zenerProgress}
                isZenerRewardClaimed={zenerProgress >= 20}
                onZenerWin={handleZenerWin}
            />
        )}

        {/* PUBLIC BOARD */}
        {appState === 'chat' && <PublicBoard />}

        {/* INPUT STATE */}
        {appState === 'input' && (
          <div className="w-full animate-slide-up max-w-xl mx-auto">
            <div className="text-left mb-12 border-l-4 border-cinnabar pl-6">
              <h2 className="text-5xl font-serif text-ink font-bold leading-tight">Ask the<br/>Oracle.</h2>
              <div className="flex items-center gap-2 mt-4">
                  <span className="text-stone-400 text-sm font-sans font-bold uppercase tracking-widest">Cost: 1 Point</span>
                  <span className="text-stone-300">|</span>
                  <span className={`text-sm font-bold ${points > 0 ? 'text-green-600' : 'text-cinnabar'}`}>Balance: {points}</span>
              </div>
            </div>

            <div className="relative mb-12">
                <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What is your query?"
                className="w-full bg-transparent border-b-2 border-stone-200 py-4 text-2xl text-ink placeholder:text-stone-300 focus:outline-none focus:border-cinnabar transition-all font-serif"
                />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-12">
               {/* Deck Toggle */}
               <button 
                 onClick={handleDeckChange}
                 className="p-6 border border-stone-200 hover:border-cinnabar transition-all duration-300 flex flex-col items-start group bg-white"
               >
                 <span className="text-[10px] text-stone-400 uppercase font-bold tracking-widest mb-2 group-hover:text-cinnabar">System</span>
                 <span className="font-serif text-xl text-ink font-bold">{deck === DeckSystem.WAITE ? 'Waite' : 'Thoth'}</span>
               </button>

               {/* Mode Toggle */}
               <button 
                 onClick={handleModeChange}
                 className="p-6 border border-stone-200 hover:border-cinnabar transition-all duration-300 flex flex-col items-start group bg-white"
               >
                 <span className="text-[10px] text-stone-400 uppercase font-bold tracking-widest mb-2 group-hover:text-cinnabar">Model</span>
                 <span className="font-serif text-xl text-ink font-bold">{mode === InterpretationMode.SANCIA ? 'Triad' : 'Tree'}</span>
               </button>
            </div>

            <button
              onClick={handleStartDivination}
              disabled={!question}
              className={`w-full py-5 font-sans font-bold text-sm uppercase tracking-[0.2em] transition-all duration-300 ${question ? 'bg-cinnabar text-white hover:bg-black' : 'bg-stone-100 text-stone-300 cursor-not-allowed'}`}
            >
              Initiate Reading (1 Point)
            </button>
          </div>
        )}

        {/* SHUFFLING STATE */}
        {appState === 'shuffling' && (
          <div className="flex flex-col items-center justify-center space-y-12 animate-fade-in w-full h-[60vh]">
            <div className="relative w-32 h-52">
                {[...Array(3)].map((_, i) => (
                    <div 
                        key={i}
                        className="absolute inset-0 bg-cinnabar border-2 border-white shadow-lg"
                        style={{
                            animation: `shuffle ${0.6 + i * 0.1}s infinite cubic-bezier(0.4, 0, 0.2, 1) alternate`,
                            transformOrigin: 'bottom center',
                            zIndex: i,
                            left: i * 2,
                            top: i * 2
                        }}
                    >
                        <div className="absolute inset-2 border border-white/30"></div>
                    </div>
                ))}
            </div>
            
            <div className="text-center">
                <p className="text-ink font-sans font-bold text-sm tracking-[0.3em] uppercase animate-pulse">Shuffling</p>
                <style>{`
                    @keyframes shuffle {
                        0% { transform: translateX(0) rotate(0); }
                        100% { transform: translateX(40px) rotate(10deg); }
                    }
                `}</style>
            </div>
          </div>
        )}

        {/* READING STATE (Card Reveal) */}
        {appState === 'reading' && (
          <div className="w-full flex flex-col items-center space-y-12 animate-fade-in">
            <div className="text-center space-y-2">
                <h3 className="text-3xl font-serif text-ink font-bold">The Spread</h3>
                <p className="text-stone-400 text-xs font-sans uppercase tracking-[0.2em]">{revealedCount} / 6 Revealed</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-12">
               {cards.map((card, idx) => (
                  <div key={card.id} className="flex justify-center">
                    <CardComponent
                      card={card}
                      isRevealed={idx < revealedCount}
                      onClick={() => handleCardClick(idx)}
                      style={{ 
                          opacity: idx <= revealedCount ? 1 : 0.5,
                          transform: idx > revealedCount ? 'scale(0.95)' : 'scale(1)'
                      }}
                    />
                  </div>
               ))}
            </div>
            
            {/* Progress Bar */}
            <div className="h-1 w-full bg-stone-100 mt-12 max-w-md">
              <div 
                className="h-full bg-cinnabar transition-all duration-500 ease-out"
                style={{ width: `${(revealedCount / 6) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* ANALYZING STATE */}
        {appState === 'analyzing' && (
          <div className="flex flex-col items-center justify-center space-y-8 animate-fade-in h-[50vh]">
             <div className="w-16 h-16 border-4 border-stone-200 border-t-cinnabar rounded-full animate-spin"></div>
             <div className="text-center">
               <h3 className="text-xl font-serif text-ink font-bold">Interpreting</h3>
               <p className="text-stone-400 text-xs font-sans font-bold uppercase tracking-widest mt-2">Consulting DeepSeek</p>
             </div>
          </div>
        )}

        {/* RESULT STATE - OPTIMIZED GALLERY LAYOUT */}
        {appState === 'result' && analysis && (
          <div className="w-full animate-fade-in pb-20">
             
             {/* 1. The Verdict Header */}
             <div className="text-center mb-16 space-y-6">
                <div className="inline-block px-4 py-1 border border-cinnabar text-cinnabar text-xs font-sans font-bold uppercase tracking-[0.2em] rounded-full">
                   Reading Complete
                </div>
                <h2 className="text-4xl md:text-6xl font-serif font-black text-ink leading-tight max-w-4xl mx-auto">
                    {analysis.summary}
                </h2>
             </div>

             {/* 2. Synthesis - Editorial Style */}
             <div className="max-w-3xl mx-auto mb-20">
                <div className="bg-white border-t-4 border-cinnabar p-8 md:p-12 shadow-sm relative">
                    <span className="absolute -top-6 left-8 text-8xl text-stone-100 font-serif z-0">“</span>
                    <h3 className="relative z-10 text-2xl font-serif font-bold text-ink mb-6">Oracle's Synthesis</h3>
                    <p className="relative z-10 text-stone-700 font-serif text-lg leading-loose italic">
                        {analysis.synthesis}
                    </p>
                </div>
             </div>

             {/* 3. The Gallery - Grid Layout */}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {analysis.cardInterpretations.map((interp, idx) => {
                   const card = cards.find(c => c.id === interp.cardId);
                   if (!card) return null;

                   return (
                     <div key={card.id} className="group bg-white border border-stone-200 hover:border-cinnabar transition-all duration-300 flex flex-col relative overflow-hidden">
                        
                        {/* Integrated Visual Header */}
                        <div className="relative h-32 bg-stone-50 border-b border-stone-100 overflow-visible">
                            {/* Card floats over the text area */}
                            <div className="absolute -bottom-12 left-6 z-10 transform group-hover:-translate-y-2 transition-transform duration-500">
                                <CardComponent 
                                    card={card} 
                                    isRevealed={true} 
                                    // Scale down slightly for the grid
                                    style={{ transform: 'scale(0.65)', transformOrigin: 'top left' }}
                                    className="shadow-md pointer-events-none"
                                />
                            </div>
                            {/* Index Number */}
                            <div className="absolute top-4 right-4 text-4xl font-serif font-bold text-stone-200">
                                {idx + 1}
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="pt-16 pb-8 px-8 flex-1 flex flex-col">
                            {/* Tag */}
                            <span className="text-[10px] font-bold font-sans uppercase tracking-widest text-stone-400 mb-2">
                                {card.isUpright ? 'Upright' : 'Reversed'} • {card.suit || 'Major'}
                            </span>
                            
                            {/* Core Meaning Headline */}
                            <h4 className="text-xl font-bold font-serif text-ink mb-4 group-hover:text-cinnabar transition-colors">
                                {interp.coreMeaning}
                            </h4>

                            {/* Deep Analysis */}
                            <p className="text-sm font-serif text-stone-600 leading-relaxed text-justify mb-6 flex-1">
                                {interp.contextAnalysis}
                            </p>

                            {/* Action Block */}
                            <div className="bg-stone-50 border-l-2 border-cinnabar p-3 mt-auto">
                                <span className="block text-[9px] font-bold text-cinnabar uppercase tracking-widest mb-1">Directive</span>
                                <p className="text-xs font-serif text-ink font-medium leading-normal">
                                    {interp.actionAdvice}
                                </p>
                            </div>
                        </div>
                     </div>
                   );
                })}
             </div>

             {/* Footer Actions */}
             <div className="flex justify-center gap-6 pt-20 border-t border-stone-100 mt-20">
                 <button 
                   onClick={handleRestart}
                   className="px-8 py-3 border border-stone-300 text-stone-500 font-sans text-xs font-bold tracking-widest hover:border-black hover:text-black transition-all"
                 >
                   NEW READING
                 </button>
                 <button 
                   onClick={() => handleNavClick('home')}
                   className="px-8 py-3 bg-ink text-white font-sans text-xs font-bold tracking-widest hover:bg-cinnabar transition-all shadow-md"
                 >
                   RETURN HOME
                 </button>
             </div>
          </div>
        )}
        
      </main>

      <Footer onAdminClick={() => setAppState('adminLogin')} />
    </div>
  );
};

export default App;