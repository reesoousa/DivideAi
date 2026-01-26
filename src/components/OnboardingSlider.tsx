import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import useEmblaCarousel from "embla-carousel-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Import onboarding images
import slide01 from "@/assets/onboarding/slide-01.png";
import slide02 from "@/assets/onboarding/slide-02.png";
import slide03 from "@/assets/onboarding/slide-03.png";
import slide04 from "@/assets/onboarding/slide-04.png";
import slide05 from "@/assets/onboarding/slide-05.png";

const ONBOARDING_KEY = "divideai_onboarding_completed";

const slides = [
  { image: slide01 },
  { image: slide02 },
  { image: slide03 },
  { image: slide04 },
  { image: slide05 },
];

interface OnboardingSliderProps {
  onComplete: () => void;
}

export function OnboardingSlider({ onComplete }: OnboardingSliderProps) {
  const navigate = useNavigate();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);

  const scrollTo = useCallback(
    (index: number) => emblaApi && emblaApi.scrollTo(index),
    [emblaApi]
  );

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    onComplete();
    navigate("/auth");
  };

  const handleSkip = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    onComplete();
    navigate("/auth");
  };

  const isLastSlide = selectedIndex === slides.length - 1;

  return (
    <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
      {/* Skip button - top right */}
      {!isLastSlide && (
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 z-20 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors safe-top"
        >
          Pular
        </button>
      )}

      {/* Desktop container - centered with max width */}
      <div className="w-full h-full md:w-auto md:h-auto md:max-w-md md:max-h-[90vh] md:rounded-2xl md:overflow-hidden md:shadow-2xl md:border md:border-border/50 flex flex-col">
        {/* Carousel */}
        <div className="flex-1 overflow-hidden relative" ref={emblaRef}>
          <div className="flex h-full">
            {slides.map((slide, index) => (
              <div
                key={index}
                className="flex-[0_0_100%] min-w-0 h-full md:h-[70vh] md:max-h-[600px]"
              >
                <img
                  src={slide.image}
                  alt={`Slide ${index + 1}`}
                  className="w-full h-full object-cover md:object-contain"
                  draggable={false}
                />
              </div>
            ))}
          </div>

          {/* Desktop navigation arrows */}
          <div className="hidden md:flex absolute inset-y-0 left-0 items-center">
            <button
              onClick={scrollPrev}
              disabled={!canScrollPrev}
              className={cn(
                "ml-2 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center transition-all",
                canScrollPrev 
                  ? "opacity-80 hover:opacity-100 hover:bg-background shadow-md" 
                  : "opacity-0 pointer-events-none"
              )}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          </div>
          <div className="hidden md:flex absolute inset-y-0 right-0 items-center">
            <button
              onClick={scrollNext}
              disabled={!canScrollNext}
              className={cn(
                "mr-2 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center transition-all",
                canScrollNext 
                  ? "opacity-80 hover:opacity-100 hover:bg-background shadow-md" 
                  : "opacity-0 pointer-events-none"
              )}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 md:relative pb-8 pt-4 safe-bottom md:pb-6 md:pt-4 bg-gradient-to-t from-background/80 to-transparent md:from-transparent md:bg-card/50">
          {/* Dots indicator */}
          <div className="flex justify-center gap-2 mb-6 md:mb-4">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => scrollTo(index)}
                className={cn(
                  "w-2.5 h-2.5 rounded-full transition-all duration-300",
                  selectedIndex === index
                    ? "bg-primary w-6"
                    : "bg-muted-foreground/40 hover:bg-muted-foreground/60"
                )}
                aria-label={`Ir para slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Action button - only on last slide */}
          {isLastSlide && (
            <div className="px-6 md:px-8">
              <Button
                onClick={handleComplete}
                size="lg"
                className="w-full h-14 md:h-12 text-lg md:text-base font-semibold"
              >
                Começar
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Desktop backdrop overlay */}
      <div className="hidden md:block fixed inset-0 bg-background/95 -z-10" />
    </div>
  );
}

export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const hasCompleted = localStorage.getItem(ONBOARDING_KEY) === "true";
    setShowOnboarding(!hasCompleted);
    setIsChecking(false);
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setShowOnboarding(false);
  };

  return { showOnboarding, isChecking, completeOnboarding };
}
