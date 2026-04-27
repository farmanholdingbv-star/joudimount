import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_LOCALE, getMessages, LOCALE_STORAGE_KEY, type Locale, type MessageKey } from "./messages";

function readStoredLocale(): Locale {
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (stored === "en" || stored === "ar") return stored;
  return DEFAULT_LOCALE;
}

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey) => string;
  numberLocale: string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => readStoredLocale());

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    localStorage.setItem(LOCALE_STORAGE_KEY, next);
    document.documentElement.lang = next === "ar" ? "ar" : "en";
    document.documentElement.dir = next === "ar" ? "rtl" : "ltr";
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale === "ar" ? "ar" : "en";
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale]);

  const value = useMemo<I18nContextValue>(() => {
    const table = getMessages(locale);
    return {
      locale,
      setLocale,
      t: (key: MessageKey) => table[key] ?? key,
      numberLocale: locale === "ar" ? "ar-AE" : "en-US",
    };
  }, [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
