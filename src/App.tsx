/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, loginWithGoogle, logout } from './lib/firebase';
import { useAppStore } from './store';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './lib/firebase';
import { handleFirestoreError } from './lib/errorHandler';
import { OperationType } from './types';
import { translations } from './lib/i18n';
import { setMusicState } from './audio';

const Onboarding = lazy(() => import('./components/Onboarding'));
const Dashboard = lazy(() => import('./components/Dashboard'));

export default function App() {
  const { user, authLoading, setUser, setAuthLoading, language, setLanguage, musicEnabled } = useAppStore();
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const t = translations[language];

  useEffect(() => {
    const handleFirstInteraction = () => {
      if (useAppStore.getState().musicEnabled) {
        setMusicState(true);
      }
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };

    window.addEventListener('click', handleFirstInteraction);
    window.addEventListener('keydown', handleFirstInteraction);

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
  }, []);

  useEffect(() => {
    if (!musicEnabled) {
      setMusicState(false);
    } else {
      setMusicState(true);
    }
  }, [musicEnabled]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const docRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(docRef);
          setHasProfile(docSnap.exists());
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
        }
      } else {
        setHasProfile(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setAuthLoading]);

  if (authLoading || (user && hasProfile === null)) {
    return (
      <div className="min-h-screen flex items-center justify-center font-display text-2xl animate-pulse text-[#ffcc00]">
        {t.loading}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
        <div className="absolute top-4 right-4 z-50">
           <button 
             onClick={() => setLanguage(language === 'en' ? 'id' : 'en')}
             className="font-sans text-xs md:text-sm text-[#f4e4bc] hover:text-white border border-[#5d4037] bg-[#3e2723] px-3 py-1 uppercase font-bold shadow-[2px_2px_0_0_#000]"
           >
             {language === 'en' ? 'ID' : 'EN'}
           </button>
        </div>
        <div className="max-w-md w-full text-center space-y-8 p-8 border-4 border-black bg-[#3e2723] shadow-[8px_8px_0_0_#000] pb-12">
          <h1 className="font-display text-4xl text-[#ffcc00] leading-snug tracking-wider" style={{ textShadow: "4px 4px 0px #000" }}>Rupiah<br/>Quest</h1>
          <p className="font-sans text-xl text-[#f4e4bc]">{t.subtitle}</p>
          <button
            onClick={loginWithGoogle}
            className="w-full py-4 mt-8 bg-[#ffcc00] hover:bg-yellow-500 text-[#3e2723] font-display text-sm md:text-base font-bold tracking-wider uppercase border-4 border-black shadow-[4px_4px_0_0_#000] active:translate-y-1 active:shadow-none transition-all"
          >
            {t.loginBtn}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative">
      <div className="absolute top-4 right-4 z-50 flex items-center gap-4">
        <button 
          onClick={() => setLanguage(language === 'en' ? 'id' : 'en')}
          className="font-sans text-xs md:text-sm text-[#f4e4bc] hover:text-white border border-[#5d4037] bg-[#3e2723] px-2 py-1 uppercase font-bold shadow-[2px_2px_0_0_#000]"
        >
          {language === 'en' ? 'ID' : 'EN'}
        </button>
        <button 
          onClick={() => setShowLogoutModal(true)} 
          className="font-sans text-xs md:text-sm text-[#f4e4bc] hover:text-white border border-[#5d4037] hover:border-[#ef5350] hover:bg-[#ef5350] bg-[#3e2723] px-3 py-1 uppercase font-bold shadow-[2px_2px_0_0_#000] transition-colors"
        >
          {t.logout}
        </button>
      </div>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-display text-2xl animate-pulse text-[#ffcc00]">{t.loading}</div>}>
        {!hasProfile ? (
          <Onboarding onComplete={() => setHasProfile(true)} />
        ) : (
          <Dashboard />
        )}
      </Suspense>

      <AnimatePresence>
        {showLogoutModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#2b1d12] border-4 border-[#ffcc00] p-6 md:p-8 max-w-sm w-full shadow-[8px_8px_0_0_#000] relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none transform translate-x-4 -translate-y-4">
                <span className="text-8xl">🚪</span>
              </div>
              <h3 className="font-display text-2xl text-[#ffcc00] uppercase mb-2 border-b-2 border-dashed border-[#5d4037] pb-2 relative z-10">
                {t.logoutTitle}
              </h3>
              <p className="font-sans text-[#f4e4bc] text-sm mb-8 mt-4 relative z-10">
                {t.logoutDesc}
              </p>
              <div className="flex gap-4 relative z-10">
                <button 
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 bg-[#1a1a17] text-white border-2 border-gray-600 hover:border-gray-400 font-sans font-bold uppercase text-xs py-3 shadow-[2px_2px_0_0_#000] active:translate-y-1 active:shadow-none transition-all"
                >
                  {t.cancel}
                </button>
                <button 
                  onClick={() => {
                    setShowLogoutModal(false);
                    logout();
                  }}
                  className="flex-1 bg-[#ef5350] text-white border-2 border-black hover:bg-red-600 font-sans font-bold uppercase text-xs py-3 shadow-[2px_2px_0_0_#000] active:translate-y-1 active:shadow-none transition-all"
                >
                  {t.logoutConfirm}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
