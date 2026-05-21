import fs from 'fs';

const transactions = [];
const scheduledEvents = [];

const runes = [
  '🪙 Gold',
  '🛍️ ShopeePay',
  '💙 DANA',
  '🌊 SeaBank',
  '🏦 Other Bank'
];

const categories = [
  '🍖 Tavern Feast',
  '🐴 Stable & Carriage',
  '📜 Quest Reward',
  '⚔️ Weapon Upgrade',
  '🛡️ Armor Repair',
  '🏰 Royal Salary',
  '🔮 Magic Scroll',
  '🎲 Guild Bets'
];

let potionStash = 0;

for (let d = new Date(2026, 2, 20); d <= new Date(2026, 4, 20); d.setDate(d.getDate() + 1)) {
  const ts = d.toISOString();
  
  // Daily expense
  transactions.push({
    type: 'Expense',
    amount: 15000 + Math.floor(Math.random() * 30000),
    category: '🍖 Tavern Feast',
    rune: '🛍️ ShopeePay',
    timestamp: ts
  });

  // Transport
  if (Math.random() < 0.5) {
    transactions.push({
      type: 'Expense',
      amount: 10000 + Math.floor(Math.random() * 15000),
      category: '🐴 Stable & Carriage',
      rune: '🛍️ ShopeePay',
      timestamp: ts
    });
  }

  // Salary
  if (d.getDate() === 25) {
    transactions.push({
      type: 'Gain',
      amount: 5000000,
      category: '🏰 Royal Salary',
      rune: '🏦 Other Bank',
      timestamp: ts
    });
  }

  // Random quest
  if (Math.random() < 0.2) {
    transactions.push({
      type: 'Gain',
      amount: 100000 + Math.floor(Math.random() * 150000),
      category: '📜 Quest Reward',
      rune: '💙 DANA',
      timestamp: ts
    });
  }

  // Potions
  if (Math.random() < 0.1 && potionStash < 5) {
    transactions.push({
      type: 'PotionBuy',
      amount: 10,
      category: '🧪 Potion Vendor',
      rune: '🪙 Gold',
      timestamp: ts
    });
    potionStash += 10;
  }

  if (Math.random() < 0.3 && potionStash > 0) {
    const drinkAmt = Math.min(potionStash, 1 + Math.floor(Math.random() * 2));
    transactions.push({
      type: 'PotionDrink',
      amount: drinkAmt,
      category: '🧪 Combat Healing',
      rune: '🪙 Gold',
      timestamp: ts
    });
    potionStash -= drinkAmt;
  }

  // Monthly bills
  if (d.getDate() === 5) {
    transactions.push({
      type: 'Expense',
      amount: 350000,
      category: '🔮 Magic Orb Maintenance',
      rune: '🏦 Other Bank',
      timestamp: ts
    });
  }
}

scheduledEvents.push({
  type: "Bounty",
  name: "🏰 Royal Salary",
  amount: 5000000,
  frequency: "monthly",
  frequencyValue: 25,
  rune: "🏦 Other Bank",
  category: "🏰 Royal Salary",
  autoLog: true,
  nextDueDate: new Date(2026, 4, 25).toISOString(),
  createdAt: new Date(2026, 2, 20).toISOString()
});

scheduledEvents.push({
  type: "Toll",
  name: "🔮 Magic Orb Maintenance",
  amount: 350000,
  frequency: "monthly",
  frequencyValue: 5,
  rune: "🏦 Other Bank",
  category: "🔮 Magic Orb Maintenance",
  autoLog: true,
  nextDueDate: new Date(2026, 5, 5).toISOString(),
  createdAt: new Date(2026, 2, 20).toISOString()
});

const exportDate = new Date(2026, 4, 21).toISOString();

fs.writeFileSync('public/sample-rpg-data.json', JSON.stringify({
  exportDate,
  transactions,
  scheduledEvents
}, null, 2));

console.log("Generated public/sample-rpg-data.json successfully.");
