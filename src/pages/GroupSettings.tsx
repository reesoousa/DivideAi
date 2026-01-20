import { useState } from "react";
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
} from "lucide-react";
import { LucideIcon } from "@/components/LucideIcon";
import { toast } from "sonner";

// Icon options for groups
const iconOptions = [
  "Home", "Users", "Plane", "Utensils", "ShoppingCart", "Car", 
  "Briefcase", "Heart", "Music", "Film", "Gamepad2", "Dumbbell",
  "GraduationCap", "Tent", "PartyPopper", "Building2"
];

interface GroupSettingsProps {
  group: Group;
  onBack: () => void;
  onUpdateGroup: (id: string, updates: Partial<Group>) => Promise<void>;
  onDeleteGroup: (id: string) => Promise<void>;
}

export default function GroupSettings({ 
  group, 
  onBack, 
  onUpdateGroup,
  onDeleteGroup,
}: GroupSettingsProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    members, 
    invites, 
    isLoading, 
    isAdmin, 
    isOwner,
    generateInviteLink,
    deactivateInvite,
    removeMember,
    updateMemberRole,
  } = useGroupMembers(group.id);

  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description || "");
  const [selectedIcon, setSelectedIcon] = useState(group.icon);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
      });
      toast.success("Grupo atualizado!");
    } finally {
      setIsSaving(false);
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
                Convidar Pessoas
              </CardTitle>
              <CardDescription>
                Gere um link para convidar novas pessoas ao grupo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={handleGenerateLink}
                disabled={isGeneratingLink}
                variant="outline"
                className="w-full"
              >
                {isGeneratingLink ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : copiedLink ? (
                  <Check className="h-4 w-4 mr-2" />
                ) : (
                  <LinkIcon className="h-4 w-4 mr-2" />
                )}
                {copiedLink ? "Link copiado!" : "Gerar link de convite"}
              </Button>

              {invites.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Links ativos</Label>
                  {invites.map((invite) => (
                    <div 
                      key={invite.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-mono truncate">
                          .../{invite.inviteCode}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {invite.useCount} uso(s)
                          {invite.expiresAt && ` • Expira em ${new Date(invite.expiresAt).toLocaleDateString()}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCopyLink(invite.inviteCode)}
                          className="h-8 w-8"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deactivateInvite(invite.id)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                {/* Owner (shown separately) */}
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Crown className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {isOwner ? "Você" : "Proprietário"}
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
                    {isOwner && member.userId !== user?.id && (
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

        {/* Danger Zone - Owner Only */}
        {isOwner && (
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
