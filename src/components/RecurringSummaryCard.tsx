import { Card, CardContent } from "@/components/ui/card";
import { Repeat, TrendingUp, Users, CalendarDays } from "lucide-react";

interface RecurringSummaryCardProps {
  totalMonthly: number;
  paidAmount: number;
  pendingAmount: number;
  participantsCount: number;
  billingDay?: number;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function RecurringSummaryCard({
  totalMonthly,
  paidAmount,
  pendingAmount,
  participantsCount,
  billingDay,
}: RecurringSummaryCardProps) {
  const paidPercentage = totalMonthly > 0 ? (paidAmount / totalMonthly) * 100 : 0;

  return (
    <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Repeat className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Custos Fixos</p>
              <p className="text-xl font-bold text-foreground">
                {formatCurrency(totalMonthly)}
              </p>
            </div>
          </div>

          {billingDay && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              <span className="text-sm">Dia {billingDay}</span>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">Progresso do mês</span>
            <span className="text-primary font-medium">{paidPercentage.toFixed(0)}%</span>
          </div>
          <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${paidPercentage}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-emerald-600 mb-1">
              <TrendingUp className="h-3.5 w-3.5" />
            </div>
            <p className="text-xs text-muted-foreground">Pago</p>
            <p className="font-semibold text-sm text-emerald-600">
              {formatCurrency(paidAmount)}
            </p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-amber-600 mb-1">
              <Repeat className="h-3.5 w-3.5" />
            </div>
            <p className="text-xs text-muted-foreground">Pendente</p>
            <p className="font-semibold text-sm text-amber-600">
              {formatCurrency(pendingAmount)}
            </p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-primary mb-1">
              <Users className="h-3.5 w-3.5" />
            </div>
            <p className="text-xs text-muted-foreground">Pessoas</p>
            <p className="font-semibold text-sm">{participantsCount}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
