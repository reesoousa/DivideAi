import { Trash2 } from "lucide-react";
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
}: ExpensesListProps) {
  const getParticipantName = (id: string) => {
    return participants.find((p) => p.id === id)?.name || "Desconhecido";
  };

  if (expenses.length === 0) {
    return null;
  }

  // Group expenses by category
  const groupedExpenses = expenses.reduce((acc, expense) => {
    const category = expense.category || "other";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(expense);
    return acc;
  }, {} as Record<string, Expense[]>);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">
          Gastos Registrados ({expenses.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(groupedExpenses).map(([category, categoryExpenses]) => (
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
            {categoryExpenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between p-3 bg-accent rounded-lg ml-6"
              >
                <div className="flex items-center gap-3">
                  <ParticipantAvatar 
                    participant={getParticipantById(participants, expense.paidBy)} 
                    size="md"
                  />
                  <div>
                    <p className="font-medium text-foreground">{expense.description}</p>
                    <p className="text-xs text-muted-foreground">
                      Pago por {getParticipantName(expense.paidBy)}
                      {expense.splitAmong && expense.splitAmong.length > 0 && (
                        <span> • Dividido entre {expense.splitAmong.length} pessoas</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-primary">
                    {formatCurrency(expense.amount)}
                  </span>
                  <button
                    onClick={() => onRemoveExpense(expense.id)}
                    className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
