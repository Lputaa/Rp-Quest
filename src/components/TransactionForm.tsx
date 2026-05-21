import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../lib/firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError } from '../lib/errorHandler';
import { OperationType, GAIN_CATEGORIES, EXPENSE_CATEGORIES, RUNES, TransactionType } from '../types';
import { useAppStore } from '../store';
import { translations } from '../lib/i18n';

export default function TransactionForm() {
  const language = useAppStore(state => state.language);
  const t = translations[language];

  const [tab, setTab] = useState<TransactionType>('Expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [rune, setRune] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !amount || !category || !rune) return;

    setLoading(true);
    try {
      const uid = auth.currentUser.uid;
      const ref = doc(collection(db, 'users', uid, 'transactions'));
      await setDoc(ref, {
        type: tab,
        amount: Number(amount),
        category,
        rune,
        timestamp: serverTimestamp()
      });
      setAmount('');
      setCategory('');
      setRune('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${auth.currentUser?.uid}/transactions`);
    } finally {
      setLoading(false);
    }
  };

  const categories = tab === 'Gain' ? GAIN_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="bg-[#2b1d12] border-4 border-black shadow-[8px_8px_0_0_#000]">
      <div className="flex border-b-4 border-black">
        <button
          onClick={() => { setTab('Gain'); setCategory(''); }}
          className={`relative flex-1 flex items-center justify-center py-4 font-sans font-bold text-sm md:text-base uppercase border-r-4 border-black transition-colors duration-300 ${tab === 'Gain' ? 'text-black' : 'bg-[#1b5e20] text-[#aed581] hover:bg-[#4caf50]/80'}`}
        >
          {tab === 'Gain' && (
            <motion.div 
              layoutId="activeTabIndicator" 
              className="absolute inset-0 bg-[#4caf50] shadow-[inset_0_-4px_0_rgba(0,0,0,0.3)] origin-bottom" 
              initial={false}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            <span className="text-xl">➕</span> {t.bountyBtn}
          </span>
        </button>
        <button
          onClick={() => { setTab('Expense'); setCategory(''); }}
          className={`relative flex-1 flex items-center justify-center py-4 font-sans font-bold text-sm md:text-base uppercase transition-colors duration-300 ${tab === 'Expense' ? 'text-white' : 'bg-[#b71c1c] text-[#ffcdd2] hover:bg-[#f44336]/80'}`}
        >
          {tab === 'Expense' && (
            <motion.div 
              layoutId="activeTabIndicator" 
              className="absolute inset-0 bg-[#f44336] shadow-[inset_0_-4px_0_rgba(0,0,0,0.3)] origin-bottom" 
              initial={false}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            <span className="text-xl">➖</span> {t.tollBtn}
          </span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.form 
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          onSubmit={handleSubmit} 
          className="p-6 space-y-4"
        >
          <div>
            <label className="block font-sans text-sm md:text-base uppercase text-[#f4e4bc] mb-2 font-bold tracking-widest">{t.amountGold}</label>
            <input
              type="number"
              min="1"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-[#1a1a17] border-4 border-black p-3 font-sans text-xl text-white focus:outline-none focus:border-[#ffcc00] shadow-[inset_4px_4px_0_rgba(0,0,0,0.5)]"
              placeholder="e.g. 50000"
            />
          </div>

          <div>
            <label className="block font-sans text-sm md:text-base uppercase text-[#f4e4bc] mb-2 font-bold tracking-widest">{t.type}</label>
            <select
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-[#1a1a17] border-4 border-black p-3 font-sans text-lg text-white focus:outline-none focus:border-[#ffcc00] shadow-[inset_4px_4px_0_rgba(0,0,0,0.5)]"
            >
              <option value="" disabled>{tab === 'Gain' ? t.selectBounty : t.selectToll}</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>

          <div>
             <label className="block font-sans text-sm md:text-base uppercase text-[#f4e4bc] mb-2 font-bold tracking-widest">{tab === 'Gain' ? t.runeDest : t.runeSource}</label>
             <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
               {RUNES.map(r => (
                 <button
                   type="button"
                   key={r.id}
                   onClick={() => setRune(r.id)}
                   className={`p-2 border-2 text-left font-sans text-sm md:text-base uppercase font-bold transition-all ${rune === r.id ? 'border-[#ffcc00] bg-[#ffcc00] text-black shadow-[2px_2px_0_0_#000]' : 'border-black bg-[#1a1a17] text-[#aed581] hover:border-[#ffcc00]/50 shadow-[2px_2px_0_0_#000]'}`}
                 >
                   {r.icon} {r.name}
                 </button>
               ))}
             </div>
          </div>

          <div className="mt-8 pt-4">
            <button
              type="submit"
              disabled={loading || !amount || !category || !rune}
              className="w-full py-4 bg-[#ffcc00] border-4 border-black text-[#3e2723] font-bold uppercase text-sm md:text-base active:translate-y-1 active:shadow-none shadow-[4px_4px_0_0_#000] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? t.recording : t.submitGuild}
            </button>
          </div>
        </motion.form>
      </AnimatePresence>
    </div>
  );
}
