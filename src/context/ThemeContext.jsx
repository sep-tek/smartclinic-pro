import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const ThemeContext = createContext(null);

const STORAGE_KEY = "smartclinic-theme";
const VALID_THEMES = [
  "default",
  "light",
  "dark",
  "system",
  "midnight",
  "warm",
  "ocean",
  "lavender",
  "graphite",
];

function getStoredTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return VALID_THEMES.includes(stored) ? stored : "default";
  } catch {
    return "default";
  }
}

function getSystemTheme() {
  if (
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: light)").matches
  ) {
    return "light";
  }

  return "dark";
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getStoredTheme);
  const [systemTheme, setSystemTheme] = useState(getSystemTheme);

  const resolvedTheme =
    theme === "system"
      ? systemTheme
      : theme === "light" ||
          theme === "dark" ||
          theme === "midnight" ||
          theme === "warm" ||
          theme === "ocean" ||
          theme === "lavender" ||
          theme === "graphite"
        ? theme
        : "dark";

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      resolvedTheme
    );

    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // ignore storage errors
    }
  }, [theme, resolvedTheme]);

  useEffect(() => {
    if (!window.matchMedia) {
      return;
    }

    const media = window.matchMedia(
      "(prefers-color-scheme: light)"
    );

    function handleChange(event) {
      setSystemTheme(event.matches ? "light" : "dark");
    }

    media.addEventListener("change", handleChange);

    return () =>
      media.removeEventListener("change", handleChange);
  }, []);

  function setTheme(nextTheme) {
    if (VALID_THEMES.includes(nextTheme)) {
      setThemeState(nextTheme);
    }
  }

  return (
    <ThemeContext.Provider
      value={{ theme, resolvedTheme, setTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
