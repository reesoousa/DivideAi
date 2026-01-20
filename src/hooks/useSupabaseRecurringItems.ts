import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RecurringItem, RecurringItemStatus, Expense } from "@/types/expense";
import { format, parse } from "date-fns";
import { toast } from "sonner";

export function useSupabaseRecurringItems(groupId: string | null) {
  const [items, setItems] = useState<RecurringItem[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [isLoading, setIsLoading] = useState(false);

  // Fetch recurring items for selected month
  const fetchItems = useCallback(async () => {
    if (!groupId) {
      setItems([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("recurring_items")
        .select("*")
        .eq("group_id", groupId)
        .eq("month", selectedMonth)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const mapped: RecurringItem[] = (data || []).map((item) => ({
        id: item.id,
        name: item.name,
        amount: Number(item.amount),
        category: item.category,
        status: item.status as RecurringItemStatus,
        paidAmount: item.paid_amount ? Number(item.paid_amount) : undefined,
        paidBy: item.paid_by_id || undefined,
        dueDay: item.due_day || undefined,
        splitAmong: item.split_among || undefined,
      }));

      setItems(mapped);
    } catch (error) {
      console.error("Error fetching recurring items:", error);
      toast.error("Erro ao carregar itens fixos");
    } finally {
      setIsLoading(false);
    }
  }, [groupId, selectedMonth]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Add recurring item
  const addRecurringItem = useCallback(async (
    item: Omit<RecurringItem, "id" | "status">
  ): Promise<string | null> => {
    if (!groupId) return null;

    try {
      const newItem = {
        group_id: groupId,
        month: selectedMonth,
        name: item.name,
        amount: item.amount,
        category: item.category,
        status: "pending",
        due_day: item.dueDay,
        split_among: item.splitAmong || null,
      };

      const { data, error } = await supabase
        .from("recurring_items")
        .insert(newItem)
        .select()
        .single();

      if (error) throw error;

      const mapped: RecurringItem = {
        id: data.id,
        name: data.name,
        amount: Number(data.amount),
        category: data.category,
        status: data.status as RecurringItemStatus,
        paidAmount: data.paid_amount ? Number(data.paid_amount) : undefined,
        paidBy: data.paid_by_id || undefined,
        dueDay: data.due_day || undefined,
        splitAmong: data.split_among || undefined,
      };

      setItems((prev) => [...prev, mapped]);
      toast.success("Item fixo adicionado!");
      return data.id;
    } catch (error) {
      console.error("Error adding recurring item:", error);
      toast.error("Erro ao adicionar item fixo");
      return null;
    }
  }, [groupId, selectedMonth]);

  // Remove recurring item
  const removeRecurringItem = useCallback(async (itemId: string) => {
    try {
      const { error } = await supabase
        .from("recurring_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;

      setItems((prev) => prev.filter((item) => item.id !== itemId));
      toast.success("Item fixo removido!");
    } catch (error) {
      console.error("Error removing recurring item:", error);
      toast.error("Erro ao remover item fixo");
    }
  }, []);

  // Update item status
  const updateItemStatus = useCallback(async (
    itemId: string,
    status: RecurringItemStatus,
    paidAmount?: number,
    paidBy?: string
  ) => {
    try {
      const updates: Record<string, unknown> = { status };
      if (paidAmount !== undefined) updates.paid_amount = paidAmount;
      if (paidBy !== undefined) updates.paid_by_id = paidBy;

      const { error } = await supabase
        .from("recurring_items")
        .update(updates)
        .eq("id", itemId);

      if (error) throw error;

      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? { ...item, status, paidAmount, paidBy }
            : item
        )
      );
    } catch (error) {
      console.error("Error updating item status:", error);
      toast.error("Erro ao atualizar status");
    }
  }, []);

  // Update recurring item
  const updateRecurringItem = useCallback(async (
    itemId: string,
    updates: Partial<RecurringItem>
  ) => {
    try {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.paidAmount !== undefined) dbUpdates.paid_amount = updates.paidAmount;
      if (updates.paidBy !== undefined) dbUpdates.paid_by_id = updates.paidBy;
      if (updates.dueDay !== undefined) dbUpdates.due_day = updates.dueDay;
      if (updates.splitAmong !== undefined) dbUpdates.split_among = updates.splitAmong;

      const { error } = await supabase
        .from("recurring_items")
        .update(dbUpdates)
        .eq("id", itemId);

      if (error) throw error;

      setItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, ...updates } : item))
      );
    } catch (error) {
      console.error("Error updating recurring item:", error);
      toast.error("Erro ao atualizar item");
    }
  }, []);

  // Copy items from previous month
  const copyItemsFromPreviousMonth = useCallback(async () => {
    if (!groupId) return;

    try {
      // Find the previous month with items
      const currentDate = parse(selectedMonth, "yyyy-MM", new Date());
      currentDate.setMonth(currentDate.getMonth() - 1);
      const previousMonth = format(currentDate, "yyyy-MM");

      const { data: previousItems, error: fetchError } = await supabase
        .from("recurring_items")
        .select("*")
        .eq("group_id", groupId)
        .eq("month", previousMonth);

      if (fetchError) throw fetchError;

      if (!previousItems || previousItems.length === 0) {
        toast.info("Nenhum item no mês anterior para copiar");
        return;
      }

      // Copy items with reset status
      const newItems = previousItems.map((item) => ({
        group_id: groupId,
        month: selectedMonth,
        name: item.name,
        amount: item.amount,
        category: item.category,
        status: "pending",
        due_day: item.due_day,
        split_among: item.split_among,
      }));

      const { data: insertedItems, error: insertError } = await supabase
        .from("recurring_items")
        .insert(newItems)
        .select();

      if (insertError) throw insertError;

      const mapped: RecurringItem[] = (insertedItems || []).map((item) => ({
        id: item.id,
        name: item.name,
        amount: Number(item.amount),
        category: item.category,
        status: item.status as RecurringItemStatus,
        paidAmount: undefined,
        paidBy: undefined,
        dueDay: item.due_day || undefined,
        splitAmong: item.split_among || undefined,
      }));

      setItems((prev) => [...prev, ...mapped]);
      toast.success("Itens copiados do mês anterior!");
    } catch (error) {
      console.error("Error copying items:", error);
      toast.error("Erro ao copiar itens");
    }
  }, [groupId, selectedMonth]);

  // Navigate months
  const goToNextMonth = useCallback(async () => {
    const current = parse(selectedMonth, "yyyy-MM", new Date());
    current.setMonth(current.getMonth() + 1);
    const newMonth = format(current, "yyyy-MM");
    setSelectedMonth(newMonth);
  }, [selectedMonth]);

  const goToPreviousMonth = useCallback(() => {
    const current = parse(selectedMonth, "yyyy-MM", new Date());
    current.setMonth(current.getMonth() - 1);
    setSelectedMonth(format(current, "yyyy-MM"));
  }, [selectedMonth]);

  // Monthly totals
  const monthlyTotals = useMemo(() => {
    const total = items.reduce((sum, item) => sum + item.amount, 0);
    const paid = items
      .filter((item) => item.status === "paid")
      .reduce((sum, item) => sum + item.amount, 0);
    const partial = items
      .filter((item) => item.status === "partial")
      .reduce((sum, item) => sum + (item.paidAmount || 0), 0);
    const pending = total - paid - partial;

    return { total, paid, partial, pending };
  }, [items]);

  // Convert recurring items to expenses for unified calculations
  const recurringExpenses: Expense[] = useMemo(() => {
    return items
      .filter((item) => item.paidBy)
      .map((item) => ({
        id: `recurring-${item.id}`,
        description: item.name,
        amount: item.status === "partial" ? (item.paidAmount || 0) : item.amount,
        paidBy: item.paidBy!,
        category: item.category,
        date: new Date(),
        splitAmong: item.splitAmong,
        isRecurring: true,
        recurringItemId: item.id,
      }));
  }, [items]);

  return {
    selectedMonth,
    setSelectedMonth,
    currentMonthItems: items,
    monthlyTotals,
    recurringExpenses,
    isLoading,
    addRecurringItem,
    removeRecurringItem,
    updateItemStatus,
    updateRecurringItem,
    copyItemsFromPreviousMonth,
    goToNextMonth,
    goToPreviousMonth,
    refresh: fetchItems,
  };
}
