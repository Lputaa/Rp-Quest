import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../store';
import { translations } from '../lib/i18n';
import { useState, useEffect } from 'react';

export default function HPBar({ current, max, isHealing }: { current: number, max: number, isHealing?: boolean }) {
  const language = useAppStore(state => state.language);
  const t = translations[language];
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));
  
  let color = 'bg-[#4caf50]';
  if (percentage <= 25) color = 'bg-[#f44336]';
  else if (percentage <= 50) color = 'bg-[#ffcc00]';

  const isDead = current <= 0;

  const [showDeathAnim, setShowDeathAnim] = useState(false);

  useEffect(() => {
    if (isDead && current !== max) {
      setShowDeathAnim(true);
      const timer = setTimeout(() => setShowDeathAnim(false), 4000);
      return () => clearTimeout(timer);
    } else {
      setShowDeathAnim(false);
    }
  }, [isDead]);

  return (
    <>
      <div className="flex flex-col items-start lg:items-end gap-2 w-full lg:w-auto">
        <div className="font-sans text-xs uppercase opacity-70 text-[#f4e4bc] lg:pr-2">
          {isHealing ? (language === 'id' ? 'Sedang Menyembuhkan...' : 'Healing...') : t.dailyStamina}
        </div>
        <div className="w-full lg:w-[320px] h-8 bg-black border-4 border-[#5a5a5a] relative flex items-center">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5 }}
            className={`h-full ${color} shadow-[inset_0_-4px_0_rgba(0,0,0,0.3)] ${isHealing ? 'animate-pulse bg-opacity-70' : ''}`}
          />
          <span className="absolute w-full text-center text-sm font-bold text-white uppercase font-sans tracking-widest drop-shadow-[2px_2px_0px_#000]">
            {isDead ? `${t.youDied} (${current.toLocaleString('id-ID')} / ${max.toLocaleString('id-ID')})` : `HP: ${current.toLocaleString('id-ID')} / ${max.toLocaleString('id-ID')}`}
          </span>
        </div>
      </div>

      <AnimatePresence>
        {showDeathAnim && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, backgroundColor: 'rgba(0,0,0,0.85)' }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.5 }}
              className="text-center"
            >
              <h1 className="text-6xl md:text-8xl font-display text-red-600 tracking-widest drop-shadow-[0_0_20px_rgba(220,38,38,1)] uppercase">
                {language === 'id' ? 'Kamu Mati' : 'You Died'}
              </h1>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2, duration: 1 }}
                className="mt-6 text-gray-400 font-sans tracking-widest uppercase text-sm md:text-base"
              >
                {language === 'id' ? 'HP habis. Jangan serakah besok!' : 'HP depleted. Don\'t be greedy tomorrow!'}
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
