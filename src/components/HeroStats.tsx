import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Volume2, VolumeX } from 'lucide-react';
import { Transaction, UserProfile } from '../types';
import { isSameMonth, subDays, isSameDay } from 'date-fns';
import { useAppStore } from '../store';
import { translations } from '../lib/i18n';
import { soundEngine } from '../lib/SoundEngine';

export default function HeroStats({ transactions, profile }: { transactions: Transaction[], profile: UserProfile }) {
  const language = useAppStore(state => state.language);
  const t = translations[language];
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);

  const toggleMusic = async () => {
    const isPlaying = await soundEngine.toggleMusic();
    setIsPlayingMusic(isPlaying);
  };

  const stats = useMemo(() => {
    const today = new Date();
    const currentMonthTxs = transactions.filter(t => t.timestamp && isSameMonth(t.timestamp.toDate(), today));
    
    let monthGain = 0;
    let monthExpense = 0;
    let impulseExpense = 0;
    const activeDays = new Set<string>();

    let potionStash = 0;
    let totalNetWorth = 0;

    transactions.forEach(t => {
      if (t.type === 'PotionBuy') potionStash += t.amount;
      if (t.type === 'PotionDrink') potionStash -= t.amount;
      
      if (t.type === 'Gain' || t.type === 'PotionDrink') totalNetWorth += t.amount;
      if (t.type === 'Expense' || t.type === 'PotionBuy') totalNetWorth -= t.amount;
    });

    currentMonthTxs.forEach(t => {
      const dateStr = t.timestamp.toDate().toDateString();
      activeDays.add(dateStr);

      if (t.type === 'Gain') monthGain += t.amount;
      if (t.type === 'Expense') {
        monthExpense += t.amount;
        if (t.category === '👻 Shadow Toll') {
          impulseExpense += t.amount;
        }
      }
    });

    const incomeBase = profile.monthlyIncome + monthGain;
    const maxHP = profile.customHPCap || 100000;
    
    let title = '🌱 ' + t.peasant;

    if (monthExpense < incomeBase * 0.6 && monthExpense > 0) {
      title = '⚔️ ' + t.savingsHero;
    }
    
    if (monthExpense > 0 && impulseExpense > monthExpense * 0.4) {
      title = '👑 ' + t.greedKing;
    }

    if (totalNetWorth > 10000000) {
      title = '🐉 ' + t.nineDragon;
    }

    // Checking well prepared
    if (potionStash >= 3 * maxHP && maxHP > 0) {
      title = '🛡️ Well Prepared Adventurer';
    }

    // Checking alchemist (7 consecutive days of PotionBuy)
    let consecutiveCount = 0;
    for (let i = 0; i < 7; i++) {
      const d = subDays(today, i);
      const hasPotionBuy = transactions.some(tx => 
        tx.type === 'PotionBuy' && tx.timestamp && isSameDay(tx.timestamp.toDate(), d)
      );
      if (hasPotionBuy) consecutiveCount++;
      else break;
    }
    if (consecutiveCount === 7) {
      title = '🧪 Alchemist';
    }

    if (activeDays.size === 0) {
      title = '💀 ' + t.ghostWallet;
    }

    return { monthGain, monthExpense, title, charName: profile.characterName || 'Traveler', avatar: profile.avatar || '🧑‍🌾', totalNetWorth };
  }, [transactions, profile, t]);

  const getLevelStyle = (title: string) => {
    const emoji = title.split(' ')[0];
    switch (emoji) {
      case '🌱': return 'bg-[#f4e4bc] text-amber-900 border-amber-900 shadow-[2px_2px_0_0_#451a03]';
      case '⚔️': return 'bg-blue-600 text-white border-blue-900 shadow-[2px_2px_0_0_#1e3a8a]';
      case '👑': return 'bg-yellow-400 text-purple-900 border-purple-900 shadow-[2px_2px_0_0_#581c87]';
      case '🐉': return 'bg-emerald-600 text-white border-emerald-950 shadow-[2px_2px_0_0_#022c22]';
      case '🛡️': return 'bg-slate-700 text-slate-100 border-slate-950 shadow-[2px_2px_0_0_#020617]';
      case '🧪': return 'bg-fuchsia-900 text-green-300 border-fuchsia-950 shadow-[2px_2px_0_0_#4a044e]';
      case '💀': return 'bg-zinc-900 text-red-500 border-red-950 shadow-[2px_2px_0_0_#450a0a]';
      default: return 'bg-[#5d4037] text-white border-black shadow-[2px_2px_0_0_#000]';
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 md:gap-3 mb-1">
        <h1 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold uppercase tracking-tighter text-[#ffcc00] leading-normal drop-shadow-[4px_4px_0_#000]">
          {profile.gender === 'Madam' ? 'Lady' : 'Sir'} {stats.charName}
        </h1>
        <button 
          onClick={toggleMusic} 
          className="fixed bottom-6 right-6 z-[100] bg-[#3e2723] hover:bg-[#5d4037] text-[#ffcc00] p-4 border-4 border-black rounded-full shadow-[4px_4px_0_0_#000] active:translate-y-1 active:shadow-[2px_2px_0_0_#000] transition-all"
        >
          {isPlayingMusic ? <Volume2 size={24} /> : <VolumeX size={24} />}
        </button>
      </div>
      <div className="flex flex-col gap-2 md:gap-4 flex-wrap">
        <div className="flex items-stretch gap-2 md:gap-3 flex-wrap">
          <div className="bg-gradient-to-b from-[#2b1d12] to-[#1a1a17] border-2 border-amber-600/50 px-4 py-1.5 flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.1),2px_2px_0_0_rgba(217,119,6,0.3)] relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent"></div>
            <span className="font-display text-[11px] md:text-sm uppercase text-amber-500 tracking-[0.2em] font-black drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] z-10">
              LVL <span className="text-amber-400 text-sm md:text-base">{Math.floor(stats.monthGain / 1000000) + 1}</span>
            </span>
          </div>
          <div className={`font-sans px-4 py-1.5 border-2 text-[11px] md:text-sm uppercase flex items-center gap-2 font-black transition-all relative overflow-hidden ${getLevelStyle(stats.title)}`}>
            <div className="absolute top-0 left-0 w-full h-[1px] bg-white/20"></div>
            <span className="text-lg leading-none drop-shadow-md z-10 scale-110">{stats.title.split(' ')[0]}</span>
            <span className="tracking-[0.15em] z-10 drop-shadow-md">{stats.title.substring(stats.title.indexOf(' ') + 1)}</span>
          </div>
        </div>

        {/* EXP Bar */}
        <div className="w-full max-w-sm flex flex-col gap-1 mt-1">
          <div className="flex justify-between text-[10px] uppercase font-bold text-amber-600 tracking-widest font-sans">
            <span>EXP</span>
            <span>{Math.max(0, stats.monthGain % 1000000).toLocaleString('id-ID')} / 1.000.000</span>
          </div>
          <div className="h-2 w-full bg-black/10 border border-black/30 overflow-hidden relative">
            <motion.div 
              className="h-full bg-[#ffcc00] border-r border-[#d4a000]"
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(0, Math.min(100, (stats.monthGain % 1000000) / 1000000 * 100))}%` }}
              transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            />
          </div>
        </div>

        {/* Total Net Worth */}
        <div className="w-full max-w-sm flex flex-col mt-2 p-3 pb-4 bg-gradient-to-r from-[#2b1d12] to-[#1a1a17] border-2 border-[#5d4037] shadow-[2px_2px_0_0_#000] relative overflow-hidden group hover:border-[#ffcc00] transition-colors">
          <div className="absolute top-0 right-0 p-2 opacity-10 font-black text-6xl pointer-events-none transform translate-x-4 -translate-y-4 text-[#ffcc00]">✦</div>
          <span className="font-display text-[10px] uppercase tracking-[0.2em] text-[#f4e4bc] mb-1 opacity-80 z-10">
            {language === 'id' ? 'Total Kekayaan Bersih' : 'Total Net Worth'}
          </span>
          <span className={`font-sans text-2xl md:text-3xl font-black drop-shadow-[2px_2px_0_rgba(0,0,0,1)] tracking-tight z-10 flex items-center mb-3 ${stats.totalNetWorth < 0 ? 'text-[#ef5350]' : 'text-[#ffcc00]'}`}>
            {stats.totalNetWorth < 0 ? '-' : ''} <span className="text-sm mr-1 opacity-70">Rp</span> {Math.abs(stats.totalNetWorth).toLocaleString('id-ID')}
          </span>
          
          <div className="flex gap-2 mt-auto z-10 border-t border-[#5d4037] pt-3">
            <motion.div 
              key={`gain-${stats.monthGain}`} 
              initial={{ scale: 1.2, backgroundColor: 'rgba(102,187,106,0.5)', color: '#fff' }} 
              animate={{ scale: 1, backgroundColor: 'rgba(26,26,23,1)', color: '#aed581' }} 
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="flex-1 font-sans text-[#aed581] text-[10px] uppercase tracking-widest px-2 py-1.5 border border-[#aed581]/30 shadow-[2px_2px_0_0_rgba(174,213,129,0.3)] flex flex-col justify-center"
            >
              <div className="flex items-center gap-1 opacity-80 mb-0.5"><span className="text-[8px] animate-pulse">▲</span> {t.bountyBtn}</div>
              <div className="font-bold text-xs">{stats.monthGain.toLocaleString('id-ID')}</div>
            </motion.div>
            <motion.div 
              key={`exp-${stats.monthExpense}`} 
              initial={{ scale: 1.2, backgroundColor: 'rgba(239,83,80,0.5)', color: '#fff' }} 
              animate={{ scale: 1, backgroundColor: 'rgba(26,26,23,1)', color: '#ef5350' }} 
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="flex-1 font-sans text-[#ef5350] text-[10px] uppercase tracking-widest px-2 py-1.5 border border-[#ef5350]/30 shadow-[2px_2px_0_0_rgba(239,83,80,0.3)] flex flex-col justify-center"
            >
              <div className="flex items-center gap-1 opacity-80 mb-0.5"><span className="text-[8px] animate-pulse">▼</span> {t.tollBtn}</div>
              <div className="font-bold text-xs">{stats.monthExpense.toLocaleString('id-ID')}</div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
