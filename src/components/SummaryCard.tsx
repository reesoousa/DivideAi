import { Wallet, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface SummaryCardProps {
  totalExpenses: number;
  participantsCount: number;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function SummaryCard({ totalExpenses, participantsCount }: SummaryCardProps) {
  const perPerson = participantsCount > 0 ? totalExpenses / participantsCount : 0;

  return (
    <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0 shadow-lg">
      <CardContent className="pt-6 pb-6">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 text-center">
          <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-3 sm:p-4">
            <Wallet className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-1.5 sm:mb-2 opacity-90" />
            <p className="text-xs sm:text-sm opacity-90">Total</p>
            <p className="text-lg sm:text-2xl font-bold truncate">{formatCurrency(totalExpenses)}</p>
          </div>
          <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-3 sm:p-4">
            <Users className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-1.5 sm:mb-2 opacity-90" />
            <p className="text-xs sm:text-sm opacity-90">Por pessoa</p>
            <p className="text-lg sm:text-2xl font-bold truncate">{formatCurrency(perPerson)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
