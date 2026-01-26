export type PixKeyType = 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';

export interface PixKey {
  id: string;
  type: PixKeyType;
  key: string;
  label?: string; // Optional label like "Conta Principal"
}

export interface Participant {
  id: string;
  name: string;
  avatar: string;
  avatarType: 'color' | 'image';
  avatarImage?: string;
  role?: string;
  participationPercentage?: number;
  pixKeys?: PixKey[];
  userId?: string; // Linked user ID for authenticated participants
}

export interface ExpenseCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  category: string;
  date: Date;
  splitAmong?: string[]; // If undefined, split among all
  isRecurring?: boolean; // Indicates if this is a recurring fixed expense
  recurringItemId?: string; // Reference to the original recurring item
}

export interface Settlement {
  from: string;
  to: string;
  amount: number;
}

export interface BalanceDetail {
  participantId: string;
  paid: number;
  shouldPay: number;
  balance: number;
}

export interface Payment {
  id: string;
  settlementFrom: string;
  settlementTo: string;
  amount: number;
  date: Date;
  receiptUrl?: string;
  note?: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  createdAt: Date;
  isRecurring: boolean;
  billingDay?: number; // Dia de cobrança mensal (1-31)
  splitType?: 'equal' | 'percentage'; // Type of expense splitting
  isOwner?: boolean; // Whether current user is the owner
  isAdmin?: boolean; // Whether current user is admin
  role?: 'owner' | 'admin' | 'member'; // User's role in the group
}

export interface GroupMember {
  id: string;
  userId: string;
  groupId: string;
  role: 'admin' | 'member';
  joinedAt: Date;
  displayName?: string;
  avatarUrl?: string;
}

export interface GroupInvite {
  id: string;
  groupId: string;
  inviteCode: string;
  createdAt: Date;
  expiresAt?: Date;
  maxUses?: number;
  useCount: number;
  isActive: boolean;
}

export type RecurringItemStatus = 'pending' | 'paid' | 'partial';

export interface RecurringItem {
  id: string;
  name: string;
  amount: number;
  category: string;
  status: RecurringItemStatus;
  paidAmount?: number;
  paidBy?: string;
  dueDay?: number; // Dia do vencimento
  splitAmong?: string[]; // Participantes que dividem o custo
}

export interface MonthlyRecurringData {
  month: string; // formato: YYYY-MM
  items: RecurringItem[];
}
