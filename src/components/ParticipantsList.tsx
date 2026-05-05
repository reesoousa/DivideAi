import { useState, useRef } from "react";
import { UserPlus, X, Edit2, Check, Share2, Image, Palette, Plus, Key, Link as LinkIcon, Copy, Loader2, Trash2 } from "lucide-react";
import { Participant, PixKey, PixKeyType, GroupInvite } from "@/types/expense";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PixKeyManager } from "./PixKeyManager";
import { InviteQRCode } from "./InviteQRCode";
import { toast } from "sonner";

interface ParticipantsListProps {
  participants: Participant[];
  onAddParticipant: (
    name: string, 
    role?: string, 
    participationPercentage?: number,
    avatarColor?: string,
    avatarImage?: string
  ) => void;
  onUpdateParticipant: (id: string, updates: Partial<Participant>) => void;
  onRemoveParticipant: (id: string) => void;
  // New invite props
  isAdmin?: boolean;
  invites?: GroupInvite[];
  onGenerateInvite?: () => Promise<string | null>;
  onRevokeInvite?: (inviteId: string) => Promise<void>;
  isGeneratingInvite?: boolean;
}

// 7 cores pré-definidas + opção de color picker
const avatarColorOptions = [
  { value: "#E57373", label: "Vermelho" },
  { value: "#64B5F6", label: "Azul" },
  { value: "#81C784", label: "Verde" },
  { value: "#FFD54F", label: "Amarelo" },
  { value: "#BA68C8", label: "Roxo" },
  { value: "#4DB6AC", label: "Teal" },
  { value: "#A1887F", label: "Marrom" },
];

export function ParticipantsList({
  participants,
  onAddParticipant,
  onUpdateParticipant,
  onRemoveParticipant,
  isAdmin = false,
  invites = [],
  onGenerateInvite,
  onRevokeInvite,
  isGeneratingInvite = false,
}: ParticipantsListProps) {
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  
  // Avatar customization states
  const [avatarTab, setAvatarTab] = useState<string>("color");
  const [selectedColor, setSelectedColor] = useState(avatarColorOptions[0].value);
  const [customColor, setCustomColor] = useState("#6B7280");
  const [useCustomColor, setUseCustomColor] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const colorPickerRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdd = () => {
    if (newName.trim()) {
      const finalColor = avatarTab === "color" 
        ? (useCustomColor ? customColor : selectedColor) 
        : undefined;
      
      onAddParticipant(
        newName.trim(), 
        newRole.trim() || undefined,
        undefined,
        finalColor,
        avatarTab === "image" ? avatarPreview || undefined : undefined
      );
      setNewName("");
      setNewRole("");
      setAvatarPreview(null);
      setSelectedColor(avatarColorOptions[0].value);
      setUseCustomColor(false);
      setAvatarTab("color");
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

  const handleGenerateAndCopyLink = async () => {
    if (!onGenerateInvite) return;
    
    const link = await onGenerateInvite();
    if (link) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  const handleCopyExistingLink = async (code: string) => {
    const link = `${window.location.origin}/join/${code}`;
    await navigator.clipboard.writeText(link);
    setCopiedLink(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const getRoleLabel = (role?: string) => {
    const roles: Record<string, string> = {
      organizer: "Organizador",
      member: "Membro",
      guest: "Convidado",
    };
    return roles[role || ""] || role || "";
  };

  const renderAvatar = (participant: Participant) => {
    if (participant.avatarType === 'image' && participant.avatarImage) {
      return (
        <img 
          src={participant.avatarImage} 
          alt={participant.name}
          className="w-10 h-10 rounded-full object-cover"
        />
      );
    }
    // Check if avatar is a hex color or a Tailwind class
    const isHexColor = participant.avatar?.startsWith('#');
    
    return (
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
          isHexColor ? 'text-white' : `${participant.avatar} text-primary-foreground`
        }`}
        style={isHexColor ? { backgroundColor: participant.avatar } : undefined}
      >
        {participant.name.charAt(0).toUpperCase()}
      </div>
    );
  };

  return (
    <Card className="bg-card/70 backdrop-blur-xl border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Participantes ({participants.length})
          </div>
          <div className="flex items-center gap-2">
            {/* Botão Convidar - ícone apenas no mobile */}
            <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="ghost" className="gap-1.5 px-2 sm:px-3">
                  <Share2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Convidar</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Share2 className="h-5 w-5 text-primary" />
                    Link de Convite
                  </DialogTitle>
                  <DialogDescription>
                    {isAdmin 
                      ? invites.length > 0 
                        ? "Gerencie o link de convite ativo do grupo"
                        : "Gere um link para convidar novas pessoas ao grupo"
                      : "Solicite ao administrador um link de convite"
                    }
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {isAdmin && onGenerateInvite ? (
                    <>
                      {invites.length > 0 ? (
                        <>
                          {/* Active invite display */}
                          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-3">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                              <span className="text-sm font-medium text-primary">Link ativo</span>
                            </div>
                            {invites.map((invite) => (
                              <div key={invite.id} className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <code className="flex-1 text-xs bg-muted px-2 py-1.5 rounded-md font-mono truncate">
                                    .../{invite.inviteCode}
                                  </code>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handleCopyExistingLink(invite.inviteCode)}
                                    className="h-8 w-8 shrink-0"
                                  >
                                    {copiedLink ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                  </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {invite.useCount} pessoa(s) entrou(aram)
                                  {invite.expiresAt && ` • Expira em ${new Date(invite.expiresAt).toLocaleDateString()}`}
                                </p>
                              </div>
                            ))}
                          </div>

                          {/* Revoke invite with confirmation */}
                          {onRevokeInvite && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Revogar link
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Revogar link de convite?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    O link será desativado permanentemente. Qualquer pessoa que tentar usá-lo receberá uma mensagem de que o convite foi revogado.
                                    <br /><br />
                                    <strong>Isso não remove pessoas que já entraram.</strong>
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => {
                                      invites.forEach(invite => onRevokeInvite(invite.id));
                                    }}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Revogar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center">
                          Nenhum link ativo. Gere um link para convidar pessoas.
                        </p>
                      )}

                      <Button
                        onClick={handleGenerateAndCopyLink}
                        disabled={isGeneratingInvite}
                        className="w-full"
                      >
                        {isGeneratingInvite ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <LinkIcon className="h-4 w-4 mr-2" />
                        )}
                        {invites.length > 0 ? "Gerar novo link" : "Gerar link de convite"}
                      </Button>

                      {invites.length > 0 && (
                        <p className="text-xs text-muted-foreground text-center">
                          Gerar novo link desativa o atual automaticamente
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">
                        Apenas administradores podem gerar links de convite.
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Peça ao administrador do grupo para compartilhar um link com você.
                      </p>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            {/* Botão Adicionar - ícone "+" apenas no mobile */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-1.5 px-2 sm:px-3">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Adicionar</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
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

                  {/* Avatar Customization */}
                  <div className="space-y-2">
                    <Label>Avatar</Label>
                    <Tabs value={avatarTab} onValueChange={setAvatarTab}>
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="color" className="flex items-center gap-1">
                          <Palette className="h-4 w-4" />
                          Cor
                        </TabsTrigger>
                        <TabsTrigger value="image" className="flex items-center gap-1">
                          <Image className="h-4 w-4" />
                          Foto
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="color" className="mt-3">
                        <div className="flex flex-wrap gap-2 sm:gap-2">
                          {avatarColorOptions.map((color) => (
                            <button
                              key={color.value}
                              type="button"
                              onClick={() => {
                                setSelectedColor(color.value);
                                setUseCustomColor(false);
                              }}
                              className={`w-11 h-11 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all active:scale-95 ${
                                selectedColor === color.value && !useCustomColor
                                  ? "ring-2 ring-primary ring-offset-2 ring-offset-background" 
                                  : "hover:scale-105"
                              }`}
                              style={{ backgroundColor: color.value }}
                            >
                              {selectedColor === color.value && !useCustomColor && (
                                <Check className="h-4 w-4 text-white" />
                              )}
                            </button>
                          ))}
                          {/* Color Picker option */}
                          <button
                            type="button"
                            onClick={() => {
                              setUseCustomColor(true);
                              colorPickerRef.current?.click();
                            }}
                            className={`w-11 h-11 sm:w-10 sm:h-10 rounded-full border-2 border-dashed border-border flex items-center justify-center transition-all active:scale-95 ${
                              useCustomColor
                                ? "ring-2 ring-primary ring-offset-2 ring-offset-background" 
                                : "hover:scale-105 hover:border-primary"
                            }`}
                            style={useCustomColor ? { backgroundColor: customColor } : undefined}
                          >
                            {useCustomColor ? (
                              <Check className="h-4 w-4 text-white" />
                            ) : (
                              <Plus className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>
                          <input
                            ref={colorPickerRef}
                            type="color"
                            value={customColor}
                            onChange={(e) => {
                              setCustomColor(e.target.value);
                              setUseCustomColor(true);
                            }}
                            className="hidden"
                          />
                        </div>
                      </TabsContent>
                      <TabsContent value="image" className="mt-3">
                        <div className="flex flex-col items-center gap-3">
                          {avatarPreview ? (
                            <div className="relative">
                              <img 
                                src={avatarPreview} 
                                alt="Preview" 
                                className="w-20 h-20 rounded-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => setAvatarPreview(null)}
                                className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-1"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <div 
                              onClick={() => fileInputRef.current?.click()}
                              className="w-20 h-20 rounded-full bg-muted border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary transition-colors"
                            >
                              <Image className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            {avatarPreview ? "Trocar foto" : "Escolher foto"}
                          </Button>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>

                  <Button onClick={handleAdd} className="w-full" disabled={!newName.trim()}>
                    Adicionar Participante
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
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
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {renderAvatar(participant)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground">{participant.name}</p>
                        {participant.role && (
                          <p className="text-xs text-muted-foreground">
                            {getRoleLabel(participant.role)}
                          </p>
                        )}
                        {/* Pix Keys Display */}
                        {participant.pixKeys && participant.pixKeys.length > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            <Key className="h-3 w-3 text-primary" />
                            <span className="text-xs text-primary">
                              {participant.pixKeys.length} chave{participant.pixKeys.length > 1 ? 's' : ''} Pix
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {/* Add Pix Key Button */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <button
                            className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-primary active:bg-muted/50 rounded-lg transition-colors"
                          >
                            <Key className="h-4 w-4" />
                          </button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Chaves Pix de {participant.name}</DialogTitle>
                            <DialogDescription>
                              Gerencie as chaves Pix para receber pagamentos
                            </DialogDescription>
                          </DialogHeader>
                          <div className="py-4">
                            <PixKeyManager
                              pixKeys={participant.pixKeys || []}
                              onAddPixKey={(type, key, label) => {
                                const newKey: PixKey = {
                                  id: crypto.randomUUID(),
                                  type,
                                  key,
                                  label,
                                };
                                onUpdateParticipant(participant.id, {
                                  pixKeys: [...(participant.pixKeys || []), newKey],
                                });
                              }}
                              onRemovePixKey={(keyId) => {
                                onUpdateParticipant(participant.id, {
                                  pixKeys: (participant.pixKeys || []).filter((k) => k.id !== keyId),
                                });
                              }}
                            />
                          </div>
                        </DialogContent>
                      </Dialog>
                      <button
                        onClick={() => handleStartEdit(participant)}
                        className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-primary active:bg-muted/50 rounded-lg transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onRemoveParticipant(participant.id)}
                        className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-destructive active:bg-destructive/10 rounded-lg transition-colors"
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