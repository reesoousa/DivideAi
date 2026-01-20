import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Expense, Participant, BalanceDetail, Settlement } from "@/types/expense";
import { toast } from "sonner";

export function useSupabaseExpenses(groupId: string | null, participants: Participant[]) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch expenses
  const fetchExpenses = useCallback(async () => {
    if (!groupId) {
      setExpenses([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("group_id", groupId)
        .order("date", { ascending: false });

      if (error) throw error;

      const mapped: Expense[] = (data || []).map((e) => ({
        id: e.id,
        description: e.description,
        amount: Number(e.amount),
        paidBy: e.paid_by_id,
        category: e.category,
        date: new Date(e.date),
        splitAmong: e.split_among || undefined,
      }));

      setExpenses(mapped);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      toast.error("Erro ao carregar gastos");
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  // Add expense
  const addExpense = useCallback(async (
    description: string,
    amount: number,
    paidBy: string,
    category: string = "other",
    splitAmong?: string[]
  ) => {
    if (!groupId) return;

    try {
      const newExpense = {
        group_id: groupId,
        description,
        amount,
        paid_by_id: paidBy,
        category,
        date: new Date().toISOString().split("T")[0],
        split_among: splitAmong || null,
      };

      const { data, error } = await supabase
        .from("expenses")
        .insert(newExpense)
        .select()
        .single();

      if (error) throw error;

      const mapped: Expense = {
        id: data.id,
        description: data.description,
        amount: Number(data.amount),
        paidBy: data.paid_by_id,
        category: data.category,
        date: new Date(data.date),
        splitAmong: data.split_among || undefined,
      };

      setExpenses((prev) => [mapped, ...prev]);
      toast.success("Gasto adicionado!");
    } catch (error) {
      console.error("Error adding expense:", error);
      toast.error("Erro ao adicionar gasto");
    }
  }, [groupId]);

  // Remove expense
  const removeExpense = useCallback(async (id: string) => {
    // Ignore recurring expenses (they come from recurring_items)
    if (id.startsWith("recurring-")) return;

    try {
      const { error } = await supabase
        .from("expenses")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setExpenses((prev) => prev.filter((e) => e.id !== id));
      toast.success("Gasto removido!");
    } catch (error) {
      console.error("Error removing expense:", error);
      toast.error("Erro ao remover gasto");
    }
  }, []);

  // Calculate totals and balances
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
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
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
    const shouldPayMap: Record<string, number> = {};
    participants.forEach((p) => {
      shouldPayMap[p.id] = 0;
    });

    expenses.forEach((expense) => {
      const splitParticipants =
        expense.splitAmong && expense.splitAmong.length > 0
          ? expense.splitAmong
          : participants.map((p) => p.id);

      const perPerson = expense.amount / splitParticipants.length;
      splitParticipants.forEach((id) => {
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
    expenses,
    isLoading,
    totalExpenses,
    expensesByParticipant,
    expensesByCategory,
    expensesByMonth,
    balanceDetails,
    settlements,
    addExpense,
    removeExpense,
    refresh: fetchExpenses,
  };
}
