import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Group } from "@/types/expense";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const groupColors = [
  "bg-primary",
  "bg-secondary",
  "bg-chart-1",
  "bg-chart-2",
  "bg-chart-4",
  "bg-chart-5",
];

export function useSupabaseGroups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch groups from Supabase
  const fetchGroups = useCallback(async (showRefreshIndicator = false) => {
    if (!user) {
      setGroups([]);
      setIsLoading(false);
      return;
    }

    if (showRefreshIndicator) {
      setIsRefreshing(true);
    }

    try {
      const { data, error } = await supabase
        .from("groups")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mappedGroups: Group[] = (data || []).map((g) => ({
        id: g.id,
        name: g.name,
        description: g.description || undefined,
        icon: g.icon,
        color: g.color,
        createdAt: new Date(g.created_at),
        isRecurring: g.is_recurring,
        billingDay: g.billing_day || undefined,
      }));

      setGroups(mappedGroups);

      if (showRefreshIndicator) {
        toast.success("Dados atualizados!");
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
      toast.error("Erro ao carregar grupos");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);

  // Initial load
  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // Add group
  const addGroup = useCallback(async (
    name: string,
    description?: string,
    isRecurring: boolean = false,
    billingDay?: number,
    icon?: string
  ): Promise<string | null> => {
    if (!user) {
      toast.error("Você precisa estar logado");
      return null;
    }

    try {
      const newGroup = {
        user_id: user.id,
        name,
        description,
        icon: icon || "Home",
        color: groupColors[groups.length % groupColors.length],
        is_recurring: isRecurring,
        billing_day: isRecurring ? billingDay : null,
      };

      const { data, error } = await supabase
        .from("groups")
        .insert(newGroup)
        .select()
        .single();

      if (error) throw error;

      const mappedGroup: Group = {
        id: data.id,
        name: data.name,
        description: data.description || undefined,
        icon: data.icon,
        color: data.color,
        createdAt: new Date(data.created_at),
        isRecurring: data.is_recurring,
        billingDay: data.billing_day || undefined,
      };

      setGroups((prev) => [mappedGroup, ...prev]);
      toast.success("Grupo criado!");
      return data.id;
    } catch (error) {
      console.error("Error creating group:", error);
      toast.error("Erro ao criar grupo");
      return null;
    }
  }, [user, groups.length]);

  // Remove group
  const removeGroup = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from("groups")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setGroups((prev) => prev.filter((g) => g.id !== id));
      if (selectedGroupId === id) {
        setSelectedGroupId(null);
      }
      toast.success("Grupo removido!");
    } catch (error) {
      console.error("Error removing group:", error);
      toast.error("Erro ao remover grupo");
    }
  }, [selectedGroupId]);

  // Update group
  const updateGroup = useCallback(async (id: string, updates: Partial<Group>) => {
    try {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.icon !== undefined) dbUpdates.icon = updates.icon;
      if (updates.color !== undefined) dbUpdates.color = updates.color;
      if (updates.isRecurring !== undefined) dbUpdates.is_recurring = updates.isRecurring;
      if (updates.billingDay !== undefined) dbUpdates.billing_day = updates.billingDay;

      const { error } = await supabase
        .from("groups")
        .update(dbUpdates)
        .eq("id", id);

      if (error) throw error;

      setGroups((prev) =>
        prev.map((g) => (g.id === id ? { ...g, ...updates } : g))
      );
    } catch (error) {
      console.error("Error updating group:", error);
      toast.error("Erro ao atualizar grupo");
    }
  }, []);

  const selectGroup = useCallback((id: string) => {
    setSelectedGroupId(id);
  }, []);

  const deselectGroup = useCallback(() => {
    setSelectedGroupId(null);
  }, []);

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  const refresh = useCallback(() => {
    fetchGroups(true);
  }, [fetchGroups]);

  return {
    groups,
    selectedGroupId,
    selectedGroup,
    isLoading,
    isRefreshing,
    addGroup,
    removeGroup,
    updateGroup,
    selectGroup,
    deselectGroup,
    refresh,
  };
}
