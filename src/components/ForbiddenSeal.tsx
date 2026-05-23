import React, { useState } from "react";
import {
  Transaction,
  OperationType,
  GAIN_CATEGORIES,
  EXPENSE_CATEGORIES,
  RUNES,
} from "../types";
import { useAppStore } from "../store";
import { translations } from "../lib/i18n";
import { format } from "date-fns";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { handleFirestoreError } from "../lib/errorHandler";
import { playSFX } from "../audio";
import { Check } from "lucide-react";

export default function ForbiddenSeal() {
  const language = useAppStore((state) => state.language);
  const t = translations[language];

  const [addForm, setAddForm] = useState<Partial<Transaction>>({
    type: "Expense",
    amount: 0,
    category: "",
    rune: "Gold",
    description: "",
    timestamp: Timestamp.now(),
  });

  const handleAddNew = async () => {
    if (!auth.currentUser) return;
    try {
      playSFX("questComplete");
      const txRef = collection(
        db,
        "users",
        auth.currentUser.uid,
        "transactions",
      );
      await addDoc(txRef, {
        ...addForm,
        amount: Number(addForm.amount),
      });
      setAddForm({
        type: "Expense",
        amount: 0,
        category: "",
        rune: "Gold",
        description: "",
        timestamp: Timestamp.now(),
      });
    } catch (err: any) {
      console.error(err);
      handleFirestoreError(
        err,
        OperationType.CREATE,
        `users/${auth.currentUser.uid}/transactions`,
      );
    }
  };

  return (
    <div className="bg-[#1a1a17] border-4 border-[#3e2723] p-6 shadow-[8px_8px_0_0_#000] text-[#f4e4bc] my-8 relative overflow-hidden">
      {/* Decorative magical circles */}
      <div className="absolute top-0 right-0 w-64 h-64 border-4 border-dashed border-[#5d4037] rounded-full -mt-20 -mr-20 animate-spin-slow opacity-20 pointer-events-none"></div>
      <div
        className="absolute bottom-0 left-0 w-48 h-48 border-4 border-dashed border-red-900 rounded-full -mb-10 -ml-10 animate-spin-slow opacity-20 pointer-events-none"
        style={{ animationDirection: "reverse" }}
      ></div>

      <div className="text-center mb-8 relative z-10 border-b-2 border-[#5d4037] pb-6">
        <h2
          className="font-display text-3xl md:text-4xl text-red-500 uppercase tracking-widest"
          style={{ textShadow: "2px 2px 0px #000" }}
        >
          {language === "id" ? "Segel Terlarang" : "Forbidden Seal"}
        </h2>
        <p className="font-sans text-xs md:text-sm text-gray-400 mt-2 italic">
          {language === "id"
            ? "Mencatat kejadian di luar takdir. Lakukan dengan sadar."
            : "Record an event outside destiny. Proceed with awareness."}
        </p>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="bg-[#2b1d12] border-4 border-black shadow-[8px_8px_0_0_#000] mb-6">
          <div className="flex bg-[#3e2723] border-b-4 border-black p-4 justify-center items-center">
            <span className="font-bold text-[#ffcc00] uppercase text-sm md:text-base tracking-widest text-center">
              {language === "id" ? "Mantra Kehidupan Baru" : "New Memory Spell"}
            </span>
          </div>

          <div className="flex border-b-4 border-black">
            <button
              type="button"
              onClick={() => {
                playSFX("click");
                setAddForm({ ...addForm, type: "Gain", category: "" });
              }}
              className={`relative flex-1 flex items-center justify-center py-4 font-sans font-bold text-sm md:text-base uppercase border-r-4 border-black transition-colors duration-300 ${addForm.type === "Gain" ? "bg-[#4caf50] text-black shadow-[inset_0_-4px_0_rgba(0,0,0,0.3)]" : "bg-[#1b5e20] text-[#aed581] hover:bg-[#4caf50]/80"}`}
            >
              <span className="relative z-10 flex items-center gap-2">
                <span className="text-xl">➕</span> {t.bountyBtn || "Bounty"}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                playSFX("click");
                setAddForm({ ...addForm, type: "Expense", category: "" });
              }}
              className={`relative flex-1 flex items-center justify-center py-4 font-sans font-bold text-sm md:text-base uppercase transition-colors duration-300 ${addForm.type === "Expense" ? "bg-[#f44336] text-white shadow-[inset_0_-4px_0_rgba(0,0,0,0.3)]" : "bg-[#b71c1c] text-[#ffcdd2] hover:bg-[#f44336]/80"}`}
            >
              <span className="relative z-10 flex items-center gap-2">
                <span className="text-xl">➖</span> {t.tollBtn || "Toll"}
              </span>
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block font-sans text-sm md:text-base uppercase text-[#f4e4bc] mb-2 font-bold tracking-widest">
                {t.amountGold || "Jumlah"}
              </label>
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                className="w-full bg-[#1a1a17] border-4 border-black p-3 font-sans text-xl text-white focus:outline-none focus:border-[#ffcc00] shadow-[inset_4px_4px_0_rgba(0,0,0,0.5)]"
                value={addForm.amount || ""}
                onChange={(e) =>
                  setAddForm({ ...addForm, amount: Number(e.target.value) })
                }
              />
              {addForm.amount && !isNaN(Number(addForm.amount)) && (
                <p className="mt-1 text-[#ffcc00] font-sans text-xs font-bold tracking-widest text-right">
                  Rp {Number(addForm.amount).toLocaleString("id-ID")}
                </p>
              )}
            </div>

            <div>
              <label className="block font-sans text-sm md:text-base uppercase text-[#f4e4bc] mb-2 font-bold tracking-widest">
                {t.type || "Kategori"}
              </label>
              <select
                className="w-full bg-[#1a1a17] border-4 border-black p-3 font-sans text-lg text-white focus:outline-none focus:border-[#ffcc00] shadow-[inset_4px_4px_0_rgba(0,0,0,0.5)]"
                value={addForm.category || ""}
                onChange={(e) =>
                  setAddForm({ ...addForm, category: e.target.value })
                }
              >
                <option value="" disabled>
                  {addForm.type === "Gain" ? t.selectBounty : t.selectToll}
                </option>
                {(addForm.type === "Gain"
                  ? GAIN_CATEGORIES
                  : EXPENSE_CATEGORIES
                ).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-sans text-sm md:text-base uppercase text-[#f4e4bc] mb-2 font-bold tracking-widest">
                {addForm.type === "Gain" ? t.runeDest : t.runeSource}
              </label>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                {RUNES.map((r) => (
                  <button
                    type="button"
                    key={r.id}
                    onClick={() => {
                      playSFX("click");
                      setAddForm({ ...addForm, rune: r.id });
                    }}
                    className={`p-2 border-2 text-left font-sans text-sm md:text-base uppercase font-bold transition-all ${addForm.rune === r.id ? "border-[#ffcc00] bg-[#ffcc00] text-black shadow-[2px_2px_0_0_#000]" : "border-black bg-[#1a1a17] text-[#aed581] hover:border-[#ffcc00]/50 shadow-[2px_2px_0_0_#000]"}`}
                  >
                    {r.icon} {r.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-sans text-sm md:text-base uppercase text-[#f4e4bc] mb-2 font-bold tracking-widest">
                Tanggal
              </label>
              <input
                type="date"
                className="w-full bg-[#1a1a17] border-4 border-black p-3 font-sans text-lg text-white focus:outline-none focus:border-[#ffcc00] shadow-[inset_4px_4px_0_rgba(0,0,0,0.5)]"
                value={
                  addForm.timestamp
                    ? format(addForm.timestamp.toDate(), "yyyy-MM-dd")
                    : ""
                }
                onChange={(e) => {
                  if (e.target.value) {
                    const dateObj = new Date(e.target.value + "T12:00:00Z");
                    setAddForm({
                      ...addForm,
                      timestamp: Timestamp.fromDate(dateObj),
                    });
                  }
                }}
              />
            </div>

            <div>
              <label className="block font-sans text-sm md:text-base uppercase text-[#f4e4bc] mb-2 font-bold tracking-widest">
                {language === "id"
                  ? "Catatan (Opsional)"
                  : "Message (Optional)"}
              </label>
              <input
                type="text"
                className="w-full bg-[#1a1a17] border-4 border-black p-3 font-sans text-lg text-white focus:outline-none focus:border-[#ffcc00] shadow-[inset_4px_4px_0_rgba(0,0,0,0.5)]"
                value={addForm.description || ""}
                onChange={(e) =>
                  setAddForm({ ...addForm, description: e.target.value })
                }
              />
            </div>

            <div className="mt-8 pt-4">
              <button
                onClick={handleAddNew}
                disabled={!addForm.amount || !addForm.category || !addForm.rune}
                className="w-full py-4 bg-[#ffcc00] border-4 border-black text-[#3e2723] font-bold uppercase text-sm md:text-base active:translate-y-1 active:shadow-none shadow-[4px_4px_0_0_#000] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                <Check size={20} className="text-black" />{" "}
                {language === "id" ? "Simpan Kepastian" : "Save Certainty"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
