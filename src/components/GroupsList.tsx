import { useState } from "react";
import { Group } from "@/types/expense";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, ChevronRight, FolderOpen, Repeat, Calendar, Sparkles, Loader2 } from "lucide-react";
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
  onAddGroup: (name: string, description?: string, isRecurring?: boolean, billingDay?: number, icon?: string) => Promise<string | null>;
  onRemoveGroup: (id: string) => void;
  onSelectGroup: (id: string) => void;
  onFirstGroupCreated?: () => void;
}

export function GroupsList({
  groups,
  onAddGroup,
  onRemoveGroup,
  onSelectGroup,
  onFirstGroupCreated,
}: GroupsListProps) {
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [billingDay, setBillingDay] = useState<string>("1");
  const [selectedIcon, setSelectedIcon] = useState<string>("Home");
  const [showForm, setShowForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAdd = async () => {
    if (newGroupName.trim() && !isCreating) {
      const isFirstGroup = groups.length === 0;
      setIsCreating(true);
      try {
        const groupId = await onAddGroup(
          newGroupName.trim(),
          newGroupDescription.trim() || undefined,
          isRecurring,
          isRecurring ? parseInt(billingDay) : undefined,
          selectedIcon
        );
        resetForm();
        
        // Trigger first group tutorial if this was the first group
        if (isFirstGroup && groupId && onFirstGroupCreated) {
          // Small delay to let the group be selected first
          setTimeout(() => {
            onFirstGroupCreated();
          }, 300);
        }
      } finally {
        setIsCreating(false);
      }
    }
  };

  const handleRemove = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      await onRemoveGroup(id);
    } finally {
      setDeletingId(null);
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
          <div className="bg-muted/30 rounded-lg p-4 space-y-4 border border-border/30">
            <Input
              placeholder="Nome do grupo (ex: Casa, Viagem SP)"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="bg-background/80"
              disabled={isCreating}
            />
            <Input
              placeholder="Descrição (opcional)"
              value={newGroupDescription}
              onChange={(e) => setNewGroupDescription(e.target.value)}
              className="bg-background/80"
              disabled={isCreating}
            />

            {/* Seletor de ícone */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <Label className="font-medium">Ícone do grupo</Label>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {availableIcons.map((icon) => (
                  <button
                    key={icon.name}
                    type="button"
                    onClick={() => setSelectedIcon(icon.name)}
                    disabled={isCreating}
                    className={cn(
                      "w-11 h-11 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all active:scale-95",
                      selectedIcon === icon.name
                        ? "bg-primary text-primary-foreground shadow-md scale-105"
                        : "bg-background/80 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/30",
                      isCreating && "opacity-50 cursor-not-allowed"
                    )}
                    title={icon.label}
                  >
                    <LucideIcon name={icon.name} className="h-5 w-5" />
                  </button>
                ))}
              </div>
            </div>

            {/* Seletor de tipo de grupo */}
            <div className="bg-background/50 rounded-lg p-4 space-y-3 border border-border/20">
              <Label className="font-medium text-sm">Tipo de grupo</Label>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsRecurring(false)}
                  disabled={isCreating}
                  className={cn(
                    "flex flex-col items-center text-center p-4 rounded-lg border-2 transition-colors",
                    !isRecurring
                      ? "bg-primary/10 border-primary"
                      : "bg-background/80 border-border/50 hover:bg-muted/50",
                    isCreating && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center mb-2",
                    !isRecurring ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <span className={cn(
                    "font-medium text-sm",
                    !isRecurring ? "text-primary" : "text-foreground"
                  )}>
                    Grupo Único
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">
                    Viagens, eventos pontuais
                  </span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setIsRecurring(true)}
                  disabled={isCreating}
                  className={cn(
                    "flex flex-col items-center text-center p-4 rounded-lg border-2 transition-colors",
                    isRecurring
                      ? "bg-primary/10 border-primary"
                      : "bg-background/80 border-border/50 hover:bg-muted/50",
                    isCreating && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center mb-2",
                    isRecurring ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    <Repeat className="h-4 w-4" />
                  </div>
                  <span className={cn(
                    "font-medium text-sm",
                    isRecurring ? "text-primary" : "text-foreground"
                  )}>
                    Grupo Recorrente
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">
                    Contas, despesas fixas
                  </span>
                </button>
              </div>

              {isRecurring && (
                <div className="pt-2 border-t border-border/30">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-sm text-muted-foreground">Dia de cobrança</Label>
                  </div>
                  <Select value={billingDay} onValueChange={setBillingDay} disabled={isCreating}>
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
              <Button onClick={handleAdd} size="sm" className="flex-1" disabled={isCreating || !newGroupName.trim()}>
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Criar Grupo"
                )}
              </Button>
              <Button variant="ghost" size="sm" onClick={resetForm} disabled={isCreating}>
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
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg bg-background/50 hover:bg-background/80 active:bg-background transition-colors cursor-pointer group border border-border/30",
                  deletingId === group.id && "opacity-50 pointer-events-none"
                )}
                onClick={() => onSelectGroup(group.id)}
              >
                <div
                  className={`w-12 h-12 rounded-lg ${group.color} flex items-center justify-center shadow-sm flex-shrink-0`}
                >
                  <LucideIcon name={group.icon} className="h-6 w-6 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-foreground truncate">
                      {group.name}
                    </p>
                    {group.isRecurring && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/30 flex-shrink-0">
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
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handleRemove(group.id, e)}
                    disabled={deletingId === group.id}
                  >
                    {deletingId === group.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 text-destructive" />
                    )}
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
