export interface Participant {
  id: string;
  name: string;
  avatar: string;
  role?: string;
  participationPercentage?: number;
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
