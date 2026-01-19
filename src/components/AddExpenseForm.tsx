import { useState } from "react";
import { Receipt } from "lucide-react";
import { Participant } from "@/types/expense";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { defaultCategories } from "@/lib/categories";

interface AddExpenseFormProps {
  participants: Participant[];
  onAddExpense: (
    description: string, 
    amount: number, 
    paidBy: string, 
    category: string,
    splitAmong?: string[]
  ) => void;
}

export function AddExpenseForm({
  participants,
  onAddExpense,
}: AddExpenseFormProps) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [category, setCategory] = useState("other");
  const [splitAmong, setSplitAmong] = useState<string[]>([]);
  const [showSplitOptions, setShowSplitOptions] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim() && amount && paidBy) {
      const selectedSplit = showSplitOptions && splitAmong.length > 0 
        ? splitAmong 
        : undefined;
      onAddExpense(description.trim(), parseFloat(amount), paidBy, category, selectedSplit);
      setDescription("");
      setAmount("");
      setPaidBy("");
      setCategory("other");
      setSplitAmong([]);
      setShowSplitOptions(false);
    }
  };

  const toggleParticipant = (id: string) => {
    setSplitAmong(prev => 
      prev.includes(id) 
        ? prev.filter(p => p !== id)
        : [...prev, id]
    );
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
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder="Valor (R$)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="0.01"
              disabled={isDisabled}
            />
            <Select value={category} onValueChange={setCategory} disabled={isDisabled}>
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                {defaultCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <span className="flex items-center gap-2">
                      <span>{cat.icon}</span>
                      <span>{cat.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="split-options" 
              checked={showSplitOptions}
              onCheckedChange={(checked) => setShowSplitOptions(checked as boolean)}
              disabled={isDisabled}
            />
            <Label htmlFor="split-options" className="text-sm text-muted-foreground cursor-pointer">
              Dividir apenas entre alguns participantes
            </Label>
          </div>

          {showSplitOptions && (
            <div className="p-3 bg-accent rounded-lg space-y-2">
              <p className="text-sm font-medium text-foreground">Dividir entre:</p>
              <div className="flex flex-wrap gap-2">
                {participants.map((p) => (
                  <div key={p.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`split-${p.id}`}
                      checked={splitAmong.includes(p.id)}
                      onCheckedChange={() => toggleParticipant(p.id)}
                    />
                    <Label htmlFor={`split-${p.id}`} className="text-sm cursor-pointer">
                      {p.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

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
