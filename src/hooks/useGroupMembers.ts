import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { GroupMember, GroupInvite } from "@/types/expense";
import { toast } from "sonner";

export function useGroupMembers(groupId: string | null) {
  const { user } = useAuth();
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [invites, setInvites] = useState<GroupInvite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  // Fetch members and check permissions
  const fetchMembers = useCallback(async () => {
    if (!groupId || !user) {
      setMembers([]);
      setInvites([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Check if user is owner
      const { data: group } = await supabase
        .from("groups")
        .select("user_id")
        .eq("id", groupId)
        .single();

      const userIsOwner = group?.user_id === user.id;
      setIsOwner(userIsOwner);

      // Fetch members with profile info
      const { data: membersData, error: membersError } = await supabase
        .from("group_members")
        .select(`
          id,
          user_id,
          group_id,
          role,
          joined_at
        `)
        .eq("group_id", groupId);

      if (membersError) throw membersError;

      // Get profile info for each member
      const memberIds = membersData?.map(m => m.user_id) || [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", memberIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      const mappedMembers: GroupMember[] = (membersData || []).map(m => {
        const profile = profileMap.get(m.user_id);
        return {
          id: m.id,
          userId: m.user_id,
          groupId: m.group_id,
          role: m.role as 'admin' | 'member',
          joinedAt: new Date(m.joined_at),
          displayName: profile?.display_name || undefined,
          avatarUrl: profile?.avatar_url || undefined,
        };
      });

      setMembers(mappedMembers);

      // Check if current user is admin
      const currentUserMember = mappedMembers.find(m => m.userId === user.id);
      setIsAdmin(userIsOwner || currentUserMember?.role === 'admin');

      // Fetch invites only if admin
      if (userIsOwner || currentUserMember?.role === 'admin') {
        const { data: invitesData } = await supabase
          .from("group_invites")
          .select("*")
          .eq("group_id", groupId)
          .eq("is_active", true);

        const mappedInvites: GroupInvite[] = (invitesData || []).map(i => ({
          id: i.id,
          groupId: i.group_id,
          inviteCode: i.invite_code,
          createdAt: new Date(i.created_at),
          expiresAt: i.expires_at ? new Date(i.expires_at) : undefined,
          maxUses: i.max_uses || undefined,
          useCount: i.use_count,
          isActive: i.is_active,
        }));

        setInvites(mappedInvites);
      }

    } catch (error) {
      console.error("Error fetching members:", error);
    } finally {
      setIsLoading(false);
    }
  }, [groupId, user]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Generate invite link - deactivates existing links first (only 1 active per group)
  const generateInviteLink = useCallback(async (options?: { 
    expiresInDays?: number; 
    maxUses?: number 
  }) => {
    if (!groupId || !user) {
      toast.error("Erro ao gerar link");
      return null;
    }

    try {
      // First, deactivate all existing active invites for this group
      const { error: deactivateError } = await supabase
        .from("group_invites")
        .update({ is_active: false })
        .eq("group_id", groupId)
        .eq("is_active", true);

      if (deactivateError) {
        console.error("Error deactivating old invites:", deactivateError);
      }

      // Generate a random invite code
      const inviteCode = crypto.randomUUID().replace(/-/g, '').substring(0, 12);
      
      const expiresAt = options?.expiresInDays 
        ? new Date(Date.now() + options.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { data, error } = await supabase
        .from("group_invites")
        .insert({
          group_id: groupId,
          invite_code: inviteCode,
          created_by: user.id,
          expires_at: expiresAt,
          max_uses: options?.maxUses || null,
        })
        .select()
        .single();

      if (error) throw error;

      const newInvite: GroupInvite = {
        id: data.id,
        groupId: data.group_id,
        inviteCode: data.invite_code,
        createdAt: new Date(data.created_at),
        expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
        maxUses: data.max_uses || undefined,
        useCount: data.use_count,
        isActive: data.is_active,
      };

      // Replace all invites with just the new one (only 1 active)
      setInvites([newInvite]);
      
      // Copy to clipboard and return the full invite URL
      const baseUrl = window.location.origin;
      const link = `${baseUrl}/join/${inviteCode}`;
      await navigator.clipboard.writeText(link);
      toast.success("Link de convite gerado e copiado!");
      return link;
    } catch (error) {
      console.error("Error generating invite:", error);
      toast.error("Erro ao gerar link de convite");
      return null;
    }
  }, [groupId, user]);

  // Deactivate invite
  const deactivateInvite = useCallback(async (inviteId: string) => {
    try {
      const { error } = await supabase
        .from("group_invites")
        .update({ is_active: false })
        .eq("id", inviteId);

      if (error) throw error;

      setInvites(prev => prev.filter(i => i.id !== inviteId));
      toast.success("Link de convite desativado");
    } catch (error) {
      console.error("Error deactivating invite:", error);
      toast.error("Erro ao desativar convite");
    }
  }, []);

  // Remove member
  const removeMember = useCallback(async (memberId: string) => {
    try {
      const { error } = await supabase
        .from("group_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;

      setMembers(prev => prev.filter(m => m.id !== memberId));
      toast.success("Membro removido do grupo");
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error("Erro ao remover membro");
    }
  }, []);

  // Update member role
  const updateMemberRole = useCallback(async (memberId: string, role: 'admin' | 'member') => {
    try {
      const { error } = await supabase
        .from("group_members")
        .update({ role })
        .eq("id", memberId);

      if (error) throw error;

      setMembers(prev => prev.map(m => 
        m.id === memberId ? { ...m, role } : m
      ));
      toast.success(role === 'admin' ? "Membro promovido a administrador" : "Permissões atualizadas");
    } catch (error) {
      console.error("Error updating member role:", error);
      toast.error("Erro ao atualizar permissões");
    }
  }, []);

  return {
    members,
    invites,
    isLoading,
    isAdmin,
    isOwner,
    generateInviteLink,
    deactivateInvite,
    removeMember,
    updateMemberRole,
    refresh: fetchMembers,
  };
}
