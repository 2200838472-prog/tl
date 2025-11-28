import React, { useState, useEffect } from 'react';
import { playSound } from '../utils/soundEngine';
import { COPYRIGHT_TEXT } from '../constants';

interface TarotNotesProps {
  onBack: () => void;
}

type NoteCategory = 'daily' | 'spread' | 'study' | 'dream';

interface Note {
  id: number;
  title: string;
  content: string;
  category: NoteCategory;
  timestamp: number;
}

const CATEGORIES: { id: NoteCategory; label: string; icon: string; desc: string }[] = [
  { id: 'daily', label: '每日灵感', icon: '☀', desc: 'Daily Insights' },
  { id: 'spread', label: '牌阵记录', icon: '❖', desc: 'Spread Archives' },
  { id: 'study', label: '符号研究', icon: '☤', desc: 'Symbol Study' },
  { id: 'dream', label: '梦境启示', icon: '☾', desc: 'Dream Journal' },
];

const TarotNotes: React.FC<TarotNotesProps> = ({ onBack }) => {
  const [activeCategory, setActiveCategory] = useState<NoteCategory>('daily');
  const [notes, setNotes] = useState<Note[]>([]);
  const [editingNote, setEditingNote] = useState<Partial<Note> | null>(null);
  const [view, setView] = useState<'list' | 'edit'>('list');

  // Load notes
  useEffect(() => {
    const saved = localStorage.getItem('zg_tarot_notes');
    if (saved) {
      try {
        setNotes(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load notes", e);
      }
    }
  }, []);

  // Save notes
  useEffect(() => {
    localStorage.setItem('zg_tarot_notes', JSON.stringify(notes));
  }, [notes]);

  const handleCreate = () => {
    playSound('click');
    setEditingNote({
      category: activeCategory,
      title: '',
      content: ''
    });
    setView('edit');
  };

  const handleEdit = (note: Note) => {
    playSound('click');
    setEditingNote(note);
    setView('edit');
  };

  const handleSave = () => {
    if (!editingNote || !editingNote.title?.trim()) return;

    playSound('chime');
    setNotes(prev => {
      if (editingNote.id) {
        // Update existing
        return prev.map(n => n.id === editingNote.id ? { ...n, ...editingNote, timestamp: Date.now() } as Note : n);
      } else {
        // Create new
        const newNote: Note = {
          id: Date.now(),
          title: editingNote.title || 'Untitled',
          content: editingNote.content || '',
          category: editingNote.category || activeCategory,
          timestamp: Date.now()
        };
        return [newNote, ...prev];
      }
    });
    setView('list');
    setEditingNote(null);
  };

  const handleDelete = (id: number) => {
      if(window.confirm("Confirm deletion of this record?")) {
          playSound('click');
          setNotes(prev => prev.filter(n => n.id !== id));
          if (editingNote?.id === id) {
              setView('list');
              setEditingNote(null);
          }
      }
  };

  const filteredNotes = notes.filter(n => n.category === activeCategory);

  return (
    <div className="min-h-screen bg-paper text-ink font-serif pb-20 flex flex-col">
      {/* Header */}
      <nav className="p-6 sticky top-0 z-40 bg-paper/95 backdrop-blur-sm border-b border-stone-200 flex items-center justify-between shadow-sm">
         <div className="flex items-center gap-3 cursor-pointer group" onClick={onBack}>
            <div className="w-8 h-8 border border-cinnabar text-cinnabar flex items-center justify-center rounded-sm group-hover:bg-cinnabar group-hover:text-white transition-colors font-serif font-bold">
               ←
            </div>
            <h1 className="font-bold text-lg tracking-widest text-ink font-serif">神秘学笔记</h1>
         </div>
         <div className="text-[10px] text-stone-400 uppercase tracking-widest border border-stone-200 px-3 py-1 rounded-full">
            Grimoire
         </div>
      </nav>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        
        <div className="flex flex-col lg:flex-row gap-8 min-h-[70vh]">
            
            {/* Sidebar / Categories */}
            <div className={`lg:w-1/4 space-y-4 ${view === 'edit' ? 'hidden lg:block' : 'block'}`}>
                <div className="mb-6 px-2">
                    <h2 className="text-2xl font-bold mb-2">分类目录</h2>
                    <p className="text-xs text-stone-400 uppercase tracking-widest">Compendium Categories</p>
                </div>
                
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => {
                            setActiveCategory(cat.id);
                            setView('list');
                            playSound('click');
                        }}
                        className={`w-full text-left p-4 rounded-sm border transition-all duration-300 flex items-center justify-between group ${activeCategory === cat.id ? 'bg-ink text-white border-ink shadow-lg' : 'bg-white border-stone-200 text-stone-600 hover:border-cinnabar'}`}
                    >
                        <div>
                            <div className="font-bold text-lg mb-1">{cat.label}</div>
                            <div className={`text-[10px] uppercase tracking-wider ${activeCategory === cat.id ? 'text-stone-400' : 'text-stone-400 group-hover:text-cinnabar'}`}>{cat.desc}</div>
                        </div>
                        <span className="text-2xl">{cat.icon}</span>
                    </button>
                ))}

                <div className="mt-8 p-4 bg-stone-100 rounded-sm border border-stone-200 text-center">
                    <div className="text-3xl font-bold text-stone-300 mb-2">{notes.length}</div>
                    <div className="text-xs text-stone-500 uppercase tracking-widest">Total Records</div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 bg-white/50 border border-stone-200 rounded-sm shadow-sm p-6 relative min-h-[500px]">
                
                {/* Background Texture */}
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cream-paper.png')" }}></div>

                {view === 'list' ? (
                    <div className="relative z-10 animate-fade-in">
                        <div className="flex justify-between items-center mb-8 border-b border-stone-200 pb-4">
                             <div>
                                <h3 className="text-2xl font-bold text-ink">{CATEGORIES.find(c => c.id === activeCategory)?.label}</h3>
                                <p className="text-xs text-stone-400 uppercase tracking-widest mt-1">Records Archive</p>
                             </div>
                             <button 
                                onClick={handleCreate}
                                className="px-6 py-2 bg-cinnabar text-white font-bold tracking-widest text-sm rounded-sm hover:bg-red-800 transition-colors shadow-md"
                             >
                                + NEW ENTRY
                             </button>
                        </div>

                        {filteredNotes.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-stone-400">
                                <span className="text-4xl mb-4 opacity-50">✎</span>
                                <p className="font-serif italic">This section is currently empty.</p>
                                <p className="text-xs mt-2 uppercase tracking-widest">Start recording your journey.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {filteredNotes.map(note => (
                                    <div 
                                        key={note.id}
                                        onClick={() => handleEdit(note)}
                                        className="group p-5 bg-white border-l-4 border-stone-200 hover:border-cinnabar shadow-sm cursor-pointer transition-all hover:shadow-md relative"
                                    >
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold text-lg text-ink mb-2 group-hover:text-cinnabar transition-colors">{note.title}</h4>
                                            <span className="text-[10px] text-stone-400 font-sans">{new Date(note.timestamp).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-stone-500 text-sm line-clamp-2 font-serif leading-relaxed">
                                            {note.content}
                                        </p>
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-xs text-stone-300">Edit ➜</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="relative z-10 animate-slide-up h-full flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <button 
                                onClick={() => setView('list')}
                                className="text-stone-400 hover:text-ink text-sm font-bold uppercase tracking-widest flex items-center gap-2"
                            >
                                ← Back
                            </button>
                            <div className="flex gap-4">
                                {editingNote?.id && (
                                    <button 
                                        onClick={() => handleDelete(editingNote.id!)}
                                        className="text-stone-400 hover:text-red-600 text-sm font-bold"
                                    >
                                        DELETE
                                    </button>
                                )}
                                <button 
                                    onClick={handleSave}
                                    className="px-6 py-2 bg-ink text-white font-bold tracking-widest text-sm rounded-sm hover:bg-cinnabar transition-colors"
                                >
                                    SAVE RECORD
                                </button>
                            </div>
                        </div>

                        <input 
                            type="text"
                            value={editingNote?.title}
                            onChange={(e) => setEditingNote(prev => ({...prev, title: e.target.value}))}
                            placeholder="Entry Title..."
                            className="w-full text-3xl font-bold font-serif bg-transparent border-b border-stone-200 pb-2 mb-6 focus:outline-none focus:border-cinnabar placeholder:text-stone-300 placeholder:italic"
                        />

                        <textarea 
                            value={editingNote?.content}
                            onChange={(e) => setEditingNote(prev => ({...prev, content: e.target.value}))}
                            placeholder="Write your insights here..."
                            className="w-full flex-1 bg-transparent resize-none focus:outline-none font-serif text-lg leading-loose text-stone-700 placeholder:text-stone-300"
                            style={{ minHeight: '400px' }}
                        />
                    </div>
                )}
            </div>
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

export default TarotNotes;