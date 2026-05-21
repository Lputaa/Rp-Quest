import React, { useState } from 'react';
import { Transaction } from '../types';
import { useAppStore } from '../store';
import { translations } from '../lib/i18n';

export default function SageChat({ transactions }: { transactions: Transaction[] }) {
  const language = useAppStore(state => state.language);
  const t = translations[language];

  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const askSage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt) return;

    setLoading(true);
    try {
      // Limit to previous 30 days of transactions for context
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      const recentTxs = transactions.filter(tx => tx.timestamp && tx.timestamp.toMillis() > thirtyDaysAgo);
      
      const res = await fetch('/api/sage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, transactions: recentTxs, language })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResponse(data.text);
    } catch (err: any) {
      setResponse(language === 'id' ? 'Sage menghela napas: "Aku tidak dapat berkomunikasi dengan semesta saat ini. Coba lagi nanti."' : 'The Sage sighs: "I cannot commune with the stars right now. Try again later."');
    } finally {
      setLoading(false);
      setPrompt('');
    }
  };

  return (
    <div className="bg-[#2c3e50] border-4 border-black p-4 flex-1 shadow-[4px_4px_0_0_#000] relative">
      <div className="flex items-center gap-2 mb-4 border-b-2 border-black pb-2">
        <div className="w-10 h-10 bg-[#7f8c8d] border-2 border-black flex items-center justify-center text-2xl">🧙</div>
        <div className="flex flex-col">
          <span className="font-sans text-xs md:text-sm font-bold uppercase text-[#f4e4bc]">{t.sageName}</span>
          <span className="font-sans text-[10px] text-[#aed581] uppercase tracking-widest">{t.sageDesc}</span>
        </div>
      </div>
      
      {response && (
        <div className="bg-black/30 p-3 rounded font-sans text-xs md:text-sm leading-relaxed mb-4 border-l-4 border-[#ffcc00] text-white whitespace-pre-wrap">
          "{response}"
        </div>
      )}

      <form onSubmit={askSage} className="mt-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={t.askSage}
            className="flex-1 bg-black/50 border-2 border-[#5a5a5a] p-2 font-sans text-xs md:text-sm text-[#aed581] focus:outline-none focus:border-[#ffcc00]"
          />
          <button 
            type="submit"
            disabled={loading || !prompt}
            className="px-4 py-2 bg-[#ffcc00] border-2 border-black hover:bg-yellow-500 text-[#3e2723] font-bold uppercase text-xs active:translate-y-1 shadow-[2px_2px_0_0_#000] active:shadow-none transition-all disabled:opacity-50"
          >
            {loading ? '...' : t.ask}
          </button>
        </div>
        <div className="flex gap-2 mt-2">
          <button type="button" onClick={() => setPrompt(t.expenseAdvice)} className="bg-[#34495e] px-2 py-1 text-[10px] text-white uppercase border border-black hover:bg-[#2c3e50]">{t.expenseAdvice}</button>
          <button type="button" onClick={() => setPrompt(t.savingsPlan)} className="bg-[#34495e] px-2 py-1 text-[10px] text-white uppercase border border-black hover:bg-[#2c3e50]">{t.savingsPlan}</button>
        </div>
      </form>
    </div>
  );
}
