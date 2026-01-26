import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Group } from "@/types/expense";
import { useGroupMembers } from "@/hooks/useGroupMembers";
import { useSupabaseGroups } from "@/hooks/useSupabaseGroups";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import {
  ArrowLeft,
  Settings,
  Users,
  Link as LinkIcon,
  Copy,
  Check,
  Trash2,
  Crown,
  Shield,
  User,
  Loader2,
  Share2,
  Percent,
  Equal,
} from "lucide-react";
import { LucideIcon } from "@/components/LucideIcon";
import { toast } from "sonner";

// Icon options for groups (16 icons for 4x4 grid)
const iconOptions = [
  "Home", "Users", "Plane", "Utensils", "ShoppingCart", "Car", 
  "Briefcase", "Heart", "Music", "Gamepad2", "Dumbbell",
  "GraduationCap", "Tent", "PartyPopper", "Building2", "Wallet"
];

interface GroupSettingsProps {
  group: Group;
  participants: { id: string; name: string; participationPercentage?: number }[];
  onBack: () => void;
  onUpdateGroup: (id: string, updates: Partial<Group>) => Promise<void>;
  onDeleteGroup: (id: string) => Promise<void>;
  onUpdateParticipantPercentage: (id: string, percentage: number) => Promise<void>;
}

export default function GroupSettings({ 
  group, 
  participants,
  onBack, 
  onUpdateGroup,
  onDeleteGroup,
  onUpdateParticipantPercentage,
}: GroupSettingsProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    members, 
    invites, 
    isLoading, 
    isAdmin, 
    isOwner,
    ownerProfile,
    generateInviteLink,
    deactivateInvite,
    removeMember,
    updateMemberRole,
  } = useGroupMembers(group.id);

  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description || "");
  const [selectedIcon, setSelectedIcon] = useState(group.icon);
  const [splitType, setSplitType] = useState<'equal' | 'percentage'>(group.splitType || 'equal');
  const [percentages, setPercentages] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Initialize percentages from participants
  useEffect(() => {
    const initial: Record<string, number> = {};
    participants.forEach(p => {
      initial[p.id] = p.participationPercentage ?? 100 / participants.length;
    });
    setPercentages(initial);
  }, [participants]);

  const totalPercentage = Object.values(percentages).reduce((sum, p) => sum + p, 0);
  const isPercentageValid = Math.abs(totalPercentage - 100) < 0.01;

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Nome do grupo é obrigatório");
      return;
    }

    setIsSaving(true);
    try {
      await onUpdateGroup(group.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        icon: selectedIcon,
        splitType,
      });
      
      // If percentage mode, save each participant's percentage
      if (splitType === 'percentage' && isPercentageValid) {
        for (const [participantId, percentage] of Object.entries(percentages)) {
          await onUpdateParticipantPercentage(participantId, percentage);
        }
      }
      
      toast.success("Grupo atualizado!");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePercentageChange = (participantId: string, value: number) => {
    setPercentages(prev => ({
      ...prev,
      [participantId]: Math.max(0, Math.min(100, value)),
    }));
  };

  const distributeEqually = () => {
    const equalPercentage = 100 / participants.length;
    const newPercentages: Record<string, number> = {};
    participants.forEach(p => {
      newPercentages[p.id] = Math.round(equalPercentage * 100) / 100;
    });
    // Adjust last one to make sure sum is exactly 100
    if (participants.length > 0) {
      const sum = Object.values(newPercentages).reduce((a, b) => a + b, 0);
      const lastId = participants[participants.length - 1].id;
      newPercentages[lastId] += 100 - sum;
    }
    setPercentages(newPercentages);
  };

  const handleGenerateLink = async () => {
    setIsGeneratingLink(true);
    const link = await generateInviteLink({ expiresInDays: 7 });
    setIsGeneratingLink(false);
    
    if (link) {
      await navigator.clipboard.writeText(link);
      setCopiedLink(true);
      toast.success("Link copiado para a área de transferência!");
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  const handleCopyLink = async (code: string) => {
    const link = `${window.location.origin}/join/${code}`;
    await navigator.clipboard.writeText(link);
    setCopiedLink(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDeleteGroup(group.id);
      onBack();
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-xl border-b border-border/50 sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3 flex-1">
            <Settings className="h-5 w-5 text-primary" />
            <h1 className="font-bold text-foreground">Gerenciar Grupo</h1>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6 pb-8">
        {/* Group Info Section - Admin Only */}
        {isAdmin && (
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings className="h-5 w-5 text-primary" />
                Informações do Grupo
              </CardTitle>
              <CardDescription>
                Edite as informações básicas do grupo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do grupo</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome do grupo"
                  className="bg-background/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descrição do grupo"
                  className="bg-background/50"
                />
              </div>

              <div className="space-y-2">
                <Label>Ícone do grupo</Label>
                <div className="flex flex-wrap gap-2">
                  {iconOptions.map((icon) => (
                    <button
                      key={icon}
                      onClick={() => setSelectedIcon(icon)}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                        selectedIcon === icon
                          ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2"
                          : "bg-muted hover:bg-muted/80"
                      }`}
                    >
                      <LucideIcon name={icon} className="h-5 w-5" />
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Salvar alterações
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Invite Link Section - Admin Only */}
        {isAdmin && (
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Share2 className="h-5 w-5 text-primary" />
                Link de Convite
              </CardTitle>
              <CardDescription>
                {invites.length > 0 
                  ? "Gerencie o link de convite ativo do grupo"
                  : "Gere um link para convidar novas pessoas ao grupo"
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                          <code className="flex-1 text-sm bg-muted px-3 py-2 rounded-md font-mono truncate">
                            {window.location.origin}/join/{invite.inviteCode}
                          </code>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleCopyLink(invite.inviteCode)}
                            className="h-9 w-9 shrink-0"
                          >
                            {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{invite.useCount} pessoa(s) entrou(aram) com este link</span>
                          {invite.expiresAt && (
                            <span>Expira em {new Date(invite.expiresAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Revoke invite with confirmation */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Revogar link de convite
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Revogar link de convite?</AlertDialogTitle>
                        <AlertDialogDescription>
                          O link de convite atual será desativado permanentemente. 
                          Qualquer pessoa que tentar usá-lo receberá uma mensagem de que o convite foi revogado.
                          <br /><br />
                          <strong>Isso não remove pessoas que já entraram no grupo.</strong>
                          <br /><br />
                          Para convidar novas pessoas, você precisará gerar um novo link.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            invites.forEach(invite => deactivateInvite(invite.id));
                          }}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Revogar link
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <p className="text-xs text-muted-foreground text-center">
                    Gerar um novo link irá automaticamente desativar o link atual
                  </p>
                </>
              ) : (
                <div className="text-center py-2">
                  <p className="text-sm text-muted-foreground mb-4">
                    Nenhum link de convite ativo. Gere um link para convidar pessoas.
                  </p>
                </div>
              )}

              <Button
                onClick={handleGenerateLink}
                disabled={isGeneratingLink}
                className="w-full"
              >
                {isGeneratingLink ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <LinkIcon className="h-4 w-4 mr-2" />
                )}
                {invites.length > 0 ? "Gerar novo link" : "Gerar link de convite"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Members Section */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-primary" />
              Membros do Grupo
            </CardTitle>
            <CardDescription>
              {members.length + 1} pessoa(s) no grupo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {/* Owner (shown separately with profile) */}
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <Avatar className="h-10 w-10">
                    {ownerProfile?.avatarUrl ? (
                      <AvatarImage src={ownerProfile.avatarUrl} />
                    ) : null}
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {ownerProfile?.displayName 
                        ? getInitials(ownerProfile.displayName)
                        : <Crown className="h-4 w-4" />
                      }
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {isOwner ? "Você" : (ownerProfile?.displayName || "Proprietário")}
                    </p>
                    <div className="flex items-center gap-1">
                      <Badge variant="secondary" className="text-xs">
                        <Crown className="h-3 w-3 mr-1" />
                        Proprietário
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Other members */}
                {members.map((member) => (
                  <div 
                    key={member.id}
                    className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.avatarUrl || undefined} />
                      <AvatarFallback>
                        {getInitials(member.displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {member.userId === user?.id ? "Você" : (member.displayName || "Membro")}
                      </p>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="text-xs">
                          {member.role === 'admin' ? (
                            <>
                              <Shield className="h-3 w-3 mr-1" />
                              Admin
                            </>
                          ) : (
                            <>
                              <User className="h-3 w-3 mr-1" />
                              Membro
                            </>
                          )}
                        </Badge>
                      </div>
                    </div>
                    {(isOwner || isAdmin) && member.userId !== user?.id && (
                      <div className="flex items-center gap-1">
                        {member.role !== 'admin' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateMemberRole(member.id, 'admin')}
                            className="text-xs"
                          >
                            Promover
                          </Button>
                        )}
                        {member.role === 'admin' && isOwner && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateMemberRole(member.id, 'member')}
                            className="text-xs text-muted-foreground"
                          >
                            Rebaixar
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeMember(member.id)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}

                {members.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Apenas você está no grupo. Convide outras pessoas!
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Split Type Section - Admin Only */}
        {isAdmin && participants.length > 1 && (
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Percent className="h-5 w-5 text-primary" />
                Forma de Divisão
              </CardTitle>
              <CardDescription>
                Configure como as despesas serão divididas entre os participantes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Split type toggle */}
              <div className="flex gap-2">
                <Button
                  variant={splitType === 'equal' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setSplitType('equal')}
                >
                  <Equal className="h-4 w-4 mr-2" />
                  Divisão Igual
                </Button>
                <Button
                  variant={splitType === 'percentage' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setSplitType('percentage')}
                >
                  <Percent className="h-4 w-4 mr-2" />
                  Por Porcentagem
                </Button>
              </div>

              {splitType === 'percentage' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Defina a porcentagem de cada participante
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={distributeEqually}
                      className="text-xs"
                    >
                      Distribuir igualmente
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {participants.map((participant) => (
                      <div key={participant.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate text-sm">{participant.name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={percentages[participant.id] || 0}
                            onChange={(e) => handlePercentageChange(participant.id, parseFloat(e.target.value) || 0)}
                            className="w-20 text-right"
                          />
                          <span className="text-sm text-muted-foreground">%</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total percentage indicator */}
                  <div className={`p-3 rounded-lg ${isPercentageValid ? 'bg-green-500/10 border border-green-500/30' : 'bg-destructive/10 border border-destructive/30'}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Total:</span>
                      <span className={`font-bold ${isPercentageValid ? 'text-green-600' : 'text-destructive'}`}>
                        {totalPercentage.toFixed(1)}%
                      </span>
                    </div>
                    {!isPercentageValid && (
                      <p className="text-xs text-destructive mt-1">
                        A soma das porcentagens deve ser exatamente 100%
                      </p>
                    )}
                  </div>
                </div>
              )}

              {splitType === 'equal' && (
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Cada participante paga uma parte igual das despesas.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Danger Zone - Owner or Admin */}
        {(isOwner || isAdmin) && (
          <Card className="border-destructive/30 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-destructive">
                <Trash2 className="h-5 w-5" />
                Zona de Perigo
              </CardTitle>
              <CardDescription>
                Ações irreversíveis para o grupo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir Grupo
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir grupo?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita. Todos os dados do grupo, 
                      incluindo despesas, participantes e pagamentos, serão 
                      permanentemente excluídos.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
