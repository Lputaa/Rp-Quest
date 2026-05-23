import React, { useMemo, useState } from "react";
import {
  Transaction,
  OperationType,
  RUNES,
  GAIN_CATEGORIES,
  EXPENSE_CATEGORIES,
} from "../types";
import { format } from "date-fns";
import { motion, AnimatePresence } from "motion/react";
import { useAppStore } from "../store";
import { translations } from "../lib/i18n";
import { db, auth } from "../lib/firebase";
import { doc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore";
import { handleFirestoreError } from "../lib/errorHandler";
import { playSFX } from "../audio";
import { Edit2, Trash2, X, Check } from "lucide-react";

const QuestLog = React.memo(function QuestLog({
  transactions,
}: {
  transactions: Transaction[];
}) {
  const language = useAppStore((state) => state.language);
  const t = translations[language];

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Transaction>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Memoize and limit to latest 50 to prevent huge DOM tree
  const recentTransactions = useMemo(() => {
    return transactions.slice(0, 50);
  }, [transactions]);

  const handleEdit = (tx: Transaction) => {
    playSFX("click");
    setEditingId(tx.id || null);
    setEditForm({
      ...tx,
      timestamp: tx.timestamp,
    });
    setDeletingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSaveEdit = async (txId: string) => {
    if (!auth.currentUser) return;
    try {
      playSFX("questComplete");
      const txRef = doc(
        db,
        "users",
        auth.currentUser.uid,
        "transactions",
        txId,
      );
      await updateDoc(txRef, {
        ...editForm,
        amount: Number(editForm.amount),
        updatedAt: Timestamp.now(),
      });
      setEditingId(null);
      setEditForm({});
    } catch (err: any) {
      console.error(err);
      handleFirestoreError(
        err,
        OperationType.UPDATE,
        `users/${auth.currentUser.uid}/transactions/${txId}`,
      );
    }
  };

  const confirmDelete = async (txId: string) => {
    if (!auth.currentUser) return;
    try {
      playSFX("questComplete"); // Or a delete sound
      const txRef = doc(
        db,
        "users",
        auth.currentUser.uid,
        "transactions",
        txId,
      );
      await deleteDoc(txRef);
      setDeletingId(null);
    } catch (err: any) {
      console.error(err);
      handleFirestoreError(
        err,
        OperationType.DELETE,
        `users/${auth.currentUser.uid}/transactions/${txId}`,
      );
    }
  };

  return (
    <div className="bg-[#f4e4bc] border-4 border-black text-[#3e2723] p-6 shadow-[8px_8px_0_0_#000] flex-1 relative overflow-hidden min-h-[400px]">
      {/* Scroll decorations */}
      <div className="absolute top-0 left-0 w-full h-4 bg-[#d7ccc8] border-b-2 border-black" />
      <div className="absolute bottom-0 left-0 w-full h-4 bg-[#d7ccc8] border-t-2 border-black" />

      <div className="flex justify-between items-center mb-6 mt-4">
        <h2 className="font-sans text-xl font-bold uppercase tracking-tighter">
          📜 {t.parchmentLog}
        </h2>
        <span className="font-sans text-[10px] md:text-xs font-bold border-2 border-[#3e2723] px-2 py-1">
          {t.logs}
        </span>
      </div>

      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar pb-8">
        <AnimatePresence>
          {recentTransactions.length === 0 ? (
            <p className="text-center font-sans text-xl text-[#3e2723]/60 py-8 italic">
              {t.noQuests}
            </p>
          ) : (
            recentTransactions.map((tItem) => {
              const isDeleting = deletingId === tItem.id;
              const canEdit = !tItem.type.startsWith("Potion");

              return (
                <motion.div
                  layout
                  key={tItem.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`border-b-2 border-[#d7ccc8] pb-4 mb-4 transition-all ${isDeleting ? "bg-white p-4 shadow-[4px_4px_0_0_#3e2723]" : ""}`}
                >
                  {isDeleting ? (
                    <div className="flex flex-col items-center py-2 space-y-4">
                      <p className="font-bold text-red-700 text-sm italic">
                        {language === "id"
                          ? "Anda yakin ingin menghancurkan catatan kuno ini?"
                          : "Are you sure you want to destroy this ancient record?"}
                      </p>
                      <div className="flex gap-4">
                        <button
                          onClick={() => setDeletingId(null)}
                          className="px-6 py-2 border-2 border-[#3e2723] font-bold text-xs uppercase hover:bg-[#d7ccc8] shadow-[2px_2px_0_0_#3e2723] active:translate-y-[2px] active:shadow-none transition-all"
                        >
                          {language === "id" ? "Batal" : "Cancel"}
                        </button>
                        <button
                          onClick={() => confirmDelete(tItem.id!)}
                          className="px-6 py-2 bg-[#b71c1c] text-white font-bold text-xs uppercase border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-y-[2px] active:shadow-none hover:bg-red-800 transition-all"
                        >
                          {language === "id" ? "Hancurkan!" : "Destroy!"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center gap-2">
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="font-sans text-[10px] md:text-xs uppercase opacity-80 text-[#5d4037] font-bold truncate">
                          {tItem.timestamp
                            ? format(
                                tItem.timestamp.toDate(),
                                "dd MMM yyyy, HH:mm",
                              )
                            : t.justNow}{" "}
                          •{" "}
                          {tItem.type === "Gain"
                            ? t.bountyBtn
                            : tItem.type === "Expense"
                              ? t.tollBtn
                              : "Potion"}{" "}
                          • {tItem.rune}
                        </span>
                        <span className="font-sans text-sm md:text-base font-bold text-black truncate flex items-center gap-1">
                          {tItem.type.startsWith("Potion") && (
                            <span className="text-[10px] bg-purple-200 text-purple-800 px-1 border border-purple-800 rounded-sm leading-none flex items-center border-[1px] shadow-[1px_1px_0_0_rgba(107,33,168,1)]">
                              POTION
                            </span>
                          )}
                          {tItem.category}
                        </span>
                        {tItem.description && (
                          <span className="font-sans text-[10px] md:text-xs text-[#5d4037] italic mt-1 truncate border-l-2 border-[#3e2723] pl-2">
                            "{tItem.description}"
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span
                          className={`font-sans text-base md:text-lg font-bold tracking-tight ${tItem.type === "Gain" || tItem.type === "PotionDrink" ? "text-[#1b5e20]" : "text-[#b71c1c]"}`}
                        >
                          {tItem.type === "Gain" || tItem.type === "PotionDrink"
                            ? "+"
                            : "-"}{" "}
                          Rp {tItem.amount.toLocaleString("id-ID")}
                        </span>
                        <div className="flex flex-col gap-1 ml-2">
                          {canEdit && (
                            <button
                              onClick={() => handleEdit(tItem)}
                              className="text-[#3e2723] hover:text-black hover:bg-[#d7ccc8] transition-colors p-1.5 rounded-sm border border-transparent hover:border-[#3e2723]"
                            >
                              <Edit2 size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              playSFX("click");
                              setDeletingId(tItem.id || null);
                            }}
                            className="text-[#b71c1c] hover:text-white hover:bg-[#b71c1c] transition-colors p-1.5 rounded-sm border border-transparent hover:border-[#b71c1c]"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #d7ccc8; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #3e2723; 
        }
      `}</style>

      <AnimatePresence>
        {editingId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#f4e4bc] border-4 border-black text-[#3e2723] p-6 shadow-[8px_8px_0_0_#000] w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-[#3e2723] text-[#f4e4bc] p-3">
                  <span className="font-bold uppercase tracking-widest text-sm">
                    {language === "id" ? "Ubah Catatan" : "Edit Scroll"}
                  </span>
                  <button
                    onClick={cancelEdit}
                    className="hover:bg-red-900 p-1 transition-colors bg-[#1a1a17] border border-[#f4e4bc]"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="flex border-2 border-[#3e2723]">
                  <button
                    type="button"
                    onClick={() => {
                      playSFX("click");
                      setEditForm({
                        ...editForm,
                        type: "Gain",
                        category: "",
                      });
                    }}
                    className={`flex-1 py-3 font-bold text-sm uppercase border-r-2 border-[#3e2723] transition-colors ${editForm.type === "Gain" ? "bg-[#4caf50] text-black" : "bg-white hover:bg-green-50 text-[#3e2723]"}`}
                  >
                    ➕ {t.bountyBtn}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playSFX("click");
                      setEditForm({
                        ...editForm,
                        type: "Expense",
                        category: "",
                      });
                    }}
                    className={`flex-1 py-3 font-bold text-sm uppercase transition-colors ${editForm.type === "Expense" ? "bg-[#f44336] text-white" : "bg-white hover:bg-red-50 text-[#3e2723]"}`}
                  >
                    ➖ {t.tollBtn}
                  </button>
                </div>

                <div>
                  <label className="block text-xs md:text-sm uppercase font-bold text-[#3e2723] mb-1">
                    {t.amountGold}
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="w-full border-2 border-[#3e2723] p-3 text-black font-bold focus:outline-none focus:border-[#ffcc00] focus:shadow-[inset_2px_2px_0_rgba(0,0,0,0.1)] text-lg"
                    value={editForm.amount || ""}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        amount: Number(e.target.value),
                      })
                    }
                  />
                  {editForm.amount && !isNaN(Number(editForm.amount)) && (
                    <p className="mt-1 text-[#3e2723] font-sans text-xs font-bold tracking-widest text-right">
                      Rp {Number(editForm.amount).toLocaleString("id-ID")}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs md:text-sm uppercase font-bold text-[#3e2723] mb-1">
                    {t.type}
                  </label>
                  <select
                    className="w-full border-2 border-[#3e2723] p-3 text-black font-bold focus:outline-none focus:border-[#ffcc00] text-base"
                    value={editForm.category || ""}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        category: e.target.value,
                      })
                    }
                  >
                    <option value="" disabled>
                      {editForm.type === "Gain" ? t.selectBounty : t.selectToll}
                    </option>
                    {(editForm.type === "Gain"
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
                  <label className="block text-xs md:text-sm uppercase font-bold text-[#3e2723] mb-1">
                    {editForm.type === "Gain" ? t.runeDest : t.runeSource}
                  </label>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                    {RUNES.map((r) => (
                      <button
                        type="button"
                        key={r.id}
                        onClick={() => {
                          playSFX("click");
                          setEditForm({ ...editForm, rune: r.id });
                        }}
                        className={`p-2 border-2 text-xs md:text-sm uppercase font-bold text-left transition-colors ${editForm.rune === r.id ? "border-[#3e2723] bg-[#3e2723] text-[#f4e4bc]" : "border-transparent bg-[#d7ccc8] text-[#3e2723] hover:border-[#3e2723]/30"}`}
                      >
                        {r.icon} {r.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs md:text-sm uppercase font-bold text-[#3e2723] mb-1">
                    {language === "id" ? "Tanggal" : "Date"}
                  </label>
                  <input
                    type="date"
                    className="w-full border-2 border-[#3e2723] p-3 text-black font-bold focus:outline-none focus:border-[#ffcc00]"
                    value={
                      editForm.timestamp
                        ? format(
                            typeof (editForm.timestamp as any).toDate === 'function' ? (editForm.timestamp as any).toDate() : new Date((editForm.timestamp as any).seconds * 1000),
                            "yyyy-MM-dd"
                          )
                        : ""
                    }
                    onChange={(e) => {
                      if (e.target.value) {
                        const d = new Date(e.target.value + "T12:00:00Z");
                        setEditForm({
                          ...editForm,
                          timestamp: Timestamp.fromDate(d) as any,
                        });
                      }
                    }}
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm uppercase font-bold text-[#3e2723] mb-1">
                    {language === "id"
                      ? "Catatan (Opsional)"
                      : "Message (Optional)"}
                  </label>
                  <input
                    type="text"
                    className="w-full border-2 border-[#3e2723] p-3 text-black font-bold focus:outline-none focus:border-[#ffcc00]"
                    value={editForm.description || ""}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        description: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => handleSaveEdit(editingId)}
                    disabled={
                      !editForm.amount || !editForm.category || !editForm.rune
                    }
                    className="w-full bg-[#ffcc00] border-2 border-[#3e2723] shadow-[4px_4px_0_0_#3e2723] text-black p-4 font-bold uppercase tracking-widest flex items-center justify-center gap-2 active:translate-y-[4px] active:shadow-none disabled:opacity-50 transition-all text-sm md:text-base"
                  >
                    <Check size={20} />{" "}
                    {language === "id" ? "Simpan Rekaman" : "Save Record"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default QuestLog;
