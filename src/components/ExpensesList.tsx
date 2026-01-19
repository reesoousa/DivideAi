import { Trash2 } from "lucide-react";
import { Expense, Participant } from "@/types/expense";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

  const getParticipantAvatar = (id: string) => {
    return participants.find((p) => p.id === id)?.avatar || "bg-muted";
  };

  if (expenses.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Gastos Registrados</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {expenses.map((expense) => (
          <div
            key={expense.id}
            className="flex items-center justify-between p-3 bg-accent rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full ${getParticipantAvatar(
                  expense.paidBy
                )} flex items-center justify-center text-primary-foreground text-sm font-medium`}
              >
                {getParticipantName(expense.paidBy).charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-foreground">{expense.description}</p>
                <p className="text-sm text-muted-foreground">
                  Pago por {getParticipantName(expense.paidBy)}
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
      </CardContent>
    </Card>
  );
}
