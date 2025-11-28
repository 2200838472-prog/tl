import React from 'react';
import { COPYRIGHT_TEXT } from '../constants';

interface ResourcesZoneProps {
  onBack: () => void;
}

interface ResourceLink {
    title: string;
    desc: string;
    url: string;
    category: 'Org' | 'Learn' | 'Community' | 'Tools';
    icon: string;
}

const RESOURCES: ResourceLink[] = [
    {
        title: "American Tarot Association",
        desc: "International organization dedicated to the study and promotion of Tarot.",
        url: "https://www.ata-tarot.com/",
        category: "Org",
        icon: "🏛️"
    },
    {
        title: "Biddy Tarot",
        desc: "Comprehensive card meanings, spreads, and modern Tarot education.",
        url: "https://www.biddytarot.com/",
        category: "Learn",
        icon: "📖"
    },
    {
        title: "Labyrinthos",
        desc: "A modern school for witchcraft and wizardry. Excellent app and study guides.",
        url: "https://labyrinthos.co/",
        category: "Learn",
        icon: "🔮"
    },
    {
        title: "Aeclectic Tarot",
        desc: "The historical archive of thousands of deck reviews and forum wisdom.",
        url: "http://www.aeclectic.net/tarot/",
        category: "Learn",
        icon: "📚"
    },
    {
        title: "Mary K. Greer's Tarot Blog",
        desc: "Deep insights from one of the world's most respected Tarot scholars.",
        url: "https://marykgreer.com/",
        category: "Learn",
        icon: "🕯️"
    },
    {
        title: "Tarot Association (UK)",
        desc: "Professional tarot association offering training and licensing.",
        url: "https://www.tarotassociation.net/",
        category: "Org",
        icon: "🎓"
    },
    {
        title: "百度贴吧-塔罗牌吧",
        desc: "Largest Chinese Tarot forum community for discussion and deck exchange.",
        url: "https://tieba.baidu.com/f?kw=%CC%FE%C2%DE%C5%C6",
        category: "Community",
        icon: "🐉"
    },
    {
        title: "豆瓣-塔罗小组",
        desc: "Douban Tarot Group - Intellectual discussions and case studies.",
        url: "https://www.douban.com/group/tarot/",
        category: "Community",
        icon: "🍃"
    }
];

const ResourcesZone: React.FC<ResourcesZoneProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-paper text-ink font-serif pb-20 flex flex-col">
      {/* Header */}
      <nav className="p-6 sticky top-0 z-40 bg-paper/95 backdrop-blur-sm border-b border-stone-200 flex items-center justify-between shadow-sm">
         <div className="flex items-center gap-3 cursor-pointer group" onClick={onBack}>
            <div className="w-8 h-8 border border-cinnabar text-cinnabar flex items-center justify-center rounded-sm group-hover:bg-cinnabar group-hover:text-white transition-colors font-serif font-bold">
               ←
            </div>
            <h1 className="font-bold text-lg tracking-widest text-ink font-serif">中宫 • 专区</h1>
         </div>
         <div className="text-[10px] text-stone-400 uppercase tracking-widest border border-stone-200 px-3 py-1 rounded-full">
            External Portal
         </div>
      </nav>

      <main className="flex-1 container mx-auto px-4 py-12 max-w-5xl animate-fade-in">
         
         <div className="text-center mb-16 space-y-4">
             <div className="w-20 h-20 mx-auto bg-stone-100 rounded-full flex items-center justify-center mb-6 border border-stone-200">
                <span className="text-4xl">🌍</span>
             </div>
             <h2 className="text-4xl font-serif font-bold text-ink tracking-widest">塔罗资源导航</h2>
             <p className="text-stone-500 italic max-w-xl mx-auto">
               "The path of wisdom is not walked alone. Here lie the gateways to the greater community."
             </p>
             <div className="w-12 h-1 bg-cinnabar mx-auto mt-6"></div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {RESOURCES.map((res, idx) => (
                 <a 
                   key={idx}
                   href={res.url}
                   target="_blank"
                   rel="noopener noreferrer"
                   className="group bg-white p-6 rounded-sm border border-stone-200 hover:border-cinnabar shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col hover:-translate-y-1 relative overflow-hidden"
                 >
                    {/* Category Tag */}
                    <div className="absolute top-0 right-0 px-3 py-1 bg-stone-50 text-[10px] uppercase tracking-wider text-stone-400 font-bold group-hover:bg-cinnabar group-hover:text-white transition-colors">
                        {res.category}
                    </div>

                    <div className="text-4xl mb-4 opacity-80 group-hover:scale-110 transition-transform duration-500 origin-left">
                        {res.icon}
                    </div>
                    
                    <h3 className="text-xl font-bold text-ink font-serif mb-2 group-hover:text-cinnabar transition-colors">
                        {res.title}
                    </h3>
                    
                    <p className="text-sm text-stone-500 leading-relaxed font-serif flex-1">
                        {res.desc}
                    </p>
                    
                    <div className="mt-6 flex items-center text-xs font-bold uppercase tracking-widest text-stone-400 group-hover:text-cinnabar transition-colors">
                        Visit Website ➜
                    </div>
                 </a>
             ))}
         </div>

         {/* Disclaimer */}
         <div className="mt-16 text-center text-xs text-stone-400 font-serif italic max-w-2xl mx-auto border-t border-stone-100 pt-8">
             Disclaimer: These links lead to external websites. Zhonggong Tarot is not affiliated with these organizations but recognizes their contribution to the mystical arts.
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

export default ResourcesZone;