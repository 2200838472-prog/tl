import React from 'react';
import { COPYRIGHT_TEXT } from '../constants';

const Footer: React.FC = () => {
  return (
    <div className="fixed bottom-0 w-full bg-xuanhei/90 backdrop-blur-sm border-t border-white/10 p-2 z-50">
      <p className="text-center text-[10px] text-gray-500 font-serif tracking-widest">
        {COPYRIGHT_TEXT}
      </p>
    </div>
  );
};

export default Footer;