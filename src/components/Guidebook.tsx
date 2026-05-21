import React from 'react';
import { useAppStore } from '../store';

export default function Guidebook() {
  const language = useAppStore(state => state.language);
  const isId = language === 'id';

  const sections = [
    {
      icon: '📖',
      title: isId ? 'Selamat Datang di Rupiah Quest!' : 'Welcome to Rupiah Quest!',
      content: isId ? (
        <>
          Aplikasi ini mengubah manajemen keuangan membosankan menjadi petualangan RPG yang epik! 
          Uang yang kamu hasilkan menjadi <strong>EXP & Level</strong>, dan pengeluaran harianmu mengurangi <strong>HP (Stamina)</strong> harianmu.
          Jika HP mu habis, kamu akan "Mati" untuk hari itu (berarti kamu over-budget!).
        </>
      ) : (
        <>
          This application turns boring financial management into an epic RPG adventure! 
          The money you earn becomes <strong>EXP & Level</strong>, and your daily expenses reduce your daily <strong>HP (Stamina)</strong>.
          If your HP empties, you "Die" for the day (which means you over-budgeted!).
        </>
      )
    },
    {
      icon: '🌟',
      title: isId ? 'Mekanik Level & EXP' : 'Level & EXP Mechanics',
      content: isId ? (
        <ul className="list-disc pl-5 space-y-2 mt-2">
          <li><strong>Mendapatkan EXP:</strong> Setiap pendapatan (Bounty) yang kamu catat bulan ini akan menambah nilai EXP mu.</li>
          <li><strong>Naik Level:</strong> Setiap terkumpul <strong>Rp 1.000.0000</strong> (1 Juta), kamu akan naik 1 Level.</li>
          <li>Bar EXP di menu utama menunjukkan sejauh mana progres pendapatanmu menuju level berikutnya. Kumpulkan lebih banyak uang untuk mencapai level tertinggi!</li>
        </ul>
      ) : (
        <ul className="list-disc pl-5 space-y-2 mt-2">
          <li><strong>Gaining EXP:</strong> Every income (Bounty) you log this month adds to your EXP.</li>
          <li><strong>Leveling Up:</strong> For every <strong>Rp 1,000,000</strong> (1 Million) earned, you will gain 1 Level.</li>
          <li>The EXP Bar on the main menu shows your progress toward the next level. Earn more gold to reach the highest level!</li>
        </ul>
      )
    },
    {
      icon: '❤️',
      title: isId ? 'Mekanik HP & Stamina' : 'HP & Stamina Mechanics',
      content: isId ? (
        <ul className="list-disc pl-5 space-y-2 mt-2">
          <li><strong>Maksimum HP:</strong> Dihitung otomatis dari <em>(Gaji - Target Tabungan) / 30 Hari</em>.</li>
          <li>Setiap kali kamu mencatat <strong className="text-red-900">Pengeluaran</strong>, HP mu berkurang sesuai jumlah nominalnya.</li>
          <li>Jika HP mencapai 0, santai, ini hanya peringatan bahwa budget harianmu telah habis. Esok hari HP akan kembali penuh (Reset Harian).</li>
        </ul>
      ) : (
        <ul className="list-disc pl-5 space-y-2 mt-2">
          <li><strong>Max HP:</strong> Calculated automatically from <em>(Income - Target Savings) / 30 Days</em>.</li>
          <li>Every time you log an <strong className="text-red-900">Expense</strong>, your HP decreases by that exact amount.</li>
          <li>If HP hits 0, relax, it's just a warning that your daily budget is depleted. Tomorrow, your HP will be fully restored (Daily Reset).</li>
        </ul>
      )
    },
    {
      icon: '🧪',
      title: isId ? 'Sistem Potion (Tabungan Darurat)' : 'Potion System (Emergency Savings)',
      content: isId ? (
        <ul className="list-disc pl-5 space-y-2 mt-2">
          <li>Merasa budget harian akan defisit? Beli <strong className="text-amber-800">Potion</strong> sebagai simpanan masa depan!</li>
          <li><strong>Membeli Potion:</strong> Mencatat uang sebagai tabungan aman (mengurangi uang tersedia, tapi tidak merusak HP hari ini).</li>
          <li><strong>Meminum Potion:</strong> Saat HP harianmu menipis, meminum potion akan memulihkan HP mu (mencairkan tabungan darurat).</li>
        </ul>
      ) : (
        <ul className="list-disc pl-5 space-y-2 mt-2">
          <li>Feel like your daily budget will deficit? Buy <strong className="text-amber-800">Potions</strong> as future savings!</li>
          <li><strong>Buying Potions:</strong> Logs money as safe savings (reduces available money, but doesn't damage today's HP).</li>
          <li><strong>Drinking Potions:</strong> When your daily HP runs low, drinking a potion restores your HP (liquidating emergency savings).</li>
        </ul>
      )
    },
    {
      icon: '🔰',
      title: isId ? 'Gelar Petualang (Titles)' : 'Adventurer Titles',
      content: isId ? (
        <ul className="list-disc pl-5 space-y-2 mt-2">
          <li>Gelar diberikan berdasarkan kebiasaan keuanganmu selama sebulan terakhir.</li>
          <li><strong>🌱 Peasant (Warga Biasa):</strong> Gelar awal setiap bulan.</li>
          <li><strong>⚔️ Savings Hero (Pahlawan Tabungan):</strong> Pengeluaranmu di bawah 60% dari total pendapatan saat ini. Keren!</li>
          <li><strong>👑 Greed King (Raja Keserakahan):</strong> Lebih dari 40% pengeluaranmu dialokasikan untuk <em>👻 Shadow Toll</em> (keinginan/impulsif). Hati-hati!</li>
          <li><strong>🐉 Nine Dragon (Naga Sembilan):</strong> Total kekayaan bersihmu (Net Worth) mencapai lebih dari Rp 10.000.000 (10 Juta). Luar biasa!</li>
          <li><strong>🛡️ Well Prepared Adventurer:</strong> Simpanan Potion Darurat-mu minimal setara 3x Max HP harianmu. Super Aman!</li>
          <li><strong>🧪 Alchemist (Sang Alkemis):</strong> Kamu sukses berdisiplin membeli Potion (menabung darurat) selama 7 hari berturut-turut!</li>
          <li><strong>💀 Ghost Wallet (Dompet Hantu):</strong> Belum ada transaksi tercatat sama sekali bulan ini.</li>
        </ul>
      ) : (
        <ul className="list-disc pl-5 space-y-2 mt-2">
          <li>Titles are awarded based on your financial habits for the current month.</li>
          <li><strong>🌱 Peasant:</strong> Default starting title each month.</li>
          <li><strong>⚔️ Savings Hero:</strong> Your expenses are below 60% of your total current income. Awesome!</li>
          <li><strong>👑 Greed King:</strong> Over 40% of your expenses went to <em>👻 Shadow Toll</em> (wants/impulsive). Watch out!</li>
          <li><strong>🐉 Nine Dragon:</strong> Your total net worth has reached over Rp 10,000,000 (10 Million). Incredible!</li>
          <li><strong>🛡️ Well Prepared Adventurer:</strong> Your Emergency Potion stash is at least 3x your daily Max HP. Very Safe!</li>
          <li><strong>🧪 Alchemist:</strong> You successfully disciplined yourself to buy Potions (save) for 7 consecutive days!</li>
          <li><strong>💀 Ghost Wallet:</strong> No transactions recorded this month yet.</li>
        </ul>
      )
    },
    {
      icon: '📂',
      title: isId ? 'Kategori Transaksi (Categories)' : 'Transaction Categories',
      content: isId ? (
        <div className="space-y-4 mt-2">
          <div>
            <h4 className="font-bold uppercase tracking-widest text-sm border-b-2 border-black pb-1 mb-2 text-[#aed581]">Pendapatan (Gain)</h4>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>🏰 Royal Salary:</strong> Gaji utama, penghasilan bulanan (Primary Salary).</li>
              <li><strong>📜 Quest Reward:</strong> Bonus pekerjaan, komisi, lembur (Bonus / Project Work).</li>
              <li><strong>🎯 Bounty Hunter:</strong> Penghasilan sampingan, freelance (Side Hustle / Freelance).</li>
              <li><strong>🤝 Tribute:</strong> Hadiah, tunjangan, uang kaget (Gifts / Allowance).</li>
              <li><strong>🎲 Loot Drop:</strong> Keuntungan investasi, bunga, penjualan aset (Investment / Sales).</li>
              <li><strong>⚗️ Alchemy:</strong> Penghasilan lain-lain (Other / Mystery Gain).</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold uppercase tracking-widest text-sm border-b-2 border-black pb-1 mb-2 text-[#f44336]">Pengeluaran (Toll)</h4>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>🍖 Tavern Feast:</strong> Makan dan minum sehari-hari (Food/Groceries).</li>
              <li><strong>🐴 Stable & Carriage:</strong> Transportasi, bensin, ongkos jalan (Transport).</li>
              <li><strong>🏡 Castle Upkeep:</strong> Kebutuhan rumah, kos, listrik, air, internet (Housing/Utilities).</li>
              <li><strong>⚔️ Armory:</strong> Perawatan diri, pakaian, skincare (Personal Care).</li>
              <li><strong>🧙 Arcane Studies:</strong> Buku, langganan pendidikan, e-course (Education).</li>
              <li><strong>🎭 Tavern Entertainment:</strong> Hiburan, langganan streaming, jalan-jalan (Entertainment).</li>
              <li><strong>💊 Healer's Fee:</strong> Obat, suplemen, dokter, asuransi kesehatan (Health).</li>
              <li><strong>👻 Shadow Toll:</strong> Pengeluaran dadakan, impulsif, atau sesuatu yang tidak bisa dijelaskan (Impulse/Ghost Expenses). Akan memicu gelar <strong>Greed King</strong> jika terlalu banyak!</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="space-y-4 mt-2">
          <div>
            <h4 className="font-bold uppercase tracking-widest text-sm border-b-2 border-black pb-1 mb-2 text-[#aed581]">Income (Gain)</h4>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>🏰 Royal Salary:</strong> Primary salary, main monthly income.</li>
              <li><strong>📜 Quest Reward:</strong> Work bonus, overtime, commission.</li>
              <li><strong>🎯 Bounty Hunter:</strong> Side hustle, freelance income.</li>
              <li><strong>🤝 Tribute:</strong> Gifts, allowance, sudden windfalls.</li>
              <li><strong>🎲 Loot Drop:</strong> Investment returns, interest, asset sales.</li>
              <li><strong>⚗️ Alchemy:</strong> Unknown or miscellaneous income.</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold uppercase tracking-widest text-sm border-b-2 border-black pb-1 mb-2 text-[#f44336]">Expenses (Toll)</h4>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>🍖 Tavern Feast:</strong> Food, dining out, and groceries.</li>
              <li><strong>🐴 Stable & Carriage:</strong> Transportation, gas, and transit fares.</li>
              <li><strong>🏡 Castle Upkeep:</strong> Housing, rent, electricity, water, internet (Utilities).</li>
              <li><strong>⚔️ Armory:</strong> Personal care, clothing, skincare.</li>
              <li><strong>🧙 Arcane Studies:</strong> Books, courses, educational subscriptions.</li>
              <li><strong>🎭 Tavern Entertainment:</strong> Entertainment, streaming, hanging out.</li>
              <li><strong>💊 Healer's Fee:</strong> Medicines, supplements, healthcare, insurance.</li>
              <li><strong>👻 Shadow Toll:</strong> Impulsive, sudden, or ghost expenses. Will trigger the <strong>Greed King</strong> title if there are too many!</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      icon: '⚔️',
      title: isId ? 'Strategi Keuangan (Financial Strategy)' : 'Financial Strategy',
      content: isId ? (
        <>
          <p className="mb-2"><strong>Tips Bertahan Hidup:</strong></p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Atur Setting:</strong> Pastikan kamu sudah mengisi <em>Bulanan (Income)</em> dan <em>Target Relik (Savings)</em> di menu Settings agar HP mu terhitung dengan akurat!</li>
            <li><strong>Rutin Mencatat:</strong> Semakin sering kamu mencatatkan log naga (transaksi), laporan Oracle (Charts) akan semakin pintar dalam membantumu melihat kemana saja gold mu pergi.</li>
            <li><strong>Gunakan Potion secara bijak:</strong> Potion adalah metafora untuk dana sink-fund/darurat. Kumpulkan saat Gold mu sedang banyak (Gain), minum hanya saat benar-benar sekarat (Emergency).</li>
          </ul>
        </>
      ) : (
        <>
          <p className="mb-2"><strong>Survival Tips:</strong></p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Configure Settings:</strong> Make sure you have filled in your <em>Monthly Income</em> and <em>Target Savings</em> in the Settings menu so your HP calculates accurately!</li>
            <li><strong>Log Regularly:</strong> The more consistently you log transactions, the smarter the Oracle Scroll (Charts) gets in showing where your gold is going.</li>
            <li><strong>Use Potions wisely:</strong> Potions are a metaphor for sink-funds/emergency funds. Stockpile them when your Gold is plentiful (Gain), drink them only when you are truly dying (Emergency).</li>
          </ul>
        </>
      )
    }
  ];

  return (
    <div className="bg-[#f4e4bc] border-4 border-black p-4 md:p-8 shadow-[8px_8px_0_0_#000] text-[#3e2723] max-w-4xl mx-auto">
      <h2 className="font-display text-2xl md:text-3xl lg:text-4xl mb-6 md:mb-8 uppercase text-center border-b-4 border-[#3d251e] pb-4 mx-auto w-full">
        {isId ? '📜 Buku Panduan Petualang' : '📜 Adventurer\'s Guidebook'}
      </h2>

      <div className="flex flex-col gap-8">
        {sections.map((sec, idx) => (
          <div key={idx} className="bg-white border-2 border-dashed border-[#3e2723] p-6 relative">
            <div className="absolute -top-5 -left-5 w-10 h-10 bg-[#ffcc00] border-2 border-black flex flex-col items-center justify-center text-xl shadow-[2px_2px_0_0_#000] rotate-12">
              {sec.icon}
            </div>
            <h3 className="font-sans font-bold text-xl uppercase mb-3 text-amber-900 border-b-2 border-[#d7ccc8] pb-2">
              {sec.title}
            </h3>
            <div className="font-sans text-sm md:text-base leading-relaxed opacity-90">
              {sec.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
