import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Payment, Settlement } from "@/types/expense";
import { toast } from "sonner";

export function useSupabasePayments(groupId: string | null, settlements: Settlement[]) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch payments
  const fetchPayments = useCallback(async () => {
    if (!groupId) {
      setPayments([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("group_id", groupId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mapped: Payment[] = (data || []).map((p) => ({
        id: p.id,
        settlementFrom: p.from_participant_id,
        settlementTo: p.to_participant_id,
        amount: Number(p.amount),
        date: new Date(p.created_at),
        receiptUrl: p.receipt_url || undefined,
        note: p.notes || undefined,
      }));

      setPayments(mapped);
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast.error("Erro ao carregar pagamentos");
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // Add payment
  const addPayment = useCallback(async (
    settlementFrom: string,
    settlementTo: string,
    amount: number,
    receiptUrl?: string,
    note?: string
  ) => {
    if (!groupId) return;

    try {
      const newPayment = {
        group_id: groupId,
        from_participant_id: settlementFrom,
        to_participant_id: settlementTo,
        amount,
        receipt_url: receiptUrl,
        notes: note,
      };

      const { data, error } = await supabase
        .from("payments")
        .insert(newPayment)
        .select()
        .single();

      if (error) throw error;

      const mapped: Payment = {
        id: data.id,
        settlementFrom: data.from_participant_id,
        settlementTo: data.to_participant_id,
        amount: Number(data.amount),
        date: new Date(data.created_at),
        receiptUrl: data.receipt_url || undefined,
        note: data.notes || undefined,
      };

      setPayments((prev) => [mapped, ...prev]);
      toast.success("Pagamento registrado!");
    } catch (error) {
      console.error("Error adding payment:", error);
      toast.error("Erro ao registrar pagamento");
    }
  }, [groupId]);

  // Remove payment
  const removePayment = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from("payments")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setPayments((prev) => prev.filter((p) => p.id !== id));
      toast.success("Pagamento removido!");
    } catch (error) {
      console.error("Error removing payment:", error);
      toast.error("Erro ao remover pagamento");
    }
  }, []);

  // Calculate remaining settlements
  const remainingSettlements = useMemo((): Settlement[] => {
    const paidAmounts: Record<string, number> = {};

    payments.forEach((payment) => {
      const key = `${payment.settlementFrom}-${payment.settlementTo}`;
      paidAmounts[key] = (paidAmounts[key] || 0) + payment.amount;
    });

    return settlements
      .map((settlement) => {
        const key = `${settlement.from}-${settlement.to}`;
        const paid = paidAmounts[key] || 0;
        const remaining = settlement.amount - paid;
        return {
          ...settlement,
          amount: Math.max(0, Math.round(remaining * 100) / 100),
        };
      })
      .filter((s) => s.amount > 0.01);
  }, [settlements, payments]);

  return {
    payments,
    isLoading,
    remainingSettlements,
    addPayment,
    removePayment,
    refresh: fetchPayments,
  };
}
