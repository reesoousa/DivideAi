import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavItemProps {
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

export function BottomNavItem({ icon: Icon, label, isActive, onClick }: BottomNavItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        // Larger touch target for mobile (min 44px)
        "flex flex-col items-center justify-center gap-1 py-3 px-4 min-h-[52px] min-w-[52px]",
        "rounded-xl transition-all duration-200 active:scale-95",
        // Prevent accidental taps with proper spacing
        isActive
          ? "text-primary bg-primary/10"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/30 active:bg-muted/50"
      )}
    >
      <Icon className={cn("h-5 w-5 transition-transform duration-200", isActive && "scale-110")} />
      <span className="text-[10px] font-medium leading-tight">{label}</span>
    </button>
  );
}
