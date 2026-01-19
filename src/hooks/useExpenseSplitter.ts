import { useState, useMemo } from "react";
import { Participant, Expense, Settlement, BalanceDetail } from "@/types/expense";

const avatarColors = [
  "bg-primary",
  "bg-secondary",
  "bg-chart-1",
  "bg-chart-4",
  "bg-chart-5",
  "bg-chart-2",
  "bg-accent-foreground",
];

export function useExpenseSplitter() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const addParticipant = (name: string, role?: string, participationPercentage?: number) => {
    const newParticipant: Participant = {
      id: crypto.randomUUID(),
      name,
      avatar: avatarColors[participants.length % avatarColors.length],
      role,
      participationPercentage: participationPercentage || 100,
    };
    setParticipants([...participants, newParticipant]);
  };

  const updateParticipant = (id: string, updates: Partial<Participant>) => {
    setParticipants(participants.map((p) => 
      p.id === id ? { ...p, ...updates } : p
    ));
  };

  const removeParticipant = (id: string) => {
    setParticipants(participants.filter((p) => p.id !== id));
    setExpenses(expenses.filter((e) => e.paidBy !== id));
  };

  const addExpense = (
    description: string, 
    amount: number, 
    paidBy: string, 
    category: string = "other",
    splitAmong?: string[]
  ) => {
    const newExpense: Expense = {
      id: crypto.randomUUID(),
      description,
      amount,
      paidBy,
      category,
      date: new Date(),
      splitAmong,
    };
    setExpenses([...expenses, newExpense]);
  };

  const removeExpense = (id: string) => {
    setExpenses(expenses.filter((e) => e.id !== id));
  };

  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const expensesByParticipant = useMemo(() => {
    const map: Record<string, number> = {};
    participants.forEach((p) => {
      map[p.id] = 0;
    });
    expenses.forEach((e) => {
      if (map[e.paidBy] !== undefined) {
        map[e.paidBy] += e.amount;
      }
    });
    return map;
  }, [expenses, participants]);

  const expensesByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => {
      if (!map[e.category]) {
        map[e.category] = 0;
      }
      map[e.category] += e.amount;
    });
    return map;
  }, [expenses]);

  const expensesByMonth = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => {
      const date = new Date(e.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!map[monthKey]) {
        map[monthKey] = 0;
      }
      map[monthKey] += e.amount;
    });
    return map;
  }, [expenses]);

  const balanceDetails = useMemo((): BalanceDetail[] => {
    if (participants.length === 0) return [];

    const details: BalanceDetail[] = [];
    
    // Calculate what each person should pay based on expenses they're part of
    const shouldPayMap: Record<string, number> = {};
    participants.forEach(p => {
      shouldPayMap[p.id] = 0;
    });

    expenses.forEach(expense => {
      const splitParticipants = expense.splitAmong && expense.splitAmong.length > 0
        ? expense.splitAmong
        : participants.map(p => p.id);
      
      const perPerson = expense.amount / splitParticipants.length;
      splitParticipants.forEach(id => {
        if (shouldPayMap[id] !== undefined) {
          shouldPayMap[id] += perPerson;
        }
      });
    });

    participants.forEach((p) => {
      const paid = expensesByParticipant[p.id] || 0;
      const shouldPay = shouldPayMap[p.id] || 0;
      details.push({
        participantId: p.id,
        paid,
        shouldPay,
        balance: paid - shouldPay,
      });
    });

    return details;
  }, [participants, expenses, expensesByParticipant]);

  const settlements = useMemo((): Settlement[] => {
    if (participants.length < 2) return [];

    const balances: Record<string, number> = {};
    balanceDetails.forEach((detail) => {
      balances[detail.participantId] = detail.balance;
    });

    const debtors: { id: string; amount: number }[] = [];
    const creditors: { id: string; amount: number }[] = [];

    Object.entries(balances).forEach(([id, balance]) => {
      if (balance < -0.01) {
        debtors.push({ id, amount: Math.abs(balance) });
      } else if (balance > 0.01) {
        creditors.push({ id, amount: balance });
      }
    });

    const result: Settlement[] = [];

    debtors.forEach((debtor) => {
      let remaining = debtor.amount;
      creditors.forEach((creditor) => {
        if (remaining > 0.01 && creditor.amount > 0.01) {
          const transfer = Math.min(remaining, creditor.amount);
          result.push({
            from: debtor.id,
            to: creditor.id,
            amount: Math.round(transfer * 100) / 100,
          });
          remaining -= transfer;
          creditor.amount -= transfer;
        }
      });
    });

    return result;
  }, [participants, balanceDetails]);

  return {
    participants,
    expenses,
    totalExpenses,
    expensesByParticipant,
    expensesByCategory,
    expensesByMonth,
    balanceDetails,
    settlements,
    addParticipant,
    updateParticipant,
    removeParticipant,
    addExpense,
    removeExpense,
  };
}
