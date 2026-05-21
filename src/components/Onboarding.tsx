import { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError } from '../lib/errorHandler';
import { OperationType } from '../types';
import { useAppStore } from '../store';
import { translations } from '../lib/i18n';
import { motion, AnimatePresence } from 'motion/react';
import { ExternalLink, X, Dices } from 'lucide-react';

const AVATARS = ['👨‍🚀', '🧙‍♂️', '🧝‍♀️', '🧛‍♂️', '🧜‍♀️', '🧟‍♂️', '🦸‍♀️', '🦹‍♂️', '🕵️‍♀️', '🥷', '🤴', '👸', '🧌', '🤺', '🤹'];
const FIRST_NAMES = ['Arthur', 'Lancelot', 'Merlin', 'Gawain', 'Morgana', 'Guinevere', 'Percival', 'Bors', 'Fiona', 'Gimli', 'Legolas'];
const LAST_NAMES = ['the Brave', 'the Wise', 'the Swift', 'the Strong', 'of Camelot', 'the Pure', 'the Bold', 'Shadow', 'Ironfoot'];

export default function Onboarding({ onComplete }: { onComplete: () => void }) {
  const language = useAppStore(state => state.language);
  const t = translations[language];

  const [characterName, setCharacterName] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [gender, setGender] = useState<'Sir' | 'Madam'>('Sir');
  const [income, setIncome] = useState('');
  const [dailyExpense, setDailyExpense] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    handleRandomize();
  }, []);

  const handleRandomize = () => {
    const randomAvatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];
    const randomFirstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const randomLastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const randomGender = Math.random() > 0.5 ? 'Sir' : 'Madam';
    
    setCharacterName(`${randomFirstName} ${randomLastName}`);
    setAvatar(randomAvatar);
    setGender(randomGender);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !agreed) return;
    
    setLoading(true);
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(userRef, {
        characterName,
        avatar,
        gender,
        monthlyIncome: Number(income),
        targetDailyExpense: Number(dailyExpense),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      onComplete();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${auth.currentUser.uid}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="max-w-md mx-auto mt-12 p-8 border-4 border-black bg-[#3e2723] shadow-[8px_8px_0_0_#000] relative z-10">
        <h2 className="font-display text-2xl text-[#ffcc00] mb-6 text-center tracking-tighter" style={{ textShadow: "2px 2px 0px #000" }}>{t.charCreation}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-[#1a1a17] border-4 border-black p-4 shadow-[inset_4px_4px_0_rgba(0,0,0,0.5)]">
            <div className="flex justify-between items-center mb-4">
              <label className="block font-sans text-sm md:text-base uppercase tracking-widest font-bold text-[#ffcc00]">{language === 'id' ? 'Identitas Pahlawan' : 'Hero Identity'}</label>
              <button 
                type="button" 
                onClick={handleRandomize}
                className="flex items-center gap-1 text-xs font-sans uppercase font-bold text-[#f4e4bc] hover:text-[#ffcc00] transition-colors"
              >
                <Dices size={14} />
                Randomize
              </button>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-1 space-y-4">
                <div>
                  <label className="block font-sans text-xs uppercase tracking-widest font-bold text-[#f4e4bc] mb-1">{language === 'id' ? 'Nama Karakter' : 'Character Name'}</label>
                  <input
                    type="text"
                    required
                    maxLength={20}
                    value={characterName}
                    onChange={(e) => setCharacterName(e.target.value)}
                    className="w-full bg-[#2c1b18] border-2 border-black p-2 font-sans text-white focus:outline-none focus:border-[#ffcc00]"
                    placeholder="Hero Name"
                  />
                </div>
                <div>
                  <label className="block font-sans text-xs uppercase tracking-widest font-bold text-[#f4e4bc] mb-1">Gender</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setGender('Sir')}
                      className={`flex-1 py-1 px-2 border-2 text-xs font-sans font-bold uppercase transition-colors ${gender === 'Sir' ? 'border-[#ffcc00] bg-[#ffcc00] text-[#3e2723]' : 'border-[#5a5a5a] text-[#f4e4bc] hover:border-[#f4e4bc]'}`}
                    >
                      Sir
                    </button>
                    <button
                      type="button"
                      onClick={() => setGender('Madam')}
                      className={`flex-1 py-1 px-2 border-2 text-xs font-sans font-bold uppercase transition-colors ${gender === 'Madam' ? 'border-[#ffcc00] bg-[#ffcc00] text-[#3e2723]' : 'border-[#5a5a5a] text-[#f4e4bc] hover:border-[#f4e4bc]'}`}
                    >
                      Madam
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="w-24 shrink-0">
                <label className="block font-sans text-xs uppercase tracking-widest font-bold text-[#f4e4bc] mb-1 text-center">Avatar</label>
                <div className="grid grid-cols-2 gap-1 h-32 overflow-y-auto pr-1 custom-scrollbar">
                  {AVATARS.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setAvatar(a)}
                      className={`aspect-square flex items-center justify-center text-xl border-2 transition-all ${avatar === a ? 'border-[#ffcc00] bg-[#3e2723] scale-110' : 'border-[#5a5a5a] hover:border-[#f4e4bc] opacity-70 hover:opacity-100'}`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block font-sans text-sm md:text-base uppercase tracking-widest font-bold text-[#f4e4bc] mb-2">{t.incomeLabel}</label>
            <input
              type="number"
              required
              min="0"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              className="w-full bg-[#1a1a17] border-4 border-black p-3 font-sans text-xl text-white focus:outline-none focus:border-[#ffcc00] shadow-[inset_4px_4px_0_rgba(0,0,0,0.5)]"
              placeholder="e.g. 5000000"
            />
          </div>

          <div>
            <label className="block font-sans text-sm md:text-base uppercase tracking-widest font-bold text-[#f4e4bc] mb-2">{t.savingsLabel}</label>
            <input
              type="number"
              required
              min="0"
              value={dailyExpense}
              onChange={(e) => setDailyExpense(e.target.value)}
              className="w-full bg-[#1a1a17] border-4 border-black p-3 font-sans text-xl text-white focus:outline-none focus:border-[#ffcc00] shadow-[inset_4px_4px_0_rgba(0,0,0,0.5)]"
              placeholder={t.targetExpensePlaceholder || "e.g. 50000"}
            />
          </div>

          <div className="flex items-start gap-3 mt-4 p-2">
            <input
              type="checkbox"
              id="agreeCheck"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 w-5 h-5 accent-[#ffcc00] cursor-pointer"
            />
            <label htmlFor="agreeCheck" className="text-[#f4e4bc] text-sm font-sans flex-1 cursor-pointer">
              {t.termsAgreeLabel}
            </label>
            <button 
              type="button" 
              onClick={() => setShowTerms(true)}
              className="text-[#ffcc00] hover:text-white p-1"
            >
              <ExternalLink size={16} />
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || !agreed}
            className="w-full py-4 mt-8 bg-[#ffcc00] border-4 border-black hover:bg-yellow-500 text-[#3e2723] shadow-[4px_4px_0_0_#000] font-bold text-sm md:text-base tracking-wider uppercase active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t.forging : t.beginQuest}
          </button>
        </form>
      </div>

      <AnimatePresence>
        {showTerms && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
          >
             <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-[#f4e4bc] border-4 border-black p-6 w-full max-w-md shadow-[8px_8px_0_0_#000] relative"
             >
                <button
                  onClick={() => setShowTerms(false)}
                  className="absolute top-4 right-4 text-gray-500 hover:text-black hover:bg-black/10 p-1"
                >
                  <X size={24} />
                </button>
                <h3 className="font-display text-2xl mb-4 text-[#3e2723] uppercase border-b-2 border-black pb-2 mr-8">
                  {t.termsTitle}
                </h3>
                <div className="font-sans text-sm md:text-base text-[#5d4037] leading-relaxed">
                  {t.termsContent}
                </div>
                <div className="mt-8 flex justify-end">
                   <button
                     onClick={() => setShowTerms(false)}
                     className="bg-[#3e2723] text-[#ffcc00] border-2 border-black px-6 py-2 uppercase font-bold text-sm font-sans shadow-[2px_2px_0_0_#000] hover:bg-black transition-colors"
                   >
                     {language === 'id' ? 'Tutup' : 'Close'}
                   </button>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
