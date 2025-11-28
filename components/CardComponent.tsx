
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
      className={`card-3d relative w-24 h-40 md:w-32 md:h-52 cursor-pointer select-none ${className} ${!isRevealed && onClick ? 'hover:-translate-y-2' : ''}`}
      onClick={handleClick}
      style={{
        ...style,
        transform: (style as any)?.transform || (isRevealed 
          ? `rotateY(180deg) rotate(${card?.isUpright ? 0 : 180}deg)` 
          : 'rotateY(0deg)'),
        transformStyle: 'preserve-3d'
      }}
    >
      {/* Card Back - Solid Red, Minimalist Seal */}
      <div 
        className="absolute w-full h-full bg-cinnabar flex items-center justify-center border-4 border-white shadow-sm"
        style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
      >
        <div className="w-16 h-16 border border-white/50 flex items-center justify-center rounded-full">
            <span className="text-white/90 font-serif font-bold text-2xl">中</span>
        </div>
      </div>

      {/* Card Front - Clean White, Swiss Style Typography */}
      <div 
        className="absolute w-full h-full bg-white text-ink shadow-sm border border-stone-200 flex flex-col"
        style={{ 
            backfaceVisibility: 'hidden', 
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)' 
        }}
      >
        
        <div className="relative h-full p-3 flex flex-col items-center justify-between">
           {/* Top Number */}
           <div className="w-full flex justify-between items-center border-b border-black pb-1 mb-2">
              <span className="text-[10px] font-sans font-bold text-stone-400 uppercase">
                  {card?.arcana === 'Major' ? 'Major' : card?.suit}
              </span>
              <span className="text-sm font-serif font-bold text-ink">
                  {card?.arcana === 'Major' ? (card.number === 0 ? '0' : getRoman(card.number || 0)) : card?.number}
              </span>
           </div>

           {/* Main Symbol (SVG) */}
           <div className="flex-1 w-full flex items-center justify-center">
              <div className="text-cinnabar">
                  {getSuitSVG(card?.suit, card?.arcana === 'Major')}
              </div>
           </div>

           {/* Bottom Name */}
           <div className="w-full text-center mt-2">
             <div className="text-sm font-bold font-serif text-ink truncate">
               {card?.nameZh}
             </div>
             <div className="text-[9px] text-stone-400 font-sans font-bold uppercase tracking-wider mt-1">
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
    const size = "42"; // Slightly smaller for better whitespace
    
    if (isMajor) {
        return (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="square" strokeLinejoin="miter">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 3v18" />
                <path d="M3 12h18" />
            </svg>
        );
    }

    switch(suit) {
        case 'Cups':
            return (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="square" strokeLinejoin="miter">
                    <path d="M17 2H7a5 5 0 0 0-5 5v10a5 5 0 0 0 5 5h10a5 5 0 0 0 5-5V7a5 5 0 0 0-5-5Z" />
                </svg>
            );
        case 'Swords':
             return (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="square" strokeLinejoin="miter">
                    <path d="M12 2v20" />
                    <path d="M8 18l4 4 4-4" />
                    <path d="M8 6h8" />
                </svg>
            );
        case 'Wands':
             return (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="square" strokeLinejoin="miter">
                    <path d="M12 22V2" />
                    <path d="M12 6l4-4" />
                    <path d="M8 6l4-4" />
                </svg>
             );
        case 'Pentacles':
        case 'Disks':
             return (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="square" strokeLinejoin="miter">
                    <circle cx="12" cy="12" r="9" />
                    <rect x="9" y="9" width="6" height="6" />
                </svg>
             );
        default:
             return (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="square" strokeLinejoin="miter">
                   <path d="M12 2L2 22h20L12 2z" />
                </svg>
             );
    }
}

export default CardComponent;
