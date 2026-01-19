import { ExpenseCategory } from "@/types/expense";

// Icon names from lucide-react to be used with the Icon component
export const defaultCategories: ExpenseCategory[] = [
  { id: "food", name: "Alimentação", icon: "Utensils", color: "bg-chart-1" },
  { id: "transport", name: "Transporte", icon: "Car", color: "bg-chart-2" },
  { id: "entertainment", name: "Entretenimento", icon: "PartyPopper", color: "bg-chart-3" },
  { id: "accommodation", name: "Hospedagem", icon: "Building", color: "bg-chart-4" },
  { id: "shopping", name: "Compras", icon: "ShoppingBag", color: "bg-chart-5" },
  { id: "drinks", name: "Bebidas", icon: "Wine", color: "bg-primary" },
  { id: "other", name: "Outros", icon: "Package", color: "bg-secondary" },
];

export function getCategoryById(id: string): ExpenseCategory | undefined {
  return defaultCategories.find((c) => c.id === id);
}

export function getCategoryColor(id: string): string {
  return getCategoryById(id)?.color || "bg-muted";
}

export function getCategoryIcon(id: string): string {
  return getCategoryById(id)?.icon || "Package";
}

export function getCategoryName(id: string): string {
  return getCategoryById(id)?.name || "Outros";
}
