import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useI18n } from "./i18n/I18nContext";
export default function LanguageSwitcher() {
    const { locale, setLocale, t } = useI18n();
    return (_jsxs("label", { className: "language-switcher", children: [_jsx("span", { className: "language-switcher-label", children: t("lang.label") }), _jsxs("select", { className: "language-switcher-select", value: locale, onChange: (e) => setLocale(e.target.value), "aria-label": t("lang.label"), children: [_jsx("option", { value: "ar", children: t("lang.ar") }), _jsx("option", { value: "en", children: t("lang.en") })] })] }));
}
