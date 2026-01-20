import { useState } from "react";
import { Plus, Trash2, Key, Mail, Phone, Hash, Building2 } from "lucide-react";
import { PixKey, PixKeyType } from "@/types/expense";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface PixKeyManagerProps {
  pixKeys: PixKey[];
  onAddPixKey: (type: PixKeyType, key: string, label?: string) => void;
  onRemovePixKey: (id: string) => void;
  compact?: boolean;
}

const pixKeyTypeLabels: Record<PixKeyType, { label: string; icon: React.ReactNode; placeholder: string }> = {
  cpf: { label: "CPF", icon: <Hash className="h-4 w-4" />, placeholder: "000.000.000-00" },
  cnpj: { label: "CNPJ", icon: <Building2 className="h-4 w-4" />, placeholder: "00.000.000/0000-00" },
  email: { label: "E-mail", icon: <Mail className="h-4 w-4" />, placeholder: "exemplo@email.com" },
  phone: { label: "Telefone", icon: <Phone className="h-4 w-4" />, placeholder: "+55 11 99999-9999" },
  random: { label: "Aleatória", icon: <Key className="h-4 w-4" />, placeholder: "Chave aleatória" },
};

export function PixKeyManager({ pixKeys, onAddPixKey, onRemovePixKey, compact }: PixKeyManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [keyType, setKeyType] = useState<PixKeyType>("cpf");
  const [keyValue, setKeyValue] = useState("");
  const [keyLabel, setKeyLabel] = useState("");

  const handleAdd = () => {
    if (keyValue.trim()) {
      onAddPixKey(keyType, keyValue.trim(), keyLabel.trim() || undefined);
      setKeyValue("");
      setKeyLabel("");
      setKeyType("cpf");
      setIsDialogOpen(false);
    }
  };

  const formatPixKey = (key: PixKey) => {
    // Mask part of the key for privacy
    const value = key.key;
    if (key.type === "cpf" && value.length >= 11) {
      return `***.***.${value.slice(-5, -2)}-${value.slice(-2)}`;
    }
    if (key.type === "cnpj" && value.length >= 14) {
      return `**.***.***/${value.slice(-6, -2)}-${value.slice(-2)}`;
    }
    if (key.type === "email") {
      const [user, domain] = value.split("@");
      if (user && domain) {
        return `${user.charAt(0)}***@${domain}`;
      }
    }
    if (key.type === "phone") {
      return `****${value.slice(-4)}`;
    }
    if (key.type === "random" && value.length > 8) {
      return `${value.slice(0, 4)}...${value.slice(-4)}`;
    }
    return value;
  };

  return (
    <div className="space-y-2">
      {pixKeys.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {pixKeys.map((pixKey) => (
            <Badge
              key={pixKey.id}
              variant="secondary"
              className="flex items-center gap-1.5 py-1 px-2"
            >
              {pixKeyTypeLabels[pixKey.type].icon}
              <span className="text-xs">
                {pixKey.label || pixKeyTypeLabels[pixKey.type].label}: {formatPixKey(pixKey)}
              </span>
              {!compact && (
                <button
                  onClick={() => onRemovePixKey(pixKey.id)}
                  className="ml-1 p-0.5 hover:bg-destructive/20 rounded transition-colors"
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setIsDialogOpen(true)}
        className="gap-1.5"
      >
        <Plus className="h-3.5 w-3.5" />
        {compact ? "Pix" : "Adicionar Chave Pix"}
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Chave Pix</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipo de Chave</Label>
              <Select value={keyType} onValueChange={(v) => setKeyType(v as PixKeyType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(pixKeyTypeLabels).map(([type, { label, icon }]) => (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center gap-2">
                        {icon}
                        {label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pixKey">Chave Pix *</Label>
              <Input
                id="pixKey"
                placeholder={pixKeyTypeLabels[keyType].placeholder}
                value={keyValue}
                onChange={(e) => setKeyValue(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pixLabel">Apelido (opcional)</Label>
              <Input
                id="pixLabel"
                placeholder="Ex: Conta Principal, Nubank..."
                value={keyLabel}
                onChange={(e) => setKeyLabel(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 flex-col-reverse sm:flex-row">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button onClick={handleAdd} disabled={!keyValue.trim()} className="w-full sm:w-auto">
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
