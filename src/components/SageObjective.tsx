import React, { useMemo } from "react";
import { Transaction } from "../types";
import { isSameDay } from "date-fns";
import { useAppStore } from "../store";
import { motion, AnimatePresence } from "motion/react";
import { MessageSquareText } from "lucide-react";

export default function SageObjective({
  transactions,
}: {
  transactions: Transaction[];
}) {
  const language = useAppStore((state) => state.language);
  const isId = language === "id";

  const { gainCount, expenseCount, hasTransactionsToday } = useMemo(() => {
    const today = new Date();
    const todayTransactions = transactions.filter(
      (t) => t.timestamp && isSameDay(t.timestamp.toDate(), today),
    );

    return {
      gainCount: todayTransactions.filter((t) => t.type === "Gain").length,
      expenseCount: todayTransactions.filter((t) => t.type === "Expense")
        .length,
      hasTransactionsToday: todayTransactions.length > 0,
    };
  }, [transactions]);

  const { message, author } = useMemo(() => {
    if (!hasTransactionsToday) {
      return {
        message: isId
          ? "Gulungan perkamen masih bersih hari ini. Ingatlah, perjalanan ribuan mil dimulai dengan mencatat logam pertamamu."
          : "The parchment remains unstained today. Remember, a journey of a thousand miles begins with logging your first coin.",
        author: isId
          ? "Sage Besar, Pengamat Kosong"
          : "The Grand Sage, Observer of the Void",
      };
    }

    if (expenseCount > 3 && gainCount === 0) {
      return {
        message: isId
          ? "Badai pengeluaran menerpamu! Ingatlah, uang koin lebih ringan dari bulu saat ditinggalkan, tapi lebih berat dari batu karang saat dikumpulkan."
          : "A storm of expenses descends! Remember, a coin is lighter than a feather when spent, but heavier than a boulder to hoard.",
        author: isId
          ? "Sage Besar, Peringatan Badai"
          : "The Grand Sage, Warner of Storms",
      };
    }

    if (gainCount > 0) {
      return {
        message: isId
          ? "Suara emas berdenting menambah pundi-pundimu. Jangan lupa menyisihkannya untuk bekal masa depan di perbendaharaan Guild."
          : "The golden clink adds to your treasury. Do not forget to stash away provisions for the future in the Guild's vault.",
        author: isId
          ? "Sage Besar, Pembawa Kabar Terang"
          : "The Grand Sage, Herald of Light",
      };
    }

    return {
      message: isId
        ? "Keseimbangan adalah kunci. Lanjutkan pencatatanmu dengan teliti, dan takdir akan memperlihatkan jalan keluarnya."
        : "Balance is key. Continue your diligent ledger, and destiny shall reveal the way forward.",
      author: isId ? "Sage Besar, Sang Arbiter" : "The Grand Sage, The Arbiter",
    };
  }, [gainCount, expenseCount, hasTransactionsToday, isId]);

  return (
    <div className="bg-[#2c3e50] border-4 border-[#1a252f] p-4 shadow-[4px_4px_0_0_#000] relative">
      <div className="flex items-center gap-2 mb-3 border-b-2 border-[#1a252f] pb-2">
        <div className="w-8 h-8 bg-[#1a252f] border-2 border-black flex items-center justify-center text-white">
          <MessageSquareText size={16} />
        </div>
        <div className="flex flex-col">
          <span className="font-sans text-xs md:text-sm font-bold uppercase text-[#f4e4bc]">
            {isId ? "Nasihat Harian Sage" : "Sage's Daily Reminder"}
          </span>
          <span className="font-sans text-[10px] text-[#aed581] uppercase tracking-widest">
            {author}
          </span>
        </div>
      </div>

      <motion.div
        key={message}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-sans text-xs md:text-sm text-white italic leading-relaxed border-l-4 border-[#ffcc00] pl-3 py-1"
      >
        "{message}"
      </motion.div>
    </div>
  );
}
