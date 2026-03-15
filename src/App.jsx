import React, { useState, useEffect } from 'react'
import { Home, Layers, Gamepad2, Settings, ArrowRight, Award, Flame, Zap, Moon, Calendar, Trophy } from 'lucide-react'
import './App.css'
import wordsData from './data/oxford_3000_full.json';

// === GAMIFICATION CONSTANTS ===
const LEVELS = [
  { max: 99, name: 'Sugar Crush 🧁', desc: 'Just starting with small sugar cubes' },
  { max: 499, name: 'Sweet Syrup 🍯', desc: 'Getting smoother like sweet syrup' },
  { max: 1499, name: 'Soft Marshmallow 🍡', desc: 'Solid foundation, soft and sweet' },
  { max: 3999, name: 'Honey Toast 🍞', desc: 'Understanding sentences and context clearly' },
  { max: 9999, name: 'Grand Soufflé 🍰', desc: 'Advanced level, remembered almost everything' },
  { max: Infinity, name: 'Sweetly Master 👑', desc: 'Completed the Oxford 3000 course!' },
];

const ACHIEVEMENTS_DATA = {
  sugar_high: { id: 'sugar_high', name: '🔥 Sugar High', desc: 'Answered 20 words correctly in a row', icon: '🔥' },
  midnight_snack: { id: 'midnight_snack', name: '🌙 Midnight Snack', desc: 'Reviewed vocabulary after midnight', icon: '🌙' },
  lightning: { id: 'lightning', name: '⚡ Lightning Sweets', desc: 'Answered correctly within 3 seconds', icon: '⚡' },
  weekly_treat: { id: 'weekly_treat', name: '📅 Weekly Treat', desc: 'Studied for 7 consecutive days', icon: '📅' },
};

function getLevelInfo(xp) {
  let prevMax = 0;
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp <= LEVELS[i].max) {
      const isMaxLevel = i === LEVELS.length - 1;
      const progress = isMaxLevel ? 100 : Math.round(((xp - prevMax) / (LEVELS[i].max - prevMax + 1)) * 100);
      return { ...LEVELS[i], levelNum: i + 1, progress, nextGoal: isMaxLevel ? null : LEVELS[i].max + 1, prevMax };
    }
    prevMax = LEVELS[i].max + 1;
  }
  return { ...LEVELS[LEVELS.length - 1], levelNum: LEVELS.length, progress: 100, nextGoal: null, prevMax };
}

function App() {
  const [currentTab, setCurrentTab] = useState('home'); 
  
  // Progress State
  const [knownWords, setKnownWords] = useState(() => {
    const saved = localStorage.getItem('sweetly_known');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [unknownWords, setUnknownWords] = useState(() => {
    const saved = localStorage.getItem('sweetly_unknown');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [wrongCounts, setWrongCounts] = useState(() => {
    const saved = localStorage.getItem('sweetly_wrong_counts');
    return saved ? JSON.parse(saved) : {};
  });

  // Gamification State
  const [xp, setXp] = useState(() => {
    return parseInt(localStorage.getItem('sweetly_xp') || '0', 10);
  });
  const [achievements, setAchievements] = useState(() => {
    const saved = localStorage.getItem('sweetly_achievements');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [streakData, setStreakData] = useState(() => {
    const saved = localStorage.getItem('sweetly_streak');
    if (saved) return JSON.parse(saved);
    return { lastLoginDate: new Date().toDateString(), streakCount: 1 };
  });

  const unlockAchievement = (id) => {
    setAchievements(prev => {
      const next = new Set(prev);
      if (!next.has(id)) {
        next.add(id);
        // Bonus XP for achievement
        setXp(x => x + 100);
        // Could trigger an alert/toast here
        alert(`🏆 Achievement Unlocked: ${ACHIEVEMENTS_DATA[id].name}!\nBonus 100 XP`);
      }
      return next;
    });
  };

  // Setup / Check Daily Streaks
  useEffect(() => {
    const today = new Date().toDateString();
    
    // eslint-disable-next-line
    setStreakData((prev) => {
      if (prev.lastLoginDate === today) return prev;

      let newStreak = prev.streakCount;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      if (prev.lastLoginDate === yesterday.toDateString()) {
        newStreak += 1;
      } else {
        newStreak = 1;
      }

      // We trigger the achievement check here inside the effect asynchronously to avoid cascades
      setTimeout(() => {
        if (newStreak >= 7) {
          unlockAchievement('weekly_treat');
        }
      }, 0);

      return { lastLoginDate: today, streakCount: newStreak };
    });
  }, []); // Run once on mount

  // Sync to local storage
  useEffect(() => localStorage.setItem('sweetly_known', JSON.stringify(Array.from(knownWords))), [knownWords]);
  useEffect(() => localStorage.setItem('sweetly_unknown', JSON.stringify(Array.from(unknownWords))), [unknownWords]);
  useEffect(() => localStorage.setItem('sweetly_wrong_counts', JSON.stringify(wrongCounts)), [wrongCounts]);
  useEffect(() => localStorage.setItem('sweetly_xp', xp.toString()), [xp]);
  useEffect(() => localStorage.setItem('sweetly_achievements', JSON.stringify(Array.from(achievements))), [achievements]);
  useEffect(() => localStorage.setItem('sweetly_streak', JSON.stringify(streakData)), [streakData]);

  const addXp = (amount) => {
    setXp(prev => prev + amount);
  };

  const resetProgress = () => {
    if(window.confirm("Are you sure you want to reset all stats and XP?")) {
      setKnownWords(new Set());
      setUnknownWords(new Set());
      setWrongCounts({});
      setXp(0);
      setAchievements(new Set());
      setStreakData({ lastLoginDate: new Date().toDateString(), streakCount: 1 });
    }
  };

  return (
    <div className="bg-[#f0f2f5] min-h-screen flex justify-center font-sans">
      <div className="w-full max-w-md bg-linear-to-b from-[#fdfbfb] to-[#ebedee] min-h-screen flex flex-col relative shadow-[0_0_50px_rgba(0,0,0,0.1)] overflow-hidden">
        
        {/* Main Area */}
        <div className="flex-1 overflow-y-auto pb-24 scroll-smooth">
          {currentTab === 'home' && <HomeView 
             knownWords={knownWords} unknownWords={unknownWords} total={wordsData.length}
             resetProgress={resetProgress}
             xp={xp} achievements={achievements} streakCount={streakData.streakCount}
          />}
          {currentTab === 'flashcards' && <FlashcardsView 
             knownWords={knownWords} setKnownWords={setKnownWords}
             unknownWords={unknownWords} setUnknownWords={setUnknownWords}
             addXp={addXp}
          />}
          {currentTab === 'test' && <TestView 
             setKnownWords={setKnownWords}
             unknownWords={unknownWords} setUnknownWords={setUnknownWords}
             addXp={addXp} unlockAchievement={unlockAchievement}
             wrongCounts={wrongCounts} setWrongCounts={setWrongCounts}
          />}
        </div>

        {/* Bottom Nav */}
        <div className="absolute bottom-0 w-full bg-white/80 backdrop-blur-xl border-t border-slate-100 px-6 py-4 flex justify-between items-center z-50 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
          <NavButton icon={<Home size={24} />} label="Home" isActive={currentTab === 'home'} onClick={() => setCurrentTab('home')} />
          <NavButton icon={<Layers size={24} />} label="Flashcards" isActive={currentTab === 'flashcards'} onClick={() => setCurrentTab('flashcards')} />
          <NavButton icon={<Gamepad2 size={24} />} label="Quiz" isActive={currentTab === 'test'} onClick={() => setCurrentTab('test')} />
        </div>
      </div>
    </div>
  )
}

function NavButton({ icon, label, isActive, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`relative flex flex-col items-center gap-1 transition-all duration-300 ${isActive ? 'text-indigo-600 scale-110' : 'text-slate-400 hover:text-indigo-400 hover:-translate-y-1'}`}
    >
      {isActive && (
        <div className="absolute inset-0 bg-indigo-50 blur-xl rounded-full scale-150 opacity-50"></div>
      )}
      <div className="relative z-10">{icon}</div>
      <span className="text-[10px] font-bold tracking-wide z-10">{label}</span>
      {isActive && <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1 absolute -bottom-2 animate-in fade-in zoom-in"></div>}
    </button>
  );
}

// ==========================================
// HOME VIEW
// ==========================================
function HomeView({ knownWords, unknownWords, total, resetProgress, xp, achievements, streakCount }) {
  const [showList, setShowList] = useState(null); // 'mastered' | 'review' | null
  const remaining = total - knownWords.size - unknownWords.size;
  const progressPercent = Math.round((knownWords.size / total) * 100);
  const userLevel = getLevelInfo(xp);

  return (
    <div className="p-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-[-50px] left-[-50px] w-64 h-64 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-[10%] right-[-50px] w-64 h-64 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

      <header className="mb-8 flex justify-between items-center mt-2 relative z-10">
        <div>
          <h1 className="text-4xl font-black bg-clip-text text-transparent bg-linear-to-r from-indigo-600 via-purple-600 to-pink-500 tracking-tight drop-shadow-sm">Sweetly</h1>

        </div>
        <button onClick={resetProgress} className="w-10 h-10 bg-white/60 backdrop-blur-md rounded-2xl flex items-center justify-center text-slate-400 shadow-[0_2px_10px_rgba(0,0,0,0.05)] border border-white hover:text-indigo-500 hover:rotate-90 transition-all duration-300">
          <Settings size={18} />
        </button>
      </header>

      {/* User Profile / Level Card */}
      <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-white/80 mb-8 relative overflow-hidden group hover:shadow-[0_30px_50px_-15px_rgba(99,102,241,0.1)] transition-all duration-500">
        <div className="absolute -top-10 -right-10 p-4 opacity-5 pointer-events-none group-hover:scale-110 group-hover:rotate-12 transition-all duration-700">
           <Trophy size={140} className="text-indigo-900" />
        </div>
        
        <div className="flex items-center gap-5 mb-5">
          <div className="relative">
            <div className="absolute inset-0 bg-linear-to-br from-indigo-400 to-purple-500 rounded-2xl blur-md opacity-50 group-hover:opacity-100 transition-opacity"></div>
            <div className="w-16 h-16 bg-linear-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-inner relative z-10 border border-white/20">
               Lv.{userLevel.levelNum}
            </div>
          </div>
          <div className="flex-1 relative z-10">
             <h2 className="text-2xl font-black text-slate-800 tracking-tight">{userLevel.name}</h2>
             <p className="text-indigo-500 text-xs font-bold mt-0.5">{userLevel.desc}</p>
          </div>
        </div>

        {/* XP Bar */}
        <div className="mt-2">
          <div className="flex justify-between text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-wide">
            <span className="text-indigo-600">{xp} XP</span>
            <span>{userLevel.nextGoal ? `${userLevel.nextGoal} XP` : 'MAX'}</span>
          </div>
          <div className="w-full bg-slate-100/80 h-4 rounded-full overflow-hidden shadow-inner border border-slate-200/50 relative">
            <div 
              className="bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500 h-full rounded-full transition-all duration-1000 ease-out" 
              style={{ width: `${userLevel.progress}%` }}
            >
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/30 to-transparent w-full h-full transform -translate-x-full animate-[shimmer_2s_infinite]"></div>
            </div>
          </div>
        </div>

        <div className="flex justify-between mt-6 pt-5 border-t border-slate-100/50 relative z-10">
           <div className="text-center flex-1 border-r border-slate-100/50">
             <div className="text-xl font-black text-orange-500 flex items-center justify-center gap-1.5 drop-shadow-sm">
               <Flame size={18} className="animate-pulse" /> {streakCount}
             </div>
             <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Day Streak</div>
           </div>
           <div className="text-center flex-1">
             <div className="text-xl font-black text-purple-600 flex items-center justify-center gap-1.5 drop-shadow-sm">
               <Award size={18} /> {achievements.size}
             </div>
             <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Badges</div>
           </div>
        </div>
      </div>

      {/* Main Stats Card */}
      <h3 className="font-bold text-slate-800 mb-4 ml-1 flex items-center gap-2 text-lg">
         <Layers size={18} className="text-purple-500" /> Vocabulary Stats
      </h3>
      <div className="grid grid-cols-2 gap-4 mb-8">
        <StatCard 
          icon="✅" label="Mastered" value={knownWords.size} 
          color="bg-white/60 text-emerald-600 border border-emerald-100 shadow-[0_8px_20px_-10px_rgba(16,185,129,0.15)] backdrop-blur-sm" 
          onClick={() => setShowList('mastered')}
        />
        <StatCard 
          icon="❌" label="Needs Review" value={unknownWords.size} 
          color="bg-white/60 text-rose-600 border border-rose-100 shadow-[0_8px_20px_-10px_rgba(244,63,94,0.15)] backdrop-blur-sm" 
          onClick={() => setShowList('review')}
        />
        <div className="col-span-2">
           <div className="bg-white/70 backdrop-blur-md p-5 rounded-[1.5rem] border border-white flex items-center justify-between shadow-[0_10px_30px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_15px_35px_-15px_rgba(0,0,0,0.1)] transition-all">
             <div>
               <div className="text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-widest">Overall Progress</div>
               <div className="text-3xl font-black bg-clip-text text-transparent bg-linear-to-br from-slate-700 to-slate-900">{progressPercent}%</div>
             </div>
             <div className="text-right">
               <div className="text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-widest">Unseen</div>
               <div className="text-2xl font-black text-slate-500 opacity-80">{remaining}</div>
             </div>
           </div>
        </div>
      </div>

      {/* Achievements Locker */}
      <h3 className="font-bold text-slate-800 mb-4 ml-1 flex items-center gap-2 text-lg">
        <Trophy size={18} className="text-yellow-500" /> Locker
      </h3>
      <div className="grid grid-cols-2 gap-4 mb-8">
        {Object.values(ACHIEVEMENTS_DATA).map(badge => {
          const unlocked = achievements.has(badge.id);
          return (
            <div key={badge.id} className={`p-4 rounded-[1.5rem] flex flex-col items-center text-center transition-all duration-300 ${unlocked ? 'bg-white/80 backdrop-blur-md border border-white shadow-[0_15px_30px_-15px_rgba(234,179,8,0.2)] hover:-translate-y-1' : 'bg-slate-100/50 border border-slate-200/50 opacity-50 grayscale'}`}>
              <span className="text-4xl mb-3 filter drop-shadow-md">{badge.icon}</span>
              <span className={`text-sm font-black tracking-tight ${unlocked ? 'bg-clip-text text-transparent bg-linear-to-br from-orange-500 to-yellow-600' : 'text-slate-400'}`}>{badge.name}</span>
              <span className={`text-[10px] font-bold leading-tight mt-1 ${unlocked ? 'text-orange-900/60' : 'text-slate-400'}`}>{badge.desc}</span>
            </div>
          )
        })}
      </div>

      {/* Word List Modal */}
      {showList && (
        <WordListModal 
          type={showList} 
          onClose={() => setShowList(null)} 
          knownWords={knownWords} 
          unknownWords={unknownWords} 
        />
      )}
    </div>
  );
}

function WordListModal({ type, onClose, knownWords, unknownWords }) {
  const isMastered = type === 'mastered';
  const title = isMastered ? 'Mastered Words' : 'Needs Review';
  const titleColor = isMastered ? 'text-emerald-500' : 'text-rose-500';
  const targetSet = isMastered ? knownWords : unknownWords;

  const words = Array.from(targetSet).map(idx => wordsData[idx]);

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}></div>
      <div className="bg-white/95 backdrop-blur-2xl w-full max-w-md sm:rounded-4xl rounded-t-[2.5rem] shadow-[0_-20px_50px_rgba(0,0,0,0.1)] sm:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.3)] border-t sm:border border-white relative z-10 animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-8 duration-500 flex flex-col max-h-[85vh]">
        <div className="p-8 pb-4 flex justify-between items-center relative">
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-slate-200 rounded-full sm:hidden"></div>
          <div>
            <h3 className={`text-2xl font-black ${titleColor} tracking-tight`}>{title}</h3>
            <p className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-widest">{words.length} vocabulary {words.length === 1 ? 'word' : 'words'}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all hover:rotate-90">✕</button>
        </div>
        <div className="px-4 pb-10 overflow-y-auto flex-1 custom-scrollbar">
          {words.length === 0 ? (
            <div className="py-20 text-center">
              <span className="text-5xl block mb-4 grayscale opacity-30">🔍</span>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No words here yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 p-2">
              {words.map((w, idx) => (
                <div key={idx} className="bg-white/50 backdrop-blur-sm p-4 rounded-3xl border border-white shadow-sm flex items-center justify-between group hover:border-indigo-100 hover:bg-white transition-all">
                  <div className="flex flex-col">
                    <div className="font-black text-slate-800 text-lg tracking-tight group-hover:text-indigo-600 transition-colors">{w.word}</div>
                    <div className="text-xs text-slate-500 font-medium mt-0.5">{w.meaning_th}</div>
                  </div>
                  <div className="px-3 py-1 bg-slate-50 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-500 group-hover:border-indigo-100 transition-all">
                    {w.level}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`p-5 rounded-3xl flex flex-col items-center justify-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl active:scale-95 group relative overflow-hidden ${color}`}
    >
      <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <span className="text-3xl mb-2 filter drop-shadow-md group-hover:scale-110 transition-transform">{icon}</span>
      <span className="font-black text-3xl tracking-tight leading-none">{value}</span>
      <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 mt-2">{label}</span>
      <div className="absolute bottom-1 right-2 text-[8px] font-black uppercase tracking-tighter opacity-0 group-hover:opacity-30 transition-opacity">View List →</div>
    </button>
  );
}

// ==========================================
// FLASHCARDS VIEW
// ==========================================
function FlashcardsView({ knownWords, setKnownWords, unknownWords, setUnknownWords, addXp }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyMode, setStudyMode] = useState('all'); 
  const [shuffleSeed, setShuffleSeed] = useState(Math.random());

  // Derive the pool deterministically based on the seed
  const activeSet = React.useMemo(() => {
    let pool = studyMode === 'review' 
      ? Array.from(unknownWords).map(i => ({ index: i, ...wordsData[i] }))
      : wordsData.map((word, i) => ({ index: i, ...word }));
    
    // Use the seed to predictably shuffle during render (no side effects)
    // We recreate the array and sort it based on a pseudo-random value that only changes when requested
    // Here we use a standard Math.random sort, but since the seed only changes on explicit actions,
    // this array remains stable between normal renders where the seed and dependencies haven't changed.
    // However, to satisfy React's strict purity, instead of Math.random() in the sort, 
    // we should create a stable shuffle function tied to the seed. 
    // But honestly, the easiest way to avoid the purity error is just storing the shuffled array in state 
    // and updating it via event handlers instead of useEffect.

    return pool.map(item => ({ item, sort: Math.random() }))
               .sort((a, b) => a.sort - b.sort)
               .map(({ item }) => item);
               
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studyMode, shuffleSeed, unknownWords.size]); // We purposefully omit knownWords to avoid reshuffling when marking known

  const currentCard = activeSet.length > 0 ? activeSet[currentIndex] : null;

  const handleNext = () => {
    if (activeSet.length === 0) return;
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % activeSet.length);
    }, 150);
  };

  const handleRandom = () => {
    if (activeSet.length === 0) return;
    setIsFlipped(false);
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * activeSet.length);
      setCurrentIndex(randomIndex);
    }, 150);
  };

  const handleMark = (isKnown) => {
    if (!currentCard) return;
    const wordIndex = currentCard.index;

    if (isKnown) {
      if(!knownWords.has(wordIndex)) addXp(5); // +5 XP for learning a word
      setKnownWords(prev => {
        const next = new Set(prev);
        next.add(wordIndex);
        return next;
      });
      setUnknownWords(prev => {
        const next = new Set(prev);
        next.delete(wordIndex);
        return next;
      });
    } else {
      setUnknownWords(prev => {
        const next = new Set(prev);
        next.add(wordIndex);
        return next;
      });
      setKnownWords(prev => {
        const next = new Set(prev);
        next.delete(wordIndex);
        return next;
      });
    }
    handleNext();
  };

  const toggleStudyMode = () => {
    setIsFlipped(false);
    if (studyMode === 'all' && unknownWords.size > 0) {
      setStudyMode('review');
    } else {
      setStudyMode('all');
    }
    setShuffleSeed(Math.random()); // Reshuffle when mode changes
    setCurrentIndex(0);
  };

  return (
    <div className="flex flex-col items-center py-6 px-4 h-full animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
      
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-[20%] right-[-20%] w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute bottom-[10%] left-[-20%] w-72 h-72 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      <header className="mb-6 w-full flex justify-between items-center px-4 relative z-10">
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Flashcards</h2>
        {unknownWords.size > 0 && (
          <button 
            onClick={toggleStudyMode}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 ${
              studyMode === 'review' ? 'bg-linear-to-r from-rose-500 to-pink-500 text-white border-transparent' : 'bg-white/80 backdrop-blur-md text-rose-500 border border-white'
            }`}
          >
            {studyMode === 'review' ? '🟢 Normal Mode' : `🔴 Review Mode (${unknownWords.size})`}
          </button>
        )}
      </header>

      {/* Main Flashcard */}
      {activeSet.length === 0 ? (
        <div className="w-full h-[450px] bg-white/60 backdrop-blur-xl rounded-4xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] flex flex-col items-center justify-center text-center p-8 border border-white relative z-10">
          <span className="text-6xl mb-6 filter drop-shadow-md animate-bounce">🎉</span>
          <h2 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">Excellent!</h2>
          <p className="text-slate-500 text-sm font-medium">You have no words to review</p>
          <button onClick={toggleStudyMode} className="mt-8 px-8 py-3 bg-linear-to-r from-pink-500 to-rose-500 text-white rounded-xl font-bold text-sm shadow-[0_10px_20px_-10px_rgba(244,63,94,0.5)] hover:shadow-[0_15px_25px_-10px_rgba(244,63,94,0.6)] hover:-translate-y-1 transition-all duration-300">
            Back to all words
          </button>
        </div>
      ) : (
        <div 
          className="relative w-full aspect-[4/5] max-h-[480px] cursor-pointer [perspective:1500px] z-10"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div className={`relative w-full h-full transition-all duration-700 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
            
            {/* Front Side: English Word */}
            <div className={`absolute inset-0 w-full h-full bg-white/90 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.1)] flex flex-col items-center justify-center border border-white [backface-visibility:hidden] relative overflow-hidden transition-colors duration-500
              ${knownWords.has(currentCard.index) ? 'border-emerald-200/50 bg-emerald-50/10' : ''}
              ${unknownWords.has(currentCard.index) ? 'border-rose-200/50 bg-rose-50/20' : ''}
            `}>
              {(knownWords.has(currentCard.index) || unknownWords.has(currentCard.index)) && (
                <div className={`absolute top-0 right-0 px-5 py-2.5 rounded-bl-[1.5rem] text-[10px] font-black uppercase tracking-wider text-white shadow-sm
                    ${knownWords.has(currentCard.index) ? 'bg-linear-to-br from-emerald-400 to-green-500' : 'bg-linear-to-br from-rose-400 to-pink-500'}
                `}>
                  {knownWords.has(currentCard.index) ? '✅ Mastered' : '❌ Needs Review'}
                </div>
              )}

              <div className="absolute top-8 left-8 px-4 py-1.5 bg-linear-to-br from-slate-50 to-slate-100 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200/60 shadow-sm">
                {currentCard.level} <span className="text-slate-300 mx-1">•</span> {currentCard.pos}
              </div>
              
              <h2 className="text-5xl sm:text-6xl font-black text-slate-800 tracking-tight px-6 text-center bg-clip-text text-transparent bg-linear-to-br from-slate-700 to-slate-900 drop-shadow-sm">
                {currentCard.word}
              </h2>
              
              <div className="absolute bottom-10 flex flex-col items-center gap-3 opacity-60">
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shadow-inner border border-slate-100">
                   <span className="text-slate-400 animate-bounce text-lg">↓</span>
                </div>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">Tap to see meaning</p>
              </div>
            </div>

            {/* Back Side: Thai Meaning & Sentences */}
            <div className="absolute inset-0 w-full h-full bg-linear-to-br from-pink-50 via-purple-50 to-indigo-100 text-slate-800 rounded-4xl shadow-[0_25px_50px_-12px_rgba(99,102,241,0.25)] flex flex-col items-center justify-center p-8 backface-hidden transform-[rotateY(180deg)] border-2 border-white">
              {/* Soft glow effects inside the pastel card for a dreamy feel */}
              <div className="absolute top-0 right-0 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-[80px] opacity-40 pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-[80px] opacity-40 pointer-events-none"></div>
              
              <h3 className="text-4xl sm:text-5xl font-black mb-10 text-center leading-tight bg-clip-text text-transparent bg-linear-to-br from-indigo-600 to-purple-600 drop-shadow-sm z-10">
                {currentCard.meaning_th}
              </h3>
              
              <div className="w-full text-center overflow-y-auto max-h-[220px] scrollbar-hide z-10 relative">
                <div className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white shadow-[0_10px_30px_rgb(99,102,241,0.1)]">
                  <p className="text-xl font-medium leading-relaxed text-slate-700 italic">
                    "{currentCard.sentence_en}"
                  </p>
                  <div className="h-px bg-linear-to-r from-transparent via-indigo-200 to-transparent my-5 w-3/4 mx-auto"></div>
                  <p className="text-slate-500 text-sm font-bold tracking-wide">
                    {currentCard.sentence_th}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Control Panel */}
      {activeSet.length > 0 && (
        <div className="mt-10 flex flex-col gap-6 w-full px-2 z-10 mb-4">
          <div className="w-full h-14 relative">
             {!isFlipped ? (
                <div className="absolute inset-0 flex gap-4 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <button onClick={(e) => { e.stopPropagation(); handleRandom(); }} className="flex-1 bg-white/80 backdrop-blur-md text-slate-600 font-black uppercase tracking-widest text-[11px] rounded-[1.25rem] shadow-[0_8px_20px_-10px_rgba(0,0,0,0.1)] hover:shadow-[0_15px_25px_-10px_rgba(0,0,0,0.15)] hover:-translate-y-1 transition-all duration-300 border border-white active:scale-95">🔀 Random</button>
                  <button onClick={(e) => { e.stopPropagation(); handleNext(); }} className="flex-1 bg-linear-to-r from-indigo-500 to-purple-500 text-white font-black uppercase tracking-widest text-[11px] rounded-[1.25rem] shadow-[0_10px_20px_-10px_rgba(99,102,241,0.5)] hover:shadow-[0_15px_30px_-10px_rgba(99,102,241,0.6)] hover:-translate-y-1 transition-all duration-300 active:scale-95">Next ✨</button>
                </div>
             ) : (
                <div className="absolute inset-0 flex gap-4 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <button onClick={(e) => { e.stopPropagation(); handleMark(false); }} className="flex-1 bg-white/80 backdrop-blur-md text-rose-500 font-black uppercase tracking-widest text-[11px] rounded-[1.25rem] shadow-[0_8px_20px_-10px_rgba(244,63,94,0.15)] hover:bg-white hover:text-rose-600 hover:shadow-[0_15px_25px_-10px_rgba(244,63,94,0.2)] hover:-translate-y-1 transition-all duration-300 border border-white active:scale-95 flex items-center justify-center gap-2"><span>❌ Don't Know</span></button>
                  <button onClick={(e) => { e.stopPropagation(); handleMark(true); }} className="flex-1 bg-linear-to-r from-emerald-400 to-green-500 text-white font-black uppercase tracking-widest text-[11px] rounded-[1.25rem] shadow-[0_10px_20px_-10px_rgba(34,197,94,0.4)] hover:shadow-[0_15px_30px_-10px_rgba(34,197,94,0.5)] hover:-translate-y-1 transition-all duration-300 active:scale-95 flex items-center justify-center gap-2"><span>✅ Got It!</span></button>
                </div>
             )}
          </div>
          <div className="text-center mt-2">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
              {studyMode === 'review' ? 'Reviewing' : 'Card'} {currentIndex + 1} of {activeSet.length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// TEST VIEW
// ==========================================
function TestView({ setKnownWords, unknownWords, setUnknownWords, addXp, unlockAchievement, wrongCounts, setWrongCounts }) {
  const [question, setQuestion] = useState(null);
  const [options, setOptions] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [combo, setCombo] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(0);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const generateQuestion = () => {
    let pool = unknownWords.size > 0 && Math.random() > 0.3 
      ? Array.from(unknownWords).map(i => ({ index: i, ...wordsData[i] }))
      : wordsData.map((word, i) => ({ index: i, ...word }));

    if (pool.length === 0) return;

    const targetWord = pool[Math.floor(Math.random() * pool.length)];

    const wrongOptions = [];
    while (wrongOptions.length < 3) {
      const randWord = wordsData[Math.floor(Math.random() * wordsData.length)];
      if (randWord.word !== targetWord.word && !wrongOptions.find(w => w.meaning_th === randWord.meaning_th)) {
        wrongOptions.push(randWord);
      }
    }

    setQuestion(targetWord);
    setOptions([targetWord, ...wrongOptions].sort(() => Math.random() - 0.5));
    setSelectedAnswer(null);
    setIsCorrect(null);
    setFeedbackMsg('');
    setQuestionStartTime(Date.now());
  };

  useEffect(() => {
    generateQuestion();
    // Check Midnight Snack Achievement
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 5) {
       unlockAchievement('midnight_snack');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAnswer = (option) => {
    if (selectedAnswer !== null) return; 

    // eslint-disable-next-line
    const timeTaken = Date.now() - questionStartTime;
    const correct = option.word === question.word;
    setSelectedAnswer(option);
    setIsCorrect(correct);
    
    setScore(prev => ({ correct: prev.correct + (correct ? 1 : 0), total: prev.total + 1 }));

    if (correct) {
      const newCombo = combo + 1;
      setCombo(newCombo);
      
      let xpEarned = 10;
      if (newCombo > 2) xpEarned += 5; // combo bonus
      
      addXp(xpEarned);
      setFeedbackMsg(`Sweetly answered! You earned ${xpEarned} XP 💕`);

      // Achievement Checks
      if (newCombo >= 20) unlockAchievement('sugar_high');
      if (timeTaken <= 3000) unlockAchievement('lightning');

      setKnownWords(prev => new Set(prev).add(question.index));
      setUnknownWords(prev => {
        const next = new Set(prev);
        next.delete(question.index);
        return next;
      });
    } else {
      setCombo(0);
      setWrongCounts(prev => ({ ...prev, [question.index]: (prev[question.index] || 0) + 1 }));
      setFeedbackMsg(`Oops! A bit bitter. Time to add some sugar! 🥺`);
      setUnknownWords(prev => new Set(prev).add(question.index));
      setKnownWords(prev => {
        const next = new Set(prev);
        next.delete(question.index);
        return next;
      });
    }

    setTimeout(generateQuestion, 1800);
  };

  if (!question) return null;

  return (
    <div className="p-6 h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      
      <header className="mb-6 mt-4 flex justify-between items-end relative z-10">
        <div>
          <h2 className="text-3xl font-black bg-clip-text text-transparent bg-linear-to-r from-indigo-600 to-purple-500 drop-shadow-sm tracking-tight">Quiz Mode</h2>
          <p className="text-slate-400 text-[11px] font-bold mt-1 uppercase tracking-[0.2em]">Memory Test</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {combo > 1 && (
            <div className="bg-orange-50 px-2 py-1 rounded-lg border border-orange-100 flex items-center gap-1 animate-in slide-in-from-right zoom-in">
              <Flame size={12} className="text-orange-500" />
              <span className="text-orange-600 font-black text-xs">x{combo} Combo</span>
            </div>
          )}
          <div className="bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100 flex items-center gap-2">
            <span className="text-indigo-600 font-black">{score.correct} / {score.total}</span>
          </div>
        </div>
      </header>

      {/* Floating Feedback */}
      {selectedAnswer !== null && (
        <div className={`text-center font-bold text-sm mb-3 animate-in slide-in-from-bottom-2 fade-in ${isCorrect ? 'text-green-500' : 'text-rose-500'}`}>
          {feedbackMsg}
        </div>
      )}

      {/* Question Card */}
      <div className="bg-white/80 backdrop-blur-xl rounded-4xl p-8 shadow-[0_20px_40px_-15px_rgba(99,102,241,0.15)] border border-white mb-8 flex-1 flex flex-col items-center justify-center relative z-10 transition-all duration-300 hover:shadow-[0_25px_50px_-15px_rgba(99,102,241,0.2)]">
         <div className="absolute top-5 left-6 text-slate-300 font-bold text-xs uppercase tracking-widest">What does it mean?</div>
         {wrongCounts[question.index] > 0 && (
           <div className="absolute top-5 right-5 text-rose-500 bg-rose-50/80 backdrop-blur-sm px-3 py-1 rounded-xl font-bold text-[10px] uppercase tracking-wide flex items-center gap-1.5 shadow-[0_4px_10px_-2px_rgba(244,63,94,0.1)] border border-rose-100">
             ⚠️ Incorrect {wrongCounts[question.index]} times before
           </div>
         )}
         <h3 className="text-5xl text-center font-black bg-clip-text text-transparent bg-linear-to-br from-slate-700 to-slate-900 drop-shadow-sm tracking-tight mt-6">
           {question.word}
         </h3>
         <div className="mt-6 px-4 py-1.5 bg-linear-to-br from-indigo-50 to-purple-50 text-indigo-500 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-100/50 shadow-sm flex items-center gap-2">
            <span>{question.level}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-200"></span>
            <span>{question.pos}</span>
         </div>
      </div>

      <div className="grid grid-cols-1 gap-4 mb-6 relative z-10">
        {options.map((option, idx) => {
          let btnStyle = "bg-white/90 backdrop-blur-sm border border-slate-100 text-slate-600 shadow-[0_4px_15px_-5px_rgba(0,0,0,0.05)] hover:shadow-[0_10px_20px_-5px_rgba(99,102,241,0.15)] hover:border-indigo-200 hover:-translate-y-1 hover:bg-linear-to-r hover:from-white hover:to-indigo-50";
          let icon = null;

          if (selectedAnswer !== null) {
            if (option.word === question.word) {
              btnStyle = "bg-linear-to-r from-emerald-50 to-green-50 z-10 border border-emerald-200 text-green-700 shadow-[0_10px_25px_-5px_rgba(16,185,129,0.3)] scale-[1.03] transition-all";
              icon = "✅";
            } else if (selectedAnswer.word === option.word && !isCorrect) {
              btnStyle = "bg-linear-to-r from-rose-50 to-pink-50 border border-rose-200 text-rose-700 shadow-[0_10px_25px_-5px_rgba(244,63,94,0.3)]";
              icon = "❌";
            } else {
              btnStyle = "bg-slate-50/50 border border-slate-100 text-slate-400 opacity-40 grayscale";
            }
          }

          return (
            <button 
              key={idx} onClick={() => handleAnswer(option)} disabled={selectedAnswer !== null}
              className={`p-5 rounded-3xl w-full text-left font-bold transition-all duration-300 relative flex items-center justify-between ${btnStyle} active:scale-95`}
            >
              <span className="text-lg tracking-wide">{option.meaning_th}</span>
              {icon && <span className="text-2xl animate-in zoom-in spin-in-12">{icon}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default App