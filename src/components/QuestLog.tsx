import React, { useMemo } from 'react';
import { Transaction } from '../types';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../store';
import { translations } from '../lib/i18n';

const QuestLog = React.memo(function QuestLog({ transactions }: { transactions: Transaction[] }) {
  const language = useAppStore(state => state.language);
  const t = translations[language];

  // Memoize and limit to latest 50 to prevent huge DOM tree
  const recentTransactions = useMemo(() => {
    return transactions.slice(0, 50);
  }, [transactions]);

  return (
    <div className="bg-[#f4e4bc] border-4 border-black text-[#3e2723] p-6 shadow-[8px_8px_0_0_#000] flex-1 relative overflow-hidden min-h-[400px]">
      {/* Scroll decorations */}
      <div className="absolute top-0 left-0 w-full h-4 bg-[#d7ccc8] border-b-2 border-black" />
      <div className="absolute bottom-0 left-0 w-full h-4 bg-[#d7ccc8] border-t-2 border-black" />
      
      <div className="flex justify-between items-center mb-6 mt-4">
        <h2 className="font-sans text-xl font-bold uppercase tracking-tighter">📜 {t.parchmentLog}</h2>
        <span className="font-sans text-[10px] md:text-xs font-bold border-2 border-[#3e2723] px-2 py-1">{t.logs}</span>
      </div>

      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar pb-8">
        <AnimatePresence>
          {recentTransactions.length === 0 ? (
            <p className="text-center font-sans text-xl text-[#3e2723]/60 py-8 italic">{t.noQuests}</p>
          ) : (
            recentTransactions.map((tItem) => (
              <motion.div
                key={tItem.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="border-b-2 border-[#d7ccc8] pb-2 flex justify-between items-center"
              >
                <div className="flex flex-col">
                  <span className="font-sans text-[10px] md:text-sm uppercase opacity-60">
                    {tItem.timestamp ? format(tItem.timestamp.toDate(), 'dd MMM') : t.justNow} • {tItem.type === 'Gain' ? t.bountyBtn : (tItem.type === 'Expense' ? t.tollBtn : 'Potion')} • {tItem.rune}
                  </span>
                  <span className="font-sans text-sm md:text-lg font-bold">
                    {tItem.type.startsWith('Potion') && <span className="mr-1 text-[10px] bg-purple-200 text-purple-800 px-1 border border-purple-800 rounded-sm">[POTION]</span>}
                    {tItem.category}
                  </span>
                  {tItem.description && (
                    <span className="font-sans text-[10px] md:text-xs text-[#3e2723]/80 italic mt-0.5">
                      "{tItem.description}"
                    </span>
                  )}
                </div>
                <span className={`font-sans text-sm md:text-lg font-bold ${(tItem.type === 'Gain' || tItem.type === 'PotionDrink') ? 'text-green-700' : 'text-red-700'}`}>
                  {(tItem.type === 'Gain' || tItem.type === 'PotionDrink') ? '+' : '-'} Rp {tItem.amount.toLocaleString('id-ID')}
                </span>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #d7ccc8; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #3e2723; 
        }
      `}</style>
    </div>
  );
});

export default QuestLog;
