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
        "flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-xl transition-all duration-200",
        isActive
          ? "text-primary"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className={cn("h-5 w-5", isActive && "scale-110")} />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}
