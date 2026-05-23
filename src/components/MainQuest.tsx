import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, OperationType } from '../types';
import { updateDoc, doc, serverTimestamp, addDoc, collection } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useAppStore } from '../store';
import { handleFirestoreError } from '../lib/errorHandler';
import { playSFX } from '../audio';

export default function MainQuest({ profile }: { profile: UserProfile }) {
  const language = useAppStore(state => state.language);
  const [depositAmounts, setDepositAmounts] = useState<Record<string, string>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  const vaultQuests = profile.vaultQuests || [];

  const handleAddQuest = async () => {
    if (!auth.currentUser || !newName || !newTarget || isNaN(Number(newTarget))) return;
    const target = Number(newTarget);
    if (target <= 0) return;

    setAddLoading(true);
    const uid = auth.currentUser.uid;
    
    try {
      playSFX('levelUp');
      const newQuest = {
        id: crypto.randomUUID(),
        name: newName,
        target: target,
        progress: 0
      };

      const updatedQuests = [...vaultQuests, newQuest];
      await updateDoc(doc(db, 'users', uid), {
        vaultQuests: updatedQuests,
        updatedAt: serverTimestamp()
      });

      setIsAdding(false);
      setNewName('');
      setNewTarget('');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    } finally {
      setAddLoading(false);
    }
  };

  const handleDeposit = async (questId: string, name: string) => {
    const amountStr = depositAmounts[questId];
    if (!auth.currentUser || !amountStr || isNaN(Number(amountStr))) return;
    const amount = Number(amountStr);
    if (amount <= 0) return;

    setLoadingId(questId);
    const uid = auth.currentUser.uid;
    try {
      playSFX('coin');
      let completedQuest: any = null;
      let updatedQuests = vaultQuests.map(q => {
        if (q.id === questId) {
          const newProgress = (q.progress || 0) + amount;
          const updated = { ...q, progress: newProgress };
          if (newProgress >= q.target) {
            completedQuest = updated;
          }
          return updated;
        }
        return q;
      });

      let completedQuestsToSave = profile.completedVaultQuests || [];
      if (completedQuest) {
        updatedQuests = updatedQuests.filter(q => q.id !== questId);
        completedQuestsToSave = [...completedQuestsToSave, completedQuest];
      }

      // 1. Update quests
      await updateDoc(doc(db, 'users', uid), {
        vaultQuests: updatedQuests,
        ...(completedQuest ? { completedVaultQuests: completedQuestsToSave } : {}),
        updatedAt: serverTimestamp()
      });

      // 2. Catat sebagai expense
      await addDoc(collection(db, 'users', uid, 'transactions'), {
        type: 'Expense',
        amount: amount,
        category: 'Vault Deposit',
        rune: 'savings',
        description: `Deposit untuk: ${name}`,
        timestamp: serverTimestamp()
      });
      
      setDepositAmounts({ ...depositAmounts, [questId]: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="bg-[#3e2723] border-4 border-black shadow-[4px_4px_0_0_#000] text-white">
      <div className="flex items-center gap-3 p-4 border-b-2 border-[#5d4037]">
        <div className="text-3xl drop-shadow-[2px_2px_0px_#000]">🏰</div>
        <div className="flex justify-between items-center w-full">
          <div>
            <h3 className="font-display text-lg uppercase text-[#ffcc00] tracking-tighter" style={{ textShadow: "1px 1px 0px #000" }}>The Vault</h3>
            <p className="font-sans text-xs md:text-sm text-[#f4e4bc]">{vaultQuests.length}/5 {language === 'id' ? 'Misi Aktif' : 'Active Quests'}</p>
          </div>
          {vaultQuests.length < 5 && (
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="bg-[#2e7d32] hover:bg-[#1b5e20] text-white border-2 border-black font-sans font-bold uppercase text-xs px-2 py-1 shadow-[2px_2px_0_0_#000] active:translate-y-1 active:shadow-none transition-all"
            >
              {isAdding ? 'X' : (language === 'id' ? '+ Tambah' : '+ Add')}
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-[#2d1b15] border-b-2 border-[#5d4037]"
          >
            <div className="p-4 space-y-3">
              <div>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={language === 'id' ? 'Nama Misi (cth: Beli PC)' : 'Quest Name (e.g. Buy PC)'}
                  className="w-full bg-[#1a1a17] border-2 border-black p-2 font-sans text-sm text-white focus:outline-none focus:border-[#ffcc00]"
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value)}
                  placeholder={language === 'id' ? 'Target (Gold)' : 'Target Coins (Gold)'}
                  className="flex-1 bg-[#1a1a17] border-2 border-black p-2 font-sans text-sm text-white focus:outline-none focus:border-[#ffcc00]"
                />
                <button
                  onClick={handleAddQuest}
                  disabled={addLoading || !newName || !newTarget}
                  className="bg-[#2e7d32] text-white border-2 border-black font-sans font-bold uppercase text-xs px-4 py-2 shadow-[2px_2px_0_0_#000] active:translate-y-1 active:shadow-none disabled:opacity-50 transition-all font-display"
                >
                  {addLoading ? '...' : (language === 'id' ? 'Buat' : 'Create')}
                </button>
              </div>
              {newTarget && !isNaN(Number(newTarget)) && (
                <p className="mt-1 text-[#ffcc00] font-sans text-xs font-bold tracking-widest text-left">
                  Rp {Number(newTarget).toLocaleString('id-ID')}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="divide-y-2 divide-[#5d4037]">
        {vaultQuests.length === 0 && !isAdding && (
          <div className="p-6 text-center">
            <p className="font-sans text-xs opacity-70 italic text-[#f4e4bc]">
              {language === 'id' 
                ? 'Belum ada misi. Tambahkan misi baru untuk mulai menabung!'
                : 'No quests yet. Add a new quest to start saving!'}
            </p>
          </div>
        )}
        {vaultQuests.map(quest => {
          const percentage = quest.target > 0 ? Math.min(100, Math.floor(((quest.progress || 0) / quest.target) * 100)) : 0;
          const isExpanded = expandedId === quest.id;
          
          return (
            <div key={quest.id} className="p-4 relative">
              <button 
                onClick={() => setExpandedId(isExpanded ? null : quest.id)}
                className="w-full text-left flex justify-between items-center mb-2 focus:outline-none"
              >
                 <span className="font-sans font-bold text-sm text-[#f4e4bc] truncate uppercase pr-2">{quest.name}</span>
                 <span className="text-[#ffcc00] font-sans font-bold text-xs flex-shrink-0">{percentage}%</span>
              </button>
              
              <div className="w-full bg-black border-2 border-black h-3 relative cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : quest.id)}>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  className="h-full bg-[#ffcc00] shadow-[inset_0_-2px_0_rgba(0,0,0,0.3)]"
                />
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-3"
                  >
                    <div className="flex justify-between font-sans text-xs mb-3 text-gray-300">
                      <span>Rp {(quest.progress || 0).toLocaleString('id-ID')}</span>
                      <span>Target: Rp {quest.target.toLocaleString('id-ID')}</span>
                    </div>
                    
                    <div className="flex gap-2">
                      <input 
                        type="number" 
                        value={depositAmounts[quest.id] || ''}
                        onChange={e => setDepositAmounts({ ...depositAmounts, [quest.id]: e.target.value })}
                        placeholder={language === 'id' ? 'Jumlah (Gold)...' : 'Amount (Gold)...'}
                        className="flex-1 bg-[#1a1a17] border-2 border-black px-2 py-1 font-sans text-xs focus:outline-none focus:border-[#ffcc00] text-white"
                      />
                      <button 
                        onClick={() => handleDeposit(quest.id, quest.name)}
                        disabled={loadingId === quest.id || !depositAmounts[quest.id]}
                        className="bg-[#2e7d32] hover:bg-[#1b5e20] text-white border-2 border-black font-sans font-bold uppercase text-[10px] md:text-xs px-3 py-1 shadow-[2px_2px_0_0_#000] active:translate-y-1 active:shadow-none disabled:opacity-50 transition-all focus:outline-none"
                      >
                        {loadingId === quest.id ? '...' : (language === 'id' ? 'Simpan' : 'Stash')}
                      </button>
                    </div>
                    {depositAmounts[quest.id] && !isNaN(Number(depositAmounts[quest.id])) && (
                      <p className="mt-1 text-[#ffcc00] font-sans text-xs font-bold tracking-widest text-left">
                        Rp {Number(depositAmounts[quest.id]).toLocaleString('id-ID')}
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
