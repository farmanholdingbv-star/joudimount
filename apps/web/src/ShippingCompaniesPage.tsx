import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "./api";
import LocationMapPicker from "./LocationMapPicker";
import { useI18n } from "./i18n/I18nContext";
import { Role, ShippingCompany } from "./types";

type ShippingCompanyForm = {
  companyName: string;
  code: string;
  contactName: string;
  phone: string;
  email: string;
  latitude: number | null;
  longitude: number | null;
  status: "active" | "inactive";
};

const emptyCompany: ShippingCompanyForm = {
  companyName: "",
  code: "",
  contactName: "",
  phone: "",
  email: "",
  latitude: null,
  longitude: null,
  status: "active",
};

export default function ShippingCompaniesPage({ role }: { role: Role }) {
  const { t } = useI18n();
  const [items, setItems] = useState<ShippingCompany[]>([]);
  const [form, setForm] = useState(emptyCompany);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const isManager = role === "manager";

  async function loadItems() {
    const res = await apiFetch("/api/shipping-companies");
    if (!res.ok) throw new Error("failed");
    setItems((await res.json()) as ShippingCompany[]);
  }

  useEffect(() => {
    loadItems().catch(() => setError(t("shipping.loadError")));
  }, [t]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!isManager) return;
    setError("");
    const path = editingId ? `/api/shipping-companies/${editingId}` : "/api/shipping-companies";
    const method = editingId ? "PUT" : "POST";
    const trimmedEmail = form.email.trim();
    const body: Record<string, unknown> = {
      companyName: form.companyName,
      code: form.code,
      contactName: form.contactName || undefined,
      phone: form.phone || undefined,
      status: form.status,
    };
    if (trimmedEmail) body.email = trimmedEmail;
    else if (editingId) body.email = null;
    if (form.latitude != null && form.longitude != null) {
      body.latitude = form.latitude;
      body.longitude = form.longitude;
    } else if (editingId) {
      body.latitude = null;
      body.longitude = null;
    }
    const res = await apiFetch(path, { method, body: JSON.stringify(body) });
    if (!res.ok) {
      setError(t("shipping.saveError"));
      return;
    }
    setForm(emptyCompany);
    setEditingId(null);
    await loadItems();
  };

  const onEdit = (item: ShippingCompany) => {
    setEditingId(item.id);
    setForm({
      companyName: item.companyName,
      code: item.code,
      contactName: item.contactName ?? "",
      phone: item.phone ?? "",
      email: item.email ?? "",
      latitude: item.latitude ?? null,
      longitude: item.longitude ?? null,
      status: item.status,
    });
  };

  const onDelete = async (id: string) => {
    if (!isManager) return;
    if (!window.confirm(t("shipping.deleteConfirm"))) return;
    const res = await apiFetch(`/api/shipping-companies/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setError(t("shipping.deleteError"));
      return;
    }
    await loadItems();
  };

  return (
    <main className="container">
      <div className="page-actions">
        <Link to="/" className="link-button">
          {t("shipping.back")}
        </Link>
      </div>
      <h1>{t("shipping.title")}</h1>
      <p className="section-subtitle">{t("shipping.managerOnly")}</p>
      {!isManager ? <p className="muted">{t("shipping.managerOnly")}</p> : null}
      {error ? <p className="error">{error}</p> : null}

      {isManager ? (
        <form className="details-card form-grid" onSubmit={onSubmit}>
          <label>
            {t("shipping.companyName")}
            <input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} required />
          </label>
          <label>
            {t("shipping.code")}
            <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
          </label>
          <label>
            {t("shipping.contactName")}
            <input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
          </label>
          <label>
            {t("shipping.phone")}
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </label>
          <label>
            {t("shipping.email")}
            <input
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>
          <LocationMapPicker
            latitude={form.latitude}
            longitude={form.longitude}
            onChange={(lat, lng) => setForm({ ...form, latitude: lat, longitude: lng })}
            hint={t("shipping.mapClickHint")}
            clearLabel={t("shipping.clearLocation")}
          />
          <label>
            {t("shipping.status")}
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as "active" | "inactive" })}>
              <option value="active">{t("shipping.active")}</option>
              <option value="inactive">{t("shipping.inactive")}</option>
            </select>
          </label>
          <button className="primary-button" type="submit">
            {editingId ? t("shipping.update") : t("shipping.create")}
          </button>
        </form>
      ) : null}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t("shipping.companyName")}</th>
              <th>{t("shipping.code")}</th>
              <th>{t("shipping.contactName")}</th>
              <th>{t("shipping.phone")}</th>
              <th>{t("shipping.email")}</th>
              <th>{t("shipping.location")}</th>
              <th>{t("shipping.status")}</th>
              {isManager ? <th>{t("shipping.actions")}</th> : null}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.companyName}</td>
                <td>{item.code}</td>
                <td>{item.contactName ?? "-"}</td>
                <td>{item.phone ?? "-"}</td>
                <td>{item.email ?? "-"}</td>
                <td>
                  {item.latitude != null && item.longitude != null ? (
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${item.latitude}&mlon=${item.longitude}&zoom=14`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {t("shipping.viewOnMap")}
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
                <td>
                  <span className="status-badge">{item.status}</span>
                </td>
                {isManager ? (
                  <td>
                    <button type="button" className="primary-button" onClick={() => onEdit(item)}>
                      {t("shipping.edit")}
                    </button>{" "}
                    <button type="button" className="danger-button" onClick={() => onDelete(item.id)}>
                      {t("shipping.delete")}
                    </button>
                  </td>
                ) : null}
              </tr>
            ))}
            {!items.length && (
              <tr>
                <td colSpan={isManager ? 8 : 7}>{t("shipping.empty")}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
