export interface Participant {
  id: string;
  name: string;
  avatar: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  date: Date;
}

export interface Settlement {
  from: string;
  to: string;
  amount: number;
}
