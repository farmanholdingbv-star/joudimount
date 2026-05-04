import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "./api";
import { useI18n } from "./i18n/I18nContext";
export default function Login({ onLogin }) {
    const { t } = useI18n();
    const navigate = useNavigate();
    const [email, setEmail] = useState("manager@tracker.local");
    const [password, setPassword] = useState("123456");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const onSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError("");
        try {
            const user = await login(email, password);
            onLogin(user);
            navigate("/");
        }
        catch {
            setError(t("login.error"));
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("main", { className: "container py-4", children: [_jsx("h1", { className: "display-6 fw-bold", children: t("login.title") }), _jsx("p", { className: "section-subtitle", children: t("login.subtitle") }), error ? _jsx("p", { className: "error alert alert-danger", children: error }) : null, _jsx("form", { className: "card shadow-sm", style: { maxWidth: 480 }, onSubmit: onSubmit, children: _jsx("div", { className: "card-body", children: _jsxs("div", { className: "row g-3", children: [_jsxs("div", { className: "col-12", children: [_jsx("label", { className: "form-label mb-0", htmlFor: "login-email", children: t("login.email") }), _jsx("input", { id: "login-email", className: "form-control mt-1", type: "email", value: email, onChange: (e) => setEmail(e.target.value), required: true })] }), _jsxs("div", { className: "col-12", children: [_jsx("label", { className: "form-label mb-0", htmlFor: "login-password", children: t("login.password") }), _jsx("input", { id: "login-password", className: "form-control mt-1", type: "password", value: password, onChange: (e) => setPassword(e.target.value), required: true })] }), _jsx("div", { className: "col-12", children: _jsx("button", { className: "btn btn-primary", type: "submit", disabled: loading, children: loading ? t("login.submitting") : t("login.submit") }) })] }) }) }), _jsx("p", { className: "muted mt-3", children: t("login.demoHint") })] }));
}
