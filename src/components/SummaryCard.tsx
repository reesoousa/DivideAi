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
    <Card className="bg-primary text-primary-foreground">
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <Wallet className="h-6 w-6 mx-auto mb-2 opacity-80" />
            <p className="text-sm opacity-80">Total</p>
            <p className="text-2xl font-bold">{formatCurrency(totalExpenses)}</p>
          </div>
          <div>
            <Users className="h-6 w-6 mx-auto mb-2 opacity-80" />
            <p className="text-sm opacity-80">Por pessoa</p>
            <p className="text-2xl font-bold">{formatCurrency(perPerson)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
