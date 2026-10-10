import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "../context/ThemeContext";
import "./ThemeSwitcher.css";

const OPTIONS = [
  { value: "default", label: "Default / Sage", theme: "dark" },
  { value: "light", label: "Light", theme: "light" },
  { value: "dark", label: "Dark", theme: "dark" },
  { value: "system", label: "System", theme: "system" },
  { value: "midnight", label: "Midnight", theme: "midnight" },
  { value: "warm", label: "Warm", theme: "warm" },
  { value: "ocean", label: "Ocean", theme: "ocean" },
  { value: "lavender", label: "Lavender", theme: "lavender" },
  { value: "graphite", label: "Graphite", theme: "graphite" },
];

const LABELS = {
  default: "Default (Sage)",
  light: "Light",
  dark: "Dark",
  system: "System",
  midnight: "Midnight",
  warm: "Warm",
  ocean: "Ocean",
  lavender: "Lavender",
  graphite: "Graphite",
};

function ThemeIcon({ theme }) {
  const stroke = "currentColor";

  if (theme === "light" || theme === "warm" || theme === "lavender") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    );
  }

  if (theme === "system") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" aria-hidden="true">
        <rect x="3" y="4" width="18" height="12" rx="2" />
        <path d="M8 20h8M12 16v4" />
      </svg>
    );
  }

  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" aria-hidden="true">
      <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" />
    </svg>
  );
}

function ThemeSwitcher({ label = "Color theme" }) {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  /* =====================================================
     MOBILE SHEET (PORTAL)
     ---------------------------------------------------------
     On small screens the menu must escape its parent
     containers. The admin sidebar is `position: fixed` with a
     `transform` and `overflow-y: auto`, and a non-`none`
     transform on an ancestor makes it the containing block
     for `position: fixed` descendants — so an in-place menu
     gets clipped and mis-positioned inside the drawer.

     Rendering it into document.body removes every ancestor
     transform, overflow and stacking context, so the sheet
     is always positioned against the viewport.

     Desktop keeps the original in-place absolute menu.
     ===================================================== */

  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(max-width: 800px)").matches
      : false
  );

  useEffect(() => {
    const media = window.matchMedia("(max-width: 800px)");

    function onChange(event) {
      setIsMobile(event.matches);
    }

    media.addEventListener("change", onChange);

    return () => {
      media.removeEventListener("change", onChange);
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    function onPointer(event) {
      const target = event.target;

      /* The menu may be portaled to document.body, so it is
         not a descendant of rootRef and must be checked too.
         Without this, tapping an option would be treated as
         an outside click and unmount the menu before its
         onClick ran. */

      if (
        !rootRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    }

    function onKey(event) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const menu = (
    <div
      className="theme-menu"
      role="menu"
      aria-label={label}
      ref={menuRef}
    >
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          role="menuitemradio"
          aria-checked={theme === option.value}
          className={
            theme === option.value
              ? "theme-option active"
              : "theme-option"
          }
          onClick={() => {
            setTheme(option.value);
            setOpen(false);
            buttonRef.current?.focus();
          }}
        >
          <span
            className="theme-preview"
            data-theme={option.theme}
            aria-hidden="true"
          >
            <span className="theme-preview-surface">
              <span className="theme-preview-line" />
              <span className="theme-preview-accent" />
            </span>
          </span>

          <span className="theme-option-text">
            {option.label}
          </span>

          {theme === option.value && (
            <span className="theme-option-check" aria-hidden="true">
              ✓
            </span>
          )}
        </button>
      ))}
    </div>
  );

  return (
    <div className="theme-switcher" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className="theme-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${label}: ${LABELS[theme] || theme}. Activate to change theme.`}
        title={`Theme: ${LABELS[theme] || theme}`}
        onClick={() => setOpen((previous) => !previous)}
      >
        <ThemeIcon theme={theme} />
        <span className="theme-trigger-label">{LABELS[theme] || theme}</span>
      </button>

      {open &&
        (isMobile
          ? createPortal(menu, document.body)
          : menu)}
    </div>
  );
}

export default ThemeSwitcher;
