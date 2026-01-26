import { useState, useCallback, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Users, Receipt, Wallet, ChevronRight, ChevronLeft, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface TutorialStep {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const tutorialSteps: TutorialStep[] = [
  {
    icon: <Users className="h-12 w-12" />,
    title: "Adicione pessoas",
    description: "Comece adicionando os participantes do grupo. Eles poderão acompanhar as despesas junto com você.",
  },
  {
    icon: <Receipt className="h-12 w-12" />,
    title: "Cadastre despesas",
    description: "Registre os gastos informando quem pagou e como será dividido entre os participantes.",
  },
  {
    icon: <Wallet className="h-12 w-12" />,
    title: "Acerte as contas",
    description: "O app calcula automaticamente quem deve quanto para quem. Use Pix para facilitar os pagamentos!",
  },
];

interface FirstGroupTutorialProps {
  open: boolean;
  onClose: () => void;
}

export function FirstGroupTutorial({ open, onClose }: FirstGroupTutorialProps) {
  const { user } = useAuth();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  // Track carousel changes
  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  const markTutorialAsSeen = async () => {
    if (!user) return;
    
    try {
      await supabase
        .from("profiles")
        .update({ has_seen_first_group_tutorial: true })
        .eq("user_id", user.id);
    } catch (error) {
      console.error("Error updating tutorial status:", error);
    }
  };

  const handleClose = async () => {
    await markTutorialAsSeen();
    onClose();
  };

  const handleComplete = async () => {
    await markTutorialAsSeen();
    onClose();
  };

  const isLastStep = selectedIndex === tutorialSteps.length - 1;
  const isFirstStep = selectedIndex === 0;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-sm p-0 gap-0 overflow-hidden">
        <VisuallyHidden>
          <DialogTitle>Tutorial do primeiro grupo</DialogTitle>
        </VisuallyHidden>
        
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-3 top-3 z-10 h-8 w-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          aria-label="Fechar tutorial"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Carousel */}
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {tutorialSteps.map((step, index) => (
              <div
                key={index}
                className="flex-[0_0_100%] min-w-0 p-6 pt-10"
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    {step.icon}
                  </div>
                  <h3 className="text-xl font-semibold">{step.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 pt-2 space-y-4">
          {/* Dots */}
          <div className="flex justify-center gap-2">
            {tutorialSteps.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-300",
                  selectedIndex === index
                    ? "bg-primary w-4"
                    : "bg-muted-foreground/30"
                )}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex gap-3">
            {!isFirstStep && (
              <Button
                variant="outline"
                onClick={scrollPrev}
                className="flex-1"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Voltar
              </Button>
            )}
            
            {isLastStep ? (
              <Button
                onClick={handleComplete}
                className="flex-1"
              >
                Entendi!
              </Button>
            ) : (
              <Button
                onClick={scrollNext}
                className={cn("flex-1", isFirstStep && "w-full")}
              >
                Próximo
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
