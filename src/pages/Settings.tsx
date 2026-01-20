import { useNavigate } from "react-router-dom";
import { useSettings, Language, Currency, DateFormat, ThemeMode } from "@/contexts/SettingsContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Bell,
  Globe,
  Info,
  DollarSign,
  Calendar,
  ExternalLink,
  Palette,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";

const APP_VERSION = "1.0.0";

const languages: { value: Language; label: string; flag: string }[] = [
  { value: "pt-BR", label: "Português (Brasil)", flag: "🇧🇷" },
  { value: "en-US", label: "English (US)", flag: "🇺🇸" },
  { value: "es-ES", label: "Español", flag: "🇪🇸" },
];

const currencies: { value: Currency; label: string; symbol: string }[] = [
  { value: "BRL", label: "Real Brasileiro", symbol: "R$" },
  { value: "USD", label: "Dólar Americano", symbol: "$" },
  { value: "EUR", label: "Euro", symbol: "€" },
];

const dateFormats: { value: DateFormat; label: string; example: string }[] = [
  { value: "DD/MM/YYYY", label: "DD/MM/AAAA", example: "25/01/2025" },
  { value: "MM/DD/YYYY", label: "MM/DD/AAAA", example: "01/25/2025" },
  { value: "YYYY-MM-DD", label: "AAAA-MM-DD", example: "2025-01-25" },
];

const themeOptions: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Escuro", icon: Moon },
  { value: "system", label: "Sistema", icon: Monitor },
];

export default function Settings() {
  const navigate = useNavigate();
  const { settings, updateSettings, updateNotifications, updateTheme } = useSettings();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-xl border-b border-border/50 sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-bold text-foreground">Configurações</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6 pb-8">
        {/* Theme Section */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Palette className="h-5 w-5 text-primary" />
              Aparência
            </CardTitle>
            <CardDescription>
              Escolha o tema do aplicativo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {themeOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = settings.theme === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => updateTheme(option.value)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border/50 bg-background/50 hover:border-primary/50"
                    }`}
                  >
                    <Icon className={`h-6 w-6 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                    <span className={`text-sm font-medium ${isSelected ? "text-primary" : "text-foreground"}`}>
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Notifications Section */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="h-5 w-5 text-primary" />
              Notificações
            </CardTitle>
            <CardDescription>
              Gerencie como você recebe avisos do aplicativo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5 flex-1">
                <Label htmlFor="notifications-enabled" className="font-medium">
                  Ativar notificações
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receba avisos importantes do app
                </p>
              </div>
              <Switch
                id="notifications-enabled"
                checked={settings.notifications.enabled}
                onCheckedChange={(enabled) => updateNotifications({ enabled })}
                className="flex-shrink-0"
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5 flex-1">
                <Label htmlFor="pending-charges" className="font-medium">
                  Cobranças pendentes
                </Label>
                <p className="text-sm text-muted-foreground">
                  Aviso de itens fixos não pagos
                </p>
              </div>
              <Switch
                id="pending-charges"
                checked={settings.notifications.pendingCharges}
                onCheckedChange={(pendingCharges) =>
                  updateNotifications({ pendingCharges })
                }
                disabled={!settings.notifications.enabled}
                className="flex-shrink-0"
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5 flex-1">
                <Label htmlFor="new-expenses" className="font-medium">
                  Novos gastos
                </Label>
                <p className="text-sm text-muted-foreground">
                  Aviso quando alguém adiciona um gasto
                </p>
              </div>
              <Switch
                id="new-expenses"
                checked={settings.notifications.newExpenses}
                onCheckedChange={(newExpenses) =>
                  updateNotifications({ newExpenses })
                }
                disabled={!settings.notifications.enabled}
                className="flex-shrink-0"
              />
            </div>
          </CardContent>
        </Card>

        {/* App Preferences Section */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Globe className="h-5 w-5 text-primary" />
              Preferências do Aplicativo
            </CardTitle>
            <CardDescription>
              Personalize idioma, moeda e formato de data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Language */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                Idioma
              </Label>
              <Select
                value={settings.language}
                onValueChange={(value: Language) =>
                  updateSettings({ language: value })
                }
              >
                <SelectTrigger className="bg-background/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      <span className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Currency */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                Moeda padrão
              </Label>
              <Select
                value={settings.currency}
                onValueChange={(value: Currency) =>
                  updateSettings({ currency: value })
                }
              >
                <SelectTrigger className="bg-background/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((curr) => (
                    <SelectItem key={curr.value} value={curr.value}>
                      <span className="flex items-center gap-2">
                        <span className="font-mono text-muted-foreground">
                          {curr.symbol}
                        </span>
                        <span>{curr.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Date Format */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Formato de data
              </Label>
              <Select
                value={settings.dateFormat}
                onValueChange={(value: DateFormat) =>
                  updateSettings({ dateFormat: value })
                }
              >
                <SelectTrigger className="bg-background/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dateFormats.map((format) => (
                    <SelectItem key={format.value} value={format.value}>
                      <span className="flex items-center gap-2">
                        <span>{format.label}</span>
                        <span className="text-muted-foreground text-xs">
                          ({format.example})
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* About Section */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Info className="h-5 w-5 text-primary" />
              Sobre o Aplicativo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <span className="text-muted-foreground">Nome</span>
              <span className="font-medium">DivideAí</span>
            </div>

            <Separator />

            <div className="flex items-center justify-between py-2">
              <span className="text-muted-foreground">Versão</span>
              <span className="font-mono text-sm bg-muted px-2 py-0.5 rounded">
                v{APP_VERSION}
              </span>
            </div>

            <Separator />

            <div className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-between text-muted-foreground hover:text-foreground"
                onClick={() => window.open("#", "_blank")}
              >
                Termos de Uso
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-between text-muted-foreground hover:text-foreground"
                onClick={() => window.open("#", "_blank")}
              >
                Política de Privacidade
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground py-4">
          DivideAí © 2025 • Simplifique suas divisões
        </p>
      </main>
    </div>
  );
}
