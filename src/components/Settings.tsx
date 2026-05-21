import { useState, useEffect } from 'react';
import { UserProfile, OperationType } from '../types';
import { auth, db } from '../lib/firebase';
import { doc, updateDoc, serverTimestamp, collection, writeBatch, Timestamp } from 'firebase/firestore';
import { handleFirestoreError } from '../lib/errorHandler';
import { useAppStore } from '../store';
import { translations } from '../lib/i18n';
import { subDays } from 'date-fns';

const AVATARS = [
  '🧑‍🌾', '🧙‍♂️', '🧝‍♀️', '🧛‍♂️', '🧜‍♀️', '🧞‍♂️', '🦸‍♀️', '🦹‍♂️', '🕵️‍♀️', '🥷'
];

export default function Settings({ profile }: { profile: UserProfile }) {
  const language = useAppStore(state => state.language);
  const t = translations[language];

  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generateSuccess, setGenerateSuccess] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    characterName: profile.characterName || auth.currentUser?.displayName || 'Traveler',
    avatar: profile.avatar || '🧑‍🌾',
    targetDailyExpense: profile.targetDailyExpense?.toString() || profile.targetSavings?.toString() || '',
    customHPCap: profile.customHPCap?.toString() || profile.targetDailyExpense?.toString() || Math.floor((profile.monthlyIncome - (profile.targetSavings || 0))/30).toString()
  });

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (generateSuccess) {
      const timer = setTimeout(() => setGenerateSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [generateSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setLoading(true);
    setSuccess(false);

    try {
      const pDoc = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(pDoc, {
        characterName: formData.characterName,
        avatar: formData.avatar,
        targetDailyExpense: Number(formData.targetDailyExpense),
        customHPCap: Number(formData.customHPCap),
        updatedAt: serverTimestamp()
      });
      setSuccess(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
    } finally {
      setLoading(false);
    }
  };

  const generateDummyData = async () => {
    if (!auth.currentUser) return;
    
    setGenerating(true);
    setGenerateSuccess(false);
    setGenerateError(null);
    try {
      const batch = writeBatch(db);
      const txRef = collection(db, 'users', auth.currentUser.uid, 'transactions');
      
      const today = new Date();
      
      // Salary at the start of the month (Assume around 20 days ago)
      batch.set(doc(txRef), {
        type: 'Gain',
        amount: profile.monthlyIncome || 8000000,
        category: '🏰 Royal Salary',
        rune: 'bca',
        timestamp: Timestamp.fromDate(subDays(today, 20))
      });

      // Quest Rewards
      batch.set(doc(txRef), {
        type: 'Gain',
        amount: 250000,
        category: '📜 Quest Reward',
        rune: 'dana',
        timestamp: Timestamp.fromDate(subDays(today, 10))
      });
      
      batch.set(doc(txRef), {
        type: 'Gain',
        amount: 500000,
        category: '📜 Quest Reward',
        rune: 'seabank',
        timestamp: Timestamp.fromDate(subDays(today, 2))
      });

      // Some daily expenses
      for (let i = 0; i <= 21; i++) {
        const d = subDays(today, i);
        
        // Food
        batch.set(doc(txRef), {
          type: 'Expense',
          amount: 50000 + Math.floor(Math.random() * 50000),
          category: '🍖 Tavern Feast',
          rune: 'shopeepay',
          timestamp: Timestamp.fromDate(d)
        });

        // Transport (every other day)
        if (i % 2 === 0) {
          batch.set(doc(txRef), {
            type: 'Expense',
            amount: 20000,
            category: '🐴 Stable & Carriage',
            rune: 'dana',
            timestamp: Timestamp.fromDate(d)
          });
        }
      }

      // Alchemist title (7 consecutive potions)
      for (let i = 0; i < 7; i++) {
        batch.set(doc(txRef), {
          type: 'PotionBuy',
          amount: 15000,
          category: '🧪 Emergency Potion',
          rune: 'bca',
          timestamp: Timestamp.fromDate(subDays(today, i))
        });
      }

      // Drink one potion
      batch.set(doc(txRef), {
        type: 'PotionDrink',
        amount: 20000,
        category: '🧪 Emergency Potion',
        rune: 'dana',
        timestamp: Timestamp.fromDate(subDays(today, 3))
      });

      // Shadow Toll to trigger warning (>40% of standard expenses if they are low)
      batch.set(doc(txRef), {
        type: 'Expense',
        amount: 1800000,
        category: '👻 Shadow Toll',
        rune: 'bca',
        timestamp: Timestamp.fromDate(subDays(today, 5))
      });

      await batch.commit();
      setGenerateSuccess(true);
    } catch (e: any) {
      console.error(e);
      setGenerateError(e.message || String(e));
      try {
        handleFirestoreError(e, OperationType.CREATE, `users/${auth.currentUser.uid}/transactions`);
      } catch (_) {}
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="bg-[#f4e4bc] border-4 border-black p-6 shadow-[8px_8px_0_0_#000] text-[#3e2723] max-w-2xl mx-auto">
      <h2 className="font-display text-2xl uppercase border-b-4 border-[#3d251e] mb-6 pb-2 inline-block shadow-[4px_4px_0_rgba(61,37,30,0.2)]">{t.settingsTitle}</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
           <label className="block font-sans text-sm md:text-base uppercase font-bold tracking-widest text-[#3e2723] mb-2">{t.avatar}</label>
           <div className="flex flex-wrap gap-2">
             {AVATARS.map(emoji => (
               <button
                 key={emoji}
                 type="button"
                 onClick={() => setFormData({ ...formData, avatar: emoji })}
                 className={`text-3xl w-14 h-14 border-4 ${formData.avatar === emoji ? 'bg-[#ffcc00] border-black shadow-[2px_2px_0_0_#000] translate-y-[2px]' : 'bg-white border-[#d7ccc8] hover:bg-gray-100'} transition-all flex items-center justify-center`}
               >
                 {emoji}
               </button>
             ))}
           </div>
        </div>

        <div>
          <label className="block font-sans text-sm md:text-base uppercase font-bold tracking-widest text-[#3e2723] mb-2">{t.charName}</label>
          <input
            type="text"
            required
            value={formData.characterName}
            onChange={(e) => setFormData({ ...formData, characterName: e.target.value })}
            className="w-full bg-white border-4 border-[#3e2723] p-3 font-sans text-lg text-[#3e2723] focus:outline-none focus:border-[#ffcc00] shadow-[inset_4px_4px_0_rgba(0,0,0,0.1)]"
          />
        </div>

        <div>
          <label className="block font-sans text-sm md:text-base uppercase font-bold tracking-widest text-[#3e2723] mb-2">{t.savingsLabel}</label>
          <input
            type="number"
            required
            min="0"
            value={formData.targetDailyExpense}
            onChange={(e) => setFormData({ ...formData, targetDailyExpense: e.target.value })}
            className="w-full bg-white border-4 border-[#3e2723] p-3 font-sans text-lg text-[#3e2723] focus:outline-none focus:border-[#ffcc00] shadow-[inset_4px_4px_0_rgba(0,0,0,0.1)]"
            placeholder={t.targetExpensePlaceholder}
          />
        </div>

        <div>
          <label className="block font-sans text-sm md:text-base uppercase font-bold tracking-widest text-[#3e2723] mb-2 flex items-center gap-2">
            {t.customHp}
            <span className="text-[10px] bg-red-200 text-red-800 px-1 italic">H+1</span>
          </label>
          <input
            type="number"
            required
            min="10"
            value={formData.customHPCap}
            onChange={(e) => setFormData({ ...formData, customHPCap: e.target.value })}
            className="w-full bg-white border-4 border-[#3e2723] p-3 font-sans text-lg text-[#3e2723] focus:outline-none focus:border-[#ffcc00] shadow-[inset_4px_4px_0_rgba(0,0,0,0.1)]"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 mt-8 bg-[#ffcc00] border-4 border-black hover:bg-yellow-500 text-[#3e2723] shadow-[4px_4px_0_0_#000] font-bold text-sm md:text-base tracking-wider uppercase active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '...' : t.saveBtn}
        </button>
        {success && (
          <div className="text-center text-green-700 font-bold uppercase text-xs animate-bounce mt-4">
            ✨ {t.saveSuccess} ✨
          </div>
        )}
      </form>

      <div className="mt-12 pt-8 border-t-2 border-dashed border-[#d7ccc8]">
        <h3 className="font-sans font-bold uppercase text-xs text-amber-900 mb-2">Dev Tools (Oracle Magic)</h3>
        <button
          onClick={generateDummyData}
          disabled={generating}
          className="w-full py-2 bg-amber-900 hover:bg-amber-800 text-white border-4 border-black font-bold text-xs tracking-wider uppercase shadow-[2px_2px_0_0_#000] active:translate-y-1 active:shadow-none transition-all disabled:opacity-50"
        >
          {generating ? 'Summoning...' : 'Summon Dummy Data (Simulation)'}
        </button>
        {generateSuccess && (
          <div className="text-center text-amber-700 font-bold uppercase text-xs animate-pulse mt-4">
            ✨ {language === 'id' ? 'Data berhasil disuntikkan! Cek Oracle Scroll.' : 'Dummy data injected! Check Oracle Scroll.'} ✨
          </div>
        )}
        {generateError && (
          <div className="text-center text-red-700 font-bold uppercase text-[10px] mt-4 border border-red-700 p-2 bg-red-100">
            Error: {generateError}
          </div>
        )}
      </div>
    </div>
  );
}
