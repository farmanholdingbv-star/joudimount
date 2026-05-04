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
    <main className="container py-4">
      <h1 className="display-6 fw-bold">{t("login.title")}</h1>
      <p className="section-subtitle">{t("login.subtitle")}</p>
      {error ? <p className="error alert alert-danger">{error}</p> : null}
      <form className="card shadow-sm" style={{ maxWidth: 480 }} onSubmit={onSubmit}>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-12">
              <label className="form-label mb-0" htmlFor="login-email">
                {t("login.email")}
              </label>
              <input
                id="login-email"
                className="form-control mt-1"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="col-12">
              <label className="form-label mb-0" htmlFor="login-password">
                {t("login.password")}
              </label>
              <input
                id="login-password"
                className="form-control mt-1"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="col-12">
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? t("login.submitting") : t("login.submit")}
              </button>
            </div>
          </div>
        </div>
      </form>
      <p className="muted mt-3">{t("login.demoHint")}</p>
    </main>
  );
}
