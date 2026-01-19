import { History, Receipt, Trash2, Image } from "lucide-react";
import { Payment, Participant } from "@/types/expense";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ParticipantAvatar, getParticipantById } from "@/components/ParticipantAvatar";

interface PaymentHistoryProps {
  payments: Payment[];
  participants: Participant[];
  onRemovePayment: (id: string) => void;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function PaymentHistory({
  payments,
  participants,
  onRemovePayment,
}: PaymentHistoryProps) {
  const getParticipantName = (id: string) => {
    return participants.find((p) => p.id === id)?.name || "Desconhecido";
  };

  if (payments.length === 0) {
    return (
      <Card className="bg-card/70 backdrop-blur-xl border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Histórico de Pagamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm text-center py-6">
            Nenhum pagamento registrado ainda.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Sort payments by date, most recent first
  const sortedPayments = [...payments].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <Card className="bg-card/70 backdrop-blur-xl border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          Histórico de Pagamentos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedPayments.map((payment) => (
            <div
              key={payment.id}
              className="p-4 bg-accent/50 rounded-xl border border-border/30"
            >
                <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <ParticipantAvatar 
                      participant={getParticipantById(participants, payment.settlementFrom)} 
                      size="md"
                    />
                    <span className="text-muted-foreground text-sm">→</span>
                    <ParticipantAvatar 
                      participant={getParticipantById(participants, payment.settlementTo)} 
                      size="md"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {getParticipantName(payment.settlementFrom)} pagou{" "}
                      {getParticipantName(payment.settlementTo)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(payment.date), "dd 'de' MMMM, yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-primary whitespace-nowrap">
                    {formatCurrency(payment.amount)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => onRemovePayment(payment.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {(payment.note || payment.receiptUrl) && (
                <div className="mt-3 pt-3 border-t border-border/30 flex items-center gap-3">
                  {payment.note && (
                    <p className="text-xs text-muted-foreground flex-1">
                      <Receipt className="h-3 w-3 inline mr-1" />
                      {payment.note}
                    </p>
                  )}
                  {payment.receiptUrl && (
                    <a
                      href={payment.receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <Image className="h-3 w-3" />
                      Ver comprovante
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
