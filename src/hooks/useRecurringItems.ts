import { useState, useCallback, useMemo } from "react";
import { RecurringItem, MonthlyRecurringData, RecurringItemStatus } from "@/types/expense";
import { format, parse } from "date-fns";

// Itens fixos padrão sugeridos
export const defaultRecurringItems = [
  { name: "Internet", category: "utilities", icon: "Wifi" },
  { name: "Aluguel", category: "housing", icon: "Home" },
  { name: "Luz", category: "utilities", icon: "Lightbulb" },
  { name: "Água", category: "utilities", icon: "Droplets" },
  { name: "Gasolina", category: "transport", icon: "Fuel" },
  { name: "Gás", category: "utilities", icon: "Flame" },
  { name: "Streaming", category: "entertainment", icon: "Tv" },
  { name: "Academia", category: "health", icon: "Dumbbell" },
];

export function useRecurringItems() {
  const [monthlyData, setMonthlyData] = useState<MonthlyRecurringData[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    format(new Date(), "yyyy-MM")
  );

  // Obtém os itens do mês selecionado
  const currentMonthItems = useMemo(() => {
    const data = monthlyData.find((d) => d.month === selectedMonth);
    return data?.items || [];
  }, [monthlyData, selectedMonth]);

  // Adiciona um item recorrente
  const addRecurringItem = useCallback(
    (item: Omit<RecurringItem, "id" | "status">) => {
      const newItem: RecurringItem = {
        ...item,
        id: crypto.randomUUID(),
        status: "pending",
      };

      setMonthlyData((prev) => {
        const existingMonthIndex = prev.findIndex(
          (d) => d.month === selectedMonth
        );

        if (existingMonthIndex >= 0) {
          const updated = [...prev];
          updated[existingMonthIndex] = {
            ...updated[existingMonthIndex],
            items: [...updated[existingMonthIndex].items, newItem],
          };
          return updated;
        }

        return [...prev, { month: selectedMonth, items: [newItem] }];
      });

      return newItem.id;
    },
    [selectedMonth]
  );

  // Remove um item recorrente
  const removeRecurringItem = useCallback(
    (itemId: string) => {
      setMonthlyData((prev) =>
        prev.map((monthData) => ({
          ...monthData,
          items: monthData.items.filter((item) => item.id !== itemId),
        }))
      );
    },
    []
  );

  // Atualiza o status de um item
  const updateItemStatus = useCallback(
    (
      itemId: string,
      status: RecurringItemStatus,
      paidAmount?: number,
      paidBy?: string
    ) => {
      setMonthlyData((prev) =>
        prev.map((monthData) => ({
          ...monthData,
          items: monthData.items.map((item) =>
            item.id === itemId
              ? { ...item, status, paidAmount, paidBy }
              : item
          ),
        }))
      );
    },
    []
  );

  // Atualiza um item
  const updateRecurringItem = useCallback(
    (itemId: string, updates: Partial<RecurringItem>) => {
      setMonthlyData((prev) =>
        prev.map((monthData) => ({
          ...monthData,
          items: monthData.items.map((item) =>
            item.id === itemId ? { ...item, ...updates } : item
          ),
        }))
      );
    },
    []
  );

  // Copia itens de um mês para outro (para itens recorrentes)
  const copyItemsToMonth = useCallback(
    (fromMonth: string, toMonth: string) => {
      const fromData = monthlyData.find((d) => d.month === fromMonth);
      if (!fromData) return;

      const copiedItems: RecurringItem[] = fromData.items.map((item) => ({
        ...item,
        id: crypto.randomUUID(),
        status: "pending" as RecurringItemStatus,
        paidAmount: undefined,
        paidBy: undefined,
      }));

      setMonthlyData((prev) => {
        const existingIndex = prev.findIndex((d) => d.month === toMonth);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            items: [...updated[existingIndex].items, ...copiedItems],
          };
          return updated;
        }
        return [...prev, { month: toMonth, items: copiedItems }];
      });
    },
    [monthlyData]
  );

  // Inicializa mês com itens do mês anterior se vazio
  const initializeMonth = useCallback(
    (month: string) => {
      const existingData = monthlyData.find((d) => d.month === month);
      if (existingData && existingData.items.length > 0) return;

      // Busca o mês anterior mais próximo com itens
      const sortedMonths = monthlyData
        .filter((d) => d.month < month && d.items.length > 0)
        .sort((a, b) => b.month.localeCompare(a.month));

      if (sortedMonths.length > 0) {
        copyItemsToMonth(sortedMonths[0].month, month);
      }
    },
    [monthlyData, copyItemsToMonth]
  );

  // Calcula totais do mês
  const monthlyTotals = useMemo(() => {
    const items = currentMonthItems;
    const total = items.reduce((sum, item) => sum + item.amount, 0);
    const paid = items
      .filter((item) => item.status === "paid")
      .reduce((sum, item) => sum + item.amount, 0);
    const partial = items
      .filter((item) => item.status === "partial")
      .reduce((sum, item) => sum + (item.paidAmount || 0), 0);
    const pending = total - paid - partial;

    return { total, paid, partial, pending };
  }, [currentMonthItems]);

  // Navega para o próximo mês
  const goToNextMonth = useCallback(() => {
    const current = parse(selectedMonth, "yyyy-MM", new Date());
    current.setMonth(current.getMonth() + 1);
    const newMonth = format(current, "yyyy-MM");
    setSelectedMonth(newMonth);
    initializeMonth(newMonth);
  }, [selectedMonth, initializeMonth]);

  // Navega para o mês anterior
  const goToPreviousMonth = useCallback(() => {
    const current = parse(selectedMonth, "yyyy-MM", new Date());
    current.setMonth(current.getMonth() - 1);
    setSelectedMonth(format(current, "yyyy-MM"));
  }, [selectedMonth]);

  return {
    selectedMonth,
    setSelectedMonth,
    currentMonthItems,
    monthlyTotals,
    addRecurringItem,
    removeRecurringItem,
    updateItemStatus,
    updateRecurringItem,
    copyItemsToMonth,
    initializeMonth,
    goToNextMonth,
    goToPreviousMonth,
    monthlyData,
  };
}
