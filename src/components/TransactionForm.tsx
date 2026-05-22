import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../lib/firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError } from '../lib/errorHandler';
import { OperationType, GAIN_CATEGORIES, EXPENSE_CATEGORIES, RUNES, TransactionType, Transaction } from '../types';
import { useAppStore } from '../store';
import { translations } from '../lib/i18n';

export default function TransactionForm({ transactions }: { transactions: Transaction[] }) {
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

  const potionStash = useMemo(() => {
    return transactions.reduce((acc, tx) => {
      if (tx.type === 'PotionBuy') return acc + tx.amount;
      if (tx.type === 'PotionDrink') return acc - tx.amount;
      return acc;
    }, 0);
  }, [transactions]);

  const [tab, setTab] = useState<TransactionType>('Expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [rune, setRune] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const [potionForm, setPotionForm] = useState<'buy' | 'drink' | null>(null);
  const [potionAmount, setPotionAmount] = useState('');
  const [potionRune, setPotionRune] = useState(RUNES[0].id);

  const [scrollProgress, setScrollProgress] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollLeft, scrollWidth, clientWidth } = e.currentTarget;
    if (scrollWidth > clientWidth) {
      let progress = scrollLeft / (scrollWidth - clientWidth);
      if (progress > 0.95) progress = 1;
      setScrollProgress(progress);
    } else {
      setScrollProgress(0);
    }
  };

  const scrollChest = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const amount = 200;
      carouselRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
    }
  };

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
        description: description || null,
        timestamp: serverTimestamp()
      });
      setAmount('');
      setCategory('');
      setRune('');
      setDescription('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${auth.currentUser?.uid}/transactions`);
    } finally {
      setLoading(false);
    }
  };

  const categories = tab === 'Gain' ? GAIN_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="bg-[#2b1d12] border-4 border-black shadow-[8px_8px_0_0_#000]">
      {/* Treasure Chest Carousel embed (Mobile Only) */}
      <div className="lg:hidden p-4 bg-[#3e2723] border-b-4 border-black sticky top-0 z-[80] shadow-[0_4px_0_0_rgba(0,0,0,0.5)]">
        <h2 className="text-[#ffcc00] font-sans text-xs uppercase mb-3 flex items-center gap-2">
          <span>💰</span> {t.treasureChest}
        </h2>
        <div 
          ref={carouselRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto gap-3 pb-2 snap-x snap-mandatory hide-scroll pr-8" 
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
           <style>{`.hide-scroll::-webkit-scrollbar { display: none; }`}</style>
           
           <div className="flex-shrink-0 snap-start bg-indigo-900 border-2 border-black p-2 min-w-[200px] flex flex-col justify-between">
             <div>
               <div className="text-xs uppercase text-indigo-300 font-bold mb-1 flex items-center gap-1"><span>🧪</span> Potions</div>
               <div className="text-sm font-bold text-white">Rp {potionStash.toLocaleString('id-ID')}</div>
             </div>
             <div className="flex gap-1 mt-2">
               <button type="button" onClick={() => setPotionForm(potionForm === 'buy' ? null : 'buy')} className={`flex-1 text-[10px] py-1 border border-black uppercase font-bold ${potionForm === 'buy' ? 'bg-indigo-400 text-black' : 'bg-indigo-700 text-white hover:bg-indigo-600'}`}>+{t.buy}</button>
               <button type="button" onClick={() => setPotionForm(potionForm === 'drink' ? null : 'drink')} disabled={potionStash <= 0} className={`flex-1 text-[10px] py-1 border border-black uppercase font-bold disabled:opacity-50 disabled:cursor-not-allowed ${potionForm === 'drink' ? 'bg-pink-400 text-black' : 'bg-pink-700 text-white hover:bg-pink-600'}`}>-{t.drink}</button>
             </div>
           </div>

           {RUNES.map(r => (
             <div key={r.id} className="flex-shrink-0 snap-start bg-[#2b1d12] border-2 border-black p-2 min-w-[140px]">
               <div className="flex items-center gap-2 mb-1">
                 <span className="text-sm">{r.icon}</span>
                 <span className="text-[10px] uppercase text-[#f4e4bc] font-bold">{r.name}</span>
               </div>
               <div className="text-sm font-bold text-[#aed581]">Rp {(balances[r.id] || 0).toLocaleString('id-ID')}</div>
             </div>
           ))}
        </div>

        {/* Scroll Progress Bar */}
        <div className="flex justify-center mt-3 mb-2">
           <div className="w-24 h-1.5 bg-[#2b1d12] rounded-full border border-black overflow-hidden relative">
              <div 
                className="absolute top-0 bottom-0 bg-[#ffcc00] rounded-full transition-all duration-100 ease-out"
                style={{
                  left: `${scrollProgress * 70}%`, // 70% max left to allow 30% width bar
                  width: '30%'
                }}
              />
           </div>
        </div>

        <AnimatePresence>
          {potionForm && (
            <motion.form 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              onSubmit={handlePotionAction}
              className="mt-2 flex flex-col gap-2 overflow-hidden"
            >
              <input 
                type="number" 
                inputMode="numeric"
                pattern="[0-9]*"
                min="1" 
                max={potionForm === 'drink' ? potionStash : undefined}
                required
                value={potionAmount}
                onChange={e => setPotionAmount(e.target.value)}
                placeholder="Amount (Potions)"
                className="w-full bg-[#1a1a17] border-2 border-black p-2 font-sans text-sm text-white focus:outline-none focus:border-[#ffcc00]"
              />
              {potionAmount && !isNaN(Number(potionAmount)) && (
                <p className="text-[#ffcc00] font-sans text-xs font-bold tracking-widest text-right">
                  Rp {Number(potionAmount).toLocaleString('id-ID')}
                </p>
              )}
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
            <label htmlFor="txAmount" className="block font-sans text-sm md:text-base uppercase text-[#f4e4bc] mb-2 font-bold tracking-widest">{t.amountGold}</label>
            <input
              id="txAmount"
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              min="1"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-[#1a1a17] border-4 border-black p-3 font-sans text-xl text-white focus:outline-none focus:border-[#ffcc00] shadow-[inset_4px_4px_0_rgba(0,0,0,0.5)]"
              placeholder="e.g. 50000"
            />
            {amount && !isNaN(Number(amount)) && (
               <p className="mt-1 text-[#ffcc00] font-sans text-xs font-bold tracking-widest text-right">
                 Rp {Number(amount).toLocaleString('id-ID')}
               </p>
            )}
          </div>

          <div>
            <label htmlFor="txCategory" className="block font-sans text-sm md:text-base uppercase text-[#f4e4bc] mb-2 font-bold tracking-widest">{t.type}</label>
            <select
              id="txCategory"
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
             <label className="block font-sans text-sm md:text-base uppercase text-[#f4e4bc] mb-2 font-bold tracking-widest" id="rune-selection-label">{tab === 'Gain' ? t.runeDest : t.runeSource}</label>
             <div className="grid grid-cols-2 lg:grid-cols-3 gap-2" role="group" aria-labelledby="rune-selection-label">
               {RUNES.map(r => (
                 <button
                   type="button"
                   key={r.id}
                   onClick={() => setRune(r.id)}
                   aria-pressed={rune === r.id}
                   className={`p-2 border-2 text-left font-sans text-sm md:text-base uppercase font-bold transition-all ${rune === r.id ? 'border-[#ffcc00] bg-[#ffcc00] text-black shadow-[2px_2px_0_0_#000]' : 'border-black bg-[#1a1a17] text-[#aed581] hover:border-[#ffcc00]/50 shadow-[2px_2px_0_0_#000]'}`}
                 >
                   {r.icon} {r.name}
                 </button>
               ))}
             </div>
          </div>

          <div>
            <label htmlFor="txDesc" className="block font-sans text-sm md:text-base uppercase text-[#f4e4bc] mb-2 font-bold tracking-widest">{language === 'id' ? 'Catatan (Opsional)' : 'Message (Optional)'}</label>
            <input
              id="txDesc"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#1a1a17] border-4 border-black p-3 font-sans text-lg text-white focus:outline-none focus:border-[#ffcc00] shadow-[inset_4px_4px_0_rgba(0,0,0,0.5)]"
              placeholder={language === 'id' ? 'Tuliskan sedikit cerita tentang ini...' : 'Write down a little story about this...'}
            />
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
