import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "./api";
import LocationMapPicker from "./LocationMapPicker";
import { useI18n } from "./i18n/I18nContext";
const emptyCompany = {
    companyName: "",
    code: "",
    contactName: "",
    phone: "",
    email: "",
    dispatchFormTemplate: "",
    latitude: null,
    longitude: null,
    status: "active",
};
export default function ShippingCompaniesPage({ role }) {
    const { t } = useI18n();
    const [items, setItems] = useState([]);
    const [form, setForm] = useState(emptyCompany);
    const [editingId, setEditingId] = useState(null);
    const [error, setError] = useState("");
    const isManager = role === "manager";
    async function loadItems() {
        const res = await apiFetch("/api/shipping-companies");
        if (!res.ok)
            throw new Error("failed");
        setItems((await res.json()));
    }
    useEffect(() => {
        loadItems().catch(() => setError(t("shipping.loadError")));
    }, [t]);
    const onSubmit = async (event) => {
        event.preventDefault();
        if (!isManager)
            return;
        setError("");
        const path = editingId ? `/api/shipping-companies/${editingId}` : "/api/shipping-companies";
        const method = editingId ? "PUT" : "POST";
        const trimmedEmail = form.email.trim();
        const body = {
            companyName: form.companyName,
            code: form.code,
            contactName: form.contactName || undefined,
            phone: form.phone || undefined,
            status: form.status,
        };
        if (trimmedEmail)
            body.email = trimmedEmail;
        else if (editingId)
            body.email = null;
        if (form.latitude != null && form.longitude != null) {
            body.latitude = form.latitude;
            body.longitude = form.longitude;
        }
        else if (editingId) {
            body.latitude = null;
            body.longitude = null;
        }
        body.dispatchFormTemplate = form.dispatchFormTemplate.trim();
        const res = await apiFetch(path, { method, body: JSON.stringify(body) });
        if (!res.ok) {
            setError(t("shipping.saveError"));
            return;
        }
        setForm(emptyCompany);
        setEditingId(null);
        await loadItems();
    };
    const onEdit = (item) => {
        setEditingId(item.id);
        setForm({
            companyName: item.companyName,
            code: item.code,
            contactName: item.contactName ?? "",
            phone: item.phone ?? "",
            email: item.email ?? "",
            dispatchFormTemplate: item.dispatchFormTemplate ?? "",
            latitude: item.latitude ?? null,
            longitude: item.longitude ?? null,
            status: item.status,
        });
    };
    const onDelete = async (id) => {
        if (!isManager)
            return;
        if (!window.confirm(t("shipping.deleteConfirm")))
            return;
        const res = await apiFetch(`/api/shipping-companies/${id}`, { method: "DELETE" });
        if (!res.ok) {
            setError(t("shipping.deleteError"));
            return;
        }
        await loadItems();
    };
    return (_jsxs("main", { className: "container", children: [_jsx("div", { className: "page-actions", children: _jsx(Link, { to: "/", className: "link-button", children: t("shipping.back") }) }), _jsx("h1", { children: t("shipping.title") }), _jsx("p", { className: "section-subtitle", children: t("shipping.managerOnly") }), !isManager ? _jsx("p", { className: "muted", children: t("shipping.managerOnly") }) : null, error ? _jsx("p", { className: "error", children: error }) : null, isManager ? (_jsxs("form", { className: "details-card form-grid", onSubmit: onSubmit, children: [_jsxs("label", { children: [t("shipping.companyName"), _jsx("input", { value: form.companyName, onChange: (e) => setForm({ ...form, companyName: e.target.value }), required: true })] }), _jsxs("label", { children: [t("shipping.code"), _jsx("input", { value: form.code, onChange: (e) => setForm({ ...form, code: e.target.value }), required: true })] }), _jsxs("label", { children: [t("shipping.contactName"), _jsx("input", { value: form.contactName, onChange: (e) => setForm({ ...form, contactName: e.target.value }) })] }), _jsxs("label", { children: [t("shipping.phone"), _jsx("input", { value: form.phone, onChange: (e) => setForm({ ...form, phone: e.target.value }) })] }), _jsxs("label", { children: [t("shipping.email"), _jsx("input", { type: "email", autoComplete: "email", value: form.email, onChange: (e) => setForm({ ...form, email: e.target.value }) })] }), _jsxs("label", { className: "full-row", children: [t("shipping.dispatchFormTemplate"), _jsx("textarea", { value: form.dispatchFormTemplate, onChange: (e) => setForm({ ...form, dispatchFormTemplate: e.target.value }), rows: 5 })] }), _jsx("p", { className: "muted full-row", children: t("shipping.dispatchFormTemplateHint") }), _jsx(LocationMapPicker, { latitude: form.latitude, longitude: form.longitude, onChange: (lat, lng) => setForm({ ...form, latitude: lat, longitude: lng }), hint: t("shipping.mapClickHint"), clearLabel: t("shipping.clearLocation") }), _jsxs("label", { children: [t("shipping.status"), _jsxs("select", { value: form.status, onChange: (e) => setForm({ ...form, status: e.target.value }), children: [_jsx("option", { value: "active", children: t("shipping.active") }), _jsx("option", { value: "inactive", children: t("shipping.inactive") })] })] }), _jsx("button", { className: "primary-button", type: "submit", children: editingId ? t("shipping.update") : t("shipping.create") })] })) : null, _jsx("div", { className: "table-wrap", children: _jsxs("table", { children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: t("shipping.companyName") }), _jsx("th", { children: t("shipping.code") }), _jsx("th", { children: t("shipping.contactName") }), _jsx("th", { children: t("shipping.phone") }), _jsx("th", { children: t("shipping.email") }), _jsx("th", { children: t("shipping.location") }), _jsx("th", { children: t("shipping.status") }), isManager ? _jsx("th", { children: t("shipping.actions") }) : null] }) }), _jsxs("tbody", { children: [items.map((item) => (_jsxs("tr", { children: [_jsx("td", { children: item.companyName }), _jsx("td", { children: item.code }), _jsx("td", { children: item.contactName ?? "-" }), _jsx("td", { children: item.phone ?? "-" }), _jsx("td", { children: item.email ?? "-" }), _jsx("td", { children: item.latitude != null && item.longitude != null ? (_jsx("a", { href: `https://www.openstreetmap.org/?mlat=${item.latitude}&mlon=${item.longitude}&zoom=14`, target: "_blank", rel: "noreferrer", children: t("shipping.viewOnMap") })) : ("-") }), _jsx("td", { children: _jsx("span", { className: "status-badge", children: item.status }) }), isManager ? (_jsxs("td", { children: [_jsx("button", { type: "button", className: "primary-button", onClick: () => onEdit(item), children: t("shipping.edit") }), " ", _jsx("button", { type: "button", className: "danger-button", onClick: () => onDelete(item.id), children: t("shipping.delete") })] })) : null] }, item.id))), !items.length && (_jsx("tr", { children: _jsx("td", { colSpan: isManager ? 8 : 7, children: t("shipping.empty") }) }))] })] }) })] }));
}
