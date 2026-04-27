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
import type { MessageKey } from "./i18n/messages";
import { AuthUser, Role, Transaction } from "./types";

function roleLabel(role: Role, t: (key: MessageKey) => string) {
  if (role === "manager") return t("role.manager");
  if (role === "employee") return t("role.employee");
  if (role === "employee2") return t("app.roleEmployee2");
  return t("role.accountant");
}

type TransactionModule = "transactions" | "transfers" | "exports";
const MODULES: Array<{ id: TransactionModule; route: string; titleKey: MessageKey; descKey: MessageKey }> = [
  { id: "transactions", route: "/", titleKey: "app.title", descKey: "dashboard.transactionsDesc" as MessageKey },
  { id: "transfers", route: "/transfers", titleKey: "transfer.app.title" as MessageKey, descKey: "dashboard.transfersDesc" as MessageKey },
  { id: "exports", route: "/exports", titleKey: "export.app.title" as MessageKey, descKey: "dashboard.exportsDesc" as MessageKey },
];

function TransactionsList({
  role,
  user,
  onLogout,
  module = "transactions",
}: {
  role: Role;
  user: AuthUser;
  onLogout: () => void;
  module?: TransactionModule;
}) {
  const { t, numberLocale } = useI18n();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const pageSize = 30;

  useEffect(() => {
    apiFetch(`/api/${module}`)
      .then((res) => res.json())
      .then((data) => setTransactions(data))
      .catch(() => setError(t(module === "transactions" ? "list.loadError" : (module === "transfers" ? "transfer.list.loadError" : "export.list.loadError") as MessageKey)));
  }, [role, t, module]);

  const filteredTransactions = transactions.filter((tx) => {
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      tx.clientName.toLowerCase().includes(q) ||
      tx.shippingCompanyName.toLowerCase().includes(q) ||
      tx.declarationNumber.toLowerCase().includes(q) ||
      (tx.declarationNumber2 ?? "").toLowerCase().includes(q) ||
      tx.airwayBill.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || tx.clearanceStatus === statusFilter;
    const matchesStage = stageFilter === "all" || (tx.transactionStage ?? "PREPARATION") === stageFilter;
    return matchesQuery && matchesStatus && matchesStage;
  });

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter, stageFilter]);

  const statusOptions = Array.from(new Set(transactions.map((tx) => tx.clearanceStatus)));
  const stageOptions = Array.from(new Set(transactions.map((tx) => tx.transactionStage ?? "PREPARATION")));
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedTransactions = filteredTransactions.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <main className="container">
      <h1>{t((module === "transactions" ? "app.title" : module === "transfers" ? "transfer.app.title" : "export.app.title") as MessageKey)}</h1>
      <p className="section-subtitle">{t((module === "transactions" ? "app.tagline" : module === "transfers" ? "transfer.app.tagline" : "export.app.tagline") as MessageKey)}</p>
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
            <Link to="/transfers" className="link-button">
              {t("nav.transfers" as MessageKey)}
            </Link>
            <Link to="/exports" className="link-button">
              {t("nav.exports" as MessageKey)}
            </Link>
            {role === "manager" || role === "employee" ? (
              <Link to={`/${module}/new`} className="primary-button">
                {t((module === "transactions" ? "nav.addTransaction" : module === "transfers" ? "nav.addTransfer" : "nav.addExport") as MessageKey)}
              </Link>
            ) : null}
            <button className="danger-button" onClick={onLogout}>
              {t("nav.logout")}
            </button>
          </div>
        </div>
        <div className="module-cards">
          {MODULES.map((item) => (
            <Link
              key={item.id}
              to={item.route}
              className={`module-card ${module === item.id ? "module-card-active" : ""}`}
            >
              <span className="module-card-title">{t(item.titleKey)}</span>
              <span className="module-card-desc">{t(item.descKey)}</span>
            </Link>
          ))}
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
          <select className="filter-select" value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}>
            <option value="all">{t("list.filterAllStages")}</option>
            {stageOptions.map((stage) => (
              <option key={stage} value={stage}>
                {t(`stage.${stage}` as MessageKey)}
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
              <tr key={tx.id} className="clickable-row" onClick={() => navigate(`/${module}/${tx.id}`)}>
                <td>{tx.clientName}</td>
                <td>{tx.shippingCompanyName}</td>
                <td>
                  <span className="status-badge">
                    {t(`stage.${tx.transactionStage ?? "PREPARATION"}` as MessageKey)} • {tx.clearanceStatus}
                  </span>
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
            {t("list.paginationPrev")}
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
            {t("list.paginationNext")}
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
        <img src="/logo.png" alt="Project logo" className="app-logo" />
        <div className="app-header-user-wrap">
          {user ? <span className="app-header-user">{user.name}</span> : null}
        </div>
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
      <Route path="/" element={<TransactionsList role={role} user={user} onLogout={onLogout} module="transactions" />} />
      <Route path="/transfers" element={<TransactionsList role={role} user={user} onLogout={onLogout} module="transfers" />} />
      <Route path="/exports" element={<TransactionsList role={role} user={user} onLogout={onLogout} module="exports" />} />
      <Route path="/employees" element={<EmployeeSection role={role} />} />
      <Route path="/clients" element={<ClientsPage role={role} />} />
      <Route path="/clients/:id" element={<ClientDetailPage />} />
      <Route path="/shipping-companies" element={<ShippingCompaniesPage role={role} />} />
      <Route path="/shipping-companies/:id" element={<ShippingCompanyDetailPage />} />
      <Route path="/transactions/new" element={<TransactionForm role={role} module="transactions" />} />
      <Route path="/transactions/:id/edit" element={<TransactionForm role={role} module="transactions" />} />
      <Route path="/transactions/:id" element={<TransactionDetails role={role} module="transactions" />} />
      <Route path="/transfers/new" element={<TransactionForm role={role} module="transfers" />} />
      <Route path="/transfers/:id/edit" element={<TransactionForm role={role} module="transfers" />} />
      <Route path="/transfers/:id" element={<TransactionDetails role={role} module="transfers" />} />
      <Route path="/exports/new" element={<TransactionForm role={role} module="exports" />} />
      <Route path="/exports/:id/edit" element={<TransactionForm role={role} module="exports" />} />
      <Route path="/exports/:id" element={<TransactionDetails role={role} module="exports" />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
