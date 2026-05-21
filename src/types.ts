import { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  characterName?: string;
  avatar?: string;
  gender?: 'Sir' | 'Madam';
  customHPCap?: number;
  monthlyIncome: number;
  targetDailyExpense?: number;
  targetSavings?: number; // legacy
  vaultQuests?: VaultQuest[];
  mainQuestName?: string; // legacy
  mainQuestTarget?: number; // legacy
  mainQuestProgress?: number; // legacy
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface VaultQuest {
  id: string;
  name: string;
  target: number;
  progress: number;
}

export type TransactionType = 'Gain' | 'Expense' | 'PotionBuy' | 'PotionDrink';

export interface Transaction {
  id?: string;
  type: TransactionType;
  amount: number;
  category: string;
  rune: string;
  timestamp: Timestamp;
  isPending?: boolean;
  description?: string;
}

export const GAIN_CATEGORIES = [
  { id: '🏰 Royal Salary', name: 'Royal Salary', icon: '🏰' },
  { id: '📜 Quest Reward', name: 'Quest Reward', icon: '📜' },
  { id: '🎯 Bounty Hunter', name: 'Bounty Hunter', icon: '🎯' },
  { id: '🤝 Tribute', name: 'Tribute', icon: '🤝' },
  { id: '🎲 Loot Drop', name: 'Loot Drop', icon: '🎲' },
  { id: '⚗️ Alchemy', name: 'Alchemy', icon: '⚗️' }
];

export const EXPENSE_CATEGORIES = [
  { id: '🍖 Tavern Feast', name: 'Tavern Feast', icon: '🍖' },
  { id: '🐴 Stable & Carriage', name: 'Stable & Carriage', icon: '🐴' },
  { id: '🏡 Castle Upkeep', name: 'Castle Upkeep', icon: '🏡' },
  { id: '⚔️ Armory', name: 'Armory', icon: '⚔️' },
  { id: '🧙 Arcane Studies', name: 'Arcane Studies', icon: '🧙' },
  { id: '🎭 Tavern Entertainment', name: 'Tavern Entertainment', icon: '🎭' },
  { id: "💊 Healer's Fee", name: "Healer's Fee", icon: '💊' },
  { id: '👻 Shadow Toll', name: 'Shadow Toll', icon: '👻' }
];

export const RUNES = [
  { id: '🪙 Gold', name: 'Gold', icon: '🪙' },
  { id: '🛍️ ShopeePay', name: 'ShopeePay', icon: '🛍️' },
  { id: '💙 DANA', name: 'DANA', icon: '💙' },
  { id: '🌊 SeaBank', name: 'SeaBank', icon: '🌊' },
  { id: '🏦 Other Bank', name: 'Other Bank', icon: '🏦' }
];

export interface ScheduledEvent {
  id?: string;
  type: 'Toll' | 'Bounty';
  name: string;
  category: string;
  rune: string;
  amount: number;
  frequency: 'daily' | 'weekly' | 'monthly';
  frequencyValue?: number; // e.g. day of week for weekly, day of month for monthly
  autoLog: boolean;
  nextDueDate: Timestamp;
  lastLoggedAt?: Timestamp;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}
