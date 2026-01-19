import { useState } from "react";
import { UserPlus, X } from "lucide-react";
import { Participant } from "@/types/expense";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ParticipantsListProps {
  participants: Participant[];
  onAddParticipant: (name: string) => void;
  onRemoveParticipant: (id: string) => void;
}

export function ParticipantsList({
  participants,
  onAddParticipant,
  onRemoveParticipant,
}: ParticipantsListProps) {
  const [newName, setNewName] = useState("");

  const handleAdd = () => {
    if (newName.trim()) {
      onAddParticipant(newName.trim());
      setNewName("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAdd();
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-primary" />
          Participantes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Nome do amigo"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button onClick={handleAdd} size="sm">
            Adicionar
          </Button>
        </div>

        {participants.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">
            Adicione os participantes do grupo
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {participants.map((participant) => (
              <div
                key={participant.id}
                className="flex items-center gap-2 bg-accent rounded-full pl-1 pr-2 py-1"
              >
                <div
                  className={`w-6 h-6 rounded-full ${participant.avatar} flex items-center justify-center text-primary-foreground text-xs font-medium`}
                >
                  {participant.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-foreground">{participant.name}</span>
                <button
                  onClick={() => onRemoveParticipant(participant.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
