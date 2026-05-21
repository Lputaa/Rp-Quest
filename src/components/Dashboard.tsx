import { useEffect, useState, useMemo } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, getDocs, where } from 'firebase/firestore';
import { handleFirestoreError } from '../lib/errorHandler';
import { OperationType, Transaction, UserProfile, ScheduledEvent } from '../types';
import HPBar from './HPBar';
import TreasureChest from './TreasureChest';
import TransactionForm from './TransactionForm';
import QuestLog from './QuestLog';
import SageChat from './SageChat';
import DailyQuests from './DailyQuests';
import HeroStats from './HeroStats';
import { doc, getDoc } from 'firebase/firestore';
import { isSameDay } from 'date-fns';

import OracleScroll from './OracleScroll';
import RoyalCalendar from './RoyalCalendar';
import Settings from './Settings';
import Guidebook from './Guidebook';
import { Timestamp, addDoc, updateDoc, doc } from 'firebase/firestore';
import { addDays, addMonths, setDate, getDay, isSameDay } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check } from 'lucide-react';

import { useAppStore } from '../store';
import { translations } from '../lib/i18n';

function calculateNextDueDate(currentDue: Date, freq: string, freqVal?: number) {
  let next = new Date(currentDue);
  if (freq === 'daily') {
    next = addDays(next, 1);
  } else if (freq === 'weekly') {
    next = addDays(next, 7);
  } else if (freq === 'monthly') {
    next = addMonths(next, 1);
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

  const [activeTab, setActiveTab] = useState<'quest' | 'oracle' | 'calendar' | 'settings' | 'guidebook'>('quest');

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
          const nextDue = calculateNextDueDate(ev.nextDueDate.toDate(), ev.frequency, ev.frequencyValue);
          
          const newTx: Transaction = {
            type: ev.rune === 'potion' && ev.type === 'Bounty' ? 'PotionBuy' : (ev.type as any),
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
    const nextDue = calculateNextDueDate(ev.nextDueDate.toDate(), ev.frequency, ev.frequencyValue);
    
    const newTx: Transaction = {
      type: ev.rune === 'potion' && ev.type === 'Bounty' ? 'PotionBuy' : (ev.type as any),
      amount: ev.amount,
      category: ev.category || 'Tithe',
      rune: ev.rune === 'potion' ? 'POTION_STASH' : ev.rune,
      timestamp: Timestamp.now(),
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

    const fetchProfile = async () => {
      try {
        const docRef = doc(db, 'users', uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `users/${uid}`);
      }
    };
    fetchProfile();

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
      unsubscribe();
      unsubscribeEvents();
    };
  }, []);

  const todayTransactions = useMemo(() => {
    const today = new Date();
    return transactions.filter(t => !t.timestamp || isSameDay(t.timestamp.toDate(), today));
  }, [transactions]);

  // Derived calculations for HP
  // Assuming HP max is daily budget: targetDailyExpense by default, fallback to legacy math
  const maxHP = profile ? (profile.customHPCap || profile.targetDailyExpense || Math.max(0, (profile.monthlyIncome - (profile.targetSavings || 0)) / 30)) : 100;
  
  let currentHP = maxHP;
  let isHealing = false;
  todayTransactions.forEach(tItem => {
    if (tItem.type === 'Expense') {
      currentHP -= tItem.amount;
    } else if (tItem.type === 'Gain') {
      // Heal mechanic: max +50% of maxHP per day
      currentHP += Math.min(tItem.amount, maxHP * 0.5);
      if (tItem.isPending) isHealing = true;
    } else if (tItem.type === 'PotionDrink') {
      currentHP += tItem.amount; // Directly heals HP
      if (tItem.isPending) isHealing = true;
    }
    // PotionBuy does not affect HP
  });

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
        <div className="flex flex-col-reverse lg:flex-col w-full gap-4 mt-2 lg:mt-0">
          <div className="w-full lg:flex lg:justify-center">
            <nav className="flex gap-2 bg-[#3e2723] p-1 border-2 border-black overflow-x-auto whitespace-nowrap scrollbar-hide lg:w-max">
              <button onClick={() => setActiveTab('quest')} className={`px-4 py-2 flex-shrink-0 font-sans font-bold uppercase text-xs md:text-sm ${activeTab === 'quest' ? 'bg-[#ffcc00] text-[#3e2723]' : 'text-[#f4e4bc] hover:bg-black/20'}`}>
                {t.navQuest || 'Quest'}
              </button>
              <button onClick={() => setActiveTab('oracle')} className={`px-4 py-2 flex-shrink-0 font-sans font-bold uppercase text-xs md:text-sm ${activeTab === 'oracle' ? 'bg-[#ffcc00] text-[#3e2723]' : 'text-[#f4e4bc] hover:bg-black/20'}`}>
                {t.navOracle || 'Oracle'}
              </button>
              <button onClick={() => setActiveTab('calendar')} className={`px-4 py-2 flex-shrink-0 font-sans font-bold uppercase text-xs md:text-sm ${activeTab === 'calendar' ? 'bg-[#ffcc00] text-[#3e2723]' : 'text-[#f4e4bc] hover:bg-black/20'}`}>
                {t.navCalendar || 'Calendar'}
              </button>
              <button onClick={() => setActiveTab('settings')} className={`px-4 py-2 flex-shrink-0 font-sans font-bold uppercase text-xs md:text-sm ${activeTab === 'settings' ? 'bg-[#ffcc00] text-[#3e2723]' : 'text-[#f4e4bc] hover:bg-black/20'}`}>
                {t.navSettings || 'Settings'}
              </button>
              <button onClick={() => setActiveTab('guidebook')} className={`px-4 py-2 flex-shrink-0 font-sans font-bold uppercase text-xs md:text-sm ${activeTab === 'guidebook' ? 'bg-[#ffcc00] text-[#3e2723]' : 'text-[#f4e4bc] hover:bg-black/20'}`}>
                {language === 'id' ? 'Panduan' : 'Guidebook'}
              </button>
            </nav>
          </div>
        </div>
      </header>
      
      {activeTab === 'quest' && (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <aside className="col-span-1 lg:col-span-3 flex flex-col gap-4">
            <TreasureChest transactions={transactions} />
            <DailyQuests transactions={transactions} />
          </aside>
          
          <main className="col-span-1 lg:col-span-6 flex flex-col gap-6">
            <TransactionForm />
            <QuestLog transactions={transactions} />
          </main>

          <aside className="col-span-1 lg:col-span-3 flex flex-col gap-4">
            <SageChat transactions={transactions} />
          </aside>
        </div>
      )}

      {activeTab === 'oracle' && (
        <OracleScroll transactions={transactions} profile={profile} maxHP={maxHP} />
      )}

      {activeTab === 'calendar' && (
        <RoyalCalendar scheduledEvents={scheduledEvents} />
      )}

      {activeTab === 'settings' && profile && (
        <Settings profile={profile} />
      )}

      {activeTab === 'guidebook' && (
        <Guidebook />
      )}

      <footer className="mt-auto py-6 border-t-4 border-[#3d251e] flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[#aed581]">✨</span>
            <span className="font-sans text-xs uppercase text-gray-400">EXP: <span className="text-white">Active</span></span>
          </div>
        </div>
        <div className="font-sans text-[10px] uppercase opacity-40 text-gray-400">
          #JuaraVibeCoding2026 • Code Less, Build More
        </div>
      </footer>
    </div>
  );
}
