import React, { useEffect, useState, useMemo, useRef, lazy, Suspense } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, Timestamp, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError } from '../lib/errorHandler';
import { OperationType, Transaction, UserProfile, ScheduledEvent } from '../types';
import HPBar from './HPBar';
import TransactionForm from './TransactionForm';
import QuestLog from './QuestLog';
import SageChat from './SageChat';
import DailyQuests from './DailyQuests';
import HeroStats from './HeroStats';
import { isSameDay, addDays, addMonths } from 'date-fns';

import MainQuest from './MainQuest';
import TreasureChest from './TreasureChest';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { playSFX } from '../audio';

import { useAppStore } from '../store';
import { translations } from '../lib/i18n';

const OracleScroll = lazy(() => import('./OracleScroll'));
const GuildReport = lazy(() => import('./GuildReport'));
const RoyalCalendar = lazy(() => import('./RoyalCalendar'));
const Settings = lazy(() => import('./Settings'));
const Guidebook = lazy(() => import('./Guidebook'));
const FeedbackBox = lazy(() => import('./FeedbackBox'));

function calculateNextDueDate(currentDue: Date, freq: string) {
  let next = new Date(currentDue);
  const now = new Date();
  
  let iterations = 0;
  while (next <= now && iterations < 1000) {
    if (freq === 'daily') {
      next = addDays(next, 1);
    } else if (freq === 'weekly') {
      next = addDays(next, 7);
    } else if (freq === 'monthly') {
      next = addMonths(next, 1);
    }
    iterations++;
  }
  return next;
}

export default function Dashboard() {
  const language = useAppStore(state => state.language);
  const t = translations[language];

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [scheduledEvents, setScheduledEvents] = useState<ScheduledEvent[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [decrees, setDecrees] = useState<ScheduledEvent[]>([]);

  const [activeTab, setActiveTab] = useState<'quest' | 'oracle' | 'report' | 'calendar' | 'settings'>('quest');
  const [isGuidebookOpen, setIsGuidebookOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [scrollProgressWidget, setScrollProgressWidget] = useState(0);

  const [showStarterInput, setShowStarterInput] = useState(false);
  const [starterTarget, setStarterTarget] = useState('');

  const handleStartAdventure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !starterTarget) return;
    const uid = auth.currentUser.uid;
    try {
      playSFX('questComplete');
      await updateDoc(doc(db, 'users', uid), {
        customHPCap: Number(starterTarget),
        updatedAt: serverTimestamp()
      });
      setShowStarterInput(false);
    } catch (e) {
      console.error(e);
    }
  };

  const carouselRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const [canScrollLeftNav, setCanScrollLeftNav] = useState(false);
  const [canScrollRightNav, setCanScrollRightNav] = useState(true);

  const handleNavScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollLeft, scrollWidth, clientWidth } = e.currentTarget;
    setCanScrollLeftNav(scrollLeft > 0);
    setCanScrollRightNav(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
  };

  const scrollNav = (direction: 'left' | 'right') => {
    if (navRef.current) {
      const scrollAmount = 150;
      navRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (navRef.current) {
      const { scrollWidth, clientWidth } = navRef.current;
      setCanScrollRightNav(scrollWidth > clientWidth);
    }
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollLeft, scrollWidth, clientWidth } = e.currentTarget;
    if (scrollWidth > clientWidth) {
      let progress = scrollLeft / (scrollWidth - clientWidth);
      if (progress > 0.95) progress = 1; // Snap to 100% when very close
      setScrollProgressWidget(progress);
    } else {
      setScrollProgressWidget(0);
    }
  };

  useEffect(() => {
    // Process scheduled events auto-logging and decrees
    if (!auth.currentUser || scheduledEvents.length === 0) return;
    const uid = auth.currentUser.uid;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pendingDecrees: ScheduledEvent[] = [];

    scheduledEvents.forEach(ev => {
      const dueDate = ev.nextDueDate.toDate();
      dueDate.setHours(0, 0, 0, 0);

      const isDue = dueDate <= today;
      const isTomorrow = isSameDay(dueDate, addDays(today, 1));
      
      if (isDue) {
        if (ev.autoLog) {
          // Auto log the transaction
          const nextDue = calculateNextDueDate(ev.nextDueDate.toDate(), ev.frequency);
          
          const newTx: Transaction = {
            type: ev.rune === 'potion' ? (ev.type === 'Bounty' ? 'PotionBuy' : 'PotionDrink') : (ev.type === 'Toll' ? 'Expense' : 'Gain'),
            amount: ev.amount,
            category: ev.category || 'Tithe',
            rune: ev.rune === 'potion' ? 'POTION_STASH' : ev.rune,
            timestamp: Timestamp.now(),
          };

          addDoc(collection(db, 'users', uid, 'transactions'), newTx);
          updateDoc(doc(db, 'users', uid, 'scheduledEvents', ev.id!), {
            nextDueDate: Timestamp.fromDate(nextDue),
            lastLoggedAt: Timestamp.now()
          });
        } else {
          // Not auto-logged, wait for manual confirmation
          pendingDecrees.push(ev);
        }
      } else if (isTomorrow) {
        // Just show reminder for tomorrow
        pendingDecrees.push(ev);
      }
    });

    setDecrees(pendingDecrees);
  }, [scheduledEvents]);

  const handleManualLog = async (ev: ScheduledEvent) => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const nextDue = calculateNextDueDate(ev.nextDueDate.toDate(), ev.frequency);
    
    const newTx: Transaction = {
      type: ev.rune === 'potion' ? (ev.type === 'Bounty' ? 'PotionBuy' : 'PotionDrink') : (ev.type === 'Toll' ? 'Expense' : 'Gain'),
      amount: ev.amount,
      category: ev.category || 'Tithe',
      rune: ev.rune === 'potion' ? 'POTION_STASH' : ev.rune,
      timestamp: Timestamp.now(),
      description: ev.name
    };

    await addDoc(collection(db, 'users', uid, 'transactions'), newTx);
    await updateDoc(doc(db, 'users', uid, 'scheduledEvents', ev.id!), {
      nextDueDate: Timestamp.fromDate(nextDue),
      lastLoggedAt: Timestamp.now()
    });
    setDecrees(prev => prev.filter(d => d.id !== ev.id));
  }

  const dismissDecree = (id: string) => {
    setDecrees(prev => prev.filter(d => d.id !== id));
  }

  useEffect(() => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;

    const docRef = doc(db, 'users', uid);
    const unsubscribeProfile = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setProfile(docSnap.data() as UserProfile);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${uid}`);
    });

    const q = query(
      collection(db, 'users', uid, 'transactions'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, { includeMetadataChanges: true }, (snapshot) => {
      const txs: Transaction[] = [];
      snapshot.forEach((doc) => {
        txs.push({ id: doc.id, ...doc.data(), isPending: doc.metadata.hasPendingWrites } as Transaction);
      });
      setTransactions(txs);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${uid}/transactions`);
    });

    const qEvents = query(
      collection(db, 'users', uid, 'scheduledEvents')
    );

    const unsubscribeEvents = onSnapshot(qEvents, (snapshot) => {
      const evts: ScheduledEvent[] = [];
      snapshot.forEach((doc) => {
        evts.push({ id: doc.id, ...doc.data() } as ScheduledEvent);
      });
      setScheduledEvents(evts);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${uid}/scheduledEvents`);
    });

    return () => {
      unsubscribeProfile();
      unsubscribe();
      unsubscribeEvents();
    };
  }, []);

  const todayTransactions = useMemo(() => {
    const today = new Date();
    return transactions.filter(t => !t.timestamp || isSameDay(t.timestamp.toDate(), today));
  }, [transactions]);

  // Derived calculations for HP
  const isNewAccount = !profile?.customHPCap;
  const maxHP = profile?.customHPCap || 0;
  
  let currentHP = maxHP;
  let isHealing = false;
  
  // Sort today's transactions from oldest to newest to replay chronological events
  const chronologicalToday = [...todayTransactions].sort((a, b) => {
    if (!a.timestamp || !b.timestamp) return 0;
    return a.timestamp.toMillis() - b.timestamp.toMillis();
  });

  chronologicalToday.forEach(tItem => {
    if (tItem.type === 'Expense') {
      currentHP -= tItem.amount;
    } else if (tItem.type === 'Gain') {
      // Heal mechanic: max +50% of maxHP per day
      currentHP = Math.min(currentHP + Math.min(tItem.amount, maxHP * 0.5), maxHP);
      if (tItem.isPending) isHealing = true;
    } else if (tItem.type === 'PotionDrink') {
      currentHP = Math.min(currentHP + tItem.amount, maxHP); // Directly heals HP
      if (tItem.isPending) isHealing = true;
    }
    // PotionBuy does not affect HP
  });

  currentHP = Math.min(currentHP, maxHP);

  return (
    <div className="max-w-[1200px] w-full mx-auto p-4 md:p-6 flex flex-col gap-6 h-full min-h-screen relative">
      <AnimatePresence>
        {decrees.length > 0 && (
          <div className="fixed inset-x-0 bottom-4 md:bottom-auto md:top-4 z-50 px-4 md:max-w-md md:mx-auto md:right-4 md:inset-x-auto w-full flex flex-col gap-2 pointer-events-none">
            {decrees.map(d => {
              const dueDate = d.nextDueDate.toDate();
              dueDate.setHours(0,0,0,0);
              const today = new Date();
              today.setHours(0,0,0,0);
              const isToday = isSameDay(dueDate, today);
              const isTomorrow = isSameDay(dueDate, addDays(today, 1));
              const isMissed = dueDate < today;

              return (
                <motion.div
                  key={d.id}
                  initial={{ opacity: 0, scale: 0.9, y: 50 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, x: 100 }}
                  className="bg-[#f4e4bc] border-4 border-black p-4 shadow-[8px_8px_0_0_#000] pointer-events-auto"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-display text-lg uppercase flex items-center gap-2">
                       {isMissed ? '💀 Missed Quest' : '📜 Royal Decree'}
                    </h4>
                    <button onClick={() => dismissDecree(d.id!)} className="text-gray-500 hover:text-black">
                      <X size={16} />
                    </button>
                  </div>
                  <p className="font-sans text-sm font-bold text-[#3e2723]">
                    {d.name} <br/>
                    {isMissed && <span className="text-red-700">Has not been recorded. Record it now?</span>}
                    {isToday && <span>Is due today! Rp {d.amount.toLocaleString('id-ID')}</span>}
                    {isTomorrow && <span>Heads up! Due tomorrow: Rp {d.amount.toLocaleString('id-ID')}</span>}
                  </p>
                  {(isMissed || isToday) && (
                    <button onClick={() => handleManualLog(d)} className="mt-3 w-full bg-[#ffcc00] border-2 border-black py-2 font-bold uppercase text-xs hover:bg-[#ffe066] flex justify-center items-center gap-1 shadow-[2px_2px_0_0_#000]">
                      <Check size={14}/> Catat Sekarang
                    </button>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
      </AnimatePresence>

      <header className="flex flex-col mb-4 lg:mb-8 border-b-4 border-[#3d251e] pb-4 gap-4 lg:gap-6 mt-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 w-full">
          <div className="w-full lg:w-auto">
            {profile && <HeroStats transactions={transactions} profile={profile} />}
          </div>
          <div className="w-full lg:w-[350px]">
            <HPBar current={currentHP} max={maxHP} isHealing={isHealing} />
          </div>
        </div>
        {/* Navigation below Hero Stats & HP Bar for Desktop (lg), original order for Mobile (using flex-col-reverse wrapper on mobile) */}
        {!isNewAccount && (
          <div className="flex flex-col-reverse lg:flex-col w-full gap-4 mt-2 lg:mt-0">
            <div className="w-full lg:flex lg:justify-center sticky top-4 z-[90]">
              <div className="relative w-full lg:w-max">
                {canScrollLeftNav && (
                  <div className="absolute left-0 top-0 bottom-0 z-20 flex items-center justify-start pl-1 bg-gradient-to-r from-[#3e2723] from-50% to-transparent w-16 lg:hidden pointer-events-none">
                    <button 
                      onClick={() => { playSFX('click'); scrollNav('left'); }} 
                      className="w-8 h-8 bg-[#ffcc00] hover:bg-white text-[#3e2723] border-2 border-black flex items-center justify-center shadow-[2px_2px_0_0_#000] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none transition-all pointer-events-auto rounded-sm"
                    >
                      <ChevronLeft size={20} strokeWidth={2.5} />
                    </button>
                  </div>
                )}
                <nav 
                  ref={navRef} 
                  onScroll={handleNavScroll} 
                  className="flex bg-[#3e2723] p-1.5 border-4 border-black shadow-[6px_6px_0_0_#000] overflow-x-auto whitespace-nowrap scrollbar-hide w-full lg:w-max backdrop-blur-md relative"
                >
                  {[
                    { id: 'quest', label: t.navQuest || 'Quest' },
                    { id: 'oracle', label: t.navOracle || 'Oracle' },
                    { id: 'report', label: language === 'id' ? 'Rapor Misi' : 'Guild Report' },
                    { id: 'calendar', label: t.navCalendar || 'Calendar' },
                    { id: 'settings', label: t.navSettings || 'Settings' }
                  ].map((tab) => (
                    <motion.button
                      key={tab.id}
                      onClick={() => {
                        playSFX('click');
                        setActiveTab(tab.id as any);
                      }}
                      whileHover={{ y: -2 }}
                      whileTap={{ y: 2 }}
                      className={`relative px-4 py-2 flex-shrink-0 font-sans font-bold uppercase text-xs md:text-sm z-10 transition-colors ${activeTab === tab.id ? 'text-[#3e2723]' : 'text-[#f4e4bc] hover:text-white'}`}
                    >
                      {activeTab === tab.id && (
                        <motion.div
                          layoutId="activeTabBadge"
                          className="absolute inset-0 bg-[#ffcc00] border-2 border-black"
                          style={{ zIndex: -1 }}
                          transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        />
                      )}
                      {tab.label}
                    </motion.button>
                  ))}
                </nav>
                {canScrollRightNav && (
                  <div className="absolute right-0 top-0 bottom-0 z-20 flex items-center justify-end pr-1 bg-gradient-to-l from-[#3e2723] from-50% to-transparent w-16 lg:hidden pointer-events-none">
                    <button 
                      onClick={() => { playSFX('click'); scrollNav('right'); }} 
                      className="w-8 h-8 bg-[#ffcc00] hover:bg-white text-[#3e2723] border-2 border-black flex items-center justify-center shadow-[2px_2px_0_0_#000] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none transition-all pointer-events-auto rounded-sm"
                    >
                      <ChevronRight size={20} strokeWidth={2.5} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Floating Buttons */}
      <div className="fixed bottom-6 left-6 z-[100] flex flex-col gap-4">
        {/* Floating Guidebook Button */}
        <button 
          onClick={() => {
            playSFX('click');
            setIsGuidebookOpen(true);
          }}
          className="animate-bounce bg-[#ffcc00] hover:bg-white text-[#3e2723] p-4 border-4 border-black rounded-full shadow-[4px_4px_0_0_#000] active:translate-y-1 active:shadow-[2px_2px_0_0_#000] transition-colors flex items-center justify-center group"
        >
          <span className="text-2xl drop-shadow-md">📖</span>
          <span className="absolute left-full ml-4 whitespace-nowrap bg-black text-[#ffcc00] uppercase font-bold text-xs py-1 px-2 border-2 border-[#ffcc00] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            {language === 'id' ? 'Panduan' : 'Guidebook'}
          </span>
        </button>
      </div>
      
      {isNewAccount ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 border-4 border-black bg-[#1a1a17] text-white shadow-[8px_8px_0_0_#000] text-center my-8 mx-auto w-full max-w-2xl">
          {!showStarterInput ? (
            <>
              <h2 className="font-display text-xl sm:text-2xl md:text-4xl mb-4 text-[#ffcc00] uppercase break-words">{language === 'id' ? 'Mulai Petualanganmu!' : 'Start Your Adventure!'}</h2>
              <p className="font-sans text-[#f4e4bc] mb-8 max-w-md leading-relaxed">
                {language === 'id' ? (
                  <>Sebelum memulai misi, tentukan terlebih dahulu target pengeluaran harian maksimalmu. Ini akan menjadi batas <strong className="text-red-500">HP-mu</strong> dalam bertahan hidup di dunia nyata!</>
                ) : (
                  <>Before starting your mission, define your maximum daily expense target. This will act as your <strong className="text-red-500">HP</strong> limit for surviving the real world!</>
                )}
              </p>
              <button 
                onClick={() => {
                  playSFX('click');
                  setShowStarterInput(true);
                }}
                className="px-8 py-4 bg-[#ffcc00] border-4 border-black font-bold uppercase text-black text-xl hover:-translate-y-1 shadow-[4px_4px_0_0_#000] active:translate-y-1 active:shadow-none transition-all"
              >
                {language === 'id' ? '🗡️ Mulai!' : '🗡️ Start!'}
              </button>
            </>
          ) : (
            <form onSubmit={handleStartAdventure} className="w-full max-w-sm flex flex-col gap-4 mx-auto animate-in fade-in slide-in-from-bottom-4">
               <label htmlFor="starterTarget" className="font-sans font-bold text-[#f4e4bc] mb-1 uppercase tracking-widest text-sm text-left">{language === 'id' ? 'Target Pengeluaran Harian (Max HP)' : 'Daily Expense Target (Max HP)'}</label>
               <input 
                 id="starterTarget"
                 type="number"
                 required
                 inputMode="numeric"
                 pattern="[0-9]*"
                 value={starterTarget}
                 onChange={e => setStarterTarget(e.target.value)}
                 className="w-full bg-[#3e2723] border-4 border-black border-l-[#ffcc00] p-4 text-white font-sans text-xl outline-none focus:bg-black transition-colors shadow-[inset_4px_4px_0_rgba(0,0,0,0.5)]"
                 placeholder={language === 'id' ? 'Contoh: 150000' : 'E.g., 150000'}
                 autoFocus
               />
               {starterTarget && !isNaN(Number(starterTarget)) && (
                 <p className="text-[#ffcc00] font-sans text-xs font-bold tracking-widest text-right -mt-2">
                   Rp {Number(starterTarget).toLocaleString('id-ID')}
                 </p>
               )}
               <button 
                type="submit"
                className="w-full py-4 bg-[#ffcc00] border-4 border-black font-bold uppercase text-black text-lg hover:-translate-y-1 shadow-[4px_4px_0_0_#000] active:translate-y-1 active:shadow-none transition-all"
               >
                 {language === 'id' ? 'Tetapkan HP' : 'Set HP'}
               </button>
            </form>
          )}
        </div>
      ) : (
        <>
          {activeTab === 'quest' && (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Mobile Widget Carousel (visible only on mobile) */}
          <div className="col-span-1 lg:hidden flex flex-col order-2 -mx-4">
            <div 
              ref={carouselRef}
              onScroll={handleScroll}
              className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 pl-4 pr-16" 
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
               <style>{`.hide-scroll::-webkit-scrollbar { display: none; }`}</style>
               <div className="w-[85vw] sm:w-[350px] flex-shrink-0 snap-start hide-scroll">
                 {profile && <MainQuest profile={profile} />}
               </div>
               <div className="w-[85vw] sm:w-[350px] flex-shrink-0 snap-start hide-scroll">
                 <DailyQuests transactions={transactions} />
               </div>
               <div className="w-[85vw] sm:w-[350px] flex-shrink-0 snap-start hide-scroll">
                 <SageChat transactions={transactions} />
               </div>
            </div>
            {/* Scroll Progress Bar */}
            <div className="flex justify-center mt-2 mb-4">
               <div className="w-24 h-1.5 bg-[#5d4037] rounded-full border border-black overflow-hidden relative">
                  <div 
                    className="absolute top-0 bottom-0 bg-[#ffcc00] rounded-full transition-all duration-100 ease-out"
                    style={{
                      left: `${scrollProgressWidget * 66}%`,
                      width: '34%'
                    }}
                  />
               </div>
            </div>
          </div>

          {/* Desktop Left Aside */}
          <aside className="hidden lg:flex col-span-1 lg:col-span-3 flex-col gap-4 order-1">
            {profile && <MainQuest profile={profile} />}
            <DailyQuests transactions={transactions} />
          </aside>
          
          <main className="col-span-1 lg:col-span-6 flex flex-col gap-6 order-1 lg:order-2">
            <TransactionForm transactions={transactions} />
            <QuestLog transactions={transactions} />
          </main>

          {/* Desktop Right Aside */}
          <aside className="hidden lg:flex col-span-1 lg:col-span-3 flex-col gap-4 order-3">
            <TreasureChest transactions={transactions} />
            <SageChat transactions={transactions} />
          </aside>
        </div>
      )}

      {activeTab === 'oracle' && (
        <Suspense fallback={<div className="p-8 text-center text-[#ffcc00] animate-pulse">Consulting the Oracles...</div>}>
          <OracleScroll transactions={transactions} maxHP={maxHP} />
        </Suspense>
      )}

      {activeTab === 'report' && (
        <Suspense fallback={<div className="p-8 text-center text-[#ffcc00] animate-pulse">Gathering Reports...</div>}>
          <GuildReport transactions={transactions} profile={profile} />
        </Suspense>
      )}

      {activeTab === 'calendar' && (
        <Suspense fallback={<div className="p-8 text-center text-[#ffcc00] animate-pulse">Checking Calendar...</div>}>
          <RoyalCalendar scheduledEvents={scheduledEvents} />
        </Suspense>
      )}

      {activeTab === 'settings' && profile && (
        <Suspense fallback={<div className="p-8 text-center text-[#ffcc00] animate-pulse">Opening Settings...</div>}>
          <Settings profile={profile} />
        </Suspense>
      )}
      </>
      )}

      {isGuidebookOpen && (
        <Suspense fallback={null}>
          <Guidebook onClose={() => setIsGuidebookOpen(false)} />
        </Suspense>
      )}

      {isFeedbackOpen && (
        <Suspense fallback={null}>
          <FeedbackBox onClose={() => setIsFeedbackOpen(false)} />
        </Suspense>
      )}

      <footer className="mt-auto py-6 border-t-4 border-[#3d251e] flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex gap-4 items-center">
          <button 
            onClick={() => { playSFX('click'); setIsFeedbackOpen(true); }}
            className="flex items-center gap-1.5 font-sans font-bold text-xs uppercase text-[#ffcc00] hover:text-white transition-colors"
          >
            <span>🦉</span> {language === 'id' ? 'Saran' : 'Feedback'}
          </button>
        </div>
        <div className="font-sans text-[10px] uppercase opacity-40 text-gray-400">
          #JuaraVibeCoding2026 • Code Less, Build More
        </div>
      </footer>
    </div>
  );
}
