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
    return (_jsxs("main", { className: "container", children: [_jsx("h1", { children: t("login.title") }), _jsx("p", { className: "section-subtitle", children: t("login.subtitle") }), error ? _jsx("p", { className: "error", children: error }) : null, _jsxs("form", { className: "details-card form-grid", onSubmit: onSubmit, children: [_jsxs("label", { className: "full-row", children: [t("login.email"), _jsx("input", { type: "email", value: email, onChange: (e) => setEmail(e.target.value), required: true })] }), _jsxs("label", { className: "full-row", children: [t("login.password"), _jsx("input", { type: "password", value: password, onChange: (e) => setPassword(e.target.value), required: true })] }), _jsx("button", { className: "primary-button", type: "submit", disabled: loading, children: loading ? t("login.submitting") : t("login.submit") })] }), _jsx("p", { className: "muted", children: t("login.demoHint") })] }));
}
