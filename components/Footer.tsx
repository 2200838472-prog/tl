
import React from 'react';
import { COPYRIGHT_TEXT } from '../constants';

interface FooterProps {
    onAdminClick?: () => void;
}

const Footer: React.FC<FooterProps> = ({ onAdminClick }) => {
  return (
    <div className="fixed bottom-0 w-full bg-paper/90 backdrop-blur-sm border-t border-stone-200 p-3 z-50 flex justify-between items-center px-6">
      <div className="flex-1"></div> {/* Spacer */}
      
      <p className="text-center text-[10px] text-stone-400 font-serif tracking-widest">
        {COPYRIGHT_TEXT}
      </p>

      <div className="flex-1 flex justify-end">
          {onAdminClick && (
              <button 
                onClick={onAdminClick}
                className="text-stone-300 hover:text-cinnabar transition-colors"
                title="Admin Access"
              >
                  🔒
              </button>
          )}
      </div>
    </div>
  );
};

export default Footer;
