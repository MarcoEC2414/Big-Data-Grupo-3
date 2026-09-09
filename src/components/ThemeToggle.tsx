import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { tema, toggleTema } = useTheme();
  const esOscuro = tema === "dark";

  return (
    <button
      type="button"
      onClick={toggleTema}
      aria-label={esOscuro ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
      title={esOscuro ? "Tema claro" : "Tema oscuro"}
      className={`group relative flex h-9 w-16 shrink-0 items-center rounded-full border border-border bg-surface px-1 transition-colors hover:border-primary/40 ${className}`}
    >
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-full bg-card shadow-soft transition-transform duration-300 ease-out ${
          esOscuro ? "translate-x-7" : "translate-x-0"
        }`}
      >
        {esOscuro ? (
          <Moon className="h-3.5 w-3.5 text-primary" />
        ) : (
          <Sun className="h-3.5 w-3.5 text-primary" />
        )}
      </span>
      <Sun
        className={`absolute left-1.5 h-3.5 w-3.5 transition-opacity ${
          esOscuro ? "opacity-30 text-muted-foreground" : "opacity-0"
        }`}
      />
      <Moon
        className={`absolute right-1.5 h-3.5 w-3.5 transition-opacity ${
          esOscuro ? "opacity-0" : "opacity-30 text-muted-foreground"
        }`}
      />
    </button>
  );
}
