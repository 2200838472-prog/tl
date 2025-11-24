import React from 'react';
import { COPYRIGHT_TEXT } from '../constants';

const Footer: React.FC = () => {
  return (
    <div className="fixed bottom-0 w-full bg-paper/90 backdrop-blur-sm border-t border-stone-200 p-3 z-50">
      <p className="text-center text-[10px] text-stone-400 font-serif tracking-widest">
        {COPYRIGHT_TEXT}
      </p>
    </div>
  );
};

export default Footer;