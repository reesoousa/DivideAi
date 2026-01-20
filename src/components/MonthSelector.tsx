import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MonthSelectorProps {
  selectedMonth: string;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
}

export function MonthSelector({
  selectedMonth,
  onPreviousMonth,
  onNextMonth,
}: MonthSelectorProps) {
  const date = parse(selectedMonth, "yyyy-MM", new Date());
  const formattedMonth = format(date, "MMMM 'de' yyyy", { locale: ptBR });

  return (
    <div className="flex items-center justify-between bg-card/70 backdrop-blur-xl border border-border/50 rounded-xl p-2 sm:p-3 shadow-sm">
      <Button
        variant="ghost"
        size="icon"
        onClick={onPreviousMonth}
        className="h-10 w-10 sm:h-9 sm:w-9"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>

      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-primary hidden sm:block" />
        <span className="font-medium capitalize text-foreground text-sm sm:text-base">
          {formattedMonth}
        </span>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={onNextMonth}
        className="h-10 w-10 sm:h-9 sm:w-9"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
}
