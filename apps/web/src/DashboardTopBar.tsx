import LanguageSwitcher from "./LanguageSwitcher";
import type { AuthUser } from "./types";

export function DashboardTopBar({
  user,
  title,
  subtitle,
}: {
  user: AuthUser;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="dashboard-page-header mx-auto mb-3 px-1">
      <div className="dashboard-top-bar d-flex align-items-center justify-content-start flex-wrap gap-3">
        <img src="/logo.png" alt="Project logo" width={66} height={66} className="app-logo flex-shrink-0" />
        <span className="app-header-user badge text-bg-light border flex-shrink-0">{user.name}</span>
        <LanguageSwitcher />
        <div className="dashboard-top-bar-title min-w-0">
          <h1 className="dashboard-top-bar-heading fw-bold mb-0 text-body">{title}</h1>
          <p className="section-subtitle mb-0 mt-1">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}
