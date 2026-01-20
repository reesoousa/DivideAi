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

interface GroupRecurringData {
  monthlyData: MonthlyRecurringData[];
  selectedMonth: string;
}

export function useRecurringItems(groupId: string | null) {
  // Store data per group
  const [groupsRecurringData, setGroupsRecurringData] = useState<Record<string, GroupRecurringData>>({});

  // Get current group's data or defaults
  const currentGroupData = useMemo((): GroupRecurringData => {
    if (!groupId) return { monthlyData: [], selectedMonth: format(new Date(), "yyyy-MM") };
    return groupsRecurringData[groupId] || { monthlyData: [], selectedMonth: format(new Date(), "yyyy-MM") };
  }, [groupsRecurringData, groupId]);

  const { monthlyData, selectedMonth } = currentGroupData;

  // Helper to update current group's data
  const updateGroupRecurringData = useCallback((updater: (data: GroupRecurringData) => GroupRecurringData) => {
    if (!groupId) return;
    setGroupsRecurringData(prev => ({
      ...prev,
      [groupId]: updater(prev[groupId] || { monthlyData: [], selectedMonth: format(new Date(), "yyyy-MM") })
    }));
  }, [groupId]);

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

      updateGroupRecurringData((data) => {
        const existingMonthIndex = data.monthlyData.findIndex(
          (d) => d.month === data.selectedMonth
        );

        if (existingMonthIndex >= 0) {
          const updatedMonthlyData = [...data.monthlyData];
          updatedMonthlyData[existingMonthIndex] = {
            ...updatedMonthlyData[existingMonthIndex],
            items: [...updatedMonthlyData[existingMonthIndex].items, newItem],
          };
          return { ...data, monthlyData: updatedMonthlyData };
        }

        return {
          ...data,
          monthlyData: [...data.monthlyData, { month: data.selectedMonth, items: [newItem] }],
        };
      });

      return newItem.id;
    },
    [updateGroupRecurringData]
  );

  // Remove um item recorrente
  const removeRecurringItem = useCallback(
    (itemId: string) => {
      updateGroupRecurringData((data) => ({
        ...data,
        monthlyData: data.monthlyData.map((monthData) => ({
          ...monthData,
          items: monthData.items.filter((item) => item.id !== itemId),
        })),
      }));
    },
    [updateGroupRecurringData]
  );

  // Atualiza o status de um item
  const updateItemStatus = useCallback(
    (
      itemId: string,
      status: RecurringItemStatus,
      paidAmount?: number,
      paidBy?: string
    ) => {
      updateGroupRecurringData((data) => ({
        ...data,
        monthlyData: data.monthlyData.map((monthData) => ({
          ...monthData,
          items: monthData.items.map((item) =>
            item.id === itemId
              ? { ...item, status, paidAmount, paidBy }
              : item
          ),
        })),
      }));
    },
    [updateGroupRecurringData]
  );

  // Atualiza um item
  const updateRecurringItem = useCallback(
    (itemId: string, updates: Partial<RecurringItem>) => {
      updateGroupRecurringData((data) => ({
        ...data,
        monthlyData: data.monthlyData.map((monthData) => ({
          ...monthData,
          items: monthData.items.map((item) =>
            item.id === itemId ? { ...item, ...updates } : item
          ),
        })),
      }));
    },
    [updateGroupRecurringData]
  );

  // Copia itens de um mês para outro (para itens recorrentes)
  const copyItemsToMonth = useCallback(
    (fromMonth: string, toMonth: string) => {
      updateGroupRecurringData((data) => {
        const fromData = data.monthlyData.find((d) => d.month === fromMonth);
        if (!fromData) return data;

        const copiedItems: RecurringItem[] = fromData.items.map((item) => ({
          ...item,
          id: crypto.randomUUID(),
          status: "pending" as RecurringItemStatus,
          paidAmount: undefined,
          paidBy: undefined,
        }));

        const existingIndex = data.monthlyData.findIndex((d) => d.month === toMonth);
        if (existingIndex >= 0) {
          const updatedMonthlyData = [...data.monthlyData];
          updatedMonthlyData[existingIndex] = {
            ...updatedMonthlyData[existingIndex],
            items: [...updatedMonthlyData[existingIndex].items, ...copiedItems],
          };
          return { ...data, monthlyData: updatedMonthlyData };
        }
        return {
          ...data,
          monthlyData: [...data.monthlyData, { month: toMonth, items: copiedItems }],
        };
      });
    },
    [updateGroupRecurringData]
  );

  // Inicializa mês com itens do mês anterior se vazio
  const initializeMonth = useCallback(
    (month: string) => {
      updateGroupRecurringData((data) => {
        const existingData = data.monthlyData.find((d) => d.month === month);
        if (existingData && existingData.items.length > 0) return data;

        // Busca o mês anterior mais próximo com itens
        const sortedMonths = data.monthlyData
          .filter((d) => d.month < month && d.items.length > 0)
          .sort((a, b) => b.month.localeCompare(a.month));

        if (sortedMonths.length > 0) {
          const fromData = sortedMonths[0];
          const copiedItems: RecurringItem[] = fromData.items.map((item) => ({
            ...item,
            id: crypto.randomUUID(),
            status: "pending" as RecurringItemStatus,
            paidAmount: undefined,
            paidBy: undefined,
          }));

          const existingIndex = data.monthlyData.findIndex((d) => d.month === month);
          if (existingIndex >= 0) {
            const updatedMonthlyData = [...data.monthlyData];
            updatedMonthlyData[existingIndex] = {
              ...updatedMonthlyData[existingIndex],
              items: [...updatedMonthlyData[existingIndex].items, ...copiedItems],
            };
            return { ...data, monthlyData: updatedMonthlyData };
          }
          return {
            ...data,
            monthlyData: [...data.monthlyData, { month, items: copiedItems }],
          };
        }

        return data;
      });
    },
    [updateGroupRecurringData]
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

  // Set selected month
  const setSelectedMonth = useCallback((month: string) => {
    updateGroupRecurringData((data) => ({
      ...data,
      selectedMonth: month,
    }));
  }, [updateGroupRecurringData]);

  // Navega para o próximo mês
  const goToNextMonth = useCallback(() => {
    updateGroupRecurringData((data) => {
      const current = parse(data.selectedMonth, "yyyy-MM", new Date());
      current.setMonth(current.getMonth() + 1);
      const newMonth = format(current, "yyyy-MM");
      
      // Check if we need to initialize the new month
      const existingData = data.monthlyData.find((d) => d.month === newMonth);
      if (!existingData || existingData.items.length === 0) {
        // Find previous month with items
        const sortedMonths = data.monthlyData
          .filter((d) => d.month < newMonth && d.items.length > 0)
          .sort((a, b) => b.month.localeCompare(a.month));

        if (sortedMonths.length > 0) {
          const fromData = sortedMonths[0];
          const copiedItems: RecurringItem[] = fromData.items.map((item) => ({
            ...item,
            id: crypto.randomUUID(),
            status: "pending" as RecurringItemStatus,
            paidAmount: undefined,
            paidBy: undefined,
          }));

          return {
            ...data,
            selectedMonth: newMonth,
            monthlyData: [...data.monthlyData, { month: newMonth, items: copiedItems }],
          };
        }
      }
      
      return { ...data, selectedMonth: newMonth };
    });
  }, [updateGroupRecurringData]);

  // Navega para o mês anterior
  const goToPreviousMonth = useCallback(() => {
    updateGroupRecurringData((data) => {
      const current = parse(data.selectedMonth, "yyyy-MM", new Date());
      current.setMonth(current.getMonth() - 1);
      return { ...data, selectedMonth: format(current, "yyyy-MM") };
    });
  }, [updateGroupRecurringData]);

  // Clean up group data when a group is deleted
  const clearGroupRecurringData = useCallback((gId: string) => {
    setGroupsRecurringData(prev => {
      const newData = { ...prev };
      delete newData[gId];
      return newData;
    });
  }, []);

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
    clearGroupRecurringData,
  };
}
