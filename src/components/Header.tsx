import { LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import divideaiLogo from "@/assets/divideai-logo.png";

export function Header() {
  const { user, signOut } = useAuth();

  return (
    <header className="bg-card/70 backdrop-blur-xl border-b border-border/50 px-4 py-4 sticky top-0 z-40">
      <div className="max-w-lg mx-auto flex items-center justify-between gap-2">
        <img 
          src={divideaiLogo} 
          alt="DivideAí" 
          className="h-5 w-auto"
        />
        
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-xs font-medium text-primary">
                    {user.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem className="text-xs text-muted-foreground cursor-default">
                {user.email}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={signOut} className="gap-2 text-destructive">
                <LogOut className="h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
