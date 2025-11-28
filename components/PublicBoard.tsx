
import React, { useState, useEffect, useRef } from 'react';
import { playSound } from '../utils/soundEngine';

interface Message {
  id: number;
  content: string;
  timestamp: number;
}

const PublicBoard: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load initial messages from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('zg_public_messages');
    if (saved) {
      try {
        const parsed: Message[] = JSON.parse(saved);
        const now = Date.now();
        const valid = parsed.filter(m => now - m.timestamp < 3600000); // 1 hour expiry
        setMessages(valid);
      } catch (e) {
        console.error("Failed to load messages", e);
      }
    }
  }, []);

  // Prune expired messages every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
        setMessages(prev => {
            const now = Date.now();
            const valid = prev.filter(m => now - m.timestamp < 3600000);
            if (valid.length !== prev.length) {
                localStorage.setItem('zg_public_messages', JSON.stringify(valid));
            }
            return valid;
        });
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Sync state to localStorage whenever messages change
  useEffect(() => {
      localStorage.setItem('zg_public_messages', JSON.stringify(messages));
  }, [messages]);

  const handleSend = () => {
      if (!inputText.trim()) return;
      
      const newMsg: Message = {
          id: Date.now(),
          content: inputText.trim(),
          timestamp: Date.now()
      };
      
      setMessages(prev => [newMsg, ...prev]);
      setInputText('');
      playSound('click');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSend();
      }
  };

  const getTimeRemaining = (timestamp: number) => {
      const now = Date.now();
      const left = 3600000 - (now - timestamp);
      const mins = Math.max(0, Math.floor(left / 60000));
      return `${mins}m`;
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col h-[75vh] animate-slide-up relative">
       
       {/* Header / Context */}
       <div className="text-center mb-6 space-y-2 flex-shrink-0">
           <h2 className="text-3xl font-serif text-ink font-bold tracking-widest">留声墙</h2>
           <p className="text-xs text-stone-500 font-serif italic">
             "Voices in the wind. All messages fade into the void after one hour."
           </p>
           <div className="w-12 h-0.5 bg-cinnabar/30 mx-auto"></div>
       </div>

       {/* Messages Area */}
       <div className="flex-1 overflow-y-auto pr-2 space-y-4 mb-6 scrollbar-thin scrollbar-thumb-cinnabar/20 scrollbar-track-transparent p-2 mask-image-gradient" ref={scrollRef}>
           {messages.length === 0 && (
               <div className="h-full flex flex-col items-center justify-center text-stone-300 font-serif text-sm italic space-y-4">
                   <div className="w-12 h-12 border border-stone-200 rounded-full flex items-center justify-center">
                       <span className="text-2xl text-stone-200">✉️</span>
                   </div>
                   <span>The wall is silent. Be the first to leave a mark.</span>
               </div>
           )}
           {messages.map(msg => (
               <div key={msg.id} className="group relative bg-white/40 p-5 rounded-sm border-l-2 border-stone-200 hover:border-cinnabar transition-all duration-300 hover:bg-white/80 hover:shadow-md animate-fade-in">
                   <p className="text-ink font-serif text-lg leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                   <div className="flex justify-between items-center mt-3 pt-3 border-t border-stone-100/50">
                        <span className="text-[10px] text-stone-400 font-sans tracking-wider uppercase flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-stone-300 rounded-full"></span>
                            Seeker
                        </span>
                        <span className="text-[10px] text-cinnabar/60 font-sans font-bold flex items-center gap-1 bg-cinnabar/5 px-2 py-0.5 rounded-full">
                            <span>⏳</span>
                            {getTimeRemaining(msg.timestamp)} left
                        </span>
                   </div>
               </div>
           ))}
       </div>

       {/* Input Area */}
       <div className="relative bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-stone-200 focus-within:border-cinnabar transition-colors duration-300 flex-shrink-0 z-10">
           <textarea
             value={inputText}
             onChange={(e) => setInputText(e.target.value)}
             onKeyDown={handleKeyDown}
             placeholder="Leave a whisper to the universe..."
             className="w-full bg-transparent text-ink font-serif placeholder:text-stone-400 focus:outline-none resize-none min-h-[60px]"
           />
           <div className="flex justify-between items-center mt-2">
               <span className="text-[10px] text-stone-400 font-serif italic">Messages expire automatically</span>
               <button 
                 onClick={handleSend}
                 disabled={!inputText.trim()}
                 className="px-6 py-1.5 bg-ink text-white text-xs font-serif tracking-widest hover:bg-cinnabar disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-sm shadow-sm"
               >
                 发送 SEND
               </button>
           </div>
       </div>
    </div>
  );
};

export default PublicBoard;
