import { useState, useMemo } from 'react';
import { Transaction, RUNES, OperationType } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../store';
import { translations } from '../lib/i18n';
import { auth, db } from '../lib/firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError } from '../lib/errorHandler';

export default function TreasureChest({ transactions }: { transactions: Transaction[] }) {
  const language = useAppStore(state => state.language);
  const t = translations[language];

  const balances = useMemo(() => {
    const acc: Record<string, number> = {};
    RUNES.forEach(r => acc[r.id] = 0);
    
    transactions.forEach(t => {
      if (acc[t.rune] !== undefined) {
        if (t.type === 'Gain' || t.type === 'PotionDrink') acc[t.rune] += t.amount;
        else if (t.type === 'Expense' || t.type === 'PotionBuy') acc[t.rune] -= t.amount;
      }
    });
    return acc;
  }, [transactions]);

  const total = Object.values(balances).reduce((a, b) => a + b, 0);

  const potionStash = useMemo(() => {
    return transactions.reduce((acc, tx) => {
      if (tx.type === 'PotionBuy') return acc + tx.amount;
      if (tx.type === 'PotionDrink') return acc - tx.amount;
      return acc;
    }, 0);
  }, [transactions]);

  const [potionForm, setPotionForm] = useState<'buy' | 'drink' | null>(null);
  const [potionAmount, setPotionAmount] = useState('');
  const [potionRune, setPotionRune] = useState(RUNES[0].id);
  const [loading, setLoading] = useState(false);

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
    <div className="flex flex-col gap-4 w-full">
      <div className="bg-[#3e2723] border-4 border-black p-4 flex-1 shadow-[4px_4px_0_0_#000]">
        <h2 className="text-[#ffcc00] font-sans text-sm md:text-base uppercase mb-4 border-b-2 border-black pb-2 flex items-center gap-2">
          <span>💰</span> {t.treasureChest}
        </h2>
        <div className="space-y-4">
          {RUNES.map(r => (
            <motion.div 
              key={r.id} 
              className="flex justify-between items-center bg-[#2b1d12] p-2 border-2 border-black"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{r.icon}</span>
                <span className="font-sans text-[10px] md:text-sm uppercase text-[#f4e4bc]">{r.name}</span>
              </div>
              <div className="font-sans text-[10px] md:text-sm text-[#aed581]">Rp {(balances[r.id] || 0).toLocaleString('id-ID')}</div>
            </motion.div>
          ))}
        </div>
        <div className="mt-8 pt-4 border-t-2 border-black">
          <div className="font-sans text-[10px] md:text-xs uppercase opacity-50 mb-1 text-[#f4e4bc]">{t.totalNetWorth}</div>
          <div className="font-sans text-xl md:text-2xl font-bold text-[#ffcc00] drop-shadow-md">Rp {total.toLocaleString('id-ID')}</div>
        </div>
      </div>

      <div className="bg-indigo-900 border-4 border-black p-4 shadow-[4px_4px_0_0_#000]">
        <h2 className="text-[#ffcc00] font-sans text-sm md:text-base uppercase mb-2 border-b-2 border-black pb-2 flex items-center gap-2">
          <span>🧪</span> {t.potionStash}
        </h2>
        <div className="font-sans text-xl md:text-2xl font-bold text-purple-300 drop-shadow-md mb-2">Rp {potionStash.toLocaleString('id-ID')}</div>
        <p className="text-[10px] text-indigo-300 italic mb-4">{t.potionHint}</p>
        
        <div className="flex gap-2">
          <button onClick={() => setPotionForm(potionForm === 'buy' ? null : 'buy')} className={`flex-1 text-[10px] py-1 border-2 border-black uppercase font-bold shadow-[2px_2px_0_0_#000] active:translate-y-1 active:shadow-none ${potionForm === 'buy' ? 'bg-indigo-400 text-black' : 'bg-indigo-700 text-white hover:bg-indigo-600'}`}>+{t.buy}</button>
          <button onClick={() => setPotionForm(potionForm === 'drink' ? null : 'drink')} disabled={potionStash <= 0} className={`flex-1 text-[10px] py-1 border-2 border-black uppercase font-bold shadow-[2px_2px_0_0_#000] active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed ${potionForm === 'drink' ? 'bg-pink-400 text-black' : 'bg-pink-700 text-white hover:bg-pink-600'}`}>-{t.drink}</button>
        </div>

        <AnimatePresence>
          {potionForm && (
            <motion.form 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              onSubmit={handlePotionAction}
              className="mt-4 flex flex-col gap-2 overflow-hidden"
            >
              <input 
                type="number" 
                min="1" 
                max={potionForm === 'drink' ? potionStash : undefined}
                required
                value={potionAmount}
                onChange={e => setPotionAmount(e.target.value)}
                placeholder="Amount"
                className="w-full bg-[#1a1a17] border-2 border-black p-2 font-sans text-sm text-white focus:outline-none focus:border-[#ffcc00]"
              />
              <select 
                value={potionRune} 
                onChange={e => setPotionRune(e.target.value)}
                className="w-full bg-[#1a1a17] border-2 border-black p-2 font-sans text-sm text-white focus:outline-none"
              >
                {RUNES.map(r => <option key={r.id} value={r.id}>{r.icon} {r.name}</option>)}
              </select>
              <button disabled={loading} type="submit" className="w-full bg-[#ffcc00] text-black font-bold uppercase text-xs py-2 border-2 border-black disabled:opacity-50">{loading ? '...' : 'Confirm'}</button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
