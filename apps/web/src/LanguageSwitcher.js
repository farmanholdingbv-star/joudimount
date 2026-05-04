import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId } from "react";
import { useI18n } from "./i18n/I18nContext";
export default function LanguageSwitcher() {
    const { locale, setLocale, t } = useI18n();
    const id = useId();
    return (_jsxs("div", { className: "d-inline-flex align-items-center gap-2 flex-shrink-0 language-switcher", children: [_jsx("label", { htmlFor: id, className: "form-label small text-secondary mb-0 text-nowrap", children: t("lang.label") }), _jsxs("select", { id: id, className: "form-select form-select-sm", style: { width: "auto", minWidth: "6.75rem" }, value: locale, onChange: (e) => setLocale(e.target.value), "aria-label": t("lang.label"), children: [_jsx("option", { value: "ar", children: t("lang.ar") }), _jsx("option", { value: "en", children: t("lang.en") })] })] }));
}
