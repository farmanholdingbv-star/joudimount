import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiFetch } from "./api";
import { useI18n } from "./i18n/I18nContext";
import { ShippingCompany } from "./types";

export default function ShippingCompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useI18n();
  const [item, setItem] = useState<ShippingCompany | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    apiFetch(`/api/shipping-companies/${id}`)
      .then((res) => {
        if (res.status === 404) throw new Error("not-found");
        if (!res.ok) throw new Error("failed");
        return res.json();
      })
      .then((data: ShippingCompany) => setItem(data))
      .catch(() => setError(t("shipping.detailLoadError")));
  }, [id, t]);

  return (
    <main className="container">
      <div className="page-actions">
        <Link to="/shipping-companies" className="link-button">
          {t("shipping.back")}
        </Link>
      </div>
      <h1>{t("shipping.detailTitle")}</h1>
      {error ? <p className="error">{error}</p> : null}
      {!item && !error ? <p>{t("details.loading")}</p> : null}
      {item ? (
        <section className="details-card">
          <div className="details-grid">
            <p className="details-item">
              <strong>{t("shipping.companyName")}:</strong> {item.companyName}
            </p>
            <p className="details-item">
              <strong>{t("shipping.code")}:</strong> {item.code}
            </p>
            <p className="details-item">
              <strong>{t("shipping.contactName")}:</strong> {item.contactName ?? "—"}
            </p>
            <p className="details-item">
              <strong>{t("shipping.phone")}:</strong> {item.phone ?? "—"}
            </p>
            <p className="details-item">
              <strong>{t("shipping.email")}:</strong> {item.email ?? "—"}
            </p>
            <p className="details-item full-row">
              <strong>{t("shipping.dispatchFormTemplate")}:</strong>
              <br />
              <span style={{ whiteSpace: "pre-wrap" }}>{item.dispatchFormTemplate?.trim() ? item.dispatchFormTemplate : "—"}</span>
            </p>
            <p className="details-item">
              <strong>{t("shipping.location")}:</strong>{" "}
              {item.latitude != null && item.longitude != null ? (
                <a
                  href={`https://www.openstreetmap.org/?mlat=${item.latitude}&mlon=${item.longitude}&zoom=14`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {t("shipping.viewOnMap")}
                </a>
              ) : (
                "—"
              )}
            </p>
            <p className="details-item">
              <strong>{t("shipping.status")}:</strong>{" "}
              <span className="status-badge">{item.status === "active" ? t("shipping.active") : t("shipping.inactive")}</span>
            </p>
          </div>
        </section>
      ) : null}
    </main>
  );
}
