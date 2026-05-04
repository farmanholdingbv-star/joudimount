import { jsx as _jsx } from "react/jsx-runtime";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { I18nProvider } from "./i18n/I18nContext";
import "bootstrap/dist/css/bootstrap.min.css";
import "./styles.css";
ReactDOM.createRoot(document.getElementById("root")).render(_jsx(React.StrictMode, { children: _jsx(I18nProvider, { children: _jsx(BrowserRouter, { children: _jsx(App, {}) }) }) }));
