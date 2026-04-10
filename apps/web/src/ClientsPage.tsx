import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "./api";
import { useI18n } from "./i18n/I18nContext";
import { Client, Role } from "./types";

type ClientForm = {
  companyName: string;
  trn: string;
  immigrationCode: string;
  email: string;
  country: string;
  creditLimit: number;
  status: "active" | "suspended";
};

const emptyClient: ClientForm = {
  companyName: "",
  trn: "",
  immigrationCode: "",
  email: "",
  country: "",
  creditLimit: 0,
  status: "active",
};

export default function ClientsPage({ role }: { role: Role }) {
  const { t, numberLocale } = useI18n();
  const [clients, setClients] = useState<Client[]>([]);
  const [form, setForm] = useState(emptyClient);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const isManager = role === "manager";

  async function loadClients() {
    const res = await apiFetch("/api/clients");
    if (!res.ok) throw new Error("failed");
    const data = (await res.json()) as Client[];
    setClients(data);
  }

  useEffect(() => {
    loadClients().catch(() => setError(t("clients.loadError")));
  }, [t]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!isManager) return;
    setError("");
    const path = editingId ? `/api/clients/${editingId}` : "/api/clients";
    const method = editingId ? "PUT" : "POST";
    const res = await apiFetch(path, {
      method,
      body: JSON.stringify({
        ...form,
        creditLimit: Number(form.creditLimit),
      }),
    });
    if (!res.ok) {
      setError(t("clients.saveError"));
      return;
    }
    setForm(emptyClient);
    setEditingId(null);
    await loadClients();
  };

  const onEdit = (client: Client) => {
    setEditingId(client.id);
    setForm({
      companyName: client.companyName,
      trn: client.trn,
      immigrationCode: client.immigrationCode ?? "",
      email: client.email ?? "",
      country: client.country ?? "",
      creditLimit: client.creditLimit,
      status: client.status,
    });
  };

  const onDelete = async (id: string) => {
    if (!isManager) return;
    if (!window.confirm(t("clients.deleteConfirm"))) return;
    const res = await apiFetch(`/api/clients/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setError(t("clients.deleteError"));
      return;
    }
    await loadClients();
  };

  return (
    <main className="container">
      <div className="page-actions">
        <Link to="/" className="link-button">
          {t("clients.back")}
        </Link>
      </div>
      <h1>{t("clients.title")}</h1>
      <p className="section-subtitle">{t("clients.managerOnly")}</p>
      {!isManager ? <p className="muted">{t("clients.managerOnly")}</p> : null}
      {error ? <p className="error">{error}</p> : null}

      {isManager ? (
        <form className="details-card form-grid" onSubmit={onSubmit}>
          <label>
            {t("clients.companyName")}
            <input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} required />
          </label>
          <label>
            {t("clients.trn")}
            <input value={form.trn} onChange={(e) => setForm({ ...form, trn: e.target.value })} required />
          </label>
          <label>
            {t("clients.immigrationCode")}
            <input value={form.immigrationCode} onChange={(e) => setForm({ ...form, immigrationCode: e.target.value })} />
          </label>
          <label>
            {t("clients.clientEmail")}
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>
          <label>
            {t("clients.country")}
            <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
          </label>
          <label>
            {t("clients.creditLimit")}
            <input
              type="number"
              min={0}
              value={form.creditLimit}
              onChange={(e) => setForm({ ...form, creditLimit: Number(e.target.value) })}
              required
            />
          </label>
          <label>
            {t("clients.status")}
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as "active" | "suspended" })}>
              <option value="active">{t("clients.active")}</option>
              <option value="suspended">{t("clients.suspended")}</option>
            </select>
          </label>
          <button className="primary-button" type="submit">
            {editingId ? t("clients.update") : t("clients.create")}
          </button>
        </form>
      ) : null}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t("clients.companyName")}</th>
              <th>{t("clients.trn")}</th>
              <th>{t("clients.immigrationCode")}</th>
              <th>{t("clients.clientEmail")}</th>
              <th>{t("clients.country")}</th>
              <th>{t("clients.creditLimit")}</th>
              <th>{t("clients.status")}</th>
              {isManager ? <th>{t("clients.actions")}</th> : null}
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id}>
                <td>{client.companyName}</td>
                <td>{client.trn}</td>
                <td>{client.immigrationCode ?? "-"}</td>
                <td>{client.email ?? "-"}</td>
                <td>{client.country ?? "-"}</td>
                <td>{client.creditLimit.toLocaleString(numberLocale)}</td>
                <td>
                  <span className="status-badge">{client.status}</span>
                </td>
                {isManager ? (
                  <td>
                    <button type="button" className="primary-button" onClick={() => onEdit(client)}>
                      {t("clients.edit")}
                    </button>{" "}
                    <button type="button" className="danger-button" onClick={() => onDelete(client.id)}>
                      {t("clients.delete")}
                    </button>
                  </td>
                ) : null}
              </tr>
            ))}
            {!clients.length && (
              <tr>
                <td colSpan={isManager ? 8 : 7}>{t("clients.empty")}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
