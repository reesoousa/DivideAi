import { useMemo } from "react";
import { BarChart3, PieChart, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, Pie, PieChart as RechartsPie, Cell, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";
import { defaultCategories, getCategoryName, getCategoryIcon } from "@/lib/categories";
import { Participant } from "@/types/expense";

interface ExpenseChartsProps {
  expensesByCategory: Record<string, number>;
  expensesByMonth: Record<string, number>;
  expensesByParticipant: Record<string, number>;
  participants: Participant[];
  showMonthlyChart?: boolean;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
];

export function ExpenseCharts({
  expensesByCategory,
  expensesByMonth,
  expensesByParticipant,
  participants,
  showMonthlyChart = true,
}: ExpenseChartsProps) {
  const categoryData = useMemo(() => {
    return Object.entries(expensesByCategory)
      .filter(([_, value]) => value > 0)
      .map(([category, value], index) => ({
        name: getCategoryName(category),
        iconName: getCategoryIcon(category),
        value,
        fill: CHART_COLORS[index % CHART_COLORS.length],
      }));
  }, [expensesByCategory]);

  const monthData = useMemo(() => {
    const sortedMonths = Object.entries(expensesByMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, value]) => {
        const [year, monthNum] = month.split('-');
        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        return {
          month: `${monthNames[parseInt(monthNum) - 1]}/${year.slice(2)}`,
          value,
        };
      });
    return sortedMonths;
  }, [expensesByMonth]);

  const participantData = useMemo(() => {
    return participants.map((p, index) => ({
      name: p.name,
      value: expensesByParticipant[p.id] || 0,
      fill: CHART_COLORS[index % CHART_COLORS.length],
    }));
  }, [participants, expensesByParticipant]);

  const chartConfig: ChartConfig = {
    value: {
      label: "Valor",
      color: "hsl(var(--primary))",
    },
  };

  if (Object.keys(expensesByCategory).length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Análise de Gastos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="category" className="w-full">
          <TabsList className={`grid w-full ${showMonthlyChart ? 'grid-cols-3' : 'grid-cols-2'} mb-4`}>
            <TabsTrigger value="category" className="text-xs">
              <PieChart className="h-3 w-3 mr-1" />
              Categorias
            </TabsTrigger>
            <TabsTrigger value="participant" className="text-xs">
              <BarChart3 className="h-3 w-3 mr-1" />
              Participantes
            </TabsTrigger>
            {showMonthlyChart && (
              <TabsTrigger value="monthly" className="text-xs">
                <TrendingUp className="h-3 w-3 mr-1" />
                Mensal
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="category" className="mt-0">
            {categoryData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <RechartsPie>
                  <ChartTooltip 
                    content={
                      <ChartTooltipContent 
                        formatter={(value) => formatCurrency(value as number)} 
                      />
                    } 
                  />
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </RechartsPie>
              </ChartContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">Nenhum gasto registrado</p>
            )}
            <div className="mt-4 space-y-2">
              {categoryData.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.fill }}
                    />
                    <span>{item.name}</span>
                  </div>
                  <span className="font-medium">{formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="participant" className="mt-0">
            {participantData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <BarChart data={participantData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={(value) => `R$${value}`} />
                  <YAxis type="category" dataKey="name" width={80} />
                  <ChartTooltip 
                    content={
                      <ChartTooltipContent 
                        formatter={(value) => formatCurrency(value as number)} 
                      />
                    } 
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {participantData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">Nenhum participante</p>
            )}
          </TabsContent>

          <TabsContent value="monthly" className="mt-0">
            {monthData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <LineChart data={monthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `R$${value}`} />
                  <ChartTooltip 
                    content={
                      <ChartTooltipContent 
                        formatter={(value) => formatCurrency(value as number)} 
                      />
                    } 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              </ChartContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">Nenhum dado mensal</p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
