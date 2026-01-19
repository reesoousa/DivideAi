import { ExpenseCategory } from "@/types/expense";

export const defaultCategories: ExpenseCategory[] = [
  { id: "food", name: "Alimentação", icon: "🍕", color: "bg-chart-1" },
  { id: "transport", name: "Transporte", icon: "🚗", color: "bg-chart-2" },
  { id: "entertainment", name: "Entretenimento", icon: "🎉", color: "bg-chart-3" },
  { id: "accommodation", name: "Hospedagem", icon: "🏨", color: "bg-chart-4" },
  { id: "shopping", name: "Compras", icon: "🛍️", color: "bg-chart-5" },
  { id: "drinks", name: "Bebidas", icon: "🍻", color: "bg-primary" },
  { id: "other", name: "Outros", icon: "📦", color: "bg-secondary" },
];

export function getCategoryById(id: string): ExpenseCategory | undefined {
  return defaultCategories.find((c) => c.id === id);
}

export function getCategoryColor(id: string): string {
  return getCategoryById(id)?.color || "bg-muted";
}

export function getCategoryIcon(id: string): string {
  return getCategoryById(id)?.icon || "📦";
}

export function getCategoryName(id: string): string {
  return getCategoryById(id)?.name || "Outros";
}
