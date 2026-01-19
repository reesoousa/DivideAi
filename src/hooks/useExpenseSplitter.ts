import { useState, useMemo } from "react";
import { Participant, Expense, Settlement } from "@/types/expense";

const avatarColors = [
  "bg-primary",
  "bg-secondary",
  "bg-chart-1",
  "bg-chart-2",
  "bg-chart-3",
];

export function useExpenseSplitter() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const addParticipant = (name: string) => {
    const newParticipant: Participant = {
      id: crypto.randomUUID(),
      name,
      avatar: avatarColors[participants.length % avatarColors.length],
    };
    setParticipants([...participants, newParticipant]);
  };

  const removeParticipant = (id: string) => {
    setParticipants(participants.filter((p) => p.id !== id));
    setExpenses(expenses.filter((e) => e.paidBy !== id));
  };

  const addExpense = (description: string, amount: number, paidBy: string) => {
    const newExpense: Expense = {
      id: crypto.randomUUID(),
      description,
      amount,
      paidBy,
      date: new Date(),
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

  const settlements = useMemo((): Settlement[] => {
    if (participants.length < 2) return [];

    const perPerson = totalExpenses / participants.length;
    const balances: Record<string, number> = {};

    participants.forEach((p) => {
      const paid = expensesByParticipant[p.id] || 0;
      balances[p.id] = paid - perPerson;
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
  }, [participants, totalExpenses, expensesByParticipant]);

  return {
    participants,
    expenses,
    totalExpenses,
    expensesByParticipant,
    settlements,
    addParticipant,
    removeParticipant,
    addExpense,
    removeExpense,
  };
}
