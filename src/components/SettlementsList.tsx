import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Settlement, Participant } from "@/types/expense";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SettlementsListProps {
  settlements: Settlement[];
  participants: Participant[];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function SettlementsList({
  settlements,
  participants,
}: SettlementsListProps) {
  const getParticipantName = (id: string) => {
    return participants.find((p) => p.id === id)?.name || "Desconhecido";
  };

  const getParticipantAvatar = (id: string) => {
    return participants.find((p) => p.id === id)?.avatar || "bg-muted";
  };

  if (participants.length < 2) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-primary" />
          Acerto de Contas
        </CardTitle>
      </CardHeader>
      <CardContent>
        {settlements.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">
            Tudo certo! Ninguém deve nada a ninguém 🎉
          </p>
        ) : (
          <div className="space-y-3">
            {settlements.map((settlement, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-accent rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full ${getParticipantAvatar(
                      settlement.from
                    )} flex items-center justify-center text-primary-foreground text-sm font-medium`}
                  >
                    {getParticipantName(settlement.from).charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-foreground">
                    {getParticipantName(settlement.from)}
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <div
                    className={`w-8 h-8 rounded-full ${getParticipantAvatar(
                      settlement.to
                    )} flex items-center justify-center text-primary-foreground text-sm font-medium`}
                  >
                    {getParticipantName(settlement.to).charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-foreground">
                    {getParticipantName(settlement.to)}
                  </span>
                </div>
                <span className="font-bold text-primary">
                  {formatCurrency(settlement.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
