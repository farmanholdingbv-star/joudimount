import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "./api";
import { useI18n } from "./i18n/I18nContext";
import { AuthUser } from "./types";

export default function Login({ onLogin }: { onLogin: (user: AuthUser) => void }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [email, setEmail] = useState("manager@tracker.local");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const user = await login(email, password);
      onLogin(user);
      navigate("/");
    } catch {
      setError(t("login.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container">
      <h1>{t("login.title")}</h1>
      <p className="section-subtitle">{t("login.subtitle")}</p>
      {error ? <p className="error">{error}</p> : null}
      <form className="details-card form-grid" onSubmit={onSubmit}>
        <label className="full-row">
          {t("login.email")}
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="full-row">
          {t("login.password")}
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? t("login.submitting") : t("login.submit")}
        </button>
      </form>
      <p className="muted">{t("login.demoHint")}</p>
    </main>
  );
}
