import { useState, useMemo, useCallback } from "react";
import { Participant, Expense, Settlement, BalanceDetail, Payment, RecurringItem } from "@/types/expense";

// IMPORTANT: No white/light colors - all must be visible against light backgrounds
const avatarColors = [
  "bg-primary",
  "bg-chart-1",
  "bg-chart-2",
  "bg-chart-3",
  "bg-chart-4",
  "bg-chart-5",
  "bg-slate-500",
  "bg-zinc-500",
  "bg-stone-500",
  "bg-neutral-500",
];

interface GroupData {
  participants: Participant[];
  expenses: Expense[];
  payments: Payment[];
}

export function useExpenseSplitter(groupId: string | null, recurringItems: RecurringItem[] = []) {
  // Store data per group
  const [groupsData, setGroupsData] = useState<Record<string, GroupData>>({});

  // Get current group's data or empty defaults
  const currentData = useMemo((): GroupData => {
    if (!groupId) return { participants: [], expenses: [], payments: [] };
    return groupsData[groupId] || { participants: [], expenses: [], payments: [] };
  }, [groupsData, groupId]);

  const { participants, expenses, payments } = currentData;

  // Helper to update current group's data
  const updateGroupData = useCallback((updater: (data: GroupData) => GroupData) => {
    if (!groupId) return;
    setGroupsData(prev => ({
      ...prev,
      [groupId]: updater(prev[groupId] || { participants: [], expenses: [], payments: [] })
    }));
  }, [groupId]);

  // Convert recurring items to expenses for unified calculations
  const recurringExpenses: Expense[] = useMemo(() => {
    return recurringItems
      .filter(item => item.paidBy) // Only include items that have been assigned to someone
      .map(item => ({
        id: `recurring-${item.id}`,
        description: item.name,
        amount: item.status === 'partial' ? (item.paidAmount || 0) : item.amount,
        paidBy: item.paidBy!,
        category: item.category,
        date: new Date(),
        splitAmong: item.splitAmong,
        isRecurring: true,
        recurringItemId: item.id,
      }));
  }, [recurringItems]);

  // Combine regular expenses with recurring expenses
  const allExpenses = useMemo(() => {
    return [...expenses, ...recurringExpenses];
  }, [expenses, recurringExpenses]);

  const addParticipant = useCallback((
    name: string, 
    role?: string, 
    participationPercentage?: number,
    avatarColor?: string,
    avatarImage?: string
  ) => {
    updateGroupData(data => {
      const newParticipant: Participant = {
        id: crypto.randomUUID(),
        name,
        avatar: avatarColor || avatarColors[data.participants.length % avatarColors.length],
        avatarType: avatarImage ? 'image' : 'color',
        avatarImage,
        role,
        participationPercentage: participationPercentage || 100,
      };
      return {
        ...data,
        participants: [...data.participants, newParticipant]
      };
    });
  }, [updateGroupData]);

  const updateParticipant = useCallback((id: string, updates: Partial<Participant>) => {
    updateGroupData(data => ({
      ...data,
      participants: data.participants.map((p) => 
        p.id === id ? { ...p, ...updates } : p
      )
    }));
  }, [updateGroupData]);

  const removeParticipant = useCallback((id: string) => {
    updateGroupData(data => ({
      ...data,
      participants: data.participants.filter((p) => p.id !== id),
      expenses: data.expenses.filter((e) => e.paidBy !== id)
    }));
  }, [updateGroupData]);

  const addExpense = useCallback((
    description: string, 
    amount: number, 
    paidBy: string, 
    category: string = "other",
    splitAmong?: string[]
  ) => {
    updateGroupData(data => {
      const newExpense: Expense = {
        id: crypto.randomUUID(),
        description,
        amount,
        paidBy,
        category,
        date: new Date(),
        splitAmong,
      };
      return {
        ...data,
        expenses: [...data.expenses, newExpense]
      };
    });
  }, [updateGroupData]);

  const removeExpense = useCallback((id: string) => {
    updateGroupData(data => ({
      ...data,
      expenses: data.expenses.filter((e) => e.id !== id)
    }));
  }, [updateGroupData]);

  const totalExpenses = useMemo(() => {
    return allExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [allExpenses]);

  const expensesByParticipant = useMemo(() => {
    const map: Record<string, number> = {};
    participants.forEach((p) => {
      map[p.id] = 0;
    });
    allExpenses.forEach((e) => {
      if (map[e.paidBy] !== undefined) {
        map[e.paidBy] += e.amount;
      }
    });
    return map;
  }, [allExpenses, participants]);

  const expensesByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    allExpenses.forEach((e) => {
      if (!map[e.category]) {
        map[e.category] = 0;
      }
      map[e.category] += e.amount;
    });
    return map;
  }, [allExpenses]);

  const expensesByMonth = useMemo(() => {
    const map: Record<string, number> = {};
    allExpenses.forEach((e) => {
      const date = new Date(e.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!map[monthKey]) {
        map[monthKey] = 0;
      }
      map[monthKey] += e.amount;
    });
    return map;
  }, [allExpenses]);

  const balanceDetails = useMemo((): BalanceDetail[] => {
    if (participants.length === 0) return [];

    const details: BalanceDetail[] = [];
    
    // Calculate what each person should pay based on expenses they're part of
    const shouldPayMap: Record<string, number> = {};
    participants.forEach(p => {
      shouldPayMap[p.id] = 0;
    });

    allExpenses.forEach(expense => {
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
  }, [participants, allExpenses, expensesByParticipant]);

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

  const addPayment = useCallback((
    settlementFrom: string,
    settlementTo: string,
    amount: number,
    receiptUrl?: string,
    note?: string
  ) => {
    updateGroupData(data => {
      const newPayment: Payment = {
        id: crypto.randomUUID(),
        settlementFrom,
        settlementTo,
        amount,
        date: new Date(),
        receiptUrl,
        note,
      };
      return {
        ...data,
        payments: [...data.payments, newPayment]
      };
    });
  }, [updateGroupData]);

  const removePayment = useCallback((id: string) => {
    updateGroupData(data => ({
      ...data,
      payments: data.payments.filter((p) => p.id !== id)
    }));
  }, [updateGroupData]);

  // Calculate remaining settlements after payments
  const remainingSettlements = useMemo((): Settlement[] => {
    const paidAmounts: Record<string, number> = {};
    
    payments.forEach(payment => {
      const key = `${payment.settlementFrom}-${payment.settlementTo}`;
      paidAmounts[key] = (paidAmounts[key] || 0) + payment.amount;
    });

    return settlements
      .map(settlement => {
        const key = `${settlement.from}-${settlement.to}`;
        const paid = paidAmounts[key] || 0;
        const remaining = settlement.amount - paid;
        return {
          ...settlement,
          amount: Math.max(0, Math.round(remaining * 100) / 100),
        };
      })
      .filter(s => s.amount > 0.01);
  }, [settlements, payments]);

  // Clean up group data when a group is deleted
  const clearGroupData = useCallback((gId: string) => {
    setGroupsData(prev => {
      const newData = { ...prev };
      delete newData[gId];
      return newData;
    });
  }, []);

  return {
    participants,
    expenses,
    allExpenses, // Combined regular + recurring expenses
    payments,
    totalExpenses,
    expensesByParticipant,
    expensesByCategory,
    expensesByMonth,
    balanceDetails,
    settlements,
    remainingSettlements,
    addParticipant,
    updateParticipant,
    removeParticipant,
    addExpense,
    removeExpense,
    addPayment,
    removePayment,
    clearGroupData,
  };
}
