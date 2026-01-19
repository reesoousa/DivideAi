import { Header } from "@/components/Header";
import { ParticipantsList } from "@/components/ParticipantsList";
import { AddExpenseForm } from "@/components/AddExpenseForm";
import { ExpensesList } from "@/components/ExpensesList";
import { SummaryCard } from "@/components/SummaryCard";
import { SettlementsList } from "@/components/SettlementsList";
import { useExpenseSplitter } from "@/hooks/useExpenseSplitter";

const Index = () => {
  const {
    participants,
    expenses,
    totalExpenses,
    settlements,
    addParticipant,
    removeParticipant,
    addExpense,
    removeExpense,
  } = useExpenseSplitter();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-lg mx-auto px-4 py-6 space-y-4 pb-20">
        <SummaryCard
          totalExpenses={totalExpenses}
          participantsCount={participants.length}
        />

        <ParticipantsList
          participants={participants}
          onAddParticipant={addParticipant}
          onRemoveParticipant={removeParticipant}
        />

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
      </main>
    </div>
  );
};

export default Index;
