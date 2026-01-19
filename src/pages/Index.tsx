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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Receipt, BarChart3, Calculator } from "lucide-react";

const Index = () => {
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-lg mx-auto px-4 py-6 pb-20">
        <SummaryCard
          totalExpenses={totalExpenses}
          participantsCount={participants.length}
        />

        <Tabs defaultValue="expenses" className="mt-6">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="expenses" className="text-xs">
              <Receipt className="h-3 w-3 mr-1" />
              Gastos
            </TabsTrigger>
            <TabsTrigger value="participants" className="text-xs">
              <Users className="h-3 w-3 mr-1" />
              Pessoas
            </TabsTrigger>
            <TabsTrigger value="charts" className="text-xs">
              <BarChart3 className="h-3 w-3 mr-1" />
              Gráficos
            </TabsTrigger>
            <TabsTrigger value="transparency" className="text-xs">
              <Calculator className="h-3 w-3 mr-1" />
              Cálculo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="expenses" className="space-y-4 mt-0">
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
          </TabsContent>

          <TabsContent value="participants" className="space-y-4 mt-0">
            <ParticipantsList
              participants={participants}
              onAddParticipant={addParticipant}
              onUpdateParticipant={updateParticipant}
              onRemoveParticipant={removeParticipant}
            />
          </TabsContent>

          <TabsContent value="charts" className="space-y-4 mt-0">
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
          </TabsContent>

          <TabsContent value="transparency" className="space-y-4 mt-0">
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
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
