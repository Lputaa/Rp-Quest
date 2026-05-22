import React, { useState, useEffect, useRef } from "react";
import { UserProfile, OperationType } from "../types";
import { auth, db } from "../lib/firebase";
import {
  doc,
  updateDoc,
  serverTimestamp,
  collection,
  writeBatch,
  Timestamp,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import { handleFirestoreError } from "../lib/errorHandler";
import { useAppStore } from "../store";
import { translations } from "../lib/i18n";
import { subDays } from "date-fns";

const AVATARS = ["🧑‍🌾", "🧙‍♂️", "🧝‍♀️", "🧛‍♂️", "🧜‍♀️", "🧞‍♂️", "🦸‍♀️", "🦹‍♂️", "🕵️‍♀️", "🥷"];

export default function Settings({ profile }: { profile: UserProfile }) {
  const language = useAppStore((state) => state.language);
  const t = translations[language];

  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generateSuccess, setGenerateSuccess] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    characterName:
      profile.characterName || auth.currentUser?.displayName || "Traveler",
    avatar: profile.avatar || "🧑‍🌾",
    gender: profile.gender || "Sir",
    customHPCap: profile.customHPCap?.toString() || "100000",
  });

  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importExportMsg, setImportExportMsg] = useState<{type: 'success'|'error', text: string} | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (generateSuccess) {
      const timer = setTimeout(() => setGenerateSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [generateSuccess]);

  useEffect(() => {
    if (resetSuccess) {
      const timer = setTimeout(() => setResetSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [resetSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setLoading(true);
    setSuccess(false);

    try {
      const pDoc = doc(db, "users", auth.currentUser.uid);
      await updateDoc(pDoc, {
        characterName: formData.characterName,
        avatar: formData.avatar,
        gender: formData.gender,
        customHPCap: Number(formData.customHPCap),
        updatedAt: serverTimestamp(),
      });
      setSuccess(true);
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.UPDATE,
        `users/${auth.currentUser.uid}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const generateDummyData = async () => {
    if (!auth.currentUser) return;

    setGenerating(true);
    setGenerateSuccess(false);
    setGenerateError(null);
    try {
      const batch = writeBatch(db);
      const txRef = collection(
        db,
        "users",
        auth.currentUser.uid,
        "transactions",
      );

      const today = new Date();

      // Vault (High Net Worth) - Large initial gains
      batch.set(doc(txRef), {
        type: "Gain",
        amount: 25000000,
        category: "🎲 Loot Drop",
        rune: "🏦 Other Bank",
        timestamp: Timestamp.fromDate(subDays(today, 30)),
      });

      batch.set(doc(txRef), {
        type: "Gain",
        amount: 10000000,
        category: "🤝 Tribute",
        rune: "🏦 Other Bank",
        timestamp: Timestamp.fromDate(subDays(today, 25)),
      });

      batch.set(doc(txRef), {
        type: "Gain",
        amount: 5000000,
        category: "⚗️ Alchemy",
        rune: "🌊 SeaBank",
        timestamp: Timestamp.fromDate(subDays(today, 20)),
      });

      batch.set(doc(txRef), {
        type: "Gain",
        amount: 2000000,
        category: "📜 Quest Reward",
        rune: "💙 DANA",
        timestamp: Timestamp.fromDate(subDays(today, 15)),
      });

      // Recent Salary
      batch.set(doc(txRef), {
        type: "Gain",
        amount: profile.monthlyIncome || 8000000,
        category: "🏰 Royal Salary",
        rune: "🏦 Other Bank",
        timestamp: Timestamp.fromDate(subDays(today, 2)),
      });

      // Diverse Expenses (History)
      for (let i = 0; i <= 30; i++) {
        const d = subDays(today, i);

        // Daily Food (Tavern Feast)
        batch.set(doc(txRef), {
          type: "Expense",
          amount: 30000 + Math.floor(Math.random() * 40000),
          category: "🍖 Tavern Feast",
          rune: "🟢 GoPay",
          timestamp: Timestamp.fromDate(d),
        });

        // Transport (every 3 days)
        if (i % 3 === 0) {
          batch.set(doc(txRef), {
            type: "Expense",
            amount: 15000 + Math.floor(Math.random() * 20000),
            category: "🐴 Stable & Carriage",
            rune: "🟢 GoPay",
            timestamp: Timestamp.fromDate(d),
          });
        }

        // Random Quests/Loot
        if (i % 7 === 0) {
          batch.set(doc(txRef), {
            type: "Gain",
            amount: 100000 + Math.floor(Math.random() * 400000),
            category: "🎲 Loot Drop",
            rune: i % 2 === 0 ? "💙 DANA" : "🪙 Gold",
            timestamp: Timestamp.fromDate(d),
          });
        }
      }

      // Potions (Alchemist - Well stocked)
      batch.set(doc(txRef), {
        type: "PotionBuy",
        amount: 25, // 25 potions in stash
        category: "🧪 Emergency Potion",
        rune: "🪙 Gold",
        timestamp: Timestamp.fromDate(subDays(today, 10)),
      });

      batch.set(doc(txRef), {
        type: "PotionDrink",
        amount: 3,
        category: "🧪 Emergency Potion",
        rune: "🪙 Gold",
        timestamp: Timestamp.fromDate(subDays(today, 5)),
      });

      // --- Add Scheduled Events (Calendar) ---
      const scheduledRef = collection(
        db,
        "users",
        auth.currentUser.uid,
        "scheduledEvents",
      );

      batch.set(doc(scheduledRef), {
        type: "Bounty",
        name: "🏰 Royal Salary",
        amount: profile.monthlyIncome || 8000000,
        frequency: "monthly",
        frequencyValue: 25,
        rune: "🏦 Other Bank",
        category: "🏰 Royal Salary",
        autoLog: true,
        nextDueDate: Timestamp.fromDate(new Date()),
        createdAt: serverTimestamp(),
      });

      batch.set(doc(scheduledRef), {
        type: "Bounty",
        name: "🧪 Potion Stash Subsidy",
        amount: 5,
        frequency: "weekly",
        frequencyValue: 1, // Monday
        rune: "🪙 Gold",
        category: "⚗️ Alchemy",
        autoLog: true,
        nextDueDate: Timestamp.fromDate(new Date()),
        createdAt: serverTimestamp(),
      });

      batch.set(doc(scheduledRef), {
        type: "Toll",
        name: "🏰 Internet Connection",
        amount: 350000,
        category: "🏡 Castle Upkeep",
        frequency: "monthly",
        frequencyValue: 5,
        rune: "🏦 Other Bank",
        autoLog: true,
        nextDueDate: Timestamp.fromDate(new Date()),
        createdAt: serverTimestamp(),
      });

      batch.set(doc(scheduledRef), {
        type: "Toll",
        name: "📜 Streaming Subscription",
        amount: 55000,
        category: "🎭 Tavern Entertainment",
        frequency: "monthly",
        frequencyValue: 15,
        rune: "💙 DANA",
        autoLog: true,
        nextDueDate: Timestamp.fromDate(new Date()),
        createdAt: serverTimestamp(),
      });

      batch.set(doc(scheduledRef), {
        type: "Toll",
        name: "🏋️ Guild Membership",
        amount: 250000,
        category: "⚔️ Armory",
        frequency: "monthly",
        frequencyValue: 1,
        rune: "🏦 Other Bank",
        autoLog: false,
        nextDueDate: Timestamp.fromDate(new Date()),
        createdAt: serverTimestamp(),
      });

      await batch.commit();
      setGenerateSuccess(true);
    } catch (e: any) {
      console.error(e);
      setGenerateError(e.message || String(e));
      try {
        handleFirestoreError(
          e,
          OperationType.CREATE,
          `users/${auth.currentUser.uid}/transactions`,
        );
      } catch (_) {}
    } finally {
      setGenerating(false);
    }
  };

  const resetData = async () => {
    if (!auth.currentUser) return;

    setResetting(true);
    setResetSuccess(false);
    setResetError(null);
    try {
      const uid = auth.currentUser.uid;
      
      const txRef = collection(db, "users", uid, "transactions");
      const txSnap = await getDocs(txRef);
      const scheduledRef = collection(db, "users", uid, "scheduledEvents");
      const scheduledSnap = await getDocs(scheduledRef);

      // Firestore batches can only have 500 operations. If more, we need multiple chunks.
      // But for dummy data, it shouldn't exceed 500.
      const batch = writeBatch(db);
      let count = 0;

      txSnap.forEach((docSnap) => {
        batch.delete(docSnap.ref);
        count++;
      });
      
      scheduledSnap.forEach((docSnap) => {
        batch.delete(docSnap.ref);
        count++;
      });

      if (count > 0) {
        await batch.commit();
      }

      try {
        const pDoc = doc(db, "users", uid);
        await updateDoc(pDoc, {
          customHPCap: 100000,
          updatedAt: serverTimestamp(),
        });
      } catch (errProfile) {
        console.warn("Warning: Could not update profile customHPCap:", errProfile);
      }

      setFormData(prev => ({
        ...prev,
        customHPCap: "100000"
      }));

      setResetSuccess(true);
    } catch (e: any) {
      console.error('Reset Data Error Details:', e);
      setResetError(e.message || String(e));
    } finally {
      setResetting(false);
    }
  };

  const exportData = async () => {
    if (!auth.currentUser) return;
    setExporting(true);
    setImportExportMsg(null);
    try {
      const uid = auth.currentUser.uid;
      const txRef = collection(db, "users", uid, "transactions");
      const txSnap = await getDocs(txRef);
      const scheduledRef = collection(db, "users", uid, "scheduledEvents");
      const scheduledSnap = await getDocs(scheduledRef);

      const transactions: any[] = [];
      txSnap.forEach(doc => {
        const data = doc.data();
        if (data.timestamp && typeof data.timestamp.toDate === 'function') {
          data.timestamp = data.timestamp.toDate().toISOString();
        }
        transactions.push({ id: doc.id, ...data });
      });

      const scheduledEvents: any[] = [];
      scheduledSnap.forEach(doc => {
        const data = doc.data();
        if (data.nextDueDate && typeof data.nextDueDate.toDate === 'function') {
          data.nextDueDate = data.nextDueDate.toDate().toISOString();
        }
        if (data.createdAt && typeof data.createdAt.toDate === 'function') {
          data.createdAt = data.createdAt.toDate().toISOString();
        }
        if (data.lastLoggedAt && typeof data.lastLoggedAt.toDate === 'function') {
          data.lastLoggedAt = data.lastLoggedAt.toDate().toISOString();
        }
        scheduledEvents.push({ id: doc.id, ...data });
      });

      const exportObj = {
        exportDate: new Date().toISOString(),
        transactions,
        scheduledEvents
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `rpg_tracker_export_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchorNode); // required for firefox
      downloadAnchorNode.click();
      downloadAnchorNode.remove();

      setImportExportMsg({ type: 'success', text: language === "id" ? "Data berhasil diekspor!" : "Data exported successfully!" });
    } catch (e: any) {
      console.error(e);
      setImportExportMsg({ type: 'error', text: e.message || "Failed to export data" });
    } finally {
      setExporting(false);
    }
  };

  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;

    setImporting(true);
    setImportExportMsg(null);
    console.log("Importing file:", file.name);

    try {
      const text = await file.text();
      const parsedData = JSON.parse(text);

      let txCount = 0;
      let scheduledCount = 0;

      const txRef = collection(db, "users", uid, "transactions");
      const scheduledRef = collection(db, "users", uid, "scheduledEvents");

      let batch = writeBatch(db);
      let operationCount = 0;

      const commitBatchIfNeeded = async () => {
        if (operationCount > 0) {
          await batch.commit();
          batch = writeBatch(db);
          operationCount = 0;
        }
      };

      if (Array.isArray(parsedData.transactions)) {
        for (const tx of parsedData.transactions) {
          const docRef = doc(txRef);
          const dataToSave = { ...tx };
          delete dataToSave.id; // Don't save old ID as a field
          if (dataToSave.timestamp) {
            dataToSave.timestamp = Timestamp.fromDate(new Date(dataToSave.timestamp));
          } else {
            dataToSave.timestamp = Timestamp.now();
          }
          batch.set(docRef, dataToSave);
          operationCount++;
          txCount++;

          if (operationCount >= 400) await commitBatchIfNeeded();
        }
      }

      if (Array.isArray(parsedData.scheduledEvents)) {
        for (const ev of parsedData.scheduledEvents) {
          const docRef = doc(scheduledRef);
          const dataToSave = { ...ev };
          delete dataToSave.id;
          if (dataToSave.nextDueDate) {
            dataToSave.nextDueDate = Timestamp.fromDate(new Date(dataToSave.nextDueDate));
          } else {
            dataToSave.nextDueDate = Timestamp.now();
          }
          if (dataToSave.createdAt) {
            dataToSave.createdAt = Timestamp.fromDate(new Date(dataToSave.createdAt));
          } else {
            dataToSave.createdAt = serverTimestamp();
          }
          if (dataToSave.lastLoggedAt) {
            dataToSave.lastLoggedAt = Timestamp.fromDate(new Date(dataToSave.lastLoggedAt));
          }
          
          batch.set(docRef, dataToSave);
          operationCount++;
          scheduledCount++;

          if (operationCount >= 400) await commitBatchIfNeeded();
        }
      }

      await commitBatchIfNeeded();

      setImportExportMsg({ type: 'success', text: language === "id" 
        ? `Impor berhasil: ${txCount} transaksi, ${scheduledCount} event.` 
        : `Import successful: ${txCount} transactions, ${scheduledCount} events.` });
        
    } catch (e: any) {
      console.error("Import error:", e);
      setImportExportMsg({ type: 'error', text: language === "id" ? `Gagal: ${e.message}` : `Failed: ${e.message}` });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="bg-[#f4e4bc] border-4 border-black p-6 shadow-[8px_8px_0_0_#000] text-[#3e2723] max-w-2xl mx-auto">
      <h2 className="font-display text-2xl uppercase border-b-4 border-[#3d251e] mb-6 pb-2 inline-block shadow-[4px_4px_0_rgba(61,37,30,0.2)]">
        {t.settingsTitle}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block font-sans text-sm md:text-base uppercase font-bold tracking-widest text-[#3e2723] mb-2">
            {t.avatar}
          </label>
          <div className="flex flex-wrap gap-2">
            {AVATARS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setFormData({ ...formData, avatar: emoji })}
                className={`text-3xl w-14 h-14 border-4 ${formData.avatar === emoji ? "bg-[#ffcc00] border-black shadow-[2px_2px_0_0_#000] translate-y-[2px]" : "bg-white border-[#d7ccc8] hover:bg-gray-100"} transition-all flex items-center justify-center`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <div className="w-1/3">
            <label
              htmlFor="genderSetting"
              className="block font-sans text-sm md:text-base uppercase font-bold tracking-widest text-[#3e2723] mb-2"
            >
              {language === 'id' ? 'Gelar' : 'Title'}
            </label>
            <select
              id="genderSetting"
              value={formData.gender}
              onChange={(e) =>
                setFormData({ ...formData, gender: e.target.value })
              }
              className="w-full bg-white border-4 border-[#3e2723] p-3 font-sans text-lg text-[#3e2723] focus:outline-none focus:border-[#ffcc00] shadow-[inset_4px_4px_0_rgba(0,0,0,0.1)] uppercase font-bold"
            >
              <option value="Sir">Sir</option>
              <option value="Madam">Madam</option>
              <option value="Lady">Lady</option>
              <option value="Lord">Lord</option>
              <option value="Master">Master</option>
              <option value="Knight">Knight</option>
              <option value="Mage">Mage</option>
              <option value="King">King</option>
              <option value="Queen">Queen</option>
            </select>
          </div>
          <div className="flex-1">
            <label
              htmlFor="charNameSetting"
              className="block font-sans text-sm md:text-base uppercase font-bold tracking-widest text-[#3e2723] mb-2"
            >
              {t.charName}
            </label>
            <input
              id="charNameSetting"
              type="text"
              required
              value={formData.characterName}
              onChange={(e) =>
                setFormData({ ...formData, characterName: e.target.value })
              }
              className="w-full bg-white border-4 border-[#3e2723] p-3 font-sans text-lg text-[#3e2723] focus:outline-none focus:border-[#ffcc00] shadow-[inset_4px_4px_0_rgba(0,0,0,0.1)]"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="customHPCapSetting"
            className="block font-sans text-sm md:text-base uppercase font-bold tracking-widest text-[#3e2723] mb-2 flex items-center gap-2"
          >
            {t.customHp}
            <span className="text-[10px] bg-red-200 text-red-800 px-1 italic">
              H+1
            </span>
          </label>
          <input
            id="customHPCapSetting"
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            required
            min="10"
            value={formData.customHPCap}
            onChange={(e) =>
              setFormData({ ...formData, customHPCap: e.target.value })
            }
            className="w-full bg-white border-4 border-[#3e2723] p-3 font-sans text-lg text-[#3e2723] focus:outline-none focus:border-[#ffcc00] shadow-[inset_4px_4px_0_rgba(0,0,0,0.1)]"
          />
          {formData.customHPCap && !isNaN(Number(formData.customHPCap)) && (
            <p className="mt-1 text-amber-700 font-sans text-xs font-bold tracking-widest text-right">
              Rp {Number(formData.customHPCap).toLocaleString('id-ID')}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 mt-8 bg-[#ffcc00] border-4 border-black hover:bg-yellow-500 text-[#3e2723] shadow-[4px_4px_0_0_#000] font-bold text-sm md:text-base tracking-wider uppercase active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "..." : t.saveBtn}
        </button>
        {success && (
          <div className="text-center text-green-700 font-bold uppercase text-xs animate-bounce mt-4">
            ✨ {t.saveSuccess} ✨
          </div>
        )}
      </form>

      <div className="mt-12 pt-8 border-t-2 border-dashed border-[#d7ccc8]">
        <h3 className="font-sans font-bold uppercase text-xs text-amber-900 mb-2">
          Dev Tools (Oracle Magic)
        </h3>
        <div className="flex flex-col gap-2">
          <button
            onClick={generateDummyData}
            disabled={generating || resetting}
            className="w-full py-2 bg-amber-900 hover:bg-amber-800 text-white border-4 border-black font-bold text-xs tracking-wider uppercase shadow-[2px_2px_0_0_#000] active:translate-y-1 active:shadow-none transition-all disabled:opacity-50"
          >
            {generating ? "Summoning..." : "Summon Dummy Data (Simulation)"}
          </button>
          
          <button
            onClick={resetData}
            disabled={generating || resetting}
            className="w-full py-2 bg-red-800 hover:bg-red-700 text-white border-4 border-black font-bold text-xs tracking-wider uppercase shadow-[2px_2px_0_0_#000] active:translate-y-1 active:shadow-none transition-all disabled:opacity-50"
          >
            {resetting ? "Resetting..." : language === "id" ? "Reset Dummy Data" : "Reset Dummy Data"}
          </button>
        </div>
        {generateSuccess && (
          <div className="text-center text-amber-700 font-bold uppercase text-xs animate-pulse mt-4">
            ✨{" "}
            {language === "id"
              ? "Data berhasil disuntikkan! Cek Oracle Scroll."
              : "Dummy data injected! Check Oracle Scroll."}{" "}
            ✨
          </div>
        )}
        {generateError && (
          <div className="text-center text-red-700 font-bold uppercase text-[10px] mt-4 border border-red-700 p-2 bg-red-100">
            Error (Summon): {generateError}
          </div>
        )}
        
        {resetSuccess && (
          <div className="text-center text-red-700 font-bold uppercase text-xs animate-pulse mt-4">
            ✨ {language === "id" ? "Data berhasil direset!" : "Data successfully reset!"} ✨
          </div>
        )}
        {resetError && (
          <div className="text-center text-red-700 font-bold uppercase text-[10px] mt-4 border border-red-700 p-2 bg-red-100">
            Error (Reset): {resetError}
          </div>
        )}

        <div className="mt-6 pt-6 border-t-2 border-dashed border-[#d7ccc8]">
          <h3 className="font-sans font-bold uppercase text-xs text-amber-900 mb-2">
            Data Portability (Export / Import)
          </h3>
          <div className="flex flex-col gap-2">
            <button
              onClick={exportData}
              disabled={exporting || importing}
              className="w-full py-2 bg-[#ffcc00] hover:bg-yellow-500 text-[#3e2723] border-4 border-black font-bold text-xs tracking-wider uppercase shadow-[2px_2px_0_0_#000] active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {exporting ? "..." : "⬇️ " + (language === "id" ? "Ekspor JSON" : "Export JSON")}
            </button>
            <input
              type="file"
              accept=".json"
              ref={fileInputRef}
              onChange={handleImportFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={exporting || importing}
              className="w-full py-2 bg-white hover:bg-gray-100 text-[#3e2723] border-4 border-black font-bold text-xs tracking-wider uppercase shadow-[2px_2px_0_0_#000] active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {importing ? "..." : "⬆️ " + (language === "id" ? "Impor JSON" : "Import JSON")}
            </button>
          </div>
          {importExportMsg && (
            <div className={`text-center font-bold uppercase text-xs mt-4 ${importExportMsg.type === 'success' ? 'text-green-700 animate-pulse' : 'text-red-700 border border-red-700 p-2 bg-red-100'}`}>
              {importExportMsg.type === 'success' ? '✨ ' + importExportMsg.text + ' ✨' : importExportMsg.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
