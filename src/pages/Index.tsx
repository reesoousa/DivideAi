import { useState } from "react";
import { Header } from "@/components/Header";
import { ParticipantsList } from "@/components/ParticipantsList";
import { AddExpenseForm } from "@/components/AddExpenseForm";
import { ExpensesList } from "@/components/ExpensesList";
import { SummaryCard } from "@/components/SummaryCard";
import { SettlementsList } from "@/components/SettlementsList";
import { ExpenseCharts } from "@/components/ExpenseCharts";
import { TransparencyCard } from "@/components/TransparencyCard";
import { CategorySummary } from "@/components/CategorySummary";
import { useExpenseSplitter } from "@/hooks/useExpenseSplitter";
import { BottomNavItem } from "@/components/BottomNavItem";
import { Users, Receipt, BarChart3, Calculator } from "lucide-react";

type TabValue = "expenses" | "participants" | "charts" | "transparency";

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabValue>("expenses");
  const {
    participants,
    expenses,
    totalExpenses,
    expensesByParticipant,
    expensesByCategory,
    expensesByMonth,
    balanceDetails,
    settlements,
    addParticipant,
    updateParticipant,
    removeParticipant,
    addExpense,
    removeExpense,
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
            <SettlementsList
              settlements={settlements}
              participants={participants}
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
            <SettlementsList
              settlements={settlements}
              participants={participants}
            />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <Header />
      
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
          <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-lg px-2 py-1">
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
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Index;
