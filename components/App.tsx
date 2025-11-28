
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
import AdminLogin, { AdminDashboard } from './components/AdminLogin';
import UserProfile from './components/UserProfile';
import AuthModal from './components/AuthModal';
import { DeckSystem, InterpretationMode, DrawnCard, FullReadingResponse } from './types';
import { drawCards } from './utils/tarotEngine';
import { generateInterpretation } from './services/deepseekService';
import { ACKNOWLEDGEMENTS } from './constants';
import { playSound } from './utils/soundEngine';

const App: React.FC = () => {
  const [appState, setAppState] = useState<'intro' | 'home' | 'chat' | 'input' | 'shuffling' | 'reading' | 'analyzing' | 'result' | 'thanks' | 'learning' | 'rateTest' | 'resources' | 'notes' | 'adminLogin' | 'adminDashboard' | 'userProfile'>('intro');
  
  // User Inputs
  const [question, setQuestion] = useState('');
  const [deck, setDeck] = useState<DeckSystem>(DeckSystem.WAITE);
  const [mode, setMode] = useState<InterpretationMode>(InterpretationMode.SANCIA);
  
  // Session Data
  const [cards, setCards] = useState<DrawnCard[]>([]);
  const [analysis, setAnalysis] = useState<FullReadingResponse | null>(null);
  
  // UI State
  const [revealedCount, setRevealedCount] = useState(0);

  // User Account & Auth
  const [username, setUsername] = useState<string>('');
  const [points, setPoints] = useState<number>(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  // Zener
  const [zenerProgress, setZenerProgress] = useState<number>(0);
  const [isZenerRewardClaimed, setIsZenerRewardClaimed] = useState(false);
  
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

  // Check for persisted login
  useEffect(() => {
    const savedUser = localStorage.getItem('zg_username');
    if (savedUser) {
        // Attempt sync
        fetch('/api/user/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: savedUser })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                setUsername(savedUser);
                setPoints(data.points);
                setIsLoggedIn(true);
                const today = new Date().toDateString();
                if (data.lastZenerDate === today) {
                    setIsZenerRewardClaimed(true);
                    setZenerProgress(20); 
                }
            } else {
                localStorage.removeItem('zg_username');
            }
        })
        .catch(() => {
            // If offline, maybe keep logged out or use simple cache? 
            // For security, require re-login if server unreachable for sync
            console.log("Sync failed");
        });
    }
    
    // Ensure device ID exists
    if (!localStorage.getItem('zg_device_id')) {
        const did = 'DEV-' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
        localStorage.setItem('zg_device_id', did);
    }
  }, []);

  const handleLoginSuccess = (user: string, pts: number, lastZenerDate: string) => {
      setUsername(user);
      setPoints(pts);
      setIsLoggedIn(true);
      localStorage.setItem('zg_username', user);
      
      const today = new Date().toDateString();
      if (lastZenerDate === today) {
          setIsZenerRewardClaimed(true);
          setZenerProgress(20);
      } else {
          setIsZenerRewardClaimed(false);
          setZenerProgress(0);
      }
  };

  const handleLogout = () => {
      setUsername('');
      setPoints(0);
      setIsLoggedIn(false);
      localStorage.removeItem('zg_username');
      setAppState('home');
      playSound('click');
  };

  const handleZenerWin = async () => {
      if (!isLoggedIn) return; // Silent return, only logged in can play effectively
      if (isZenerRewardClaimed) return;

      const newProgress = zenerProgress + 1;
      setZenerProgress(newProgress);

      if (newProgress >= 20) {
          try {
              const res = await fetch('/api/user/zener-reward', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ username })
              });
              const data = await res.json();
              
              if (data.success) {
                  setPoints(data.points);
                  setIsZenerRewardClaimed(true);
                  playSound('chime');
                  alert("每日直觉修炼完成！获得1积分 (1 Point Added)。");
              } else {
                  setIsZenerRewardClaimed(true);
              }
          } catch (e) {
               console.error("Zener Reward Failed");
          }
      }
  };

  const refreshUserData = async () => {
      if (!username) return;
      try {
        const res = await fetch('/api/user/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
        });
        const data = await res.json();
        if (data.success) setPoints(data.points);
      } catch (e) {}
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

  // Require Auth Wrapper
  const requireAuth = (action: () => void) => {
      if (isLoggedIn) {
          action();
      } else {
          playSound('click');
          setShowAuthModal(true);
      }
  };

  const handleStartDivination = async () => {
    if (!question.trim()) return;
    
    // BACKEND DEDUCT
    try {
        const res = await fetch('/api/user/deduct', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
        });
        const data = await res.json();
        
        if (data.success) {
            setPoints(data.points);
            playSound('click');
            setAppState('shuffling');
            
            if (shuffleTimerRef.current) clearTimeout(shuffleTimerRef.current);

            shuffleTimerRef.current = setTimeout(() => {
                const drawn = drawCards(6, deck);
                setCards(drawn);
                setRevealedCount(0);
                playSound('slide');
                setAppState('reading');
            }, 3000);

        } else {
            playSound('click');
            alert(`无法开始: ${data.message || '余额不足'}`);
            return;
        }
    } catch (e) {
        alert("Server connection error.");
    }
  };

  const handleCardClick = (index: number) => {
    if (appState !== 'reading') return;
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

  const handleNavClick = (target: any) => {
      playSound('click');
      if (shuffleTimerRef.current) clearTimeout(shuffleTimerRef.current);
      
      if (target === 'profile') {
        if (!isLoggedIn) {
            setShowAuthModal(true);
        } else {
            refreshUserData();
            setAppState('userProfile');
        }
      } else if (target === 'input' || target === 'rateTest') {
          // These require auth eventually, but we let them navigate there, 
          // blocking the actual action inside or via `requireAuth` if desired.
          // For UX, better to let them see the page but block action.
          setAppState(target);
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
        playSound('chime');
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
      alert("Interpretation encountered a cosmic disturbance.");
      setAppState('reading');
    }
  };

  // --- RENDER HELPERS ---

  if (appState === 'intro') {
    return <Splash onComplete={handleSplashComplete} />;
  }

  return (
    <div className="min-h-screen bg-paper text-ink font-sans selection:bg-cinnabar selection:text-white pb-24 transition-colors duration-500 relative">
      <div className="fixed inset-0 bg-noise opacity-5 pointer-events-none z-0"></div>
      
      {/* Auth Modal Overlay */}
      {showAuthModal && (
          <AuthModal 
            onClose={() => setShowAuthModal(false)} 
            onLoginSuccess={handleLoginSuccess}
          />
      )}

      {/* Ripple Effects */}
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
             className={`hidden md:block px-5 py-2 rounded-sm text-sm font-serif font-bold tracking-wide transition-all ${appState === 'input' ? 'bg-ink text-white shadow-md' : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-ink'}`}
           >
             占卜 (Divination)
           </button>
           
           <button 
             onClick={() => handleNavClick('learning')}
             className="hidden md:block px-5 py-2 rounded-sm text-sm font-serif font-bold tracking-wide transition-all bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-ink"
           >
             书院 (Academy)
           </button>

            {/* Profile Button */}
            <button 
                onClick={() => handleNavClick('profile')}
                className={`w-8 h-8 flex items-center justify-center rounded-full border transition-all relative ${isLoggedIn ? 'border-cinnabar text-cinnabar' : 'border-stone-200 text-stone-400 hover:border-ink'}`}
                title={isLoggedIn ? `Logged in as ${username}` : "Login / Register"}
            >
                {isLoggedIn ? '👤' : '🔑'}
                {isLoggedIn && points > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-cinnabar text-white text-[9px] flex items-center justify-center rounded-full">
                        {points}
                    </span>
                )}
            </button>

           <button 
                onClick={() => handleNavClick('chat')}
                className={`w-8 h-8 flex items-center justify-center rounded-full border transition-all ${appState === 'chat' ? 'border-cinnabar text-cinnabar' : 'border-stone-200 text-stone-400 hover:text-cinnabar hover:border-cinnabar'}`}
                title="Message Board"
            >
                ✎
            </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className={`container mx-auto px-4 py-8 min-h-[70vh] flex flex-col items-center justify-center relative z-10 transition-all duration-300 ${appState === 'home' || appState === 'chat' ? 'max-w-5xl' : 'max-w-2xl'}`}>
        
        {/* HOME / DASHBOARD */}
        {appState === 'home' && (
            <Home 
                onNavigate={handleNavClick} 
                zenerProgress={zenerProgress}
                isZenerRewardClaimed={isZenerRewardClaimed}
                onZenerWin={() => {
                    if (isLoggedIn) handleZenerWin();
                    else setShowAuthModal(true);
                }}
                points={points}
                userId={isLoggedIn ? username : 'Guest'}
            />
        )}

        {appState === 'chat' && <PublicBoard />}
        
        {appState === 'learning' && <LearningHub onBack={() => handleNavClick('home')} />}
        
        {appState === 'rateTest' && (
            <TarotRateTest 
                onBack={() => handleNavClick('home')} 
                isLoggedIn={isLoggedIn}
                username={username}
                points={points}
                refreshData={refreshUserData}
                onRequireLogin={() => setShowAuthModal(true)}
            />
        )}
        
        {appState === 'resources' && <ResourcesZone onBack={() => handleNavClick('home')} />}
        
        {appState === 'notes' && <TarotNotes onBack={() => handleNavClick('home')} />}

        {appState === 'userProfile' && (
            <UserProfile 
                onBack={() => handleNavClick('home')} 
                points={points}
                userId={username}
                refreshData={refreshUserData}
                onLogout={handleLogout}
            />
        )}

        {appState === 'adminLogin' && (
            <AdminLogin onBack={() => handleNavClick('home')} onLoginSuccess={() => setAppState('adminDashboard')} />
        )}

        {appState === 'adminDashboard' && (
            <AdminDashboard onLogout={() => handleNavClick('home')} />
        )}

        {appState === 'thanks' && (
             <div className="flex flex-col items-center animate-fade-in">
                 <h2 className="text-3xl font-serif mb-8">致谢</h2>
                 {ACKNOWLEDGEMENTS.map((p, i) => (
                     <div key={i} className="mb-2 font-serif">{p.name} {p.avatarSeed}</div>
                 ))}
                 <button onClick={() => handleNavClick('home')} className="mt-8 underline">Return</button>
             </div>
        )}

        {/* INPUT STATE (Divination) */}
        {appState === 'input' && (
          <div className="w-full space-y-10 animate-slide-up">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-serif text-ink font-light">Ask the Oracle</h2>
              <div className="w-16 h-0.5 bg-cinnabar mx-auto"></div>
              <div className="text-stone-400 text-xs font-serif uppercase tracking-widest">
                  {isLoggedIn ? `Account: ${username} • Cost: 1 Point • Balance: ${points}` : 'Please Login to Consult'}
              </div>
            </div>

            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What is your heart seeking?"
              className="w-full bg-transparent border-b-2 border-stone-300 p-4 text-center text-xl text-ink placeholder:text-stone-300 focus:outline-none focus:border-cinnabar transition-all font-serif"
            />

            <div className="grid grid-cols-2 gap-6">
               <button 
                 onClick={handleDeckChange}
                 className="group p-6 border border-stone-200 bg-white/50 rounded-lg hover:border-cinnabar transition-all"
               >
                 <span className="text-[10px] text-stone-400 uppercase tracking-widest mb-2 group-hover:text-cinnabar">Tarot System</span>
                 <span className="font-serif text-lg text-ink font-bold">{deck === DeckSystem.WAITE ? '韦特 (Waite)' : '透特 (Thoth)'}</span>
               </button>

               <button 
                 onClick={handleModeChange}
                 className="group p-6 border border-stone-200 bg-white/50 rounded-lg hover:border-cinnabar transition-all"
               >
                 <span className="text-[10px] text-stone-400 uppercase tracking-widest mb-2 group-hover:text-cinnabar">Model</span>
                 <span className="font-serif text-lg text-ink font-bold">{mode === InterpretationMode.SANCIA ? '天地人 (Triad)' : '卡巴拉 (Tree)'}</span>
               </button>
            </div>

            <button
              onClick={() => requireAuth(handleStartDivination)}
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
            <div className="text-center">
                <p className="text-cinnabar font-serif text-xl tracking-widest animate-pulse">Shuffling the Cosmos...</p>
                <style>{`
                    @keyframes shuffle {
                        0% { transform: translateX(0) rotate(0); }
                        100% { transform: translateY(0) rotate(0); }
                    }
                `}</style>
            </div>
          </div>
        )}

        {/* READING STATE */}
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
          </div>
        )}

        {/* ANALYZING STATE */}
        {appState === 'analyzing' && (
          <div className="flex flex-col items-center justify-center space-y-8 animate-fade-in">
             <div className="w-24 h-24 border-4 border-cinnabar rounded-full border-t-transparent animate-spin"></div>
             <div className="text-center">
               <h3 className="text-2xl font-serif text-ink mb-2">Consulting the Oracle</h3>
             </div>
          </div>
        )}

        {/* RESULT STATE */}
        {appState === 'result' && analysis && (
          <div className="w-full animate-fade-in space-y-12 pb-12">
             <div className="text-center space-y-4 border-b border-stone-200 pb-8">
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-ink">{analysis.summary}</h2>
                <p className="text-cinnabar font-serif italic text-lg max-w-2xl mx-auto">"{analysis.synthesis}"</p>
             </div>
             <div className="space-y-16">
                {analysis.cardInterpretations.map((interp, idx) => {
                   const card = cards.find(c => c.id === interp.cardId);
                   if (!card) return null;
                   return (
                     <div key={card.id} className="flex flex-col md:flex-row gap-8 items-center md:items-start group hover:bg-white/40 p-6 rounded-lg transition-colors border border-transparent hover:border-stone-100">
                        <div className="flex-shrink-0">
                           <CardComponent card={card} isRevealed={true} className="pointer-events-none" />
                        </div>
                        <div className="flex-1 space-y-4 text-left">
                           <h4 className="text-xl font-bold text-ink font-serif">{interp.coreMeaning}</h4>
                           <p className="font-serif text-stone-700 leading-relaxed text-sm">{interp.contextAnalysis}</p>
                           <p className="font-serif text-cinnabar text-sm">{interp.actionAdvice}</p>
                        </div>
                     </div>
                   );
                })}
             </div>
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

      <Footer onAdminClick={() => setAppState('adminLogin')} />
    </div>
  );
};

export default App;
