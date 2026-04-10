import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch, getCurrentUser } from "./api";
import { useI18n } from "./i18n/I18nContext";
import { Employee, Role } from "./types";

interface Props {
  role: Role;
}

function roleLabel(role: Role, t: ReturnType<typeof useI18n>["t"]) {
  if (role === "manager") return t("role.manager");
  if (role === "employee") return t("role.employee");
  return t("role.accountant");
}

type EmployeeForm = {
  name: string;
  email: string;
  password: string;
  role: Role;
};

const emptyForm: EmployeeForm = {
  name: "",
  email: "",
  password: "",
  role: "employee",
};

async function mapEmployeeApiError(res: Response, t: ReturnType<typeof useI18n>["t"], fallback: string) {
  try {
    const data = (await res.json()) as { error?: unknown };
    const e = data.error;
    if (e === "email_taken") return t("employees.emailTaken");
    if (e === "last_manager_role") return t("employees.lastManagerRole");
    if (e === "last_manager_delete") return t("employees.lastManagerDelete");
    if (e === "delete_self") return t("employees.deleteSelfError");
    if (typeof e === "string" && e.length > 0 && !e.startsWith("{")) return e;
  } catch {
    /* use fallback */
  }
  return fallback;
}

export default function EmployeeSection({ role }: Props) {
  const { t } = useI18n();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const isManager = role === "manager";
  const currentUserId = getCurrentUser()?.id;

  async function loadEmployees() {
    const res = await apiFetch("/api/employees");
    if (!res.ok) throw new Error("failed");
    const data = (await res.json()) as Employee[];
    setEmployees(data);
  }

  useEffect(() => {
    loadEmployees().catch(() => setError(t("employees.loadError")));
  }, [t]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!isManager) return;
    setError("");
    const path = editingId ? `/api/employees/${editingId}` : "/api/employees";
    const method = editingId ? "PUT" : "POST";
    const body: Record<string, unknown> = {
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
    };
    if (!editingId) {
      body.password = form.password;
    } else if (form.password.trim().length > 0) {
      body.password = form.password;
    }
    const res = await apiFetch(path, {
      method,
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      setError(await mapEmployeeApiError(res, t, t("employees.saveError")));
      return;
    }
    setForm(emptyForm);
    setEditingId(null);
    await loadEmployees();
  };

  const onEdit = (emp: Employee) => {
    setEditingId(emp.id);
    setForm({
      name: emp.name,
      email: emp.email,
      password: "",
      role: emp.role,
    });
  };

  const onCancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  };

  const onDelete = async (id: string) => {
    if (!isManager) return;
    if (id === currentUserId) {
      setError(t("employees.deleteSelfError"));
      return;
    }
    if (!window.confirm(t("employees.deleteConfirm"))) return;
    const res = await apiFetch(`/api/employees/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setError(await mapEmployeeApiError(res, t, t("employees.deleteError")));
      return;
    }
    await loadEmployees();
  };

  return (
    <main className="container">
      <div className="page-actions">
        <Link to="/" className="link-button">
          {t("employees.back")}
        </Link>
      </div>
      <h1>{t("employees.title")}</h1>
      <p className="section-subtitle">
        {t("employees.currentRole")}: <strong>{roleLabel(role, t)}</strong>
      </p>
      <div className="details-card">{t("employees.roleFromAccount")}</div>

      <div className="role-grid">
        <section className={`details-card ${role === "manager" ? "role-active" : ""}`}>
          <h3>{t("employees.managerTitle")}</h3>
          <p>{t("employees.managerDesc")}</p>
        </section>
        <section className={`details-card ${role === "employee" ? "role-active" : ""}`}>
          <h3>{t("employees.employeeTitle")}</h3>
          <p>{t("employees.employeeDesc")}</p>
        </section>
        <section className={`details-card ${role === "accountant" ? "role-active" : ""}`}>
          <h3>{t("employees.accountantTitle")}</h3>
          <p>{t("employees.accountantDesc")}</p>
        </section>
      </div>

      <p className="section-subtitle">{t("employees.managerOnly")}</p>
      {!isManager ? <p className="muted">{t("employees.managerOnly")}</p> : null}
      {error ? <p className="error">{error}</p> : null}

      {isManager ? (
        <form className="details-card form-grid" onSubmit={onSubmit}>
          <label>
            {t("employees.name")}
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              minLength={2}
            />
          </label>
          <label>
            {t("employees.email")}
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </label>
          <label>
            {t("employees.password")}
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              autoComplete={editingId ? "new-password" : "new-password"}
              required={!editingId}
              minLength={editingId ? undefined : 4}
              placeholder={editingId ? t("employees.passwordHintEdit") : undefined}
            />
          </label>
          <label>
            {t("employees.role")}
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
              <option value="manager">{t("role.manager")}</option>
              <option value="employee">{t("role.employee")}</option>
              <option value="accountant">{t("role.accountant")}</option>
            </select>
          </label>
          <div className="full-row page-actions">
            <button className="primary-button" type="submit">
              {editingId ? t("employees.update") : t("employees.create")}
            </button>
            {editingId ? (
              <button type="button" className="link-button" onClick={onCancelEdit}>
                {t("employees.cancelEdit")}
              </button>
            ) : null}
          </div>
        </form>
      ) : null}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t("employees.name")}</th>
              <th>{t("employees.email")}</th>
              <th>{t("employees.role")}</th>
              {isManager ? <th>{t("employees.actions")}</th> : null}
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id}>
                <td>{emp.name}</td>
                <td>{emp.email}</td>
                <td>{roleLabel(emp.role, t)}</td>
                {isManager ? (
                  <td>
                    <button type="button" className="primary-button" onClick={() => onEdit(emp)}>
                      {t("employees.edit")}
                    </button>{" "}
                    <button
                      type="button"
                      className="danger-button"
                      disabled={emp.id === currentUserId}
                      onClick={() => onDelete(emp.id)}
                      title={emp.id === currentUserId ? t("employees.deleteSelfError") : undefined}
                    >
                      {t("employees.delete")}
                    </button>
                  </td>
                ) : null}
              </tr>
            ))}
            {!employees.length && (
              <tr>
                <td colSpan={isManager ? 4 : 3}>{t("employees.empty")}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="page-actions">
        <Link to="/" className="primary-button">
          {t("employees.goTracker")}
        </Link>
      </div>
    </main>
  );
}
