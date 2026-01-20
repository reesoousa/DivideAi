import { useState, useMemo, useCallback, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Header } from "@/components/Header";
import { ParticipantsList } from "@/components/ParticipantsList";
import { AddExpenseForm } from "@/components/AddExpenseForm";
import { ExpensesList } from "@/components/ExpensesList";
import { SummaryCard } from "@/components/SummaryCard";
import { ExpenseCharts } from "@/components/ExpenseCharts";
import { TransparencyCard } from "@/components/TransparencyCard";
import { CategorySummary } from "@/components/CategorySummary";
import { GroupsList } from "@/components/GroupsList";
import { SettlementsWithPayments } from "@/components/SettlementsWithPayments";
import { PaymentHistory } from "@/components/PaymentHistory";
import { MonthSelector } from "@/components/MonthSelector";
import { RecurringItemsList } from "@/components/RecurringItemsList";
import { RecurringSummaryCard } from "@/components/RecurringSummaryCard";
import { PullToRefresh } from "@/components/PullToRefresh";
import { useSupabaseGroups } from "@/hooks/useSupabaseGroups";
import { useSupabaseParticipants } from "@/hooks/useSupabaseParticipants";
import { useSupabaseExpenses } from "@/hooks/useSupabaseExpenses";
import { useSupabasePayments } from "@/hooks/useSupabasePayments";
import { useSupabaseRecurringItems } from "@/hooks/useSupabaseRecurringItems";
import { BottomNavItem } from "@/components/BottomNavItem";
import GroupSettings from "@/pages/GroupSettings";
import { Users, Receipt, BarChart3, ArrowLeft, History, Repeat, Loader2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "@/components/LucideIcon";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

type TabValue = "expenses" | "participants" | "charts" | "history" | "recurring";
type ViewMode = "main" | "settings";

const Index = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<TabValue>("expenses");
  const [viewMode, setViewMode] = useState<ViewMode>("main");

  // Groups hook with Supabase persistence
  const {
    groups,
    selectedGroupId,
    selectedGroup,
    isLoading: isLoadingGroups,
    isRefreshing: isRefreshingGroups,
    isOwner,
    isAdmin,
    addGroup,
    removeGroup,
    updateGroup,
    selectGroup,
    deselectGroup,
    refresh: refreshGroups,
  } = useSupabaseGroups();

  // Handle navigation state (from invite redirect)
  useEffect(() => {
    const state = location.state as { selectGroupId?: string } | null;
    if (state?.selectGroupId) {
      selectGroup(state.selectGroupId);
      // Clear the state to prevent re-selecting on subsequent navigations
      window.history.replaceState({}, document.title);
    }
  }, [location.state, selectGroup]);

  // Participants hook
  const {
    participants,
    isLoading: isLoadingParticipants,
    addParticipant,
    updateParticipant,
    removeParticipant,
    refresh: refreshParticipants,
  } = useSupabaseParticipants(selectedGroupId);

  // Recurring items hook
  const {
    selectedMonth,
    currentMonthItems,
    monthlyTotals,
    recurringExpenses,
    isLoading: isLoadingRecurring,
    addRecurringItem,
    removeRecurringItem,
    updateItemStatus,
    updateRecurringItem,
    goToNextMonth,
    goToPreviousMonth,
    refresh: refreshRecurring,
  } = useSupabaseRecurringItems(selectedGroupId);

  // Combine regular expenses with recurring expenses for calculations
  const {
    expenses,
    isLoading: isLoadingExpenses,
    totalExpenses: regularTotalExpenses,
    expensesByParticipant: regularExpensesByParticipant,
    expensesByCategory: regularExpensesByCategory,
    expensesByMonth: regularExpensesByMonth,
    balanceDetails: regularBalanceDetails,
    settlements: regularSettlements,
    addExpense,
    removeExpense,
    refresh: refreshExpenses,
  } = useSupabaseExpenses(selectedGroupId, participants);

  const isRecurringGroup = selectedGroup?.isRecurring ?? false;

  // Combine regular and recurring expenses for recurring groups
  const allExpenses = useMemo(() => {
    if (isRecurringGroup) {
      return [...expenses, ...recurringExpenses];
    }
    return expenses;
  }, [expenses, recurringExpenses, isRecurringGroup]);

  // Recalculate totals including recurring expenses
  const totalExpenses = useMemo(() => {
    return allExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [allExpenses]);

  const expensesByParticipant = useMemo(() => {
    const map: Record<string, number> = {};
    participants.forEach((p) => {
      map[p.id] = 0;
    });
    allExpenses.forEach((e) => {
      if (map[e.paidBy] !== undefined) {
        map[e.paidBy] += e.amount;
      }
    });
    return map;
  }, [allExpenses, participants]);

  const expensesByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    allExpenses.forEach((e) => {
      if (!map[e.category]) {
        map[e.category] = 0;
      }
      map[e.category] += e.amount;
    });
    return map;
  }, [allExpenses]);

  const expensesByMonth = useMemo(() => {
    const map: Record<string, number> = {};
    allExpenses.forEach((e) => {
      const date = new Date(e.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!map[monthKey]) {
        map[monthKey] = 0;
      }
      map[monthKey] += e.amount;
    });
    return map;
  }, [allExpenses]);

  const balanceDetails = useMemo(() => {
    if (participants.length === 0) return [];

    const shouldPayMap: Record<string, number> = {};
    participants.forEach((p) => {
      shouldPayMap[p.id] = 0;
    });

    allExpenses.forEach((expense) => {
      const splitParticipants =
        expense.splitAmong && expense.splitAmong.length > 0
          ? expense.splitAmong
          : participants.map((p) => p.id);

      const perPerson = expense.amount / splitParticipants.length;
      splitParticipants.forEach((id) => {
        if (shouldPayMap[id] !== undefined) {
          shouldPayMap[id] += perPerson;
        }
      });
    });

    return participants.map((p) => {
      const paid = expensesByParticipant[p.id] || 0;
      const shouldPay = shouldPayMap[p.id] || 0;
      return {
        participantId: p.id,
        paid,
        shouldPay,
        balance: paid - shouldPay,
      };
    });
  }, [participants, allExpenses, expensesByParticipant]);

  const settlements = useMemo(() => {
    if (participants.length < 2) return [];

    const balances: Record<string, number> = {};
    balanceDetails.forEach((detail) => {
      balances[detail.participantId] = detail.balance;
    });

    const debtors: { id: string; amount: number }[] = [];
    const creditors: { id: string; amount: number }[] = [];

    Object.entries(balances).forEach(([id, balance]) => {
      if (balance < -0.01) {
        debtors.push({ id, amount: Math.abs(balance) });
      } else if (balance > 0.01) {
        creditors.push({ id, amount: balance });
      }
    });

    const result: { from: string; to: string; amount: number }[] = [];

    debtors.forEach((debtor) => {
      let remaining = debtor.amount;
      creditors.forEach((creditor) => {
        if (remaining > 0.01 && creditor.amount > 0.01) {
          const transfer = Math.min(remaining, creditor.amount);
          result.push({
            from: debtor.id,
            to: creditor.id,
            amount: Math.round(transfer * 100) / 100,
          });
          remaining -= transfer;
          creditor.amount -= transfer;
        }
      });
    });

    return result;
  }, [participants, balanceDetails]);

  // Payments hook
  const {
    payments,
    isLoading: isLoadingPayments,
    remainingSettlements,
    addPayment,
    removePayment,
    refresh: refreshPayments,
  } = useSupabasePayments(selectedGroupId, settlements);

  // Combined refresh function
  const handleRefresh = useCallback(async () => {
    if (selectedGroupId) {
      await Promise.all([
        refreshParticipants(),
        refreshExpenses(),
        refreshPayments(),
        refreshRecurring(),
      ]);
    } else {
      await refreshGroups();
    }
  }, [selectedGroupId, refreshParticipants, refreshExpenses, refreshPayments, refreshRecurring, refreshGroups]);

  const isLoading = isLoadingGroups || isLoadingParticipants || isLoadingExpenses || isLoadingPayments || isLoadingRecurring;

  const renderContent = () => {
    switch (activeTab) {
      case "expenses":
        return (
          <div className="space-y-4">
            <AddExpenseForm
              participants={participants}
              onAddExpense={addExpense}
              onNavigateToParticipants={() => setActiveTab("participants")}
            />
            <ExpensesList
              expenses={isRecurringGroup ? allExpenses : expenses}
              participants={participants}
              onRemoveExpense={removeExpense}
              isRecurringGroup={isRecurringGroup}
            />
            <SettlementsWithPayments
              settlements={settlements}
              remainingSettlements={remainingSettlements}
              participants={participants}
              payments={payments}
              groupName={selectedGroup?.name}
              onAddPayment={addPayment}
            />
            <TransparencyCard
              participants={participants}
              expenses={isRecurringGroup ? allExpenses : expenses}
              balanceDetails={balanceDetails}
              settlements={settlements}
              totalExpenses={totalExpenses}
            />
          </div>
        );
      case "participants":
        return (
          <div className="space-y-4">
            <ParticipantsList
              participants={participants}
              onAddParticipant={addParticipant}
              onUpdateParticipant={updateParticipant}
              onRemoveParticipant={removeParticipant}
            />
          </div>
        );
      case "charts":
        return (
          <div className="space-y-4">
            <CategorySummary
              expensesByCategory={expensesByCategory}
              totalExpenses={totalExpenses}
            />
            <ExpenseCharts
              expensesByCategory={expensesByCategory}
              expensesByMonth={isRecurringGroup ? expensesByMonth : {}}
              expensesByParticipant={expensesByParticipant}
              participants={participants}
              showMonthlyChart={isRecurringGroup}
            />
          </div>
        );
      case "history":
        return (
          <div className="space-y-4">
            <PaymentHistory
              payments={payments}
              participants={participants}
              onRemovePayment={removePayment}
            />
          </div>
        );
      case "recurring":
        return (
          <div className="space-y-4">
            <MonthSelector
              selectedMonth={selectedMonth}
              onPreviousMonth={goToPreviousMonth}
              onNextMonth={goToNextMonth}
            />
            <RecurringItemsList
              items={currentMonthItems}
              participants={participants}
              onAddItem={addRecurringItem}
              onRemoveItem={removeRecurringItem}
              onUpdateStatus={updateItemStatus}
              onUpdateItem={updateRecurringItem}
              monthlyTotals={monthlyTotals}
            />
          </div>
        );
    }
  };

  // Loading skeleton for groups
  const GroupsLoadingSkeleton = () => (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-background/50 border border-border/30">
          <Skeleton className="w-12 h-12 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );

  // Groups selection view
  if (!selectedGroupId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
        <Header />

        <PullToRefresh onRefresh={handleRefresh} isRefreshing={isRefreshingGroups}>
          <main className="max-w-lg mx-auto px-4 py-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-foreground mb-1">
                Bem-vindo ao DivideAí!
              </h2>
              <p className="text-sm text-muted-foreground">
                {isLoadingGroups ? "Carregando grupos..." : "Selecione ou crie um grupo para começar"}
              </p>
            </div>

            {isLoadingGroups ? (
              <div className="bg-card/70 backdrop-blur-xl border-border/50 shadow-lg rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Carregando seus grupos...</span>
                </div>
                <GroupsLoadingSkeleton />
              </div>
            ) : (
              <GroupsList
                groups={groups}
                onAddGroup={addGroup}
                onRemoveGroup={removeGroup}
                onSelectGroup={selectGroup}
              />
            )}
          </main>
        </PullToRefresh>
      </div>
    );
  }

  // If showing group settings
  if (viewMode === "settings" && selectedGroup) {
    return (
      <GroupSettings
        group={selectedGroup}
        onBack={() => setViewMode("main")}
        onUpdateGroup={updateGroup}
        onDeleteGroup={async (id) => {
          await removeGroup(id);
          setViewMode("main");
        }}
      />
    );
  }

  // Group detail view with tabs
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Custom header with back button */}
      <header className="bg-card/80 backdrop-blur-xl border-b border-border/50 sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              deselectGroup();
              setActiveTab("expenses");
            }}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl ${selectedGroup?.color} flex items-center justify-center shadow-sm`}
            >
              {selectedGroup?.icon && (
                <LucideIcon name={selectedGroup.icon} className="h-5 w-5 text-primary-foreground" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-foreground truncate">
                  {selectedGroup?.name}
                </h1>
                {isRecurringGroup && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/30">
                    <Repeat className="h-2.5 w-2.5 mr-0.5" />
                    Recorrente
                  </Badge>
                )}
              </div>
              {selectedGroup?.description && (
                <p className="text-xs text-muted-foreground truncate">
                  {selectedGroup.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {isLoading && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
            {(isOwner || isAdmin) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode("settings")}
                className="h-9 w-9"
              >
                <Settings className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </header>

      <PullToRefresh onRefresh={handleRefresh} isRefreshing={isLoading}>
        <main className="max-w-lg mx-auto px-4 py-6 pb-32">
          {isRecurringGroup ? (
            <RecurringSummaryCard
              totalMonthly={monthlyTotals.total}
              paidAmount={monthlyTotals.paid + monthlyTotals.partial}
              pendingAmount={monthlyTotals.pending}
              participantsCount={participants.length}
              billingDay={selectedGroup?.billingDay}
            />
          ) : (
            <SummaryCard
              totalExpenses={totalExpenses}
              participantsCount={participants.length}
            />
          )}

          <div className="mt-6 animate-fade-in">
            {renderContent()}
          </div>
        </main>
      </PullToRefresh>

      {/* Bottom Navigation - Fixed with safe area */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 safe-bottom">
        <div className="max-w-lg mx-auto px-3 pb-3 sm:px-4 sm:pb-4">
          <div className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-lg">
            <div className="flex items-center justify-around px-1 py-1">
              {isRecurringGroup && (
                <BottomNavItem
                  icon={Repeat}
                  label="Fixos"
                  isActive={activeTab === "recurring"}
                  onClick={() => setActiveTab("recurring")}
                />
              )}
              <BottomNavItem
                icon={Receipt}
                label="Gastos"
                isActive={activeTab === "expenses"}
                onClick={() => setActiveTab("expenses")}
              />
              <BottomNavItem
                icon={Users}
                label="Pessoas"
                isActive={activeTab === "participants"}
                onClick={() => setActiveTab("participants")}
              />
              <BottomNavItem
                icon={BarChart3}
                label="Métricas"
                isActive={activeTab === "charts"}
                onClick={() => setActiveTab("charts")}
              />
              <BottomNavItem
                icon={History}
                label="Histórico"
                isActive={activeTab === "history"}
                onClick={() => setActiveTab("history")}
              />
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Index;
