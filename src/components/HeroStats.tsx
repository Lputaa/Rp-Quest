import { useMemo } from 'react';
import { motion } from 'motion/react';
import { Transaction, UserProfile } from '../types';
import { isSameMonth, subDays, isSameDay } from 'date-fns';
import { useAppStore } from '../store';
import { translations } from '../lib/i18n';

export default function HeroStats({ transactions, profile }: { transactions: Transaction[], profile: UserProfile }) {
  const language = useAppStore(state => state.language);
  const t = translations[language];

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
      // Calculate stash considering all time
      if (t.type === 'PotionBuy') potionStash += t.amount;
      if (t.type === 'PotionDrink') potionStash -= t.amount;
      
      if (t.type === 'Gain') totalNetWorth += t.amount;
      if (t.type === 'Expense') totalNetWorth -= t.amount;
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
    const maxHP = profile.customHPCap || profile.targetDailyExpense || Math.max(0, (profile.monthlyIncome - (profile.targetSavings || 0)) / 30);
    
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

    return { monthGain, monthExpense, title, charName: profile.characterName || 'Traveler', avatar: profile.avatar || '🧑‍🌾' };
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
          {stats.avatar} {profile.gender === 'Madam' ? 'Lady' : 'Sir'} {stats.charName}
        </h1>
      </div>
      {profile && (profile.monthlyIncome === 0 || !profile.monthlyIncome) && (
        <div className="bg-red-900 border-2 border-black text-white text-xs p-1 px-2 inline-block mb-2 font-bold uppercase animate-pulse">
          ⚠️ {language === 'id' ? 'Setir Gaji di Settings!' : 'Set Income in Settings!'}
        </div>
      )}
      <div className="flex flex-col gap-2 md:gap-4 flex-wrap">
        <div className="flex items-center gap-2 md:gap-4 flex-wrap">
          <span className={`font-sans px-3 py-1 border-2 text-xs uppercase flex items-center gap-2 font-bold transition-all ${getLevelStyle(stats.title)}`} style={{fontFamily: 'monospace'}}>
            <span className="text-base leading-none">{stats.title.split(' ')[0]}</span>
            <span>Lv. {Math.floor(stats.monthGain / 1000000) + 1} {stats.title.substring(stats.title.indexOf(' ') + 1)}</span>
          </span>
          <div className="flex gap-2">
            <motion.div 
              key={`exp-${stats.monthExpense}`} 
              initial={{ scale: 1.2, backgroundColor: 'rgba(239,83,80,0.5)', color: '#fff' }} 
              animate={{ scale: 1, backgroundColor: 'rgba(26,26,23,1)', color: '#ef5350' }} 
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="font-sans text-[#ef5350] text-xs uppercase tracking-widest px-2 py-1 border border-[#ef5350]/30 shadow-[2px_2px_0_0_rgba(239,83,80,0.3)] flex items-center gap-1"
            >
              <span className="text-[10px] animate-pulse">▼</span> {t.tollBtn}: {stats.monthExpense.toLocaleString('id-ID')}
            </motion.div>
            <motion.div 
              key={`gain-${stats.monthGain}`} 
              initial={{ scale: 1.2, backgroundColor: 'rgba(102,187,106,0.5)', color: '#fff' }} 
              animate={{ scale: 1, backgroundColor: 'rgba(26,26,23,1)', color: '#aed581' }} 
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="font-sans text-[#aed581] text-xs uppercase tracking-widest px-2 py-1 border border-[#aed581]/30 shadow-[2px_2px_0_0_rgba(174,213,129,0.3)] flex items-center gap-1"
            >
              <span className="text-[10px] animate-pulse">▲</span> {t.bountyBtn}: {stats.monthGain.toLocaleString('id-ID')}
            </motion.div>
          </div>
        </div>

        {/* EXP Bar */}
        <div className="w-full max-w-sm flex flex-col gap-1">
          <div className="flex justify-between text-[10px] uppercase font-bold text-amber-600 tracking-widest font-sans">
            <span>EXP</span>
            <span>{(stats.monthGain % 1000000).toLocaleString('id-ID')} / 1.000.000</span>
          </div>
          <div className="h-2 w-full bg-black/10 border border-black/30 overflow-hidden relative">
            <motion.div 
              className="h-full bg-[#ffcc00] border-r border-[#d4a000]"
              initial={{ width: 0 }}
              animate={{ width: `${(stats.monthGain % 1000000) / 1000000 * 100}%` }}
              transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
