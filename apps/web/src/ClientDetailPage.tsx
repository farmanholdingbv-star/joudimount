import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiFetch } from "./api";
import { useI18n } from "./i18n/I18nContext";
import { Client } from "./types";

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t, numberLocale } = useI18n();
  const [client, setClient] = useState<Client | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    apiFetch(`/api/clients/${id}`)
      .then((res) => {
        if (res.status === 404) throw new Error("not-found");
        if (!res.ok) throw new Error("failed");
        return res.json();
      })
      .then((data: Client) => setClient(data))
      .catch(() => setError(t("clients.detailLoadError")));
  }, [id, t]);

  return (
    <main className="container">
      <div className="page-actions">
        <Link to="/clients" className="link-button">
          {t("clients.back")}
        </Link>
      </div>
      <h1>{t("clients.detailTitle")}</h1>
      {error ? <p className="error">{error}</p> : null}
      {!client && !error ? <p>{t("details.loading")}</p> : null}
      {client ? (
        <section className="details-card">
          <div className="details-grid">
            <p className="details-item">
              <strong>{t("clients.companyName")}:</strong> {client.companyName}
            </p>
            <p className="details-item">
              <strong>{t("clients.trn")}:</strong> {client.trn}
            </p>
            <p className="details-item">
              <strong>{t("clients.immigrationCode")}:</strong> {client.immigrationCode ?? "—"}
            </p>
            <p className="details-item">
              <strong>{t("clients.clientEmail")}:</strong> {client.email ?? "—"}
            </p>
            <p className="details-item">
              <strong>{t("clients.country")}:</strong> {client.country ?? "—"}
            </p>
            <p className="details-item">
              <strong>{t("clients.creditLimit")}:</strong> {client.creditLimit.toLocaleString(numberLocale)}
            </p>
            <p className="details-item">
              <strong>{t("clients.status")}:</strong>{" "}
              <span className="status-badge">{client.status === "active" ? t("clients.active") : t("clients.suspended")}</span>
            </p>
          </div>
        </section>
      ) : null}
    </main>
  );
}
