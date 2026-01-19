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
import { useExpenseSplitter } from "@/hooks/useExpenseSplitter";
import { useGroups } from "@/hooks/useGroups";
import { BottomNavItem } from "@/components/BottomNavItem";
import { Users, Receipt, BarChart3, Calculator, ArrowLeft, History } from "lucide-react";
import { Button } from "@/components/ui/button";

type TabValue = "expenses" | "participants" | "charts" | "transparency" | "history";

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
    participants,
    expenses,
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
  } = useExpenseSplitter();

  const renderContent = () => {
    switch (activeTab) {
      case "expenses":
        return (
          <div className="space-y-4">
            <AddExpenseForm
              participants={participants}
              onAddExpense={addExpense}
            />
            <ExpensesList
              expenses={expenses}
              participants={participants}
              onRemoveExpense={removeExpense}
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
              expensesByMonth={expensesByMonth}
              expensesByParticipant={expensesByParticipant}
              participants={participants}
            />
          </div>
        );
      case "transparency":
        return (
          <div className="space-y-4">
            <TransparencyCard
              participants={participants}
              expenses={expenses}
              balanceDetails={balanceDetails}
              settlements={settlements}
              totalExpenses={totalExpenses}
            />
            <SettlementsWithPayments
              settlements={settlements}
              remainingSettlements={remainingSettlements}
              participants={participants}
              payments={payments}
              onAddPayment={addPayment}
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
              Bem-vindo ao SorocaLovers!
            </h2>
            <p className="text-sm text-muted-foreground">
              Selecione ou crie um grupo para começar
            </p>
          </div>

          <GroupsList
            groups={groups}
            onAddGroup={addGroup}
            onRemoveGroup={removeGroup}
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
            onClick={deselectGroup}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl ${selectedGroup?.color} flex items-center justify-center text-xl shadow-sm`}
            >
              {selectedGroup?.icon}
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-foreground truncate">
                {selectedGroup?.name}
              </h1>
              {selectedGroup?.description && (
                <p className="text-xs text-muted-foreground truncate">
                  {selectedGroup.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-lg mx-auto px-4 py-6 pb-28">
        <SummaryCard
          totalExpenses={totalExpenses}
          participantsCount={participants.length}
        />

        <div className="mt-6">
          {renderContent()}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50">
        <div className="max-w-lg mx-auto px-4 pb-4">
          <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-lg px-1 py-1">
            <div className="flex items-center justify-around">
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
                icon={Calculator}
                label="Cálculo"
                isActive={activeTab === "transparency"}
                onClick={() => setActiveTab("transparency")}
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
