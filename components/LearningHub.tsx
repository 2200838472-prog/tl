import React, { useState } from 'react';
import { LEARNING_MODULES, COPYRIGHT_TEXT } from '../constants';

interface LearningHubProps {
  onBack: () => void;
}

const LearningHub: React.FC<LearningHubProps> = ({ onBack }) => {
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);

  const activeTopic = LEARNING_MODULES.find(t => t.id === activeTopicId);

  return (
    <div className="min-h-screen bg-paper text-ink font-serif animate-fade-in pb-20">
      
      {/* Header */}
      <nav className="p-6 sticky top-0 z-40 bg-paper/95 backdrop-blur-sm border-b border-stone-200 flex items-center justify-between shadow-sm">
         <div className="flex items-center gap-3 cursor-pointer group" onClick={onBack}>
            <div className="w-8 h-8 border border-cinnabar text-cinnabar flex items-center justify-center rounded-sm group-hover:bg-cinnabar group-hover:text-white transition-colors">
               ←
            </div>
            <h1 className="font-bold text-lg tracking-widest text-ink">中宫书院</h1>
         </div>
      </nav>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        
        {!activeTopic ? (
          /* Topic List Grid */
          <div className="space-y-10 animate-slide-up">
             <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-4 font-serif text-ink">神秘学典籍</h2>
                <div className="w-16 h-1 bg-cinnabar mx-auto"></div>
                <p className="mt-4 text-stone-500 italic font-serif">"The map is not the territory, but it guides the way."</p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {LEARNING_MODULES.map((topic) => (
                  <div 
                    key={topic.id}
                    onClick={() => setActiveTopicId(topic.id)}
                    className="group relative overflow-hidden border border-stone-200 bg-white/60 hover:border-cinnabar transition-all duration-300 cursor-pointer p-8 rounded-sm shadow-sm hover:shadow-xl hover:-translate-y-1"
                  >
                     <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity select-none">
                        <span className="text-8xl font-display font-bold text-ink">
                            {topic.title.charAt(0)}
                        </span>
                     </div>
                     <div className="relative z-10">
                        <h3 className="text-xl font-bold text-ink mb-2 group-hover:text-cinnabar transition-colors">{topic.title}</h3>
                        <p className="text-xs uppercase tracking-widest text-stone-400 font-sans mb-6">{topic.subtitle}</p>
                        <div className="w-8 h-0.5 bg-stone-300 group-hover:bg-cinnabar transition-colors mb-4"></div>
                        <p className="text-sm text-stone-500 line-clamp-3 leading-relaxed">
                            {topic.content.substring(0, 100)}...
                        </p>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        ) : (
          /* Topic Detail View */
          <div className="animate-fade-in grid md:grid-cols-12 gap-8">
             
             {/* Sidebar Navigation (Desktop) */}
             <div className="hidden md:block md:col-span-3 lg:col-span-3 space-y-2 border-r border-stone-200 pr-6 h-fit sticky top-24">
                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4 pl-4">Chapters</h3>
                {LEARNING_MODULES.map(t => (
                  <div 
                    key={t.id} 
                    onClick={() => setActiveTopicId(t.id)}
                    className={`cursor-pointer px-4 py-3 rounded-sm transition-all duration-300 text-sm font-bold tracking-wide border-l-2 ${activeTopicId === t.id ? 'border-cinnabar bg-cinnabar/5 text-cinnabar' : 'border-transparent text-stone-500 hover:bg-stone-50 hover:text-ink'}`}
                  >
                    {t.title}
                  </div>
                ))}
                
                <button 
                    onClick={() => setActiveTopicId(null)}
                    className="w-full mt-8 px-4 py-2 border border-stone-200 text-stone-400 text-xs hover:border-cinnabar hover:text-cinnabar transition-colors"
                >
                    Back to Library
                </button>
             </div>

             {/* Content Area */}
             <div className="col-span-1 md:col-span-9 lg:col-span-8 space-y-8 min-h-[60vh]">
                <header className="border-b border-cinnabar/20 pb-6 mb-8">
                   <div className="flex items-center gap-4 mb-2">
                       <h2 className="text-3xl md:text-4xl font-bold text-ink">{activeTopic.title}</h2>
                       {activeTopic.diagram && (
                           <span className="px-2 py-1 bg-cinnabar/10 text-cinnabar text-[10px] uppercase font-bold tracking-wider rounded">Diagram</span>
                       )}
                   </div>
                   <p className="text-stone-500 font-serif italic text-lg">{activeTopic.subtitle}</p>
                </header>
                
                <article className="prose prose-stone prose-lg prose-p:font-serif prose-headings:font-serif max-w-none text-justify">
                   {activeTopic.content.split('\n').map((paragraph, idx) => {
                     const cleanText = paragraph.trim();
                     if (!cleanText) return null;
                     
                     // Detect if it acts like a header (short line, no period at end, or contains number/colon structure)
                     const isHeader = (cleanText.length < 50 && !cleanText.endsWith('。') && !cleanText.endsWith('.')) || /^\d+\s/.test(cleanText) || /^[A-Za-z\u4e00-\u9fa5]+$/.test(cleanText);

                     if (isHeader) {
                         return <h3 key={idx} className="text-xl font-bold text-ink mt-8 mb-4 border-l-4 border-cinnabar pl-3">{cleanText}</h3>;
                     }
                     
                     return (
                       <p key={idx} className="mb-4 leading-loose text-stone-700">
                          {cleanText}
                       </p>
                     );
                   })}
                </article>

                {/* Diagrams Section */}
                {activeTopic.diagram && (
                   <div className="mt-16 p-8 md:p-12 bg-stone-50 border border-stone-100 rounded-lg flex justify-center shadow-inner">
                      {activeTopic.diagram === 'triad' && <TriadDiagram />}
                      {activeTopic.diagram === 'quad' && <ElementsDiagram />}
                   </div>
                )}

                {/* Mobile Back Button */}
                <div className="md:hidden pt-8 border-t border-stone-100">
                    <button 
                        onClick={() => setActiveTopicId(null)}
                        className="w-full py-3 bg-stone-100 text-stone-600 font-serif font-bold"
                    >
                        Back to Library
                    </button>
                </div>
             </div>
          </div>
        )}
      </main>

      <div className="fixed bottom-0 w-full bg-paper/90 backdrop-blur-sm border-t border-stone-200 p-2 z-50">
        <p className="text-center text-[10px] text-stone-400 font-serif tracking-widest">
            {COPYRIGHT_TEXT}
        </p>
      </div>
    </div>
  );
};

// --- Diagrams ---

const TriadDiagram = () => (
    <div className="flex flex-col gap-6 items-center relative py-8">
        <div className="absolute h-full w-px bg-gradient-to-b from-transparent via-cinnabar/30 to-transparent"></div>
        
        <div className="w-40 h-40 rounded-full border border-cinnabar bg-white flex flex-col items-center justify-center relative z-10 shadow-sm">
            <span className="text-3xl font-bold text-cinnabar font-serif">天</span>
            <span className="text-xs text-stone-400 uppercase tracking-widest mt-1">Heaven</span>
            <span className="text-[10px] text-stone-300 mt-2">Archetypes</span>
        </div>
        
        <div className="w-32 h-32 border border-ink rotate-45 flex items-center justify-center relative bg-white z-10 shadow-sm my-4">
             <div className="-rotate-45 text-center">
                <span className="text-3xl font-bold text-ink block font-serif">人</span>
                <span className="text-xs text-stone-500 uppercase tracking-widest block mt-1">Man</span>
             </div>
        </div>
        
        <div className="w-40 h-40 border border-stone-800 bg-stone-50 flex flex-col items-center justify-center relative z-10 shadow-sm">
            <span className="text-3xl font-bold text-stone-800 font-serif">地</span>
            <span className="text-xs text-stone-500 uppercase tracking-widest mt-1">Earth</span>
            <span className="text-[10px] text-stone-400 mt-2">Matter</span>
        </div>
    </div>
);

const ElementsDiagram = () => (
    <div className="grid grid-cols-2 gap-6 w-full max-w-md">
        <div className="aspect-square flex flex-col items-center justify-center p-6 bg-red-50 border border-red-100 rounded-sm hover:scale-105 transition-transform">
            <div className="text-4xl text-red-600 mb-4 font-serif">火</div>
            <div className="font-bold text-red-900 uppercase tracking-widest text-xs">Fire</div>
            <div className="text-[10px] text-red-700 mt-2">Willpower</div>
        </div>
        <div className="aspect-square flex flex-col items-center justify-center p-6 bg-blue-50 border border-blue-100 rounded-sm hover:scale-105 transition-transform">
            <div className="text-4xl text-blue-600 mb-4 font-serif">水</div>
            <div className="font-bold text-blue-900 uppercase tracking-widest text-xs">Water</div>
            <div className="text-[10px] text-blue-700 mt-2">Emotion</div>
        </div>
        <div className="aspect-square flex flex-col items-center justify-center p-6 bg-yellow-50 border border-yellow-100 rounded-sm hover:scale-105 transition-transform">
            <div className="text-4xl text-stone-600 mb-4 font-serif">风</div>
            <div className="font-bold text-stone-900 uppercase tracking-widest text-xs">Air</div>
            <div className="text-[10px] text-stone-700 mt-2">Intellect</div>
        </div>
        <div className="aspect-square flex flex-col items-center justify-center p-6 bg-green-50 border border-green-100 rounded-sm hover:scale-105 transition-transform">
            <div className="text-4xl text-green-700 mb-4 font-serif">土</div>
            <div className="font-bold text-green-900 uppercase tracking-widest text-xs">Earth</div>
            <div className="text-[10px] text-green-800 mt-2">Matter</div>
        </div>
    </div>
);

export default LearningHub;