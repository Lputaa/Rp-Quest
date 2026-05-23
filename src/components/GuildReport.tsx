import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Transaction, UserProfile } from "../types";
import { useAppStore } from "../store";
import { format, subMonths, isSameMonth } from "date-fns";
import { id } from "date-fns/locale";

import HolyFire from "./HolyFire";

export default function GuildReport({
  transactions,
  profile,
}: {
  transactions: Transaction[];
  profile: UserProfile;
}) {
  const language = useAppStore((state) => state.language);
  const [opened, setOpened] = useState(false);

  const today = new Date();
  const lastMonth = subMonths(today, 1);

  const { currentGain, currentExpense, lastGain, lastExpense } = useMemo(() => {
    let cg = 0,
      ce = 0,
      lg = 0,
      le = 0;
    transactions.forEach((tx) => {
      if (!tx.timestamp) return;
      const txDate = tx.timestamp.toDate();
      const amt = tx.amount;
      if (isSameMonth(txDate, today)) {
        if (tx.type === "Gain") cg += amt;
        else if (tx.type === "Expense") ce += amt;
      } else if (isSameMonth(txDate, lastMonth)) {
        if (tx.type === "Gain") lg += amt;
        else if (tx.type === "Expense") le += amt;
      }
    });

    const incomeBaseCurrent = profile.monthlyIncome + cg;
    const incomeBaseLast = profile.monthlyIncome + lg;

    return {
      currentGain: cg,
      currentExpense: ce,
      lastGain: lg,
      lastExpense: le,
      savedCurrent: incomeBaseCurrent - ce,
      savedLast: incomeBaseLast - le,
    };
  }, [transactions, profile, today, lastMonth]);

  const savedCurrent = profile.monthlyIncome + currentGain - currentExpense;
  const savedLast = profile.monthlyIncome + lastGain - lastExpense;

  const diff = savedCurrent - savedLast;
  const diffPercentage =
    savedLast === 0 ? 0 : (diff / Math.abs(savedLast)) * 100;

  return (
    <div className="bg-[#3e2723] border-4 border-black p-4 md:p-6 shadow-[4px_4px_0_0_#000] md:shadow-[8px_8px_0_0_#000] text-white my-4 md:my-8 max-w-2xl mx-auto w-full">
      <h2
        className="font-display text-2xl md:text-3xl text-[#ffcc00] uppercase text-center mb-2 tracking-tighter"
        style={{ textShadow: "2px 2px 0px #000" }}
      >
        {language === "id" ? "Rapor Misi Bulanan" : "Guild Report"}
      </h2>
      <p className="text-center font-sans text-xs md:text-sm text-[#f4e4bc] italic mb-8">
        {format(today, "MMMM yyyy", {
          locale: language === "id" ? id : undefined,
        })}
      </p>

      {!opened ? (
        <div className="flex flex-col items-center justify-center py-12">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setOpened(true)}
            className="relative cursor-pointer group mb-6"
          >
            <div className="text-8xl md:text-9xl drop-shadow-[0_0_15px_rgba(255,204,0,0.5)] group-hover:drop-shadow-[0_0_25px_rgba(255,204,0,0.8)] transition-all">
              📦
            </div>
            <div className="absolute -inset-4 border-4 border-dashed border-[#ffcc00] rounded-full animate-spin-slow opacity-50 group-hover:opacity-100"></div>
          </motion.button>
          <p className="font-sans font-bold uppercase text-[#ffcc00] animate-pulse text-center">
            {language === "id" ? "Buka Peti Guild" : "Open Guild Chest"}
          </p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1a1a17] border-4 border-black p-4 md:p-6 shadow-[inset_4px_4px_0_rgba(0,0,0,0.5)] overflow-hidden"
        >
          <div className="flex justify-center mb-6 text-5xl md:text-6xl drop-shadow-[0_0_20px_rgba(255,204,0,0.8)] animate-bounce">
            {savedCurrent >= 0 ? "🏆" : "💀"}
          </div>

          <div className="text-center mb-8 border-b-2 border-[#5d4037] pb-6">
            <h3 className="font-sans text-sm uppercase text-gray-400 mb-1">
              {language === "id" ? "Gold Terselamatkan" : "Gold Saved"}
            </h3>
            <p
              className={`font-display text-3xl sm:text-4xl md:text-5xl break-words ${savedCurrent >= 0 ? "text-[#ffcc00]" : "text-red-500"}`}
            >
              {savedCurrent >= 0 ? "+" : ""} Rp{" "}
              {savedCurrent.toLocaleString("id-ID")}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 md:gap-4 text-center font-sans text-xs md:text-sm">
            <div className="border-r-2 border-[#5d4037] pr-2 md:pr-4">
              <p className="text-gray-400 uppercase mb-1 truncate">
                {language === "id" ? "Bulan Lalu" : "Last Month"}
              </p>
              <p className="font-bold text-[#f4e4bc] break-words">
                Rp {savedLast.toLocaleString("id-ID")}
              </p>
            </div>
            <div className="pl-2 md:pl-4">
              <p className="text-gray-400 uppercase mb-1 truncate">
                {language === "id" ? "Pertumbuhan" : "Growth"}
              </p>
              <div className="flex items-center justify-center gap-1">
                <span
                  className={`font-bold ${diff > 0 ? "text-green-500" : diff < 0 ? "text-red-500" : "text-gray-300"}`}
                >
                  {diff > 0 ? "↑" : diff < 0 ? "↓" : "-"}{" "}
                  {Math.abs(diffPercentage).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {profile.completedVaultQuests &&
            profile.completedVaultQuests.length > 0 && (
              <div className="mt-8 border-t-2 border-[#5d4037] pt-6">
                <h3
                  className="font-display text-lg md:text-2xl uppercase text-[#ffcc00] text-center mb-4 tracking-tighter"
                  style={{ textShadow: "1px 1px 0px #000" }}
                >
                  {language === "id"
                    ? "The Vault: Terselesaikan"
                    : "The Vault: Completed"}
                </h3>
                <div className="flex flex-col gap-3">
                  {profile.completedVaultQuests.map((q, idx) => (
                    <div
                      key={idx}
                      className="bg-[#2d1b15] border-2 border-[#ffcc00] p-3 flex justify-between items-center shadow-[4px_4px_0_0_#ffcc00] gap-2 overflow-hidden"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-sans font-bold text-xs md:text-sm text-[#ffcc00] uppercase tracking-wider truncate">
                          {q.name}
                        </p>
                        <p className="font-sans text-[10px] md:text-xs text-gray-400 mt-1 truncate">
                          Target: Rp {q.target.toLocaleString("id-ID")}
                        </p>
                      </div>
                      <div className="text-xl md:text-2xl drop-shadow-[2px_2px_0px_#000] flex-shrink-0">
                        🏆
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          <div className="mt-8 bg-[#3e2723] p-4 border-2 border-black">
            <p className="font-sans text-xs md:text-sm italic text-center">
              {savedCurrent >= savedLast
                ? language === "id"
                  ? `"Bagus sekali, ${profile.gender || "Sir"}! Petualanganmu membawa berkah luar biasa."`
                  : `"Excellent work, ${profile.gender || "Sir"}! Your adventures have brought great fortune."`
                : language === "id"
                  ? '"Sebuah kemunduran... Jangan biarkan bayangan mengambil hartamu lagi."'
                  : '"A setback... Do not let the shadows claim your wealth again."'}
            </p>
          </div>

          <div className="mt-8">
            <HolyFire transactions={transactions} profile={profile} />
          </div>
        </motion.div>
      )}
    </div>
  );
}
