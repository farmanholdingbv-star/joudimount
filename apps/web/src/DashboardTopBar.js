import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import LanguageSwitcher from "./LanguageSwitcher";
export function DashboardTopBar({ user, title, subtitle, }) {
    return (_jsx("div", { className: "dashboard-page-header mx-auto mb-3 px-1", children: _jsxs("div", { className: "dashboard-top-bar d-flex align-items-center justify-content-start flex-wrap gap-3", children: [_jsx("img", { src: "/logo.png", alt: "Project logo", width: 66, height: 66, className: "app-logo flex-shrink-0" }), _jsx("span", { className: "app-header-user badge text-bg-light border flex-shrink-0", children: user.name }), _jsx(LanguageSwitcher, {}), _jsxs("div", { className: "dashboard-top-bar-title min-w-0", children: [_jsx("h1", { className: "dashboard-top-bar-heading fw-bold mb-0 text-body", children: title }), _jsx("p", { className: "section-subtitle mb-0 mt-1", children: subtitle })] })] }) }));
}
