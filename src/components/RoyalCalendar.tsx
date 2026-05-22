import React, { useState } from 'react';
import { ScheduledEvent, EXPENSE_CATEGORIES, RUNES } from '../types';
import { translations } from '../lib/i18n';
import { useAppStore } from '../store';
import { collection, addDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isSameMonth, startOfWeek, endOfWeek, addDays, getDay, setDate } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Trash2, Calendar, List } from 'lucide-react';

interface RoyalCalendarProps {
  scheduledEvents: ScheduledEvent[];
}

export default function RoyalCalendar({ scheduledEvents }: RoyalCalendarProps) {
  const language = useAppStore(state => state.language);
  const [view, setView] = useState<'month' | 'list'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);

  const [formType, setFormType] = useState<'Toll' | 'Bounty'>('Toll');
  const [formName, setFormName] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formRune, setFormRune] = useState('');
  const [formFreq, setFormFreq] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [formFreqVal, setFormFreqVal] = useState<number>(1); // e.g. day of month or day of week
  const [formAutoLog, setFormAutoLog] = useState(true);

  // Month View Variables
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const getEventsForDay = (date: Date) => {
    return scheduledEvents.filter(ev => {
      const nextDue = ev.nextDueDate.toDate();
      const currentMonth = isSameMonth(date, currentDate);
      if (!currentMonth) return false;
      return isSameDay(nextDue, date);
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    
    // Calculate Next Due date based on freq and val
    let nextDue = new Date();
    const today = new Date();
    
    if (formFreq === 'monthly') {
      nextDue = setDate(today, formFreqVal);
      if (nextDue < today) nextDue = addMonths(nextDue, 1);
    } else if (formFreq === 'weekly') {
      const currentDay = getDay(today);
      const targetDay = formFreqVal;
      let diff = targetDay - currentDay;
      if (diff < 0) diff += 7;
      nextDue = addDays(today, diff);
    } // daily is just tomorrow if checked? Let's just set it to today/tomorrow.

    const newEvent: Omit<ScheduledEvent, 'id'> = {
      type: formType,
      name: formName,
      amount: Number(formAmount),
      category: formType === 'Toll' ? formCategory : '',
      rune: formRune,
      frequency: formFreq,
      frequencyValue: formFreqVal,
      autoLog: formAutoLog,
      nextDueDate: Timestamp.fromDate(nextDue),
    };

    try {
      await addDoc(collection(db, 'users', auth.currentUser.uid, 'scheduledEvents'), newEvent);
      setShowForm(false);
      resetForm();
    } catch (err) {
      console.error("Error adding scheduled event:", err);
    }
  };

  const deleteEvt = async (id: string) => {
    if (!auth.currentUser) return;
    try {
      await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'scheduledEvents', id));
    } catch (err) {
      console.error(err);
    }
  }

  const resetForm = () => {
    setFormName('');
    setFormAmount('');
    setFormCategory('');
    setFormRune('');
    setFormFreq('monthly');
    setFormFreqVal(1);
    setFormAutoLog(true);
  }

  const renderForm = () => (
    <div className="bg-[#1a1a17] text-white p-4 border-4 border-black mb-6 shadow-[4px_4px_0_0_#000] animate-in fade-in slide-in-from-top-2">
      <h3 className="font-display text-xl uppercase mb-4 text-[#ffcc00] border-b-2 border-[#5d4037] pb-2">Create Scheduled Mission</h3>
      <form onSubmit={handleCreate} className="space-y-4 font-sans">
        <div className="flex gap-2">
           <button type="button" onClick={() => setFormType('Toll')} className={`flex-1 py-2 font-bold uppercase border-2 ${formType === 'Toll' ? 'bg-red-600 border-red-800' : 'bg-transparent border-gray-600 text-gray-400'}`}>Toll</button>
           <button type="button" onClick={() => setFormType('Bounty')} className={`flex-1 py-2 font-bold uppercase border-2 ${formType === 'Bounty' ? 'bg-green-600 border-green-800' : 'bg-transparent border-gray-600 text-gray-400'}`}>Bounty</button>
        </div>
        <div>
           <label htmlFor="formName" className="block text-xs uppercase mb-1 text-gray-400">Name</label>
           <input id="formName" required type="text" value={formName} onChange={e => setFormName(e.target.value)} className="w-full bg-[#3e2723] border-2 border-black p-2 text-white outline-none focus:border-[#ffcc00]" placeholder="e.g. Castle Upkeep" />
        </div>
        <div>
           <label htmlFor="formAmount" className="block text-xs uppercase mb-1 text-gray-400">Amount</label>
           <input id="formAmount" required type="number" inputMode="numeric" pattern="[0-9]*" value={formAmount} onChange={e => setFormAmount(e.target.value)} className="w-full bg-[#3e2723] border-2 border-black p-2 text-white outline-none focus:border-[#ffcc00]" />
           {formAmount && !isNaN(Number(formAmount)) && (
             <p className="mt-1 text-[#ffcc00] font-sans text-xs font-bold tracking-widest text-right">
               Rp {Number(formAmount).toLocaleString('id-ID')}
             </p>
           )}
        </div>
        {formType === 'Toll' && (
          <div>
             <label htmlFor="formCategory" className="block text-xs uppercase mb-1 text-gray-400">Category</label>
             <select id="formCategory" required value={formCategory} onChange={e => setFormCategory(e.target.value)} className="w-full bg-[#3e2723] border-2 border-black p-2 text-white outline-none focus:border-[#ffcc00]">
                <option value="" disabled>Select category...</option>
                {EXPENSE_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
             </select>
          </div>
        )}
        <div>
           <label htmlFor="formRune" className="block text-xs uppercase mb-1 text-gray-400">{formType === 'Toll' ? 'Source Rune' : 'Target Rune'}</label>
           <select id="formRune" required value={formRune} onChange={e => setFormRune(e.target.value)} className="w-full bg-[#3e2723] border-2 border-black p-2 text-white outline-none focus:border-[#ffcc00]">
              <option value="" disabled>Select rune...</option>
              {formType === 'Bounty' && <option value="potion">🧪 Potion Stash</option>}
              {RUNES.map(r => <option key={r.id} value={r.id}>{r.icon} {r.name}</option>)}
           </select>
        </div>
        <div className="flex gap-4">
           <div className="flex-1">
             <label htmlFor="formFreq" className="block text-xs uppercase mb-1 text-gray-400">Frequency</label>
             <select id="formFreq" value={formFreq} onChange={e => setFormFreq(e.target.value as any)} className="w-full bg-[#3e2723] border-2 border-black p-2 text-white outline-none focus:border-[#ffcc00]">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
             </select>
           </div>
           {formFreq !== 'daily' && (
             <div className="flex-1">
               <label htmlFor="formFreqVal" className="block text-xs uppercase mb-1 text-gray-400">{formFreq === 'weekly' ? 'Day of Week (1-7)' : 'Date of Month (1-31)'}</label>
               <input id="formFreqVal" required type="number" inputMode="numeric" pattern="[0-9]*" min="1" max={formFreq === 'weekly' ? 7 : 31} value={formFreqVal} onChange={e => setFormFreqVal(Number(e.target.value))} className="w-full bg-[#3e2723] border-2 border-black p-2 text-white outline-none focus:border-[#ffcc00]" />
             </div>
           )}
        </div>
        <div className="flex items-center gap-2 mt-2">
           <input type="checkbox" id="autolog" checked={formAutoLog} onChange={e => setFormAutoLog(e.target.checked)} className="w-4 h-4 cursor-pointer accentuate-[#ffcc00]" />
           <label htmlFor="autolog" className="text-sm uppercase cursor-pointer">Auto-Log (Consume HP automatically)</label>
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t-2 border-[#5d4037]">
           <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border-2 border-gray-500 text-gray-400 uppercase font-bold hover:bg-white/10">Cancel</button>
           <button type="submit" className="px-6 py-2 border-2 border-black bg-[#ffcc00] text-black uppercase font-bold shadow-[2px_2px_0_0_#000] hover:translate-y-px hover:shadow-[1px_1px_0_0_#000]">Create</button>
        </div>
      </form>
    </div>
  );

  return (
    <div className="bg-[#f4e4bc] border-4 border-black p-4 md:p-6 shadow-[8px_8px_0_0_#000] text-[#3e2723]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-display text-2xl uppercase border-b-2 border-black inline-block">{language === 'id' ? 'Kalender Kerajaan' : 'Royal Calendar'}</h2>
        <div className="flex gap-2">
          <button onClick={() => setView('month')} className={`p-2 border-2 ${view === 'month' ? 'bg-[#ffcc00] border-black text-black' : 'border-[#5d4037] text-gray-500'}`}><Calendar size={18}/></button>
          <button onClick={() => setView('list')} className={`p-2 border-2 ${view === 'list' ? 'bg-[#ffcc00] border-black text-black' : 'border-[#5d4037] text-gray-500'}`}><List size={18}/></button>
        </div>
      </div>
      
      {view === 'list' && (
        showForm ? renderForm() : (
          <button onClick={() => {
            resetForm();
            setShowForm(true);
          }} className="mb-6 w-full py-3 border-4 border-dashed border-black font-bold uppercase hover:bg-black/10 flex justify-center items-center gap-2">
            <Plus /> {language === 'id' ? 'Tambah Misi Terjadwal' : 'Add Scheduled Quest'}
          </button>
        )
      )}

      {view === 'month' && (
        <div className="bg-white border-4 border-black p-4">
          <div className="flex justify-between items-center mb-4">
            <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-1 border-2 border-black hover:bg-gray-200"><ChevronLeft/></button>
            <span className="font-bold font-sans uppercase text-lg">{format(currentDate, 'MMMM yyyy')}</span>
            <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-1 border-2 border-black hover:bg-gray-200"><ChevronRight/></button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
              <div key={d} className="text-center font-bold text-xs uppercase bg-[#5d4037] text-[#f4e4bc] py-1 border border-black">{d}</div>
            ))}
            {calendarDays.map((day) => {
              const strDate = format(day, 'yyyy-MM-dd');
              const isCurrentMonth = isSameMonth(day, currentDate);
              const dayEvts = getEventsForDay(day);
              
              return (
                <button 
                  key={strDate} 
                  onClick={() => {
                    setSelectedDay(day);
                    setShowForm(false);
                  }}
                  className={`min-h-[80px] p-1 border-2 border-dashed flex flex-col text-left transition-colors ${
                    isCurrentMonth ? (selectedDay && isSameDay(day, selectedDay) ? 'border-amber-500 bg-amber-50' : 'border-gray-400 bg-gray-50 hover:bg-gray-100') : 'border-gray-200 bg-gray-100 opacity-50'
                  }`}
                >
                  <span className={`text-xs font-bold self-end ${isCurrentMonth && isSameDay(day, new Date()) ? 'bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center' : 'text-gray-500'}`}>{format(day, 'd')}</span>
                  <div className="flex-1 flex flex-col gap-1 mt-1 overflow-hidden">
                    {dayEvts.slice(0, 3).map(ev => (
                      <div key={ev.id} className={`text-[9px] uppercase font-bold p-1 overflow-hidden whitespace-nowrap text-ellipsis text-white rounded-sm ${ev.type === 'Toll' ? 'bg-red-700' : 'bg-green-700'}`}>
                        {ev.type === 'Toll' ? '🔴' : '🟢'} {ev.name}
                      </div>
                    ))}
                    {dayEvts.length > 3 && (
                      <div className="text-[9px] text-gray-500 font-bold uppercase text-center mt-1">
                        +{dayEvts.length - 3} more
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          {selectedDay && (
            <div className="mt-6 border-t-4 border-dashed border-[#5d4037] pt-4 animate-in slide-in-from-bottom-2">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="font-display text-xl uppercase">Events for {format(selectedDay, 'dd MMM yyyy')}</h3>
                  <button onClick={() => {
                    setSelectedDay(null);
                    setShowForm(false);
                  }} className="text-gray-500 hover:text-black uppercase text-xs font-bold border-2 border-transparent hover:border-black p-1">Close X</button>
               </div>
               
               {showForm ? renderForm() : (
                 <button onClick={() => {
                   resetForm();
                   setFormFreq('monthly');
                   setFormFreqVal(Number(format(selectedDay, 'd')));
                   setShowForm(true);
                 }} className="mb-4 w-full py-2 border-2 border-dashed border-black font-bold uppercase hover:bg-black/10 flex justify-center items-center gap-2">
                   <Plus size={16} /> {language === 'id' ? 'Jadwalkan di Tanggal Ini' : 'Schedule on this Date'}
                 </button>
               )}

               <div className="flex flex-col gap-2">
                 {getEventsForDay(selectedDay).length === 0 ? (
                   <p className="text-sm font-bold text-gray-400 font-sans uppercase">No events scheduled on this day.</p>
                 ) : (
                   getEventsForDay(selectedDay).map(ev => (
                     <div key={ev.id} className={`p-3 border-l-4 border-2 border-black ${ev.type === 'Toll' ? 'border-l-red-600' : 'border-l-green-600'} bg-[#f4e4bc] shadow-[2px_2px_0_0_#000] flex justify-between items-center`}>
                       <div>
                         <h4 className="font-bold font-sans uppercase text-sm">{ev.name}</h4>
                         <p className="text-xs">Rp {ev.amount.toLocaleString('id-ID')} • {ev.type} • {ev.frequency}</p>
                       </div>
                       <div className="text-right flex flex-col items-end">
                         <span className={`text-[10px] uppercase font-bold px-1 border-2 border-black ${ev.nextDueDate.toDate() < new Date() ? 'bg-red-200 text-red-900' : 'bg-blue-200 text-blue-900'}`}>
                           {ev.nextDueDate.toDate() < new Date() ? 'Missed' : 'Upcoming'}
                         </span>
                       </div>
                     </div>
                   ))
                 )}
               </div>
            </div>
          )}
        </div>
      )}

      {view === 'list' && (
        <div className="flex flex-col gap-4">
          {scheduledEvents.length === 0 ? (
            <div className="text-center p-8 border-2 border-dashed border-[#5d4037] font-sans font-bold opacity-50">
              No scheduled events found.
            </div>
          ) : (
            scheduledEvents.map(ev => (
              <div key={ev.id} className={`p-4 border-l-8 border-4 border-black ${ev.type === 'Toll' ? 'border-l-red-600' : 'border-l-green-600'} bg-white shadow-[4px_4px_0_0_#000] flex justify-between items-center`}>
                <div>
                  <h3 className="font-bold font-sans text-lg uppercase">{ev.name}</h3>
                  <p className="text-sm">
                    {ev.type === 'Toll' ? 'Toll' : 'Bounty'} • {ev.frequency} • {ev.amount.toLocaleString('id-ID')}
                  </p>
                  <p className="text-xs mt-1 text-gray-500">Next due: {format(ev.nextDueDate.toDate(), 'dd MMM yyyy')}</p>
                </div>
                <button onClick={() => deleteEvt(ev.id!)} className="p-2 border-2 border-black bg-red-600 text-white hover:bg-red-700">
                  <Trash2 size={18} />
                </button>
              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
}
