import { useState } from "react";
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
import { useExpenseSplitter } from "@/hooks/useExpenseSplitter";
import { useGroups } from "@/hooks/useGroups";
import { useRecurringItems } from "@/hooks/useRecurringItems";
import { BottomNavItem } from "@/components/BottomNavItem";
import { Users, Receipt, BarChart3, ArrowLeft, History, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "@/components/LucideIcon";
import { Badge } from "@/components/ui/badge";

type TabValue = "expenses" | "participants" | "charts" | "history" | "recurring";

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabValue>("expenses");
  
  const {
    groups,
    selectedGroupId,
    selectedGroup,
    addGroup,
    removeGroup,
    selectGroup,
    deselectGroup,
  } = useGroups();

  const {
    selectedMonth,
    currentMonthItems,
    monthlyTotals,
    addRecurringItem,
    removeRecurringItem,
    updateItemStatus,
    updateRecurringItem,
    goToNextMonth,
    goToPreviousMonth,
    clearGroupRecurringData,
  } = useRecurringItems(selectedGroupId);

  const {
    participants,
    expenses,
    allExpenses,
    payments,
    totalExpenses,
    expensesByParticipant,
    expensesByCategory,
    expensesByMonth,
    balanceDetails,
    settlements,
    remainingSettlements,
    addParticipant,
    updateParticipant,
    removeParticipant,
    addExpense,
    removeExpense,
    addPayment,
    removePayment,
    clearGroupData,
  } = useExpenseSplitter(selectedGroupId, currentMonthItems);

  const isRecurringGroup = selectedGroup?.isRecurring ?? false;

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
            {/* Gráfico mensal apenas para grupos recorrentes */}
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

  // Groups selection view
  if (!selectedGroupId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
        <Header />
        
        <main className="max-w-lg mx-auto px-4 py-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-foreground mb-1">
              Bem-vindo ao DivideAí!
            </h2>
            <p className="text-sm text-muted-foreground">
              Selecione ou crie um grupo para começar
            </p>
          </div>

          <GroupsList
            groups={groups}
            onAddGroup={addGroup}
            onRemoveGroup={(id) => {
              removeGroup(id);
              clearGroupData(id);
              clearGroupRecurringData(id);
            }}
            onSelectGroup={selectGroup}
          />
        </main>
      </div>
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
        </div>
      </header>
      
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
