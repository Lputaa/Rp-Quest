import React, { useState, useMemo } from 'react';
import { Transaction, RUNES, OperationType } from '../types';
import { db, auth } from '../lib/firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../store';
import { translations } from '../lib/i18n';
import { handleFirestoreError } from '../lib/errorHandler';

export default function TreasureChest({ transactions }: { transactions: Transaction[] }) {
  const language = useAppStore(state => state.language);
  const t = translations[language];

  const [potionForm, setPotionForm] = useState<'buy' | 'drink' | null>(null);
  const [potionAmount, setPotionAmount] = useState('');
  const [potionRune, setPotionRune] = useState(RUNES[0].id);
  const [loading, setLoading] = useState(false);

  const balances = useMemo(() => {
    const acc: Record<string, number> = {};
    RUNES.forEach(r => acc[r.id] = 0);
    transactions.forEach(tx => {
      if (acc[tx.rune] !== undefined) {
        if (tx.type === 'Gain' || tx.type === 'PotionDrink') acc[tx.rune] += tx.amount;
        else if (tx.type === 'Expense' || tx.type === 'PotionBuy') acc[tx.rune] -= tx.amount;
      }
    });
    return acc;
  }, [transactions]);

  const potionStash = useMemo(() => {
    return transactions.reduce((acc, tx) => {
      if (tx.type === 'PotionBuy') return acc + tx.amount;
      if (tx.type === 'PotionDrink') return acc - tx.amount;
      return acc;
    }, 0);
  }, [transactions]);

  const handlePotionAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !potionForm || !potionAmount) return;
    setLoading(true);
    try {
      const txRef = doc(collection(db, 'users', auth.currentUser.uid, 'transactions'));
      await setDoc(txRef, {
        type: potionForm === 'buy' ? 'PotionBuy' : 'PotionDrink',
        amount: Number(potionAmount),
        category: '🧪 Emergency Potion',
        rune: potionRune,
        timestamp: serverTimestamp()
      });
      setPotionForm(null);
      setPotionAmount('');
    } catch (error) {
       handleFirestoreError(error, OperationType.CREATE, `users/${auth.currentUser.uid}/transactions`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#2b1d12] border-4 border-black p-4 shadow-[4px_4px_0_0_#000]">
      <h2 className="font-display text-lg uppercase text-[#ffcc00] mb-4 border-b-2 border-dashed border-[#5d4037] pb-2 flex items-center gap-2">
        <span className="text-2xl drop-shadow-[2px_2px_0px_#000]">💰</span> {t.treasureChest}
      </h2>
      
      <div className="space-y-4">
        {/* Potions */}
        <div className="bg-indigo-900 border-2 border-black p-3 relative hover:scale-[1.02] transition-transform">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs uppercase font-bold text-indigo-300 flex items-center gap-2">
              <span className="text-xl">🧪</span> Emergency Potions
            </span>
            <span className="text-lg font-bold text-white tracking-widest">Rp {potionStash.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPotionForm(potionForm === 'buy' ? null : 'buy')}
              className={`flex-1 text-xs uppercase font-bold py-1 border-2 border-black transition-colors ${
                potionForm === 'buy' ? 'bg-indigo-400 text-black' : 'bg-indigo-700 text-white hover:bg-indigo-600'
              }`}
            >
              + {t.buy}
            </button>
            <button
              disabled={potionStash <= 0}
              onClick={() => setPotionForm(potionForm === 'drink' ? null : 'drink')}
              className={`flex-1 text-xs uppercase font-bold py-1 border-2 border-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                potionForm === 'drink' ? 'bg-pink-400 text-black' : 'bg-pink-700 text-white hover:bg-pink-600'
              }`}
            >
              - {t.drink}
            </button>
          </div>
          
          <AnimatePresence>
            {potionForm && (
              <motion.form 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                onSubmit={handlePotionAction}
                className="mt-3 overflow-hidden flex flex-col gap-2"
              >
                <div className="flex gap-2">
                  <input
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    min="1"
                    max={potionForm === 'drink' ? potionStash : undefined}
                    required
                    value={potionAmount}
                    onChange={e => setPotionAmount(e.target.value)}
                    placeholder="Amount..."
                    className="w-1/2 bg-[#1a1a17] border-2 border-black p-2 font-sans text-sm text-white focus:outline-none focus:border-[#ffcc00]"
                  />
                  <select
                    value={potionRune}
                    onChange={e => setPotionRune(e.target.value)}
                    className="w-1/2 bg-[#1a1a17] border-2 border-black p-2 font-sans text-sm text-white focus:outline-none"
                  >
                    {RUNES.map(r => (
                      <option key={r.id} value={r.id}>{r.icon} {r.name}</option>
                    ))}
                  </select>
                </div>
                {potionAmount && !isNaN(Number(potionAmount)) && (
                   <p className="text-[#ffcc00] font-sans text-xs font-bold tracking-widest text-left">
                     Rp {Number(potionAmount).toLocaleString('id-ID')}
                   </p>
                )}
                <button
                  disabled={loading}
                  type="submit"
                  className="w-full bg-[#ffcc00] text-black font-bold uppercase text-xs py-2 border-2 border-black active:translate-y-1 shadow-[2px_2px_0_0_#000] active:shadow-none transition-all disabled:opacity-50"
                >
                  {loading ? '...' : (language === 'id' ? 'Konfirmasi' : 'Confirm')}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* Runes */}
        {RUNES.map(r => {
          const bal = balances[r.id] || 0;
          return (
          <div key={r.id} className="bg-[#1a1a17] border-2 border-[#3d251e] p-3 flex justify-between items-center hover:border-[#ffcc00] transition-colors">
            <div className="flex items-center gap-2">
              <span className="text-xl drop-shadow-md">{r.icon}</span>
              <span className="font-sans text-xs md:text-sm uppercase text-[#f4e4bc] tracking-wider">{r.name}</span>
            </div>
            <span className={`font-sans text-sm md:text-base font-bold ${bal < 0 ? 'text-[#ef5350]' : 'text-[#aed581]'}`}>
              {bal < 0 ? '-' : ''}Rp {Math.abs(bal).toLocaleString('id-ID')}
            </span>
          </div>
          );
        })}
      </div>
    </div>
  );
}
