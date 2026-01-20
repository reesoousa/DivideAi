import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { z } from "zod";

export type Language = "pt-BR" | "en-US" | "es-ES";
export type Currency = "BRL" | "USD" | "EUR";
export type DateFormat = "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";
export type ThemeMode = "light" | "dark" | "system";

interface NotificationSettings {
  enabled: boolean;
  pendingCharges: boolean;
  newExpenses: boolean;
}

interface AppSettings {
  language: Language;
  currency: Currency;
  dateFormat: DateFormat;
  theme: ThemeMode;
  notifications: NotificationSettings;
}

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
  updateNotifications: (updates: Partial<NotificationSettings>) => void;
  formatCurrency: (value: number) => string;
  formatDate: (date: Date) => string;
}

// Zod schema for settings validation
const notificationSettingsSchema = z.object({
  enabled: z.boolean(),
  pendingCharges: z.boolean(),
  newExpenses: z.boolean(),
});

const settingsSchema = z.object({
  language: z.enum(["pt-BR", "en-US", "es-ES"]),
  currency: z.enum(["BRL", "USD", "EUR"]),
  dateFormat: z.enum(["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"]),
  theme: z.enum(["light", "dark", "system"]),
  notifications: notificationSettingsSchema,
});

const defaultSettings: AppSettings = {
  language: "pt-BR",
  currency: "BRL",
  dateFormat: "DD/MM/YYYY",
  theme: "system",
  notifications: {
    enabled: true,
    pendingCharges: true,
    newExpenses: true,
  },
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const STORAGE_KEY = "divideai-settings";

// Safe function to load and validate settings from localStorage
function loadSettingsFromStorage(): AppSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaultSettings;
    
    const parsed = JSON.parse(stored);
    
    // Validate with zod schema - use partial and merge with defaults
    const validated = settingsSchema.partial().safeParse(parsed);
    
    if (validated.success) {
      // Merge with defaults to ensure all required fields exist
      return {
        ...defaultSettings,
        ...validated.data,
        notifications: {
          ...defaultSettings.notifications,
          ...(validated.data.notifications || {}),
        },
      };
    }
    
    // If validation fails, return defaults
    console.warn("Invalid settings in localStorage, using defaults");
    return defaultSettings;
  } catch {
    return defaultSettings;
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(loadSettingsFromStorage);

  // Always apply light theme
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add("light");
  }, []);

  // Persist settings
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (updates: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  const updateNotifications = (updates: Partial<NotificationSettings>) => {
    setSettings((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, ...updates },
    }));
  };

  const formatCurrency = (value: number): string => {
    const localeMap: Record<Currency, string> = {
      BRL: "pt-BR",
      USD: "en-US",
      EUR: "de-DE",
    };

    return new Intl.NumberFormat(localeMap[settings.currency], {
      style: "currency",
      currency: settings.currency,
    }).format(value);
  };

  const formatDate = (date: Date): string => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();

    switch (settings.dateFormat) {
      case "DD/MM/YYYY":
        return `${day}/${month}/${year}`;
      case "MM/DD/YYYY":
        return `${month}/${day}/${year}`;
      case "YYYY-MM-DD":
        return `${year}-${month}-${day}`;
      default:
        return `${day}/${month}/${year}`;
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        updateNotifications,
        formatCurrency,
        formatDate,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
