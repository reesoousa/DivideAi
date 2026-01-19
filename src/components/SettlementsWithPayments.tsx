import { useState } from "react";
import { ArrowRight, CheckCircle2, CreditCard, Upload, X } from "lucide-react";
import { Settlement, Participant, Payment } from "@/types/expense";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface SettlementsWithPaymentsProps {
  settlements: Settlement[];
  remainingSettlements: Settlement[];
  participants: Participant[];
  payments: Payment[];
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
  onAddPayment,
}: SettlementsWithPaymentsProps) {
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [note, setNote] = useState("");

  const getParticipantName = (id: string) => {
    return participants.find((p) => p.id === id)?.name || "Desconhecido";
  };

  const getParticipantAvatar = (id: string) => {
    return participants.find((p) => p.id === id)?.avatar || "bg-muted";
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
    setSelectedSettlement(settlement);
    setPaymentAmount(getRemainingAmount(settlement).toFixed(2));
    setReceiptUrl("");
    setNote("");
    setPaymentDialogOpen(true);
  };

  const handleConfirmPayment = () => {
    if (!selectedSettlement || !paymentAmount) return;
    
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) return;

    onAddPayment(
      selectedSettlement.from,
      selectedSettlement.to,
      amount,
      receiptUrl || undefined,
      note || undefined
    );
    
    setPaymentDialogOpen(false);
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
            <p className="text-muted-foreground text-sm text-center py-4">
              Tudo certo! Ninguém deve nada a ninguém 🎉
            </p>
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
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-8 h-8 rounded-full ${getParticipantAvatar(
                            settlement.from
                          )} flex items-center justify-center text-primary-foreground text-sm font-medium`}
                        >
                          {getParticipantName(settlement.from).charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-foreground text-sm">
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
                        <span className="font-medium text-foreground text-sm">
                          {getParticipantName(settlement.to)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex items-center justify-between">
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
                          size="sm"
                          onClick={() => handleOpenPayment(settlement)}
                          className="gap-1"
                        >
                          <CreditCard className="h-4 w-4" />
                          Registrar Pagamento
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

      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
          </DialogHeader>
          
          {selectedSettlement && (
            <div className="space-y-4">
              <div className="p-3 bg-accent/50 rounded-lg text-sm">
                <span className="font-medium">{getParticipantName(selectedSettlement.from)}</span>
                <span className="text-muted-foreground"> pagando para </span>
                <span className="font-medium">{getParticipantName(selectedSettlement.to)}</span>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="amount">Valor do Pagamento *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0,00"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="receiptUrl" className="flex items-center gap-1">
                  <Upload className="h-3 w-3" />
                  URL do Comprovante (opcional)
                </Label>
                <Input
                  id="receiptUrl"
                  type="url"
                  placeholder="https://..."
                  value={receiptUrl}
                  onChange={(e) => setReceiptUrl(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="note">Observação (opcional)</Label>
                <Input
                  id="note"
                  placeholder="Ex: Transferência PIX"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            </div>
          )}
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmPayment}>
              Confirmar Pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
