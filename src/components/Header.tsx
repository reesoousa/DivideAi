import { Heart } from "lucide-react";

export function Header() {
  return (
    <header className="bg-card/70 backdrop-blur-xl border-b border-border/50 px-4 py-4 sticky top-0 z-40">
      <div className="max-w-lg mx-auto flex items-center justify-center gap-2">
        <Heart className="h-6 w-6 text-primary fill-primary" />
        <h1 className="text-xl font-bold text-foreground">SorocaLovers</h1>
      </div>
    </header>
  );
}
