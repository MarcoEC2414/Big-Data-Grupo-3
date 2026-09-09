import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type Tema = "light" | "dark";

const THEME_STORAGE_KEY = "senati-theme";

interface ThemeContextValue {
  tema: Tema;
  toggleTema: () => void;
  setTema: (tema: Tema) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function aplicarClaseTema(tema: Tema) {
  const root = document.documentElement;
  if (tema === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

function leerTemaInicial(): Tema {
  if (typeof window === "undefined") return "dark";
  const guardado = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (guardado === "light" || guardado === "dark") return guardado;
  // Por defecto oscuro: es la identidad visual principal del sistema.
  return "dark";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [tema, setTemaState] = useState<Tema>(() => leerTemaInicial());

  useEffect(() => {
    aplicarClaseTema(tema);
    window.localStorage.setItem(THEME_STORAGE_KEY, tema);
  }, [tema]);

  const setTema = (nuevo: Tema) => setTemaState(nuevo);
  const toggleTema = () => setTemaState((actual) => (actual === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ tema, toggleTema, setTema }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme debe usarse dentro de <ThemeProvider>");
  return ctx;
}
