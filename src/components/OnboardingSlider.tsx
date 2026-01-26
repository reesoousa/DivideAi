import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import useEmblaCarousel from "embla-carousel-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

  const scrollTo = useCallback(
    (index: number) => emblaApi && emblaApi.scrollTo(index),
    [emblaApi]
  );

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
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
    <div className="fixed inset-0 z-50 bg-background">
      {/* Skip button - top right */}
      {!isLastSlide && (
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 z-10 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors safe-top"
        >
          Pular
        </button>
      )}

      {/* Carousel */}
      <div className="h-full overflow-hidden" ref={emblaRef}>
        <div className="flex h-full">
          {slides.map((slide, index) => (
            <div
              key={index}
              className="flex-[0_0_100%] min-w-0 h-full"
            >
              <img
                src={slide.image}
                alt={`Slide ${index + 1}`}
                className="w-full h-full object-cover"
                draggable={false}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 pb-8 pt-4 safe-bottom">
        {/* Dots indicator */}
        <div className="flex justify-center gap-2 mb-6">
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
          <div className="px-6">
            <Button
              onClick={handleComplete}
              size="lg"
              className="w-full h-14 text-lg font-semibold"
            >
              Começar
            </Button>
          </div>
        )}
      </div>
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
