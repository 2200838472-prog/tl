import React, { useState, useEffect } from 'react';
import { playSound } from '../utils/soundEngine';
import { generateTestQuestion, evaluateTestAnswer, generateReferenceAnswer, TestQuestion } from '../services/deepseekService';
import { InterpretationMode } from '../types';

interface TarotRateTestProps {
  onBack: () => void;
}

const SKIP_CODE = "20061222";
const PEEK_CODE = "12222006";

const TarotRateTest: React.FC<TarotRateTestProps> = ({ onBack }) => {
  const [unlockedLevel, setUnlockedLevel] = useState<number>(1);
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState<TestQuestion | null>(null);
  const [answer, setAnswer] = useState("");
  const [view, setView] = useState<'intro' | 'test' | 'evaluating' | 'success' | 'endgame'>('intro');
  const [feedback, setFeedback] = useState("");
  const [score, setScore] = useState(0);
  const [testMode, setTestMode] = useState<InterpretationMode>(InterpretationMode.SANCIA);

  useEffect(() => {
    const saved = localStorage.getItem('zg_tarot_level');
    if (saved) {
      setUnlockedLevel(parseInt(saved, 10));
    }
  }, []);

  const saveProgress = (level: number) => {
    const newLevel = Math.max(level, unlockedLevel);
    setUnlockedLevel(newLevel);
    localStorage.setItem('zg_tarot_level', newLevel.toString());
  };

  const startLevel = async (level: number) => {
    if (level > unlockedLevel) {
        playSound('click');
        return;
    }
    
    // Level 6 Special Entry logic
    if (level === 6) {
        setCurrentLevel(6);
        setView('endgame');
        playSound('chime');
        return;
    }

    setCurrentLevel(level);
    setLoading(true);
    setView('test');
    setAnswer("");
    setFeedback("");
    setScore(0);
    setQuestion(null);
    
    playSound('slide');
    
    try {
        const q = await generateTestQuestion(level, testMode);
        setQuestion(q);
    } catch (e) {
        console.error(e);
        setFeedback("Network Error");
    } finally {
        setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!answer.trim()) return;

    const rawAnswer = answer.trim();

    // CHEAT CODE: Unlock All
    if (rawAnswer === SKIP_CODE) {
        playSound('chime');
        saveProgress(6); 
        setCurrentLevel(6);
        setView('endgame');
        return;
    }

    // CHEAT CODE: Peek Answer
    if (rawAnswer === PEEK_CODE) {
        if (!question) return;
        playSound('reveal');
        setLoading(true);
        setAnswer("Decoding Akashic Records...");
        try {
            const refAnswer = await generateReferenceAnswer(question.question, currentLevel);
            setAnswer(refAnswer);
        } catch(e) {
            setAnswer("Connection lost.");
        } finally {
            setLoading(false);
        }
        return;
    }

    if (!question) return;

    setLoading(true);
    setView('evaluating');

    try {
        const result = await evaluateTestAnswer(question.question, answer, currentLevel);
        setFeedback(result.feedback);
        setScore(result.score);
        
        // STRICT 60% RULE
        if (result.passed) { 
            playSound('chime');
            setView('success');
            if (currentLevel === unlockedLevel && currentLevel < 6) {
                saveProgress(currentLevel + 1);
            }
        } else {
            playSound('click');
            // Stay in evaluating state to show failure
        }
    } catch (e) {
        setFeedback("System Error");
        setScore(0);
    } finally {
        setLoading(false);
    }
  };

  const getLevelTitle = (lvl: number) => {
      const titles = ["", "Novice", "Apprentice", "Adept", "Master", "Grandmaster", "Unity"];
      return titles[lvl] || "Unknown";
  };

  // Render Screens
  const renderIntro = () => (
      <div className="max-w-3xl mx-auto w-full animate-fade-in flex flex-col items-center">
          <div className="text-center mb-12">
              <div className="inline-block border-b-2 border-cinnabar mb-4 pb-2">
                 <h2 className="text-3xl font-serif font-bold text-ink tracking-[0.2em]">等级评定</h2>
              </div>
              <p className="text-stone-400 font-serif text-sm tracking-widest uppercase">The Ordeal of Wisdom</p>
          </div>

          <div className="flex gap-8 mb-16">
               {(['SANCIA', 'KABBALAH'] as const).map(modeKey => {
                   const m = modeKey === 'SANCIA' ? InterpretationMode.SANCIA : InterpretationMode.KABBALAH;
                   const isActive = testMode === m;
                   return (
                       <button 
                         key={modeKey}
                         onClick={() => { playSound('click'); setTestMode(m); }}
                         className={`px-4 py-2 font-serif text-sm font-bold tracking-widest transition-all ${isActive ? 'text-cinnabar border-b border-cinnabar' : 'text-stone-300 hover:text-stone-500'}`}
                       >
                           {modeKey === 'SANCIA' ? '天地人' : '卡巴拉'}
                       </button>
                   );
               })}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 w-full px-4">
              {[1, 2, 3, 4, 5, 6].map((lvl) => {
                  const isLocked = lvl > unlockedLevel;
                  return (
                      <button
                        key={lvl}
                        onClick={() => startLevel(lvl)}
                        disabled={isLocked}
                        className={`
                            group relative aspect-[3/4] flex flex-col items-center justify-center transition-all duration-500 border
                            ${isLocked 
                                ? 'border-stone-100 bg-stone-50 opacity-60 cursor-not-allowed' 
                                : 'border-stone-200 bg-white hover:border-cinnabar hover:shadow-lg cursor-pointer'}
                        `}
                      >
                          <span className={`text-4xl mb-4 font-serif transition-transform group-hover:scale-110 ${isLocked ? 'grayscale opacity-20' : 'text-ink'}`}>
                              {lvl === 6 ? '⚛' : ['Ⅰ','Ⅱ','Ⅲ','Ⅳ','Ⅴ'][lvl-1]}
                          </span>
                          
                          <span className={`font-serif text-xs font-bold tracking-[0.2em] uppercase ${isLocked ? 'text-stone-300' : 'text-stone-600 group-hover:text-cinnabar'}`}>
                              {getLevelTitle(lvl)}
                          </span>

                          {isLocked && <div className="absolute top-3 right-3 text-[10px] text-stone-300">🔒</div>}
                      </button>
                  );
              })}
          </div>
      </div>
  );

  const renderTest = () => (
      <div className="max-w-2xl mx-auto w-full animate-slide-up pt-8">
          <div className="bg-white p-8 md:p-12 shadow-2xl rounded-sm relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-stone-200 via-cinnabar to-stone-200"></div>

              <div className="flex justify-between items-start mb-10">
                  <div>
                      <span className="text-xs font-bold text-cinnabar uppercase tracking-widest">Level {currentLevel}</span>
                      <h3 className="text-2xl font-serif font-bold text-ink mt-2">{getLevelTitle(currentLevel)}</h3>
                  </div>
                  <div className="text-stone-200 text-6xl font-serif leading-none opacity-50">
                     {currentLevel}
                  </div>
              </div>

              <div className="min-h-[100px] mb-8">
                   {loading && !question ? (
                       <div className="flex items-center gap-3 text-stone-400 animate-pulse">
                           <span className="text-xl">❖</span>
                           <span className="font-serif italic text-sm">Consulting the archives...</span>
                       </div>
                   ) : (
                       <p className="text-lg md:text-xl font-serif text-ink leading-relaxed font-medium">
                           {question?.question}
                       </p>
                   )}
              </div>

              <div className="relative">
                  <textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="在此刻下你的答案..."
                    disabled={loading || view === 'evaluating'}
                    className="w-full bg-stone-50/50 p-6 rounded-sm border border-stone-200 focus:border-cinnabar focus:bg-white focus:outline-none min-h-[200px] font-serif text-ink text-lg leading-loose resize-none transition-all placeholder:text-stone-300 placeholder:italic"
                    spellCheck={false}
                  />
                  
                  {loading && view === 'evaluating' && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
                          <div className="text-cinnabar font-serif font-bold tracking-[0.3em] animate-pulse">EVALUATING</div>
                      </div>
                  )}
              </div>

              <div className="flex justify-between items-center mt-8 pt-6 border-t border-stone-100">
                  <button 
                    onClick={() => setView('intro')}
                    className="text-stone-400 hover:text-ink text-xs font-bold uppercase tracking-widest transition-colors"
                  >
                    Abdicate
                  </button>
                  
                  <button
                    onClick={handleSubmit}
                    disabled={loading || !answer.trim()}
                    className="px-8 py-3 bg-ink text-white font-serif font-bold tracking-[0.2em] hover:bg-cinnabar disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg active:scale-95"
                  >
                    SUBMIT
                  </button>
              </div>
          </div>

          {/* Result Feedback Block */}
          {view === 'evaluating' && !loading && (
               <div className="mt-6 bg-stone-900 text-stone-300 p-6 shadow-xl animate-fade-in border-l-4 border-cinnabar">
                   <div className="flex items-start gap-4">
                       <span className="text-2xl text-cinnabar">✕</span>
                       <div className="flex-1">
                           <h4 className="text-white font-serif font-bold text-lg mb-1">Assessment Failed</h4>
                           <div className="flex gap-4 text-[10px] uppercase tracking-widest text-stone-500 mb-3">
                               <span>Score: {score}</span>
                               <span>Required: 60</span>
                           </div>
                           <p className="font-serif text-sm leading-relaxed text-stone-400 border-t border-stone-800 pt-3">
                               {feedback}
                           </p>
                       </div>
                   </div>
                   <button 
                     onClick={() => {
                         setView('test'); 
                         setFeedback(""); 
                         setAnswer("");
                         setScore(0);
                         startLevel(currentLevel); 
                     }}
                     className="mt-6 w-full py-3 bg-stone-800 hover:bg-stone-700 text-white text-xs font-bold uppercase tracking-widest transition-colors"
                   >
                       Attempt Again
                   </button>
               </div>
          )}
      </div>
  );

  const renderSuccess = () => (
      <div className="max-w-md mx-auto w-full flex flex-col items-center justify-center text-center animate-stamp-in pt-16">
          <div className="w-20 h-20 border-2 border-cinnabar rounded-full flex items-center justify-center text-cinnabar text-4xl mb-8 shadow-[0_0_30px_rgba(196,30,58,0.2)]">
              ✦
          </div>
          
          <h2 className="text-4xl font-serif font-bold text-ink mb-2">Passed</h2>
          <span className="text-stone-400 text-xs font-sans uppercase tracking-[0.3em] mb-8">Score {score} / 100</span>

          <div className="bg-white p-6 border border-stone-100 shadow-sm mb-10 w-full relative">
             <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-3 bg-paper px-2 text-cinnabar text-xl">❝</div>
             <p className="text-stone-600 font-serif italic leading-relaxed text-sm">
                {feedback}
             </p>
          </div>
          
          <div className="flex flex-col w-full gap-4">
              {currentLevel < 6 && (
                  <button 
                    onClick={() => startLevel(currentLevel + 1)}
                    className="w-full py-4 bg-ink text-white font-serif font-bold tracking-[0.2em] hover:bg-cinnabar transition-all shadow-md group"
                  >
                    NEXT LEVEL <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
                  </button>
              )}
              <button 
                onClick={() => setView('intro')}
                className="w-full py-3 text-stone-400 hover:text-ink text-xs font-serif tracking-widest transition-colors"
              >
                RETURN TO HALL
              </button>
          </div>
      </div>
  );

  const renderEndgame = () => (
      <div className="flex-1 flex flex-col items-center justify-center animate-fade-in relative w-full max-w-4xl mx-auto">
          <div className="absolute inset-0 bg-noise opacity-30 pointer-events-none"></div>
          
          <div className="relative z-10 text-center">
              <div className="text-[12rem] md:text-[16rem] leading-none text-stone-100 font-serif font-bold absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 select-none">
                  ⚛
              </div>
              
              <h2 className="text-6xl md:text-8xl font-serif font-black text-ink mb-6 tracking-widest mix-blend-multiply">归一</h2>
              <p className="text-xl md:text-2xl font-serif text-cinnabar mb-12 tracking-[0.5em] uppercase">Unity</p>
              
              <div className="max-w-md mx-auto space-y-6 text-stone-600 font-serif leading-loose">
                  <p>"The journey is the destination."</p>
                  <p className="text-sm italic">You have transcended the need for tests.</p>
              </div>

              <button 
                onClick={() => setView('intro')}
                className="mt-20 px-10 py-3 border border-stone-300 text-stone-400 hover:text-ink hover:border-ink transition-all text-xs font-bold uppercase tracking-[0.3em]"
              >
                Descend
              </button>
          </div>
      </div>
  );

  return (
    <div className="min-h-screen bg-paper pb-20 flex flex-col">
        {/* Simplified Nav */}
        <nav className="p-6 sticky top-0 z-40 bg-paper/95 backdrop-blur-md border-b border-stone-200/60 flex items-center justify-between">
             <div className="flex items-center gap-4 cursor-pointer group" onClick={onBack}>
                <span className="text-xl text-cinnabar font-serif transition-transform group-hover:-translate-x-1">←</span>
                <span className="font-serif font-bold text-ink tracking-widest uppercase text-sm">Ordeal</span>
             </div>
             <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                Rank: {getLevelTitle(unlockedLevel)}
             </div>
        </nav>

        <main className="flex-1 container mx-auto px-4 py-8 flex flex-col items-center relative z-10">
            {view === 'intro' && renderIntro()}
            {(view === 'test' || view === 'evaluating') && renderTest()}
            {view === 'success' && renderSuccess()}
            {view === 'endgame' && renderEndgame()}
        </main>
    </div>
  );
};

export default TarotRateTest;