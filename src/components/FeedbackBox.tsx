import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAppStore } from '../store';
import { playSFX } from '../audio';

export default function FeedbackBox({ onClose }: { onClose: () => void }) {
  const language = useAppStore((state) => state.language);
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !message.trim()) return;

    setLoading(true);
    try {
      playSFX('questComplete');
      await addDoc(collection(db, 'feedbacks'), {
        uid: auth.currentUser.uid,
        message: message.trim(),
        rating,
        timestamp: serverTimestamp()
      });
      setSuccess(true);
      setMessage('');
      setRating(0);
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      playSFX('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative bg-[#3e2723] border-4 border-black p-4 md:p-8 shadow-[12px_12px_0_0_#000] text-[#f4e4bc] w-full max-w-lg" 
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={() => { playSFX('click'); onClose(); }} className="absolute top-4 right-4 text-[#ffcc00] hover:text-white hover:scale-110 transition-transform">
          <X size={28} />
        </button>
        
        <h2 className="font-display text-2xl md:text-3xl mb-2 text-[#ffcc00] uppercase text-center border-b-2 border-black/30 pb-4 mx-auto w-full" style={{ textShadow: "2px 2px 0px #000" }}>
          {language === 'id' ? '🦉 Owl Mail (Saran)' : '🦉 Owl Mail (Feedback)'}
        </h2>
        
        {!success ? (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <p className="text-sm font-sans italic text-center mb-4">
              {language === 'id' 
                ? 'Kirimkan pesan, saran, atau laporan bug (hama) ke markas Guild!' 
                : 'Send your messages, suggestions, or bug (pest) reports to the Guild headquarters!'}
            </p>

            <div>
              <label className="block text-xs font-bold uppercase mb-2 tracking-widest text-[#ffcc00]">{language === 'id' ? 'Rating Guild' : 'Guild Rating'}</label>
              <div className="flex gap-2 justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => { playSFX('coin'); setRating(star); }}
                    className={`text-3xl transition-transform hover:scale-110 ${rating >= star ? 'text-[#ffcc00] drop-shadow-[2px_2px_0_rgba(0,0,0,1)]' : 'text-black/50 drop-shadow-none'}`}
                  >
                    ⭐
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase mb-2 tracking-widest text-[#ffcc00]">{language === 'id' ? 'Pesan' : 'Message'}</label>
              <textarea
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="w-full bg-[#1a1a17] border-4 border-black p-3 font-sans text-sm text-white focus:outline-none focus:border-[#ffcc00] shadow-[inset_4px_4px_0_rgba(0,0,0,0.5)] resize-none"
                placeholder={language === 'id' ? 'Tuliskan gulungan pesanmu di sini...' : 'Write your message scroll here...'}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !message.trim()}
              className="w-full mt-4 py-3 bg-[#ffcc00] border-4 border-black text-[#3e2723] font-bold uppercase shadow-[4px_4px_0_0_#000] active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (language === 'id' ? 'Menerbangkan...' : 'Flying...') : (
                <>
                  <Send size={18} /> {language === 'id' ? 'Terbangkan Surat' : 'Send Scroll'}
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="text-center py-8 animate-in zoom-in">
            <div className="text-6xl mb-4 animate-bounce">🦉✨</div>
            <h3 className="font-bold text-xl text-[#ffcc00] mb-2">{language === 'id' ? 'Surat Terkirim!' : 'Scroll Sent!'}</h3>
            <p className="text-sm font-sans italic">
              {language === 'id' ? 'Burung hantu sedang membawa pesanmu!' : 'The owl is carrying your message!'}
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
