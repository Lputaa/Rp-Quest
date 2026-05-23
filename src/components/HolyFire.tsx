import React, { useMemo, useEffect, useState } from "react";
import { Transaction, UserProfile } from "../types";
import { format } from "date-fns";
import { motion, AnimatePresence } from "motion/react";
import { playSFX } from "../audio";
import { doc, updateDoc } from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { Flame, Medal, Award, Crown } from "lucide-react";
import { useAppStore } from "../store";

const BADGES = [
  { id: "1", name: "Flame Initiate", days: 3, icon: <Medal size={16} /> },
  { id: "2", name: "Master of the Ledger", days: 7, icon: <Award size={16} /> },
  { id: "3", name: "Grand Calculator", days: 14, icon: <Crown size={16} /> },
  {
    id: "4",
    name: "Sage of Wealth",
    days: 30,
    icon: <span className="text-xl">🧙‍♂️</span>,
  },
];

export default function HolyFire({
  transactions,
  profile,
}: {
  transactions: Transaction[];
  profile: UserProfile | null;
}) {
  const language = useAppStore((state) => state.language);
  const [justUnlocked, setJustUnlocked] = useState<string | null>(null);

  const streak = useMemo(() => {
    if (!transactions.length) return 0;

    const activeDates = new Set(
      transactions.map((t) => {
        // If pending, use current date
        const d =
          t.timestamp && typeof (t.timestamp as any).toDate === "function"
            ? (t.timestamp as any).toDate()
            : new Date();
        return format(d, "yyyy-MM-dd");
      }),
    );

    let currentStreak = 0;
    const today = new Date();
    const todayStr = format(today, "yyyy-MM-dd");
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = format(yesterday, "yyyy-MM-dd");

    let checkDate = new Date();

    if (!activeDates.has(todayStr) && !activeDates.has(yesterdayStr)) {
      return 0;
    }

    if (!activeDates.has(todayStr)) {
      checkDate = new Date(yesterday);
    }

    while (activeDates.has(format(checkDate, "yyyy-MM-dd"))) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    return currentStreak;
  }, [transactions]);

  // Handle badge unlocks
  useEffect(() => {
    if (!profile || !auth.currentUser || streak === 0) return;

    const currentBadges = profile.badges || [];
    const newBadges = BADGES.filter(
      (b) => streak >= b.days && !currentBadges.includes(b.id),
    );

    if (newBadges.length > 0) {
      const unlockBadge = async () => {
        try {
          const uid = auth.currentUser!.uid;
          playSFX("levelUp");

          setJustUnlocked(newBadges[0].name);
          setTimeout(() => setJustUnlocked(null), 5000);

          await updateDoc(doc(db, "users", uid), {
            badges: [...currentBadges, ...newBadges.map((b) => b.id)],
          });
        } catch (err) {
          console.error("Failed to unlock badge:", err);
        }
      };
      unlockBadge();
    }
  }, [streak, profile]);

  const earnedBadges = useMemo(() => {
    if (!profile?.badges) return [];
    return BADGES.filter((b) => profile.badges!.includes(b.id));
  }, [profile?.badges]);

  // Determine fire color/size based on streak
  let fireColor = "text-orange-500";
  let fireScale = 1;
  let glowColor = "rgba(249, 115, 22, 0.2)"; // orange

  if (streak >= 30) {
    fireColor = "text-purple-500";
    fireScale = 1.6;
    glowColor = "rgba(168, 85, 247, 0.4)";
  } else if (streak >= 14) {
    fireColor = "text-blue-500";
    fireScale = 1.4;
    glowColor = "rgba(59, 130, 246, 0.4)";
  } else if (streak >= 7) {
    fireColor = "text-yellow-400";
    fireScale = 1.2;
    glowColor = "rgba(250, 204, 21, 0.3)";
  }

  return (
    <div className="bg-[#1a1a17] border-4 border-[#3e2723] p-4 flex flex-col items-center justify-center relative overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
      <h3 className="text-[#ffcc00] font-sans font-bold uppercase tracking-widest text-xs md:text-sm mb-4 border-b-2 border-[#3e2723] pb-1 w-full text-center">
        🔥 {language === "id" ? "Api Konsistensi" : "Holy Fire"} 🔥
      </h3>

      <div className="relative mb-6">
        {/* Glow Effect */}
        <motion.div
          className="absolute inset-0 rounded-full blur-xl z-0"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ backgroundColor: glowColor }}
        />

        <motion.div
          animate={{
            scale: [fireScale, fireScale * 1.05, fireScale],
            rotate: [-2, 2, -2],
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className={`relative z-10 ${fireColor} ${streak === 0 ? "opacity-30 grayscale" : ""}`}
        >
          <Flame size={64} fill="currentColor" strokeWidth={1} />
        </motion.div>

        {streak > 0 && (
          <div className="absolute -bottom-2 -right-2 bg-black border-2 border-[#ffcc00] text-[#ffcc00] w-8 h-8 rounded-full flex items-center justify-center font-bold font-mono text-sm shadow-[0_0_10px_rgba(255,204,0,0.5)] z-20">
            {streak}
          </div>
        )}
      </div>

      <p className="text-gray-300 font-sans text-xs text-center mb-4 min-h-[32px]">
        {streak === 0
          ? language === "id"
            ? "Api padam. Catat keuangan besok untuk menyalakannya kembali."
            : "The fire is out. Log finances tomorrow to spark it."
          : language === "id"
            ? `Kamu telah mencatat laporan ${streak} hari berturut-turut!`
            : `You have logged finances ${streak} days in a row!`}
      </p>

      {/* Badges Container */}
      <div className="flex flex-col w-full">
        {earnedBadges.length > 0 && (
          <div className="border-t-2 border-[#3e2723] pt-3 flex flex-wrap gap-2 justify-center">
            {earnedBadges.map((b) => (
              <div
                key={b.id}
                className="bg-[#3e2723] text-[#ffcc00] px-2 py-1 flex items-center gap-1 text-[10px] md:text-xs font-bold uppercase rounded-sm border border-[#ffcc00]/30 shadow-[0_2px_0_0_#000]"
              >
                {b.icon} <span className="hidden md:inline">{b.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {justUnlocked && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute inset-x-0 bottom-4 mx-4 bg-[#ffcc00] text-black p-2 font-bold text-center text-xs uppercase border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] z-30"
          >
            🎉 {language === "id" ? "Gelar Terbuka:" : "Title Unlocked:"}{" "}
            {justUnlocked}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
