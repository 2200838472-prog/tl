
import React from 'react';
import { DrawnCard } from '../types';
import { playSound } from '../utils/soundEngine';

interface CardProps {
  card?: DrawnCard;
  isRevealed: boolean;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

const CardComponent: React.FC<CardProps> = ({ card, isRevealed, onClick, className = '', style }) => {
  
  const handleClick = () => {
    if (onClick) {
        if (!isRevealed) {
            playSound('reveal');
        } else {
            playSound('flip');
        }
        onClick();
    }
  };

  return (
    <div 
      className={`card-3d relative w-24 h-40 md:w-32 md:h-52 cursor-pointer select-none transition-all duration-700 ${className} ${!isRevealed && onClick ? 'hover:-translate-y-2 hover:shadow-2xl' : ''}`}
      onClick={handleClick}
      style={{
        ...style,
        transform: style?.transform || (isRevealed 
          ? `rotateY(180deg) rotate(${card?.isUpright ? 0 : 180}deg)` 
          : 'rotateY(0deg)'),
        transformStyle: 'preserve-3d'
      }}
    >
      {/* Card Back - Red & Gold with Zhonggong Seal */}
      <div 
        className="absolute w-full h-full rounded-lg border-2 border-cinnabar/30 bg-cinnabarDim flex items-center justify-center shadow-md overflow-hidden group hover:brightness-110 transition-all"
        style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
      >
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')" }}></div>
        
        {/* Decorative inner frame */}
        <div className="absolute inset-1.5 border border-gold/30 rounded flex items-center justify-center">
             {/* Center Seal */}
             <div className="w-12 h-20 border border-gold/40 bg-black/10 flex items-center justify-center px-2 py-3 backdrop-blur-sm rounded-sm transform group-hover:scale-105 transition-transform duration-500">
                <div className="text-gold/90 font-serif font-bold text-xl writing-vertical-rl tracking-[0.3em] opacity-90">
                    中宫
                </div>
             </div>
        </div>
      </div>

      {/* Card Front - Paper Style */}
      <div 
        className="absolute w-full h-full rounded-lg bg-paper text-ink shadow-xl overflow-hidden border border-stone-200"
        style={{ 
            backfaceVisibility: 'hidden', 
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)' 
        }}
      >
        <div className="absolute inset-0 bg-paper-texture opacity-50 pointer-events-none"></div>
        
        <div className="relative h-full p-2 flex flex-col items-center justify-between">
           {/* Top Number */}
           <div className="text-[10px] font-serif w-full text-center text-cinnabar font-bold uppercase tracking-widest">
              {card?.arcana === 'Major' ? (card.number === 0 ? '0' : getRoman(card.number || 0)) : card?.number}
           </div>

           {/* Main Symbol (SVG) */}
           <div className="flex-1 w-full flex items-center justify-center relative my-2">
              <div className="text-cinnabar drop-shadow-sm transition-transform duration-700 hover:scale-110">
                  {getSuitSVG(card?.suit, card?.arcana === 'Major')}
              </div>
           </div>

           {/* Bottom Name */}
           <div className="w-full text-center border-t border-cinnabar/20 pt-2">
             <div className="text-[12px] md:text-sm font-bold font-serif text-ink truncate px-1">
               {card?.nameZh}
             </div>
             <div className="text-[8px] text-gray-500 font-display uppercase tracking-wider scale-90 mt-0.5">
                {card?.name}
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

function getRoman(num: number): string {
    const roman: {[key: number]: string} = {1:'I',2:'II',3:'III',4:'IV',5:'V',6:'VI',7:'VII',8:'VIII',9:'IX',10:'X',11:'XI',12:'XII',13:'XIII',14:'XIV',15:'XV',16:'XVI',17:'XVII',18:'XVIII',19:'XIX',20:'XX',21:'XXI'};
    return roman[num] || num.toString();
}

// SVG Icons
function getSuitSVG(suit?: string, isMajor?: boolean) {
    const color = "currentColor";
    const size = "48";
    
    if (isMajor) {
        return (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                <path d="M2 12h20" />
            </svg>
        );
    }

    switch(suit) {
        case 'Cups':
            return (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 2H7a5 5 0 0 0-5 5v10a5 5 0 0 0 5 5h10a5 5 0 0 0 5-5V7a5 5 0 0 0-5-5Z" />
                    <path d="M12 17v5" />
                    <path d="M8 22h8" />
                </svg>
            );
        case 'Swords':
             return (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
                    <path d="M13 19l6-6" />
                    <path d="M16 16l4 4" />
                    <path d="M19 21l2-2" />
                </svg>
            );
        case 'Wands':
             return (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 3l12 12" />
                    <path d="M18 15l-3 3" />
                    <path d="M6 3l3 3" />
                    <path d="M3 6l3-3" />
                    <path d="M13.5 7.5L16.5 4.5" />
                </svg>
             );
        case 'Pentacles':
        case 'Disks':
             return (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 16l-2.5-1.5L7 16l.5-3-2-2 3-.5L10 8l1.5 2.5 2.5-.5-2 2 .5 3z" />
                </svg>
             );
        default:
             return (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                   <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
             );
    }
}

export default CardComponent;
