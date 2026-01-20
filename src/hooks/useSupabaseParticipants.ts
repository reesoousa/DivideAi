import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Participant, PixKey, PixKeyType } from "@/types/expense";
import { toast } from "sonner";

const avatarColors = [
  "bg-primary",
  "bg-chart-1",
  "bg-chart-2",
  "bg-chart-3",
  "bg-chart-4",
  "bg-chart-5",
  "bg-slate-500",
  "bg-zinc-500",
];

export function useSupabaseParticipants(groupId: string | null) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch participants with pix keys
  const fetchParticipants = useCallback(async () => {
    if (!groupId) {
      setParticipants([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data: participantsData, error: participantsError } = await supabase
        .from("participants")
        .select("*")
        .eq("group_id", groupId)
        .order("created_at", { ascending: true });

      if (participantsError) throw participantsError;

      // Fetch pix keys for all participants
      const participantIds = (participantsData || []).map((p) => p.id);
      let pixKeysData: any[] = [];

      if (participantIds.length > 0) {
        const { data, error: pixError } = await supabase
          .from("pix_keys")
          .select("*")
          .in("participant_id", participantIds);

        if (pixError) throw pixError;
        pixKeysData = data || [];
      }

      // Map participants with their pix keys
      const mappedParticipants: Participant[] = (participantsData || []).map((p) => {
        const pKeys = pixKeysData
          .filter((pk) => pk.participant_id === p.id)
          .map((pk) => ({
            id: pk.id,
            type: pk.key_type as PixKeyType,
            key: pk.key_value,
            label: pk.label || undefined,
          }));

        return {
          id: p.id,
          name: p.name,
          avatar: p.avatar_color || avatarColors[0],
          avatarType: p.avatar_type as "color" | "image",
          avatarImage: p.avatar_image || undefined,
          role: p.role || undefined,
          participationPercentage: p.participation_percentage ? Number(p.participation_percentage) : 100,
          pixKeys: pKeys.length > 0 ? pKeys : undefined,
        };
      });

      setParticipants(mappedParticipants);
    } catch (error) {
      console.error("Error fetching participants:", error);
      toast.error("Erro ao carregar participantes");
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  // Add participant
  const addParticipant = useCallback(async (
    name: string,
    role?: string,
    participationPercentage?: number,
    avatarColor?: string,
    avatarImage?: string
  ) => {
    if (!groupId) return;

    try {
      const newParticipant = {
        group_id: groupId,
        name,
        role,
        participation_percentage: participationPercentage || 100,
        avatar_color: avatarColor || avatarColors[participants.length % avatarColors.length],
        avatar_type: avatarImage ? "image" : "color",
        avatar_image: avatarImage,
      };

      const { data, error } = await supabase
        .from("participants")
        .insert(newParticipant)
        .select()
        .single();

      if (error) throw error;

      const mapped: Participant = {
        id: data.id,
        name: data.name,
        avatar: data.avatar_color || avatarColors[0],
        avatarType: data.avatar_type as "color" | "image",
        avatarImage: data.avatar_image || undefined,
        role: data.role || undefined,
        participationPercentage: data.participation_percentage ? Number(data.participation_percentage) : 100,
      };

      setParticipants((prev) => [...prev, mapped]);
      toast.success("Participante adicionado!");
    } catch (error) {
      console.error("Error adding participant:", error);
      toast.error("Erro ao adicionar participante");
    }
  }, [groupId, participants.length]);

  // Update participant
  const updateParticipant = useCallback(async (id: string, updates: Partial<Participant>) => {
    try {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.role !== undefined) dbUpdates.role = updates.role;
      if (updates.participationPercentage !== undefined) {
        dbUpdates.participation_percentage = updates.participationPercentage;
      }
      if (updates.avatar !== undefined) dbUpdates.avatar_color = updates.avatar;
      if (updates.avatarType !== undefined) dbUpdates.avatar_type = updates.avatarType;
      if (updates.avatarImage !== undefined) dbUpdates.avatar_image = updates.avatarImage;

      // Handle pix keys update separately
      if (updates.pixKeys !== undefined) {
        // Delete existing pix keys
        await supabase
          .from("pix_keys")
          .delete()
          .eq("participant_id", id);

        // Insert new pix keys
        if (updates.pixKeys && updates.pixKeys.length > 0) {
          const pixKeysToInsert = updates.pixKeys.map((pk) => ({
            participant_id: id,
            key_type: pk.type,
            key_value: pk.key,
            label: pk.label,
          }));

          const { error: pixError } = await supabase
            .from("pix_keys")
            .insert(pixKeysToInsert);

          if (pixError) throw pixError;
        }
      }

      // Update participant if there are other updates
      if (Object.keys(dbUpdates).length > 0) {
        const { error } = await supabase
          .from("participants")
          .update(dbUpdates)
          .eq("id", id);

        if (error) throw error;
      }

      setParticipants((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
      );
    } catch (error) {
      console.error("Error updating participant:", error);
      toast.error("Erro ao atualizar participante");
    }
  }, []);

  // Remove participant
  const removeParticipant = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from("participants")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setParticipants((prev) => prev.filter((p) => p.id !== id));
      toast.success("Participante removido!");
    } catch (error) {
      console.error("Error removing participant:", error);
      toast.error("Erro ao remover participante");
    }
  }, []);

  return {
    participants,
    isLoading,
    addParticipant,
    updateParticipant,
    removeParticipant,
    refresh: fetchParticipants,
  };
}
