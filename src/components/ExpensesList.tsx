import { Trash2, Repeat } from "lucide-react";
import { Expense, Participant } from "@/types/expense";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCategoryIcon, getCategoryName } from "@/lib/categories";
import { Badge } from "@/components/ui/badge";
import { ParticipantAvatar, getParticipantById } from "@/components/ParticipantAvatar";
import { LucideIcon } from "@/components/LucideIcon";

interface ExpensesListProps {
  expenses: Expense[];
  participants: Participant[];
  onRemoveExpense: (id: string) => void;
  isRecurringGroup?: boolean;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function ExpensesList({
  expenses,
  participants,
  onRemoveExpense,
  isRecurringGroup = false,
}: ExpensesListProps) {
  const getParticipantName = (id: string) => {
    return participants.find((p) => p.id === id)?.name || "Desconhecido";
  };

  if (expenses.length === 0) {
    return null;
  }

  // Separate recurring and regular expenses for display
  const recurringExpenses = expenses.filter(e => e.isRecurring);
  const regularExpenses = expenses.filter(e => !e.isRecurring);

  // Group expenses by category
  const groupExpensesByCategory = (expenseList: Expense[]) => {
    return expenseList.reduce((acc, expense) => {
      const category = expense.category || "other";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(expense);
      return acc;
    }, {} as Record<string, Expense[]>);
  };

  const groupedRegularExpenses = groupExpensesByCategory(regularExpenses);
  const groupedRecurringExpenses = groupExpensesByCategory(recurringExpenses);

  const renderExpenseItem = (expense: Expense, showRecurringBadge: boolean = false) => (
    <div
      key={expense.id}
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-3 bg-accent rounded-lg ml-4 sm:ml-6"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <ParticipantAvatar 
          participant={getParticipantById(participants, expense.paidBy)} 
          size="md"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-foreground truncate">{expense.description}</p>
            {showRecurringBadge && expense.isRecurring && (
              <Badge 
                variant="outline" 
                className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/30 flex-shrink-0"
              >
                <Repeat className="h-2.5 w-2.5 mr-0.5" />
                Fixo
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            Pago por {getParticipantName(expense.paidBy)}
            {expense.splitAmong && expense.splitAmong.length > 0 && (
              <span> • Dividido entre {expense.splitAmong.length}</span>
            )}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between sm:justify-end gap-2 pl-11 sm:pl-0 flex-shrink-0">
        <span className="font-semibold text-primary whitespace-nowrap">
          {formatCurrency(expense.amount)}
        </span>
        {/* Don't show delete button for recurring expenses - they should be managed in the Fixos tab */}
        {!expense.isRecurring && (
          <button
            onClick={() => onRemoveExpense(expense.id)}
            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-destructive active:bg-destructive/10 rounded-lg transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );

  const renderCategorySection = (category: string, categoryExpenses: Expense[], showRecurringBadge: boolean = false) => (
    <div key={category} className="space-y-2">
      <div className="flex items-center gap-2">
        <LucideIcon name={getCategoryIcon(category)} className="h-5 w-5 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">
          {getCategoryName(category)}
        </span>
        <Badge variant="secondary" className="text-xs">
          {formatCurrency(categoryExpenses.reduce((sum, e) => sum + e.amount, 0))}
        </Badge>
      </div>
      {categoryExpenses.map((expense) => renderExpenseItem(expense, showRecurringBadge))}
    </div>
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">
          Gastos Registrados ({expenses.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recurring expenses section - only for recurring groups */}
        {isRecurringGroup && recurringExpenses.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <Repeat className="h-4 w-4" />
              Custos Fixos do Mês
            </div>
            {Object.entries(groupedRecurringExpenses).map(([category, categoryExpenses]) => 
              renderCategorySection(category, categoryExpenses, true)
            )}
            {regularExpenses.length > 0 && (
              <div className="border-t border-border/50 pt-3 mt-3">
                <p className="text-sm font-medium text-muted-foreground mb-2">Outros Gastos</p>
              </div>
            )}
          </div>
        )}

        {/* Regular expenses section */}
        {Object.entries(groupedRegularExpenses).map(([category, categoryExpenses]) => 
          renderCategorySection(category, categoryExpenses, false)
        )}
      </CardContent>
    </Card>
  );
}
