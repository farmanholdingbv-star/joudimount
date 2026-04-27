import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_LOCALE, getMessages, LOCALE_STORAGE_KEY } from "./messages";
function readStoredLocale() {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored === "en" || stored === "ar")
        return stored;
    return DEFAULT_LOCALE;
}
const I18nContext = createContext(null);
export function I18nProvider({ children }) {
    const [locale, setLocaleState] = useState(() => readStoredLocale());
    const setLocale = useCallback((next) => {
        setLocaleState(next);
        localStorage.setItem(LOCALE_STORAGE_KEY, next);
        document.documentElement.lang = next === "ar" ? "ar" : "en";
        document.documentElement.dir = next === "ar" ? "rtl" : "ltr";
    }, []);
    useEffect(() => {
        document.documentElement.lang = locale === "ar" ? "ar" : "en";
        document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
    }, [locale]);
    const value = useMemo(() => {
        const table = getMessages(locale);
        return {
            locale,
            setLocale,
            t: (key) => table[key] ?? key,
            numberLocale: locale === "ar" ? "ar-AE" : "en-US",
        };
    }, [locale, setLocale]);
    return _jsx(I18nContext.Provider, { value: value, children: children });
}
export function useI18n() {
    const ctx = useContext(I18nContext);
    if (!ctx)
        throw new Error("useI18n must be used within I18nProvider");
    return ctx;
}
