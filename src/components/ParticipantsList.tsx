import { useState } from "react";
import { UserPlus, X, Edit2, Check } from "lucide-react";
import { Participant } from "@/types/expense";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface ParticipantsListProps {
  participants: Participant[];
  onAddParticipant: (name: string, role?: string, participationPercentage?: number) => void;
  onUpdateParticipant: (id: string, updates: Partial<Participant>) => void;
  onRemoveParticipant: (id: string) => void;
}

export function ParticipantsList({
  participants,
  onAddParticipant,
  onUpdateParticipant,
  onRemoveParticipant,
}: ParticipantsListProps) {
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");

  const handleAdd = () => {
    if (newName.trim()) {
      onAddParticipant(newName.trim(), newRole.trim() || undefined);
      setNewName("");
      setNewRole("");
      setIsDialogOpen(false);
    }
  };

  const handleStartEdit = (participant: Participant) => {
    setEditingParticipant(participant);
    setEditName(participant.name);
    setEditRole(participant.role || "");
  };

  const handleSaveEdit = () => {
    if (editingParticipant && editName.trim()) {
      onUpdateParticipant(editingParticipant.id, {
        name: editName.trim(),
        role: editRole.trim() || undefined,
      });
      setEditingParticipant(null);
    }
  };

  const getRoleLabel = (role?: string) => {
    const roles: Record<string, string> = {
      organizer: "Organizador",
      member: "Membro",
      guest: "Convidado",
    };
    return roles[role || ""] || role || "";
  };

  return (
    <Card className="bg-card/70 backdrop-blur-xl border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Participantes ({participants.length})
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <UserPlus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Participante</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    placeholder="Nome do participante"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Papel no grupo</Label>
                  <Input
                    id="role"
                    placeholder="Ex: Organizador, Membro, Convidado"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                  />
                </div>
                <Button onClick={handleAdd} className="w-full" disabled={!newName.trim()}>
                  Adicionar Participante
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {participants.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">
            Adicione os participantes do grupo
          </p>
        ) : (
          <div className="space-y-2">
            {participants.map((participant) => (
              <div
                key={participant.id}
                className="flex items-center justify-between p-3 bg-accent rounded-lg"
              >
                {editingParticipant?.id === participant.id ? (
                  <div className="flex-1 flex items-center gap-2">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-8"
                      placeholder="Nome"
                    />
                    <Input
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value)}
                      className="h-8 w-32"
                      placeholder="Papel"
                    />
                    <Button size="sm" variant="ghost" onClick={handleSaveEdit}>
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full ${participant.avatar} flex items-center justify-center text-primary-foreground text-sm font-medium`}
                      >
                        {participant.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{participant.name}</p>
                        {participant.role && (
                          <p className="text-xs text-muted-foreground">
                            {getRoleLabel(participant.role)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartEdit(participant)}
                        className="p-1 text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onRemoveParticipant(participant.id)}
                        className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
