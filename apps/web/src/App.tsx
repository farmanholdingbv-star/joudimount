import { useEffect, useState } from "react";
import { Link, Route, Routes, useNavigate } from "react-router-dom";
import TransactionDetails from "./TransactionDetails";
import TransactionForm from "./TransactionForm";
import ClientsPage from "./ClientsPage";
import ClientDetailPage from "./ClientDetailPage";
import ShippingCompaniesPage from "./ShippingCompaniesPage";
import ShippingCompanyDetailPage from "./ShippingCompanyDetailPage";
import EmployeeSection from "./EmployeeSection";
import Login from "./Login";
import LanguageSwitcher from "./LanguageSwitcher";
import { apiFetch, getCurrentUser, logout } from "./api";
import { useI18n } from "./i18n/I18nContext";
import { AuthUser, Role, Transaction } from "./types";

function roleLabel(role: Role, t: (key: "role.manager" | "role.employee" | "role.accountant") => string) {
  if (role === "manager") return t("role.manager");
  if (role === "employee") return t("role.employee");
  if (role === "employee2") return "Employee 2";
  return t("role.accountant");
}

function TransactionsList({ role, user, onLogout }: { role: Role; user: AuthUser; onLogout: () => void }) {
  const { t, numberLocale } = useI18n();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const pageSize = 30;

  useEffect(() => {
    apiFetch("/api/transactions")
      .then((res) => res.json())
      .then((data) => setTransactions(data))
      .catch(() => setError(t("list.loadError")));
  }, [role, t]);

  const filteredTransactions = transactions.filter((tx) => {
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      tx.clientName.toLowerCase().includes(q) ||
      tx.shippingCompanyName.toLowerCase().includes(q) ||
      tx.declarationNumber.toLowerCase().includes(q) ||
      tx.airwayBill.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || tx.clearanceStatus === statusFilter;
    return matchesQuery && matchesStatus;
  });

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter]);

  const statusOptions = Array.from(new Set(transactions.map((tx) => tx.clearanceStatus)));
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedTransactions = filteredTransactions.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <main className="container">
      <h1>{t("app.title")}</h1>
      <p className="section-subtitle">{t("app.tagline")}</p>
      <div className="menu-bar">
        <div className="menu-row">
          <span>
            {t("app.loggedInAs")}: {user.name} ({roleLabel(role, t)})
          </span>
          <div className="menu-links">
            <Link to="/employees" className="link-button">
              {t("nav.employeeSection")}
            </Link>
            <Link to="/clients" className="link-button">
              {t("nav.clients")}
            </Link>
            <Link to="/shipping-companies" className="link-button">
              {t("nav.shippingCompanies")}
            </Link>
            {role === "manager" || role === "employee" ? (
              <Link to="/transactions/new" className="primary-button">
                {t("nav.addTransaction")}
              </Link>
            ) : null}
            <button className="danger-button" onClick={onLogout}>
              {t("nav.logout")}
            </button>
          </div>
        </div>

        <div className="filter-row">
          <input
            className="filter-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("list.searchPlaceholder")}
          />
          <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">{t("list.filterAllStatuses")}</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>
      {error ? <p className="error">{error}</p> : null}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t("list.col.client")}</th>
              <th>{t("list.col.shippingCompany")}</th>
              <th>{t("list.col.status")}</th>
              <th>{t("list.col.createdAt")}</th>
            </tr>
          </thead>
          <tbody>
            {pagedTransactions.map((tx) => (
              <tr key={tx.id} className="clickable-row" onClick={() => navigate(`/transactions/${tx.id}`)}>
                <td>{tx.clientName}</td>
                <td>{tx.shippingCompanyName}</td>
                <td>
                  <span className="status-badge">{tx.transactionStage ?? "PREPARATION"} • {tx.clearanceStatus}</span>
                </td>
                <td>{new Date(tx.createdAt).toLocaleString(numberLocale)}</td>
              </tr>
            ))}
            {!filteredTransactions.length && (
              <tr>
                <td colSpan={4}>{t("list.noResults")}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {filteredTransactions.length > 0 && (
        <div className="page-actions">
          <button type="button" className="primary-button" onClick={() => setPage(currentPage - 1)} disabled={currentPage === 1}>
            Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              type="button"
              key={p}
              className={p === currentPage ? "primary-button" : "link-button"}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          ))}
          <button
            type="button"
            className="primary-button"
            onClick={() => setPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </main>
  );
}

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(getCurrentUser());

  useEffect(() => {
    const onLogoutEvent = () => setUser(null);
    window.addEventListener("auth:logout", onLogoutEvent);
    return () => window.removeEventListener("auth:logout", onLogoutEvent);
  }, []);

  const handleLogout = async () => {
    await logout();
    setUser(null);
  };

  return (
    <>
      <header className="app-header">
        <LanguageSwitcher />
      </header>
      {!user ? (
        <Login onLogin={setUser} />
      ) : (
        <AuthenticatedRoutes user={user} onLogout={handleLogout} />
      )}
    </>
  );
}

function NotFoundPage() {
  const { t } = useI18n();
  return (
    <main className="container">
      <h1>{t("notFound.title")}</h1>
      <Link to="/" className="link-button">
        {t("notFound.dashboard")}
      </Link>
    </main>
  );
}

function AuthenticatedRoutes({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const role = user.role;
  return (
    <Routes>
      <Route path="/" element={<TransactionsList role={role} user={user} onLogout={onLogout} />} />
      <Route path="/employees" element={<EmployeeSection role={role} />} />
      <Route path="/clients" element={<ClientsPage role={role} />} />
      <Route path="/clients/:id" element={<ClientDetailPage />} />
      <Route path="/shipping-companies" element={<ShippingCompaniesPage role={role} />} />
      <Route path="/shipping-companies/:id" element={<ShippingCompanyDetailPage />} />
      <Route path="/transactions/new" element={<TransactionForm role={role} />} />
      <Route path="/transactions/:id/edit" element={<TransactionForm role={role} />} />
      <Route path="/transactions/:id" element={<TransactionDetails role={role} />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
