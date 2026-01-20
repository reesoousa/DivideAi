import { Calculator, Info, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Participant, Expense, BalanceDetail, Settlement } from "@/types/expense";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface TransparencyCardProps {
  participants: Participant[];
  expenses: Expense[];
  balanceDetails: BalanceDetail[];
  settlements: Settlement[];
  totalExpenses: number;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function TransparencyCard({
  participants,
  expenses,
  balanceDetails,
  settlements,
  totalExpenses,
}: TransparencyCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getParticipantName = (id: string) => {
    return participants.find((p) => p.id === id)?.name || "Desconhecido";
  };

  if (participants.length < 2 || expenses.length === 0) {
    return null;
  }

  const perPerson = totalExpenses / participants.length;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Transparência do Cálculo
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-2 p-3 bg-accent/50 rounded-lg mb-4">
          <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <p className="text-sm text-muted-foreground">
            Clique para ver o cálculo matemático completo de como os valores foram divididos entre os participantes.
          </p>
        </div>

        {isExpanded && (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="step1">
              <AccordionTrigger className="text-sm font-medium">
                1. Total de Gastos
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Soma de todos os gastos registrados:
                  </p>
                  <div className="space-y-1">
                    {expenses.map((expense, index) => (
                      <div key={expense.id} className="flex justify-between text-sm">
                        <span>{expense.description}</span>
                        <span className="font-mono">{formatCurrency(expense.amount)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-border pt-2 mt-2">
                    <div className="flex justify-between font-medium">
                      <span>Total</span>
                      <span className="text-primary font-mono">{formatCurrency(totalExpenses)}</span>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="step2">
              <AccordionTrigger className="text-sm font-medium">
                2. Valor por Pessoa (Divisão Igual)
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Fórmula: Total ÷ Número de Participantes
                  </p>
                  <div className="font-mono text-sm bg-background p-2 rounded">
                    {formatCurrency(totalExpenses)} ÷ {participants.length} = {formatCurrency(perPerson)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Cada pessoa deveria pagar <strong>{formatCurrency(perPerson)}</strong> para dividir igualmente.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="step3">
              <AccordionTrigger className="text-sm font-medium">
                3. Balanço de Cada Participante
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Fórmula: Valor Pago - Valor que Deveria Pagar = Balanço
                  </p>
                  <div className="space-y-3 mt-3">
                    {balanceDetails.map((detail) => (
                      <div key={detail.participantId} className="border border-border rounded-lg p-3">
                        <p className="font-medium text-sm mb-2">
                          {getParticipantName(detail.participantId)}
                        </p>
                        <div className="space-y-1 text-sm font-mono">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Pagou:</span>
                            <span>{formatCurrency(detail.paid)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Deveria pagar:</span>
                            <span>{formatCurrency(detail.shouldPay)}</span>
                          </div>
                          <div className="flex justify-between border-t border-border pt-1 mt-1">
                            <span className="text-muted-foreground">Balanço:</span>
                            <span className={detail.balance >= 0 ? "text-green-600" : "text-red-500"}>
                              {detail.balance >= 0 ? "+" : ""}{formatCurrency(detail.balance)}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {detail.balance > 0 
                            ? `${getParticipantName(detail.participantId)} tem ${formatCurrency(detail.balance)} a receber.`
                            : detail.balance < 0
                            ? `${getParticipantName(detail.participantId)} deve ${formatCurrency(Math.abs(detail.balance))}.`
                            : `${getParticipantName(detail.participantId)} está em dia.`
                          }
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="step4">
              <AccordionTrigger className="text-sm font-medium">
                4. Transferências Necessárias
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Para equilibrar as contas, quem deve transfere para quem tem a receber:
                  </p>
                  {settlements.length === 0 ? (
                    <p className="text-sm text-center py-4 text-green-600 font-medium">
                      ✓ Tudo equilibrado! Ninguém precisa transferir.
                    </p>
                  ) : (
                    <div className="space-y-2 mt-3">
                      {settlements.map((settlement, index) => (
                        <div 
                          key={index} 
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-background rounded-lg"
                        >
                          <div className="flex items-center gap-2 text-sm flex-wrap">
                            <span className="font-medium text-red-500">
                              {getParticipantName(settlement.from)}
                            </span>
                            <span className="text-muted-foreground">→</span>
                            <span className="font-medium text-green-600">
                              {getParticipantName(settlement.to)}
                            </span>
                          </div>
                          <span className="font-bold text-primary whitespace-nowrap">
                            {formatCurrency(settlement.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="formula">
              <AccordionTrigger className="text-sm font-medium">
                📐 Fórmulas Utilizadas
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 p-3 bg-muted/50 rounded-lg text-sm">
                  <div>
                    <p className="font-medium">Valor por Pessoa:</p>
                    <code className="block bg-background p-2 rounded mt-1 font-mono text-xs">
                      valorPorPessoa = totalGastos / numParticipantes
                    </code>
                  </div>
                  <div>
                    <p className="font-medium">Balanço Individual:</p>
                    <code className="block bg-background p-2 rounded mt-1 font-mono text-xs">
                      balanço = valorPago - valorQueDeveriaPagar
                    </code>
                  </div>
                  <div>
                    <p className="font-medium">Interpretação:</p>
                    <ul className="list-disc list-inside mt-1 text-muted-foreground">
                      <li>Balanço positivo (+): pessoa tem a receber</li>
                      <li>Balanço negativo (-): pessoa deve pagar</li>
                      <li>Balanço zero: pessoa está em dia</li>
                    </ul>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        {!isExpanded && (
          <div className="text-center">
            <Button 
              variant="outline" 
              onClick={() => setIsExpanded(true)}
              className="w-full"
            >
              <Calculator className="h-4 w-4 mr-2" />
              Ver Cálculo Detalhado
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
