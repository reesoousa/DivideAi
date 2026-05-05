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
import { InviteQRCode } from "@/components/InviteQRCode";
import { toast } from "sonner";

// Icon options for groups (16 icons for 4x4 grid)
const iconOptions = [
  "Home", "Users", "Plane", "Utensils", "ShoppingCart", "Car", 
  "Briefcase", "Heart", "Music", "Gamepad2", "Dumbbell",
  "GraduationCap", "Tent", "PartyPopper", "Building2", "Wallet"
];

interface ParticipantData {
  id: string;
  name: string;
  participationPercentage?: number;
  avatar?: string;
  avatarType?: 'color' | 'image';
  avatarImage?: string;
  userId?: string;
}

interface GroupSettingsProps {
  group: Group;
  participants: ParticipantData[];
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
  const [isSavingSplit, setIsSavingSplit] = useState(false);
  const [hasUnsavedSplitChanges, setHasUnsavedSplitChanges] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Initialize percentages from participants - auto-distribute evenly
  useEffect(() => {
    if (participants.length === 0) return;
    
    const initial: Record<string, number> = {};
    const equalShare = 100 / participants.length;
    
    // Check if any participant has a custom percentage set
    const hasCustomPercentages = participants.some(p => 
      p.participationPercentage !== undefined && 
      Math.abs(p.participationPercentage - equalShare) > 0.01
    );
    
    if (hasCustomPercentages) {
      // Use saved percentages
      participants.forEach(p => {
        initial[p.id] = p.participationPercentage ?? equalShare;
      });
    } else {
      // Auto-distribute evenly with proper rounding
      let remaining = 100;
      participants.forEach((p, index) => {
        if (index === participants.length - 1) {
          // Last participant gets the remainder to ensure exactly 100%
          initial[p.id] = Math.round(remaining * 100) / 100;
        } else {
          const share = Math.round(equalShare * 100) / 100;
          initial[p.id] = share;
          remaining -= share;
        }
      });
    }
    
    setPercentages(initial);
    setHasUnsavedSplitChanges(false);
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

  // Auto-adjust other percentages when one changes
  const handlePercentageChange = (participantId: string, newValue: number) => {
    const clampedValue = Math.max(0, Math.min(100, newValue));
    const otherParticipants = participants.filter(p => p.id !== participantId);
    
    if (otherParticipants.length === 0) {
      setPercentages({ [participantId]: 100 });
      setHasUnsavedSplitChanges(true);
      return;
    }
    
    const remaining = 100 - clampedValue;
    const currentOthersTotal = otherParticipants.reduce(
      (sum, p) => sum + (percentages[p.id] || 0), 
      0
    );
    
    const newPercentages: Record<string, number> = {
      [participantId]: clampedValue,
    };
    
    if (currentOthersTotal > 0) {
      // Distribute proportionally among others
      let distributed = 0;
      otherParticipants.forEach((p, index) => {
        const currentShare = percentages[p.id] || 0;
        const proportion = currentShare / currentOthersTotal;
        
        if (index === otherParticipants.length - 1) {
          // Last one gets the remainder
          newPercentages[p.id] = Math.round((remaining - distributed) * 100) / 100;
        } else {
          const share = Math.round(remaining * proportion * 100) / 100;
          newPercentages[p.id] = share;
          distributed += share;
        }
      });
    } else {
      // Distribute equally among others
      const equalShare = remaining / otherParticipants.length;
      let distributed = 0;
      otherParticipants.forEach((p, index) => {
        if (index === otherParticipants.length - 1) {
          newPercentages[p.id] = Math.round((remaining - distributed) * 100) / 100;
        } else {
          const share = Math.round(equalShare * 100) / 100;
          newPercentages[p.id] = share;
          distributed += share;
        }
      });
    }
    
    setPercentages(newPercentages);
    setHasUnsavedSplitChanges(true);
  };

  const distributeEqually = () => {
    const newPercentages: Record<string, number> = {};
    let remaining = 100;
    
    participants.forEach((p, index) => {
      if (index === participants.length - 1) {
        newPercentages[p.id] = Math.round(remaining * 100) / 100;
      } else {
        const share = Math.round((100 / participants.length) * 100) / 100;
        newPercentages[p.id] = share;
        remaining -= share;
      }
    });
    
    setPercentages(newPercentages);
    setHasUnsavedSplitChanges(true);
  };

  // Save split settings separately
  const handleSaveSplitSettings = async () => {
    setIsSavingSplit(true);
    try {
      // Update group split type
      await onUpdateGroup(group.id, { splitType });
      
      // Save each participant's percentage
      if (splitType === 'percentage') {
        for (const [participantId, percentage] of Object.entries(percentages)) {
          await onUpdateParticipantPercentage(participantId, percentage);
        }
      } else {
        // Reset to equal distribution when switching to equal mode
        const equalShare = 100 / participants.length;
        for (const p of participants) {
          await onUpdateParticipantPercentage(p.id, equalShare);
        }
      }
      
      setHasUnsavedSplitChanges(false);
      toast.success("Forma de divisão salva! Os cálculos foram atualizados.");
    } catch (error) {
      console.error("Error saving split settings:", error);
      toast.error("Erro ao salvar configurações de divisão");
    } finally {
      setIsSavingSplit(false);
    }
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

                  {invites[0] && (
                    <InviteQRCode inviteCode={invites[0].inviteCode} size={180} />
                  )}

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

        {/* Members Section - Shows ALL participants */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-primary" />
              Membros do Grupo
            </CardTitle>
            <CardDescription>
              {participants.length} pessoa(s) no grupo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {/* Show all participants with their roles */}
                {participants.map((participant) => {
                  // Determine the role for this participant
                  const isParticipantOwner = participant.userId === ownerProfile?.userId;
                  const memberRecord = members.find(m => m.userId === participant.userId);
                  const isParticipantAdmin = memberRecord?.role === 'admin';
                  const isCurrentUser = participant.userId === user?.id;
                  
                  // Get avatar display
                  const getAvatarContent = () => {
                    if (participant.avatarType === 'image' && participant.avatarImage) {
                      return <AvatarImage src={participant.avatarImage} />;
                    }
                    if (participant.userId) {
                      // Check if this is a linked user - get their profile avatar
                      if (isParticipantOwner && ownerProfile?.avatarUrl) {
                        return <AvatarImage src={ownerProfile.avatarUrl} />;
                      }
                      if (memberRecord?.avatarUrl) {
                        return <AvatarImage src={memberRecord.avatarUrl} />;
                      }
                    }
                    return null;
                  };
                  
                  const getAvatarFallbackClass = () => {
                    if (participant.avatarType === 'color' && participant.avatar) {
                      return participant.avatar;
                    }
                    return isParticipantOwner ? 'bg-primary' : 'bg-muted';
                  };

                  return (
                    <div 
                      key={participant.id}
                      className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg"
                    >
                      <Avatar className="h-10 w-10">
                        {getAvatarContent()}
                        <AvatarFallback className={`${getAvatarFallbackClass()} text-primary-foreground`}>
                          {participant.name 
                            ? getInitials(participant.name)
                            : <User className="h-4 w-4" />
                          }
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {isCurrentUser ? "Você" : participant.name}
                        </p>
                        <div className="flex items-center gap-1">
                          {isParticipantOwner ? (
                            <Badge variant="secondary" className="text-xs">
                              <Crown className="h-3 w-3 mr-1" />
                              Proprietário
                            </Badge>
                          ) : isParticipantAdmin ? (
                            <Badge variant="outline" className="text-xs">
                              <Shield className="h-3 w-3 mr-1" />
                              Admin
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              <User className="h-3 w-3 mr-1" />
                              Membro
                            </Badge>
                          )}
                        </div>
                      </div>
                      {/* Admin controls for linked members only */}
                      {(isOwner || isAdmin) && participant.userId && !isCurrentUser && !isParticipantOwner && memberRecord && (
                        <div className="flex items-center gap-1">
                          {!isParticipantAdmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateMemberRole(memberRecord.id, 'admin')}
                              className="text-xs"
                            >
                              Promover
                            </Button>
                          )}
                          {isParticipantAdmin && isOwner && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateMemberRole(memberRecord.id, 'member')}
                              className="text-xs text-muted-foreground"
                            >
                              Rebaixar
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeMember(memberRecord.id)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {participants.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum participante no grupo ainda.
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
                  onClick={() => {
                    setSplitType('equal');
                    setHasUnsavedSplitChanges(true);
                  }}
                >
                  <Equal className="h-4 w-4 mr-2" />
                  Divisão Igual
                </Button>
                <Button
                  variant={splitType === 'percentage' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => {
                    setSplitType('percentage');
                    setHasUnsavedSplitChanges(true);
                  }}
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
                        <Avatar className="h-8 w-8">
                          {participant.avatarType === 'image' && participant.avatarImage ? (
                            <AvatarImage src={participant.avatarImage} />
                          ) : null}
                          <AvatarFallback className={`${participant.avatar || 'bg-muted'} text-primary-foreground text-xs`}>
                            {getInitials(participant.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate text-sm">{participant.name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            value={Math.round(percentages[participant.id] || 0)}
                            onChange={(e) => handlePercentageChange(participant.id, parseFloat(e.target.value) || 0)}
                            className="w-20 text-right"
                          />
                          <span className="text-sm text-muted-foreground">%</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total percentage indicator - always valid now */}
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Total:</span>
                      <span className="font-bold text-primary">
                        {totalPercentage.toFixed(0)}%
                      </span>
                    </div>
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

              {/* Save button for split settings */}
              <Separator />
              <Button
                onClick={handleSaveSplitSettings}
                disabled={isSavingSplit}
                className="w-full"
                variant={hasUnsavedSplitChanges ? 'default' : 'outline'}
              >
                {isSavingSplit ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Salvar forma de divisão
              </Button>
              {hasUnsavedSplitChanges && (
                <p className="text-xs text-muted-foreground text-center">
                  Você tem alterações não salvas
                </p>
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
