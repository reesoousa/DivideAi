import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Users, Check, AlertTriangle } from "lucide-react";
import { LucideIcon } from "@/components/LucideIcon";

interface GroupInfo {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  is_recurring: boolean;
}

export default function JoinGroup() {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const { user, loading: isAuthLoading } = useAuth();
  const navigate = useNavigate();
  
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState(false);
  const [alreadyMember, setAlreadyMember] = useState(false);

  // Fetch invite info
  useEffect(() => {
    const fetchInviteInfo = async () => {
      if (!inviteCode) {
        setError("Link de convite inválido");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-invite-info?code=${inviteCode}`
        );
        
        const data = await response.json();

        if (!data.valid) {
          setError(data.error || "Link de convite inválido");
        } else {
          setGroupInfo(data.group);
        }
      } catch (err) {
        console.error("Error fetching invite:", err);
        setError("Erro ao carregar informações do convite");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInviteInfo();
  }, [inviteCode]);

  // Store invite code for after login
  useEffect(() => {
    if (inviteCode && !user && !isAuthLoading) {
      sessionStorage.setItem("pendingInvite", inviteCode);
    }
  }, [inviteCode, user, isAuthLoading]);

  // Handle joining the group
  const handleJoin = async () => {
    if (!user || !inviteCode) return;

    setIsJoining(true);
    try {
      const { data: { session } } = await (await import("@/integrations/supabase/client")).supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/join-group`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ invite_code: inviteCode }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao entrar no grupo");
      }

      // Clear pending invite
      sessionStorage.removeItem("pendingInvite");
      
      if (data.already_member) {
        setAlreadyMember(true);
      }
      
      setJoinSuccess(true);

      // Redirect to group after a short delay
      setTimeout(() => {
        navigate("/", { state: { selectGroupId: data.group_id } });
      }, 2000);

    } catch (err) {
      console.error("Error joining group:", err);
      setError(err instanceof Error ? err.message : "Erro ao entrar no grupo");
    } finally {
      setIsJoining(false);
    }
  };

  // Redirect to login if not authenticated
  const handleLoginRedirect = () => {
    sessionStorage.setItem("pendingInvite", inviteCode || "");
    navigate("/auth", { state: { returnTo: `/join/${inviteCode}` } });
  };

  if (isLoading || isAuthLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle>Convite inválido</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              onClick={() => navigate("/")}
            >
              Voltar para o início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (joinSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>
              {alreadyMember ? "Você já faz parte!" : "Bem-vindo ao grupo!"}
            </CardTitle>
            <CardDescription>
              {alreadyMember 
                ? `Você já é membro de ${groupInfo?.name}`
                : `Você entrou no grupo ${groupInfo?.name}`
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground mt-2">
              Redirecionando...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          {groupInfo && (
            <div 
              className={`w-20 h-20 ${groupInfo.color} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}
            >
              <LucideIcon name={groupInfo.icon} className="h-10 w-10 text-primary-foreground" />
            </div>
          )}
          <CardTitle className="text-xl">{groupInfo?.name}</CardTitle>
          {groupInfo?.description && (
            <CardDescription>{groupInfo.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span className="text-sm">
              Você foi convidado para participar deste grupo
            </span>
          </div>

          {user ? (
            <Button 
              className="w-full" 
              onClick={handleJoin}
              disabled={isJoining}
            >
              {isJoining ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Entrando...
                </>
              ) : (
                "Entrar no grupo"
              )}
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-center text-muted-foreground">
                Faça login ou crie uma conta para entrar no grupo
              </p>
              <Button 
                className="w-full" 
                onClick={handleLoginRedirect}
              >
                Continuar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
