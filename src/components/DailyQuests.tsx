import { useMemo } from 'react';
import { Transaction } from '../types';
import { isSameDay } from 'date-fns';
import { useAppStore } from '../store';
import { translations } from '../lib/i18n';

export default function DailyQuests({ transactions }: { transactions: Transaction[] }) {
  const language = useAppStore(state => state.language);
  const t = translations[language];

  const todayTransactions = useMemo(() => {
    const today = new Date();
    return transactions.filter(t => t.timestamp && isSameDay(t.timestamp.toDate(), today));
  }, [transactions]);

  const gainCount = todayTransactions.filter(t => t.type === 'Gain').length;
  const expenseCount = todayTransactions.filter(t => t.type === 'Expense').length;

  const quest1Completed = gainCount >= 1;
  const quest2Completed = expenseCount <= 3;

  return (
    <div className="space-y-4">
      <div className="bg-[#1b5e20] border-4 border-black p-3 shadow-[4px_4px_0_0_#000]">
        <div className="font-sans text-[10px] md:text-xs uppercase text-[#aed581] mb-2 font-bold tracking-widest">⚔️ "{t.merchantsPath}"</div>
        <div className={`font-sans text-xs md:text-sm leading-tight ${quest1Completed ? 'opacity-50 line-through text-[#f4e4bc]' : 'text-white'}`}>{t.recordGain}</div>
        <div className="mt-2 h-2 bg-black border border-[#5a5a5a]">
          <div className="h-full bg-[#ffcc00]" style={{ width: quest1Completed ? '100%' : '0%' }}></div>
        </div>
      </div>

      <div className="bg-[#1b5e20] border-4 border-black p-3 shadow-[4px_4px_0_0_#000]">
        <div className="font-sans text-[10px] md:text-xs uppercase text-[#aed581] mb-2 font-bold tracking-widest">🛡️ "{t.restraintBear}"</div>
        <div className={`font-sans text-xs md:text-sm leading-tight ${expenseCount > 3 ? 'text-red-400 line-through' : 'text-white'}`}>{t.keepTolls} ({expenseCount}/3)</div>
        <div className="mt-2 h-2 bg-black border border-[#5a5a5a]">
          <div className="h-full bg-[#ffcc00]" style={{ width: `${Math.min(100, Math.max(0, (3 - expenseCount) / 3 * 100))}%` }}></div>
        </div>
      </div>
    </div>
  );
}
