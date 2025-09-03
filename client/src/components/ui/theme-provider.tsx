import React, { createContext, useContext, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  enableTransitions?: boolean;
};

type ThemeProviderState = {
  theme: Theme;
  systemTheme: "dark" | "light";
  actualTheme: "dark" | "light";
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isSystemTheme: boolean;
};

const initialState: ThemeProviderState = {
  theme: "system",
  systemTheme: "light",
  actualTheme: "light",
  setTheme: () => null,
  toggleTheme: () => null,
  isSystemTheme: true,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "ui-theme",
  enableTransitions = true,
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );
  const [systemTheme, setSystemTheme] = useState<"dark" | "light">("light");
  const [isMounted, setIsMounted] = useState(false);

  // Détecter le thème système
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemTheme(mediaQuery.matches ? "dark" : "light");

    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Calculer le thème actuel
  const actualTheme = theme === "system" ? systemTheme : theme;
  const isSystemTheme = theme === "system";

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;

    // Supprimer les classes de thème existantes
    root.classList.remove("light", "dark");

    if (theme === "system") {
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }

    // Gérer les transitions
    if (enableTransitions && isMounted) {
      root.style.setProperty("--theme-transition", "all 0.3s ease");
      const timer = setTimeout(() => {
        root.style.removeProperty("--theme-transition");
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [theme, systemTheme, enableTransitions, isMounted]);

  const handleSetTheme = (newTheme: Theme) => {
    localStorage.setItem(storageKey, newTheme);
    setTheme(newTheme);
  };

  const toggleTheme = () => {
    if (theme === "system") {
      handleSetTheme(systemTheme === "dark" ? "light" : "dark");
    } else {
      handleSetTheme(theme === "dark" ? "light" : "dark");
    }
  };

  const value: ThemeProviderState = {
    theme,
    systemTheme,
    actualTheme,
    setTheme: handleSetTheme,
    toggleTheme,
    isSystemTheme,
  };

  // Éviter le flash de contenu non stylé
  if (!isMounted) {
    return <div style={{ visibility: "hidden" }}>{children}</div>;
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      <div
        className={cn(
          "min-h-screen bg-background text-foreground antialiased",
          enableTransitions && "transition-colors duration-300"
        )}
      >
        {children}
      </div>
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};

// Composant pour basculer le thème
export interface ThemeToggleProps {
  className?: string;
  size?: "sm" | "default" | "lg";
  variant?: "ghost" | "outline" | "default";
  showLabel?: boolean;
}

export function ThemeToggle({
  className,
  size = "default",
  variant = "ghost",
  showLabel = false,
}: ThemeToggleProps) {
  const { theme, toggleTheme, actualTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        {
          "h-9 w-9": size === "sm",
          "h-10 w-10": size === "default",
          "h-11 w-11": size === "lg",
        },
        {
          "hover:bg-accent hover:text-accent-foreground": variant === "ghost",
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground": variant === "outline",
          "bg-primary text-primary-foreground hover:bg-primary/90": variant === "default",
        },
        className
      )}
      title={`Basculer vers le thème ${actualTheme === "dark" ? "clair" : "sombre"}`}
    >
      {actualTheme === "dark" ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="5" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
      {showLabel && (
        <span className="ml-2 text-sm">
          {actualTheme === "dark" ? "Clair" : "Sombre"}
        </span>
      )}
    </button>
  );
}

// Utilitaires pour la gestion des thèmes
export const themeUtils = {
  getStoredTheme: (storageKey: string = "ui-theme"): Theme | null => {
    if (typeof window === "undefined") return null;
    return (localStorage.getItem(storageKey) as Theme) || null;
  },
  
  getSystemTheme: (): "dark" | "light" => {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  },
  
  applyTheme: (theme: Theme, storageKey: string = "ui-theme") => {
    if (typeof window === "undefined") return;
    
    const root = window.document.documentElement;
    const systemTheme = themeUtils.getSystemTheme();
    const actualTheme = theme === "system" ? systemTheme : theme;
    
    root.classList.remove("light", "dark");
    root.classList.add(actualTheme);
    localStorage.setItem(storageKey, theme);
  },
};