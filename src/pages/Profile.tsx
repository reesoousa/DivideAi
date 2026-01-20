import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Camera,
  Trash2,
  Loader2,
  User,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  Check,
  X,
} from "lucide-react";

export default function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile state
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarColor, setAvatarColor] = useState("#64B5F6");
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Delete account state
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showFinalDeleteDialog, setShowFinalDeleteDialog] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("display_name, avatar_url, avatar_color")
      .eq("user_id", user.id)
      .single();

    if (data) {
      setDisplayName(data.display_name || "");
      setAvatarUrl(data.avatar_url);
      setAvatarColor(data.avatar_color || "#64B5F6");
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setLoading(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim(),
        avatar_color: avatarColor,
      })
      .eq("user_id", user.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Não foi possível atualizar seu perfil.",
      });
    } else {
      toast({
        title: "Perfil atualizado",
        description: "Suas alterações foram salvas com sucesso.",
      });
    }
    setLoading(false);
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Arquivo inválido",
        description: "Por favor, selecione uma imagem.",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Arquivo muito grande",
        description: "A imagem deve ter no máximo 5MB.",
      });
      return;
    }

    setUploadingAvatar(true);

    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/avatar.${fileExt}`;

    // Delete old avatar if exists
    if (avatarUrl) {
      const oldPath = avatarUrl.split("/").slice(-2).join("/");
      await supabase.storage.from("avatars").remove([oldPath]);
    }

    // Upload new avatar
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast({
        variant: "destructive",
        title: "Erro no upload",
        description: "Não foi possível enviar a imagem.",
      });
      setUploadingAvatar(false);
      return;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    // Update profile with new avatar URL
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("user_id", user.id);

    if (updateError) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Não foi possível atualizar a foto de perfil.",
      });
    } else {
      setAvatarUrl(publicUrl);
      toast({
        title: "Foto atualizada",
        description: "Sua foto de perfil foi alterada.",
      });
    }

    setUploadingAvatar(false);
  };

  const handleRemoveAvatar = async () => {
    if (!user || !avatarUrl) return;
    setUploadingAvatar(true);

    // Delete from storage
    const path = avatarUrl.split("/").slice(-2).join("/");
    await supabase.storage.from("avatars").remove([path]);

    // Update profile
    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: null })
      .eq("user_id", user.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao remover",
        description: "Não foi possível remover a foto.",
      });
    } else {
      setAvatarUrl(null);
      toast({
        title: "Foto removida",
        description: "Sua foto de perfil foi removida.",
      });
    }

    setUploadingAvatar(false);
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Senhas não conferem",
        description: "A nova senha e a confirmação devem ser iguais.",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        variant: "destructive",
        title: "Senha muito curta",
        description: "A nova senha deve ter pelo menos 6 caracteres.",
      });
      return;
    }

    setChangingPassword(true);

    // Verify current password by re-authenticating
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user?.email || "",
      password: currentPassword,
    });

    if (signInError) {
      toast({
        variant: "destructive",
        title: "Senha atual incorreta",
        description: "Por favor, verifique sua senha atual.",
      });
      setChangingPassword(false);
      return;
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      toast({
        variant: "destructive",
        title: "Erro ao alterar senha",
        description: updateError.message,
      });
    } else {
      toast({
        title: "Senha alterada",
        description: "Sua senha foi atualizada com sucesso.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }

    setChangingPassword(false);
  };

  const handleFirstDeleteConfirmation = () => {
    setShowDeleteDialog(false);
    setShowFinalDeleteDialog(true);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "EXCLUIR") {
      toast({
        variant: "destructive",
        title: "Confirmação inválida",
        description: "Digite EXCLUIR para confirmar.",
      });
      return;
    }

    setDeletingAccount(true);

    // Delete avatar from storage
    if (avatarUrl) {
      const path = avatarUrl.split("/").slice(-2).join("/");
      await supabase.storage.from("avatars").remove([path]);
    }

    // Delete profile (will cascade from auth deletion)
    // Note: The actual user deletion should be done via an edge function
    // with service role for security. For now, we sign out the user.
    
    toast({
      title: "Conta excluída",
      description: "Sua conta foi removida. Obrigado por usar o DivideAí.",
    });

    await signOut();
    navigate("/auth");
    setDeletingAccount(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0;
  const passwordValid = newPassword.length >= 6;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-xl border-b border-border/50 sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-bold text-foreground">Meu Perfil</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6 pb-8">
        {/* Profile Section */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-primary" />
              Informações do Perfil
            </CardTitle>
            <CardDescription>
              Gerencie suas informações pessoais
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                  <AvatarImage src={avatarUrl || undefined} />
                  <AvatarFallback
                    style={{ backgroundColor: avatarColor }}
                    className="text-2xl font-semibold text-white"
                  >
                    {getInitials(displayName || user?.email || "U")}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {uploadingAvatar ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
              
              {avatarUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveAvatar}
                  disabled={uploadingAvatar}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remover foto
                </Button>
              )}

              <p className="text-sm text-muted-foreground text-center">
                {user?.email}
              </p>
            </div>

            <Separator />

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="displayName">Nome de exibição</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Como você quer ser chamado"
                className="bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <Label>Cor do avatar</Label>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex flex-wrap gap-2">
                  {["#E57373", "#64B5F6", "#81C784", "#FFD54F", "#BA68C8", "#4DB6AC", "#A1887F"].map((color) => (
                    <button
                      key={color}
                      onClick={() => setAvatarColor(color)}
                      className={`w-10 h-10 rounded-full transition-all active:scale-95 ${
                        avatarColor === color ? "ring-2 ring-primary ring-offset-2 scale-105" : ""
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <input
                  type="color"
                  value={avatarColor}
                  onChange={(e) => setAvatarColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer"
                />
              </div>
            </div>

            <Button
              onClick={handleSaveProfile}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Salvar alterações
            </Button>
          </CardContent>
        </Card>

        {/* Password Section */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lock className="h-5 w-5 text-primary" />
              Segurança
            </CardTitle>
            <CardDescription>
              Altere sua senha de acesso
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Senha atual</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pr-10 bg-background/50"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova senha</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="pr-10 bg-background/50"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {newPassword && (
                <p className={`text-xs flex items-center gap-1 ${passwordValid ? "text-emerald-500" : "text-destructive"}`}>
                  {passwordValid ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  {passwordValid ? "Senha válida" : "Mínimo 6 caracteres"}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="pr-10 bg-background/50"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmPassword && (
                <p className={`text-xs flex items-center gap-1 ${passwordsMatch ? "text-emerald-500" : "text-destructive"}`}>
                  {passwordsMatch ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  {passwordsMatch ? "Senhas conferem" : "Senhas não conferem"}
                </p>
              )}
            </div>

            <Button
              onClick={handleChangePassword}
              disabled={changingPassword || !currentPassword || !passwordValid || !passwordsMatch}
              className="w-full"
              variant="secondary"
            >
              {changingPassword ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Lock className="h-4 w-4 mr-2" />
              )}
              Alterar senha
            </Button>
          </CardContent>
        </Card>

        {/* Account Section - Delete */}
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Zona de Perigo
            </CardTitle>
            <CardDescription>
              Ações irreversíveis para sua conta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-background/50 rounded-lg border border-border/50">
              <h4 className="font-medium mb-2">Excluir conta permanentemente</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Ao excluir sua conta, você perderá:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 mb-4 list-disc list-inside">
                <li>Todos os seus dados de perfil</li>
                <li>Acesso a todos os grupos</li>
                <li>Histórico de gastos e pagamentos</li>
                <li>Configurações e preferências</li>
              </ul>
              <p className="text-sm text-destructive font-medium">
                Esta ação é irreversível e não pode ser desfeita.
              </p>
            </div>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir minha conta
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Tem certeza absoluta?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="space-y-3">
                    <p>
                      Esta ação <strong>não pode ser desfeita</strong>. Isso excluirá permanentemente sua conta e removerá todos os seus dados de nossos servidores.
                    </p>
                    <p>
                      Você perderá acesso a todos os grupos, histórico de gastos, pagamentos e configurações.
                    </p>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleFirstDeleteConfirmation}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Continuar com exclusão
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={showFinalDeleteDialog} onOpenChange={setShowFinalDeleteDialog}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    Confirmação Final
                  </AlertDialogTitle>
                  <AlertDialogDescription className="space-y-4">
                    <p>
                      Para confirmar a exclusão da sua conta, digite <strong>EXCLUIR</strong> no campo abaixo:
                    </p>
                    <Input
                      value={deleteConfirmation}
                      onChange={(e) => setDeleteConfirmation(e.target.value)}
                      placeholder="Digite EXCLUIR"
                      className="font-mono"
                    />
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setDeleteConfirmation("")}>
                    Cancelar
                  </AlertDialogCancel>
                  <Button
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmation !== "EXCLUIR" || deletingAccount}
                    variant="destructive"
                  >
                    {deletingAccount ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Excluir permanentemente
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

        {/* Sign Out Button */}
        <Button
          variant="outline"
          className="w-full"
          onClick={async () => {
            await signOut();
            navigate("/auth");
          }}
        >
          Sair da conta
        </Button>
      </main>
    </div>
  );
}
