import { useState } from "react";
import { Receipt } from "lucide-react";
import { Participant } from "@/types/expense";
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

interface AddExpenseFormProps {
  participants: Participant[];
  onAddExpense: (description: string, amount: number, paidBy: string) => void;
}

export function AddExpenseForm({
  participants,
  onAddExpense,
}: AddExpenseFormProps) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim() && amount && paidBy) {
      onAddExpense(description.trim(), parseFloat(amount), paidBy);
      setDescription("");
      setAmount("");
      setPaidBy("");
    }
  };

  const isDisabled = participants.length === 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Receipt className="h-5 w-5 text-primary" />
          Novo Gasto
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            placeholder="Descrição (ex: Pizza)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isDisabled}
          />
          <Input
            type="number"
            placeholder="Valor (R$)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0"
            step="0.01"
            disabled={isDisabled}
          />
          <Select value={paidBy} onValueChange={setPaidBy} disabled={isDisabled}>
            <SelectTrigger>
              <SelectValue placeholder="Quem pagou?" />
            </SelectTrigger>
            <SelectContent>
              {participants.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="submit" className="w-full" disabled={isDisabled}>
            Adicionar Gasto
          </Button>
        </form>
        {isDisabled && (
          <p className="text-muted-foreground text-sm text-center mt-3">
            Adicione participantes primeiro
          </p>
        )}
      </CardContent>
    </Card>
  );
}
