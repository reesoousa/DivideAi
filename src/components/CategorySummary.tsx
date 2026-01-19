import { Tag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getCategoryIcon, getCategoryName, getCategoryColor } from "@/lib/categories";

interface CategorySummaryProps {
  expensesByCategory: Record<string, number>;
  totalExpenses: number;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function CategorySummary({
  expensesByCategory,
  totalExpenses,
}: CategorySummaryProps) {
  const categories = Object.entries(expensesByCategory)
    .filter(([_, value]) => value > 0)
    .sort(([, a], [, b]) => b - a);

  if (categories.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Tag className="h-5 w-5 text-primary" />
          Resumo por Categoria
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {categories.map(([categoryId, amount]) => {
          const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
          
          return (
            <div key={categoryId} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getCategoryIcon(categoryId)}</span>
                  <span className="text-sm font-medium">{getCategoryName(categoryId)}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-primary">
                    {formatCurrency(amount)}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">
                    ({percentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
              <Progress value={percentage} className="h-2" />
            </div>
          );
        })}
        
        <div className="pt-3 border-t border-border">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-muted-foreground">
              Total ({categories.length} categorias)
            </span>
            <span className="text-lg font-bold text-primary">
              {formatCurrency(totalExpenses)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
