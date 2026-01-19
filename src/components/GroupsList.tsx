import { useState } from "react";
import { Group } from "@/types/expense";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, ChevronRight, FolderOpen, Repeat, Calendar, Sparkles } from "lucide-react";
import { LucideIcon } from "@/components/LucideIcon";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Ícones disponíveis para escolha
const availableIcons = [
  { name: "Home", label: "Casa" },
  { name: "Plane", label: "Viagem" },
  { name: "PartyPopper", label: "Festa" },
  { name: "Briefcase", label: "Trabalho" },
  { name: "UtensilsCrossed", label: "Restaurante" },
  { name: "Gamepad2", label: "Jogos" },
  { name: "Palmtree", label: "Férias" },
  { name: "Car", label: "Carro" },
  { name: "ShoppingBag", label: "Compras" },
  { name: "GraduationCap", label: "Estudos" },
  { name: "Heart", label: "Relacionamento" },
  { name: "Music", label: "Música" },
  { name: "Camera", label: "Fotografia" },
  { name: "Coffee", label: "Café" },
  { name: "Dumbbell", label: "Academia" },
  { name: "Baby", label: "Família" },
];

interface GroupsListProps {
  groups: Group[];
  onAddGroup: (name: string, description?: string, isRecurring?: boolean, billingDay?: number, icon?: string) => string;
  onRemoveGroup: (id: string) => void;
  onSelectGroup: (id: string) => void;
}

export function GroupsList({
  groups,
  onAddGroup,
  onRemoveGroup,
  onSelectGroup,
}: GroupsListProps) {
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [billingDay, setBillingDay] = useState<string>("1");
  const [selectedIcon, setSelectedIcon] = useState<string>("Home");
  const [showForm, setShowForm] = useState(false);

  const handleAdd = () => {
    if (newGroupName.trim()) {
      onAddGroup(
        newGroupName.trim(),
        newGroupDescription.trim() || undefined,
        isRecurring,
        isRecurring ? parseInt(billingDay) : undefined,
        selectedIcon
      );
      resetForm();
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setNewGroupName("");
    setNewGroupDescription("");
    setIsRecurring(false);
    setBillingDay("1");
    setSelectedIcon("Home");
  };

  return (
    <Card className="bg-card/70 backdrop-blur-xl border-border/50 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between py-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FolderOpen className="h-5 w-5 text-primary" />
          Meus Grupos
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowForm(!showForm)}
          className="gap-1"
        >
          <Plus className="h-4 w-4" />
          Novo
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {showForm && (
          <div className="bg-muted/30 rounded-xl p-4 space-y-4 border border-border/30">
            <Input
              placeholder="Nome do grupo (ex: Casa, Viagem SP)"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="bg-background/80"
            />
            <Input
              placeholder="Descrição (opcional)"
              value={newGroupDescription}
              onChange={(e) => setNewGroupDescription(e.target.value)}
              className="bg-background/80"
            />

            {/* Seletor de ícone */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <Label className="font-medium">Ícone do grupo</Label>
              </div>
              <div className="grid grid-cols-8 gap-2">
                {availableIcons.map((icon) => (
                  <button
                    key={icon.name}
                    type="button"
                    onClick={() => setSelectedIcon(icon.name)}
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center transition-all",
                      selectedIcon === icon.name
                        ? "bg-primary text-primary-foreground shadow-md scale-110"
                        : "bg-background/80 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/30"
                    )}
                    title={icon.label}
                  >
                    <LucideIcon name={icon.name} className="h-5 w-5" />
                  </button>
                ))}
              </div>
            </div>

            {/* Toggle para grupo recorrente com rótulo dinâmico */}
            <div className="bg-background/50 rounded-lg p-3 space-y-3 border border-border/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isRecurring ? (
                    <Repeat className="h-4 w-4 text-primary" />
                  ) : (
                    <Sparkles className="h-4 w-4 text-muted-foreground" />
                  )}
                  <Label htmlFor="recurring-toggle" className="font-medium cursor-pointer">
                    {isRecurring ? "Grupo Recorrente" : "Grupo Único"}
                  </Label>
                </div>
                <Switch
                  id="recurring-toggle"
                  checked={isRecurring}
                  onCheckedChange={setIsRecurring}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {isRecurring
                  ? "Habilita filtros mensais, itens fixos e controle de pagamentos recorrentes."
                  : "Ideal para viagens, eventos ou divisões pontuais."}
              </p>

              {isRecurring && (
                <div className="pt-2 border-t border-border/30">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-sm text-muted-foreground">Dia de cobrança</Label>
                  </div>
                  <Select value={billingDay} onValueChange={setBillingDay}>
                    <SelectTrigger className="mt-2 bg-background/80">
                      <SelectValue placeholder="Selecione o dia" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                        <SelectItem key={day} value={day.toString()}>
                          Dia {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAdd} size="sm" className="flex-1">
                Criar Grupo
              </Button>
              <Button variant="ghost" size="sm" onClick={resetForm}>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {groups.length === 0 && !showForm ? (
          <div className="text-center py-8 text-muted-foreground">
            <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Nenhum grupo criado ainda.</p>
            <p className="text-xs mt-1">Crie um grupo para começar a dividir gastos!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {groups.map((group) => (
              <div
                key={group.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-background/50 hover:bg-background/80 transition-colors cursor-pointer group border border-border/30"
                onClick={() => onSelectGroup(group.id)}
              >
                <div
                  className={`w-12 h-12 rounded-xl ${group.color} flex items-center justify-center shadow-sm`}
                >
                  <LucideIcon name={group.icon} className="h-6 w-6 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground truncate">
                      {group.name}
                    </p>
                    {group.isRecurring && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/30">
                        <Repeat className="h-2.5 w-2.5 mr-0.5" />
                        Recorrente
                      </Badge>
                    )}
                  </div>
                  {group.description && (
                    <p className="text-xs text-muted-foreground truncate">
                      {group.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveGroup(group.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
