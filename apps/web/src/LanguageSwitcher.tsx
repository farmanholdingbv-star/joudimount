import { useId } from "react";
import { useI18n } from "./i18n/I18nContext";
import type { Locale } from "./i18n/messages";

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  const id = useId();

  return (
    <div className="d-inline-flex align-items-center gap-2 flex-shrink-0 language-switcher">
      <label htmlFor={id} className="form-label small text-secondary mb-0 text-nowrap">
        {t("lang.label")}
      </label>
      <select
        id={id}
        className="form-select form-select-sm"
        style={{ width: "auto", minWidth: "6.75rem" }}
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        aria-label={t("lang.label")}
      >
        <option value="ar">{t("lang.ar")}</option>
        <option value="en">{t("lang.en")}</option>
      </select>
    </div>
  );
}
