import { useState } from "react";
import { RecurringItem, RecurringItemStatus, Participant } from "@/types/expense";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  Check,
  Clock,
  AlertCircle,
  Repeat,
  Wifi,
  Home,
  Lightbulb,
  Droplets,
  Fuel,
  Flame,
  Tv,
  Dumbbell,
  MoreHorizontal,
} from "lucide-react";
import { LucideIcon } from "@/components/LucideIcon";
import { defaultRecurringItems } from "@/hooks/useRecurringItems";
import { cn } from "@/lib/utils";

interface RecurringItemsListProps {
  items: RecurringItem[];
  participants: Participant[];
  onAddItem: (item: Omit<RecurringItem, "id" | "status">) => string;
  onRemoveItem: (id: string) => void;
  onUpdateStatus: (
    id: string,
    status: RecurringItemStatus,
    paidAmount?: number,
    paidBy?: string
  ) => void;
  onUpdateItem: (id: string, updates: Partial<RecurringItem>) => void;
  monthlyTotals: {
    total: number;
    paid: number;
    partial: number;
    pending: number;
  };
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

const statusConfig: Record<
  RecurringItemStatus,
  { label: string; icon: typeof Check; className: string }
> = {
  pending: {
    label: "Em aberto",
    icon: Clock,
    className: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  },
  paid: {
    label: "Pago",
    icon: Check,
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  },
  partial: {
    label: "Parcial",
    icon: AlertCircle,
    className: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  },
};

const categoryIcons: Record<string, string> = {
  utilities: "Zap",
  housing: "Home",
  transport: "Car",
  entertainment: "Tv",
  health: "Heart",
  food: "UtensilsCrossed",
  other: "MoreHorizontal",
};

export function RecurringItemsList({
  items,
  participants,
  onAddItem,
  onRemoveItem,
  onUpdateStatus,
  onUpdateItem,
  monthlyTotals,
}: RecurringItemsListProps) {
  const [showForm, setShowForm] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemAmount, setNewItemAmount] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("utilities");
  const [selectedQuickAdd, setSelectedQuickAdd] = useState<string | null>(null);
  const [paymentDialogItem, setPaymentDialogItem] = useState<RecurringItem | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentBy, setPaymentBy] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<RecurringItemStatus>("paid");

  const handleAddItem = () => {
    if (newItemName.trim() && parseFloat(newItemAmount) > 0) {
      onAddItem({
        name: newItemName.trim(),
        amount: parseFloat(newItemAmount),
        category: newItemCategory,
      });
      setNewItemName("");
      setNewItemAmount("");
      setNewItemCategory("utilities");
      setShowForm(false);
      setSelectedQuickAdd(null);
    }
  };

  const handleQuickAdd = (item: typeof defaultRecurringItems[0]) => {
    setNewItemName(item.name);
    setNewItemCategory(item.category);
    setSelectedQuickAdd(item.name);
    setShowForm(true);
  };

  const handlePaymentSubmit = () => {
    if (!paymentDialogItem) return;

    const amount = parseFloat(paymentAmount);
    if (amount > 0) {
      onUpdateStatus(
        paymentDialogItem.id,
        paymentStatus,
        paymentStatus === "partial" ? amount : paymentDialogItem.amount,
        paymentBy || undefined
      );
    }
    setPaymentDialogItem(null);
    setPaymentAmount("");
    setPaymentBy("");
    setPaymentStatus("paid");
  };

  const openPaymentDialog = (item: RecurringItem) => {
    setPaymentDialogItem(item);
    setPaymentAmount(item.amount.toString());
    setPaymentStatus("paid");
  };

  return (
    <Card className="bg-card/70 backdrop-blur-xl border-border/50 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Repeat className="h-5 w-5 text-primary" />
            Itens Fixos do Mês
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowForm(!showForm)}
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            Adicionar
          </Button>
        </div>

        {/* Resumo do mês */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="bg-muted/30 rounded-lg p-2 text-center">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="font-semibold text-sm">{formatCurrency(monthlyTotals.total)}</p>
          </div>
          <div className="bg-emerald-500/10 rounded-lg p-2 text-center">
            <p className="text-xs text-emerald-600">Pago</p>
            <p className="font-semibold text-sm text-emerald-600">
              {formatCurrency(monthlyTotals.paid + monthlyTotals.partial)}
            </p>
          </div>
          <div className="bg-amber-500/10 rounded-lg p-2 text-center">
            <p className="text-xs text-amber-600">Pendente</p>
            <p className="font-semibold text-sm text-amber-600">
              {formatCurrency(monthlyTotals.pending)}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {showForm && (
          <div className="bg-muted/30 rounded-xl p-4 space-y-3 border border-border/30">
            {/* Quick add buttons */}
            <div className="flex flex-wrap gap-2">
              {defaultRecurringItems.map((item) => (
                <Button
                  key={item.name}
                  variant={selectedQuickAdd === item.name ? "default" : "outline"}
                  size="sm"
                  className="text-xs gap-1"
                  onClick={() => handleQuickAdd(item)}
                >
                  <LucideIcon name={item.icon} className="h-3 w-3" />
                  {item.name}
                </Button>
              ))}
            </div>

            <Input
              placeholder="Nome do item"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="bg-background/80"
            />

            <Input
              type="number"
              placeholder="Valor (R$)"
              value={newItemAmount}
              onChange={(e) => setNewItemAmount(e.target.value)}
              className="bg-background/80"
            />

            <Select value={newItemCategory} onValueChange={setNewItemCategory}>
              <SelectTrigger className="bg-background/80">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="utilities">Utilidades</SelectItem>
                <SelectItem value="housing">Moradia</SelectItem>
                <SelectItem value="transport">Transporte</SelectItem>
                <SelectItem value="entertainment">Entretenimento</SelectItem>
                <SelectItem value="health">Saúde</SelectItem>
                <SelectItem value="food">Alimentação</SelectItem>
                <SelectItem value="other">Outros</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button onClick={handleAddItem} size="sm" className="flex-1">
                Adicionar Item
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowForm(false);
                  setNewItemName("");
                  setNewItemAmount("");
                  setSelectedQuickAdd(null);
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {items.length === 0 && !showForm ? (
          <div className="text-center py-8 text-muted-foreground">
            <Repeat className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Nenhum item fixo cadastrado.</p>
            <p className="text-xs mt-1">
              Adicione contas fixas como internet, aluguel, luz...
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => {
              const status = statusConfig[item.status];
              const StatusIcon = status.icon;

              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-background/50 border border-border/30 group"
                >
                  <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
                    <LucideIcon
                      name={categoryIcons[item.category] || "MoreHorizontal"}
                      className="h-5 w-5 text-muted-foreground"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground truncate">
                        {item.name}
                      </p>
                      <Badge
                        variant="outline"
                        className={cn("text-[10px] px-1.5 py-0", status.className)}
                      >
                        <StatusIcon className="h-3 w-3 mr-0.5" />
                        {status.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(item.amount)}
                      {item.status === "partial" && item.paidAmount && (
                        <span className="text-blue-600 ml-1">
                          ({formatCurrency(item.paidAmount)} pago)
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    {item.status !== "paid" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openPaymentDialog(item)}
                      >
                        <Check className="h-4 w-4 text-emerald-600" />
                      </Button>
                    )}
                    {item.status === "paid" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onUpdateStatus(item.id, "pending")}
                      >
                        <Clock className="h-4 w-4 text-amber-600" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => onRemoveItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Payment Dialog */}
        <Dialog
          open={!!paymentDialogItem}
          onOpenChange={(open) => !open && setPaymentDialogItem(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Pagamento</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Item</p>
                <p className="font-medium">{paymentDialogItem?.name}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Status</p>
                <Select
                  value={paymentStatus}
                  onValueChange={(v) => setPaymentStatus(v as RecurringItemStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Pago integralmente</SelectItem>
                    <SelectItem value="partial">Pago parcialmente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {paymentStatus === "partial" && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Valor pago (R$)
                  </p>
                  <Input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                  />
                </div>
              )}

              {participants.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Pago por (opcional)
                  </p>
                  <Select value={paymentBy} onValueChange={setPaymentBy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {participants.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={handlePaymentSubmit} className="flex-1">
                  Confirmar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPaymentDialogItem(null)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
