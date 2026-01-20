import { useState } from "react";
import { ArrowRight, CheckCircle2, CreditCard } from "lucide-react";
import { Settlement, Participant, Payment } from "@/types/expense";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ParticipantAvatar, getParticipantById } from "@/components/ParticipantAvatar";
import { PixPaymentModal } from "./PixPaymentModal";

interface SettlementsWithPaymentsProps {
  settlements: Settlement[];
  remainingSettlements: Settlement[];
  participants: Participant[];
  payments: Payment[];
  groupName?: string;
  onAddPayment: (
    from: string,
    to: string,
    amount: number,
    receiptUrl?: string,
    note?: string
  ) => void;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function SettlementsWithPayments({
  settlements,
  remainingSettlements,
  participants,
  payments,
  groupName,
  onAddPayment,
}: SettlementsWithPaymentsProps) {
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const getParticipantName = (id: string) => {
    return participants.find((p) => p.id === id)?.name || "Desconhecido";
  };

  const getPaidAmount = (from: string, to: string) => {
    return payments
      .filter((p) => p.settlementFrom === from && p.settlementTo === to)
      .reduce((sum, p) => sum + p.amount, 0);
  };

  const getRemainingAmount = (settlement: Settlement) => {
    const remaining = remainingSettlements.find(
      (s) => s.from === settlement.from && s.to === settlement.to
    );
    return remaining?.amount || 0;
  };

  const isFullyPaid = (settlement: Settlement) => {
    return getRemainingAmount(settlement) <= 0.01;
  };

  const handleOpenPayment = (settlement: Settlement) => {
    // Create a settlement with remaining amount for the modal
    const remainingAmount = getRemainingAmount(settlement);
    setSelectedSettlement({
      ...settlement,
      amount: remainingAmount
    });
    setPaymentModalOpen(true);
  };

  const handleConfirmPayment = (amount: number, receiptUrl?: string, note?: string) => {
    if (!selectedSettlement) return;
    
    onAddPayment(
      selectedSettlement.from,
      selectedSettlement.to,
      amount,
      receiptUrl,
      note
    );
    
    setPaymentModalOpen(false);
    setSelectedSettlement(null);
  };

  if (participants.length < 2) {
    return null;
  }

  return (
    <>
      <Card className="bg-card/70 backdrop-blur-xl border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Acerto de Contas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {settlements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
              <CheckCircle2 className="h-8 w-8 mb-2 text-primary" />
              <p className="text-sm text-center">Tudo certo! Ninguém deve nada a ninguém</p>
            </div>
          ) : (
            <div className="space-y-3">
              {settlements.map((settlement, index) => {
                const fullyPaid = isFullyPaid(settlement);
                const paidAmount = getPaidAmount(settlement.from, settlement.to);
                const remainingAmount = getRemainingAmount(settlement);
                
                return (
                  <div
                    key={index}
                    className={`p-4 rounded-xl border transition-all ${
                      fullyPaid
                        ? "bg-green-500/10 border-green-500/30"
                        : "bg-accent/50 border-border/30"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      {/* Mobile-friendly layout: stack on small screens */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <ParticipantAvatar 
                          participant={getParticipantById(participants, settlement.from)} 
                          size="md"
                        />
                        <span className="font-medium text-foreground text-sm">
                          {getParticipantName(settlement.from)}
                        </span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <ParticipantAvatar 
                          participant={getParticipantById(participants, settlement.to)} 
                          size="md"
                        />
                        <span className="font-medium text-foreground text-sm">
                          {getParticipantName(settlement.to)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">Total:</span>
                          <span className="font-medium">{formatCurrency(settlement.amount)}</span>
                        </div>
                        {paidAmount > 0 && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">Pago:</span>
                            <span className="font-medium text-green-600">{formatCurrency(paidAmount)}</span>
                          </div>
                        )}
                        {!fullyPaid && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">Restante:</span>
                            <span className="font-bold text-primary">{formatCurrency(remainingAmount)}</span>
                          </div>
                        )}
                      </div>
                      
                      {fullyPaid ? (
                        <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                          <CheckCircle2 className="h-4 w-4" />
                          Quitado
                        </div>
                      ) : (
                        <Button
                          size="default"
                          onClick={() => handleOpenPayment(settlement)}
                          className="gap-2 w-full sm:w-auto"
                        >
                          <CreditCard className="h-4 w-4" />
                          Realizar Pagamento
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Unified Payment Modal */}
      {selectedSettlement && (
        <PixPaymentModal
          open={paymentModalOpen}
          onOpenChange={setPaymentModalOpen}
          settlement={selectedSettlement}
          participants={participants}
          groupName={groupName}
          onConfirmPayment={handleConfirmPayment}
        />
      )}
    </>
  );
}
