import { useI18n } from "./i18n/I18nContext";
import type { Locale } from "./i18n/messages";

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();

  return (
    <label className="language-switcher">
      <span className="language-switcher-label">{t("lang.label")}</span>
      <select
        className="language-switcher-select"
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        aria-label={t("lang.label")}
      >
        <option value="ar">{t("lang.ar")}</option>
        <option value="en">{t("lang.en")}</option>
      </select>
    </label>
  );
}
