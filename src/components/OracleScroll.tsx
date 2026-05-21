import { useState, useMemo } from 'react';
import { Transaction, UserProfile, EXPENSE_CATEGORIES, GAIN_CATEGORIES } from '../types';
import { useAppStore } from '../store';
import { translations } from '../lib/i18n';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, subDays, isSameDay, startOfMonth, isSameMonth, eachDayOfInterval, addMonths, endOfMonth } from 'date-fns';

export default function OracleScroll({ transactions, maxHP }: { transactions: Transaction[], maxHP: number }) {
  const language = useAppStore(state => state.language);
  const t = translations[language];

  const [period, setPeriod] = useState<'week' | 'month' | '3months'>('week');
  const [mode, setMode] = useState<'overview' | 'drilldown'>('overview');
  const [activeDrillTab, setActiveDrillTab] = useState<'toll' | 'bounty'>('toll');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [monthOffset, setMonthOffset] = useState(0);
  
  const today = new Date();

  // Color mappings
  const COLORS = ['#ef5350', '#66bb6a', '#42a5f5', '#ffca28', '#ab47bc', '#ec407a', '#78909c', '#8d6e63'];

  const toggleCategory = (catId: string) => {
    if (selectedCategories.includes(catId)) {
      setSelectedCategories(prev => prev.filter(id => id !== catId));
    } else {
      if (selectedCategories.length < 4) {
        setSelectedCategories(prev => [...prev, catId]);
      }
    }
  };

  const chartData = useMemo(() => {
    let dataPoints: Date[] = [];
    if (period === 'week') {
      dataPoints = eachDayOfInterval({ start: subDays(today, 6), end: today });
    } else if (period === 'month') {
      const targetDate = addMonths(today, monthOffset);
      const monthStart = startOfMonth(targetDate);
      const monthEnd = monthOffset === 0 ? today : endOfMonth(targetDate);
      dataPoints = eachDayOfInterval({ start: monthStart, end: monthEnd });
    } else {
      dataPoints = eachDayOfInterval({ start: subDays(today, 90), end: today });
    }

    return dataPoints.map(date => {
      const dayTxs = transactions.filter(tx => tx.timestamp && isSameDay(tx.timestamp.toDate(), date));
      const tolls = dayTxs.filter(tx => tx.type === 'Expense');
      const bounties = dayTxs.filter(tx => tx.type === 'Gain');
      
      const point: any = {
        name: format(date, period === 'week' ? 'EEE' : 'dd MMM'),
        date: date,
        hpCap: maxHP, // using current maxHP
      };

      if (mode === 'overview') {
        point.Toll = tolls.reduce((acc, tx) => acc + tx.amount, 0);
        point.Bounty = bounties.reduce((acc, tx) => acc + tx.amount, 0);
      } else {
        selectedCategories.forEach(catId => {
          if (activeDrillTab === 'toll') {
            point[catId] = tolls.filter(tx => tx.category === catId).reduce((acc, tx) => acc + tx.amount, 0);
          } else {
            point[catId] = bounties.filter(tx => tx.category === catId).reduce((acc, tx) => acc + tx.amount, 0);
          }
        });
      }
      return point;
    });
  }, [transactions, period, mode, selectedCategories, maxHP, today, activeDrillTab, monthOffset]);

  const pieDataToll = useMemo(() => {
    const relevantTxs = transactions.filter(tx => {
      if (!tx.timestamp || tx.type !== 'Expense') return false;
      const txDate = tx.timestamp.toDate();
      if (period === 'week') return txDate >= subDays(today, 6);
      if (period === 'month') {
        const targetDate = addMonths(today, monthOffset);
        if (monthOffset === 0) return isSameMonth(txDate, today) && txDate <= today;
        return isSameMonth(txDate, targetDate);
      }
      return txDate >= subDays(today, 90);
    });
    
    const acc: Record<string, number> = {};
    relevantTxs.forEach(tx => {
      acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
    });
    
    return Object.entries(acc).map(([name, value], idx) => ({ name, value, fill: name === 'Ghost Toll' || name === 'Shadow Toll' ? '#ef5350' : COLORS[idx % COLORS.length] })).sort((a,b) => b.value - a.value);
  }, [transactions, period, today, monthOffset]);

  const pieDataBounty = useMemo(() => {
    const relevantTxs = transactions.filter(tx => {
      if (!tx.timestamp || tx.type !== 'Gain') return false;
      const txDate = tx.timestamp.toDate();
      if (period === 'week') return txDate >= subDays(today, 6);
      if (period === 'month') {
        const targetDate = addMonths(today, monthOffset);
        if (monthOffset === 0) return isSameMonth(txDate, today) && txDate <= today;
        return isSameMonth(txDate, targetDate);
      }
      return txDate >= subDays(today, 90);
    });
    
    const acc: Record<string, number> = {};
    relevantTxs.forEach(tx => {
      acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
    });
    
    return Object.entries(acc).map(([name, value], idx) => ({ name, value, fill: name === 'Royal Salary' || name === 'Yield' ? '#ffca28' : COLORS[idx % COLORS.length] })).sort((a,b) => b.value - a.value);
  }, [transactions, period, today, monthOffset]);

  const tollTotal = pieDataToll.reduce((acc, curr) => acc + curr.value, 0);
  const bountyTotal = pieDataBounty.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="bg-[#3e2723] border-4 border-black p-6 shadow-[8px_8px_0_0_#000] text-white">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b-4 border-black pb-4 gap-4 md:gap-0">
        <div>
          <h2 className="font-display text-2xl text-[#ffcc00] uppercase">{t.oracleTitle}</h2>
          <p className="font-sans text-xs md:text-sm text-[#f4e4bc] italic">{t.oracleDesc}</p>
        </div>
        <div className="flex flex-col gap-2 w-full md:w-auto items-end">
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <button onClick={() => { setPeriod('week'); setMonthOffset(0); }} className={`flex-1 md:flex-none px-2 py-2 md:py-1 text-xs font-bold uppercase border-2 ${period === 'week' ? 'bg-[#ffcc00] border-black text-black' : 'border-[#5d4037] text-gray-400'}`}>{t.weeklyView}</button>
            <button onClick={() => setPeriod('month')} className={`flex-1 md:flex-none px-2 py-2 md:py-1 text-xs font-bold uppercase border-2 ${period === 'month' ? 'bg-[#ffcc00] border-black text-black' : 'border-[#5d4037] text-gray-400'}`}>{t.monthlyView}</button>
            <button onClick={() => { setPeriod('3months'); setMonthOffset(0); }} className={`flex-1 md:flex-none px-2 py-2 md:py-1 text-xs font-bold uppercase border-2 ${period === '3months' ? 'bg-[#ffcc00] border-black text-black' : 'border-[#5d4037] text-gray-400'}`}>3 Months</button>
          </div>
          {period === 'month' && (
            <div className="flex justify-between items-center bg-[#1a1a17] border border-[#5d4037] w-full md:max-w-[200px]">
              <button disabled={monthOffset <= -12} onClick={() => setMonthOffset(m => m - 1)} className="text-[#ffcc00] font-bold px-3 py-1 text-lg disabled:opacity-50 hover:bg-[#3e2723]">{"<"}</button>
              <span className="text-xs font-bold font-sans text-white uppercase text-center flex-1">
                {format(addMonths(today, monthOffset), 'MMM yyyy')}
              </span>
              <button disabled={monthOffset >= 0} onClick={() => setMonthOffset(m => m + 1)} className="text-[#ffcc00] font-bold px-3 py-1 text-lg disabled:opacity-50 hover:bg-[#3e2723]">{">"}</button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-[#1a1a17] border-4 border-[#5d4037] p-4 relative flex flex-col min-h-[400px]">
          <div className="flex flex-col sm:flex-row justify-between mb-4 gap-2 sm:gap-0">
            <h3 className="font-sans font-bold text-[#ffcc00] uppercase text-sm">Line Chart (Trend)</h3>
            <div className="flex gap-2">
              <button onClick={() => setMode('overview')} className={`flex-1 sm:flex-none px-2 py-2 sm:py-1 text-[10px] uppercase font-bold border ${mode === 'overview' ? 'bg-white text-black' : 'border-gray-600'}`}>{t.overviewMode}</button>
              <button onClick={() => setMode('drilldown')} className={`flex-1 sm:flex-none px-2 py-2 sm:py-1 text-[10px] uppercase font-bold border ${mode === 'drilldown' ? 'bg-white text-black' : 'border-gray-600'}`}>{t.drillDownMode}</button>
            </div>
          </div>
          
          {mode === 'drilldown' && (
            <div className="mb-4">
              <div className="flex gap-2 mb-2 border-b border-gray-700 pb-2">
                <button onClick={() => { setActiveDrillTab('toll'); setSelectedCategories([]); }} className={`text-xs uppercase ${activeDrillTab === 'toll' ? 'text-red-400 font-bold' : 'text-gray-500'}`}>Toll</button>
                <button onClick={() => { setActiveDrillTab('bounty'); setSelectedCategories([]); }} className={`text-xs uppercase ${activeDrillTab === 'bounty' ? 'text-green-400 font-bold' : 'text-gray-500'}`}>Bounty</button>
              </div>
              <div className="flex flex-wrap gap-1">
                {(activeDrillTab === 'toll' ? EXPENSE_CATEGORIES : GAIN_CATEGORIES).map(cat => (
                  <button 
                    key={cat.id} 
                    onClick={() => toggleCategory(cat.id)}
                    className={`px-2 py-1 text-[10px] border ${selectedCategories.includes(cat.id) ? 'bg-[#ffcc00] text-black border-black' : 'border-gray-600 text-gray-400'}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="w-full flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="name" stroke="#ccc" fontSize={10} minTickGap={20} />
                <YAxis stroke="#ccc" fontSize={10} width={80} tickFormatter={(val) => `Rp ${(val/1000).toFixed(0)}k`} />
                <RechartsTooltip contentStyle={{ backgroundColor: '#1a1a17', border: '2px solid #5d4037', color: '#fff' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                {mode === 'overview' ? (
                  <>
                    <Line type="monotone" dataKey="Bounty" stroke="#66bb6a" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="Toll" stroke="#ef5350" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    <Line type="stepAfter" dataKey="hpCap" stroke="#ffca28" strokeDasharray="5 5" strokeWidth={2} name="HP Cap" dot={false} />
                  </>
                ) : (
                  selectedCategories.map((catId, idx) => (
                    <Line key={catId} type="monotone" dataKey={catId} stroke={COLORS[idx % COLORS.length]} strokeWidth={3} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                  ))
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Toll Allocation */}
          <div className="bg-[#1a1a17] border-4 border-[#5d4037] p-4 text-xs font-sans">
            <h3 className="text-red-400 font-bold uppercase mb-2 border-b border-gray-700 pb-1">{t.tollChart}</h3>
            <div className="h-[150px]">
              {pieDataToll.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieDataToll} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60}>
                      {pieDataToll.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                    </Pie>
                    <RechartsTooltip formatter={(val: number) => `Rp ${val.toLocaleString('id-ID')}`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <div className="flex h-full items-center justify-center text-gray-500">No data</div>}
            </div>
            <div className="mt-4 space-y-1">
              {pieDataToll.map(item => {
                const perc = (item.value / tollTotal) * 100;
                return (
                  <div key={item.name} className="flex justify-between border-b border-gray-800 pb-1">
                    <span className={`${item.name.includes('Shadow') ? 'text-red-500 font-bold' : 'text-gray-300'}`}>{item.name.replace(/.*?\s/, '')}</span>
                    <span className="text-gray-400">Rp {item.value.toLocaleString('id-ID')} ({perc.toFixed(0)}%)</span>
                  </div>
                )
              })}
              {pieDataToll.some(item => (item.value / tollTotal) > 0.4) && (
                <div className="mt-2 text-red-500 italic text-[10px] bg-red-900/20 p-2 border border-red-900">
                  ⚠️ {t.warnExpense}
                </div>
              )}
            </div>
          </div>

          {/* Bounty Allocation */}
          <div className="bg-[#1a1a17] border-4 border-[#5d4037] p-4 text-xs font-sans">
            <h3 className="text-green-400 font-bold uppercase mb-2 border-b border-gray-700 pb-1">{t.bountyChart}</h3>
            <div className="h-[150px]">
              {pieDataBounty.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieDataBounty} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60}>
                      {pieDataBounty.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                    </Pie>
                    <RechartsTooltip formatter={(val: number) => `Rp ${val.toLocaleString('id-ID')}`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <div className="flex h-full items-center justify-center text-gray-500">No data</div>}
            </div>
            <div className="mt-4 space-y-1">
              {pieDataBounty.map(item => (
                <div key={item.name} className="flex justify-between border-b border-gray-800 pb-1">
                  <span className={`${item.name.includes('Royal Status') || item.name.includes('Salary') ? 'text-yellow-400 font-bold' : 'text-gray-300'}`}>{item.name.replace(/.*?\s/, '')}</span>
                  <span className="text-gray-400">Rp {item.value.toLocaleString('id-ID')} ({(item.value/bountyTotal*100).toFixed(0)}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
