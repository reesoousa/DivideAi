import { useState } from "react";
import { Group } from "@/types/expense";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, ChevronRight, FolderOpen } from "lucide-react";

interface GroupsListProps {
  groups: Group[];
  onAddGroup: (name: string, description?: string) => string;
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
  const [showForm, setShowForm] = useState(false);

  const handleAdd = () => {
    if (newGroupName.trim()) {
      onAddGroup(newGroupName.trim(), newGroupDescription.trim() || undefined);
      setNewGroupName("");
      setNewGroupDescription("");
      setShowForm(false);
    }
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
          <div className="bg-muted/30 rounded-xl p-4 space-y-3 border border-border/30">
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
            <div className="flex gap-2">
              <Button onClick={handleAdd} size="sm" className="flex-1">
                Criar Grupo
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowForm(false);
                  setNewGroupName("");
                  setNewGroupDescription("");
                }}
              >
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
                  className={`w-12 h-12 rounded-xl ${group.color} flex items-center justify-center text-2xl shadow-sm`}
                >
                  {group.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {group.name}
                  </p>
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
