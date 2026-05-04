import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch, getCurrentUser } from "./api";
import { useI18n } from "./i18n/I18nContext";
function roleLabel(role, t) {
    if (role === "manager")
        return t("role.manager");
    if (role === "employee")
        return t("role.employee");
    if (role === "employee2")
        return "Employee 2";
    return t("role.accountant");
}
const emptyForm = {
    name: "",
    email: "",
    password: "",
    role: "employee",
};
async function mapEmployeeApiError(res, t, fallback) {
    try {
        const data = (await res.json());
        const e = data.error;
        if (e === "email_taken")
            return t("employees.emailTaken");
        if (e === "last_manager_role")
            return t("employees.lastManagerRole");
        if (e === "last_manager_delete")
            return t("employees.lastManagerDelete");
        if (e === "delete_self")
            return t("employees.deleteSelfError");
        if (typeof e === "string" && e.length > 0 && !e.startsWith("{"))
            return e;
    }
    catch {
        /* use fallback */
    }
    return fallback;
}
export default function EmployeeSection({ role }) {
    const { t } = useI18n();
    const [employees, setEmployees] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [error, setError] = useState("");
    const isManager = role === "manager";
    const currentUserId = getCurrentUser()?.id;
    async function loadEmployees() {
        const res = await apiFetch("/api/employees");
        if (!res.ok)
            throw new Error("failed");
        const data = (await res.json());
        setEmployees(data);
    }
    useEffect(() => {
        loadEmployees().catch(() => setError(t("employees.loadError")));
    }, [t]);
    const onSubmit = async (event) => {
        event.preventDefault();
        if (!isManager)
            return;
        setError("");
        const path = editingId ? `/api/employees/${editingId}` : "/api/employees";
        const method = editingId ? "PUT" : "POST";
        const body = {
            name: form.name.trim(),
            email: form.email.trim(),
            role: form.role,
        };
        if (!editingId) {
            body.password = form.password;
        }
        else if (form.password.trim().length > 0) {
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
    const onEdit = (emp) => {
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
    const onDelete = async (id) => {
        if (!isManager)
            return;
        if (id === currentUserId) {
            setError(t("employees.deleteSelfError"));
            return;
        }
        if (!window.confirm(t("employees.deleteConfirm")))
            return;
        const res = await apiFetch(`/api/employees/${id}`, { method: "DELETE" });
        if (!res.ok) {
            setError(await mapEmployeeApiError(res, t, t("employees.deleteError")));
            return;
        }
        await loadEmployees();
    };
    return (_jsxs("main", { className: "container py-2", children: [_jsx("div", { className: "page-actions", children: _jsx(Link, { to: "/", className: "btn btn-outline-secondary btn-sm", children: t("employees.back") }) }), _jsx("h1", { children: t("employees.title") }), _jsxs("p", { className: "section-subtitle", children: [t("employees.currentRole"), ": ", _jsx("strong", { children: roleLabel(role, t) })] }), _jsx("div", { className: "details-card", children: t("employees.roleFromAccount") }), _jsxs("div", { className: "role-grid", children: [_jsxs("section", { className: `details-card ${role === "manager" ? "role-active" : ""}`, children: [_jsx("h3", { children: t("employees.managerTitle") }), _jsx("p", { children: t("employees.managerDesc") })] }), _jsxs("section", { className: `details-card ${role === "employee" ? "role-active" : ""}`, children: [_jsx("h3", { children: t("employees.employeeTitle") }), _jsx("p", { children: t("employees.employeeDesc") })] }), _jsxs("section", { className: `details-card ${role === "employee2" ? "role-active" : ""}`, children: [_jsx("h3", { children: "Employee 2" }), _jsx("p", { children: "Handles stage 2 customs clearance data only." })] }), _jsxs("section", { className: `details-card ${role === "accountant" ? "role-active" : ""}`, children: [_jsx("h3", { children: t("employees.accountantTitle") }), _jsx("p", { children: t("employees.accountantDesc") })] })] }), _jsx("p", { className: "section-subtitle", children: t("employees.managerOnly") }), !isManager ? _jsx("p", { className: "muted", children: t("employees.managerOnly") }) : null, error ? _jsx("p", { className: "error alert alert-danger", children: error }) : null, isManager ? (_jsx("form", { className: "card shadow-sm mb-4", onSubmit: onSubmit, children: _jsx("div", { className: "card-body", children: _jsxs("div", { className: "row g-3", children: [_jsxs("div", { className: "col-12 col-md-6", children: [_jsx("label", { className: "form-label mb-0", children: t("employees.name") }), _jsx("input", { className: "form-control mt-1", value: form.name, onChange: (e) => setForm({ ...form, name: e.target.value }), required: true, minLength: 2 })] }), _jsxs("div", { className: "col-12 col-md-6", children: [_jsx("label", { className: "form-label mb-0", children: t("employees.email") }), _jsx("input", { className: "form-control mt-1", type: "email", value: form.email, onChange: (e) => setForm({ ...form, email: e.target.value }), required: true })] }), _jsxs("div", { className: "col-12 col-md-6", children: [_jsx("label", { className: "form-label mb-0", children: t("employees.password") }), _jsx("input", { className: "form-control mt-1", type: "password", value: form.password, onChange: (e) => setForm({ ...form, password: e.target.value }), autoComplete: editingId ? "new-password" : "new-password", required: !editingId, minLength: editingId ? undefined : 4, placeholder: editingId ? t("employees.passwordHintEdit") : undefined })] }), _jsxs("div", { className: "col-12 col-md-6", children: [_jsx("label", { className: "form-label mb-0", children: t("employees.role") }), _jsxs("select", { className: "form-select mt-1", value: form.role, onChange: (e) => setForm({ ...form, role: e.target.value }), children: [_jsx("option", { value: "manager", children: t("role.manager") }), _jsx("option", { value: "employee", children: t("role.employee") }), _jsx("option", { value: "employee2", children: "Employee 2" }), _jsx("option", { value: "accountant", children: t("role.accountant") })] })] }), _jsxs("div", { className: "col-12 d-flex flex-wrap gap-2 align-items-center", children: [_jsx("button", { className: "btn btn-primary", type: "submit", children: editingId ? t("employees.update") : t("employees.create") }), editingId ? (_jsx("button", { type: "button", className: "btn btn-outline-secondary", onClick: onCancelEdit, children: t("employees.cancelEdit") })) : null] })] }) }) })) : null, _jsx("div", { className: "table-wrap card shadow-sm", children: _jsxs("table", { className: "table table-hover align-middle mb-0", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: t("employees.name") }), _jsx("th", { children: t("employees.email") }), _jsx("th", { children: t("employees.role") }), isManager ? _jsx("th", { children: t("employees.actions") }) : null] }) }), _jsxs("tbody", { children: [employees.map((emp) => (_jsxs("tr", { children: [_jsx("td", { children: emp.name }), _jsx("td", { children: emp.email }), _jsx("td", { children: roleLabel(emp.role, t) }), isManager ? (_jsxs("td", { children: [_jsx("button", { type: "button", className: "btn btn-sm btn-outline-primary", onClick: () => onEdit(emp), children: t("employees.edit") }), " ", _jsx("button", { type: "button", className: "btn btn-sm btn-outline-danger", disabled: emp.id === currentUserId, onClick: () => onDelete(emp.id), title: emp.id === currentUserId ? t("employees.deleteSelfError") : undefined, children: t("employees.delete") })] })) : null] }, emp.id))), !employees.length && (_jsx("tr", { children: _jsx("td", { colSpan: isManager ? 4 : 3, children: t("employees.empty") }) }))] })] }) }), _jsx("div", { className: "page-actions", children: _jsx(Link, { to: "/", className: "btn btn-primary", children: t("employees.goTracker") }) })] }));
}
