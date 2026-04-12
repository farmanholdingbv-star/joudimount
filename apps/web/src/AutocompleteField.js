import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useId, useRef, useState } from "react";
export default function AutocompleteField({ label, value, onChange, onSelectSuggestion, suggestions, required, hint, minChars = 1, }) {
    const id = useId();
    const wrapRef = useRef(null);
    const [open, setOpen] = useState(false);
    const [highlight, setHighlight] = useState(0);
    const q = value.trim();
    const showList = open && onSelectSuggestion && q.length >= minChars && suggestions.length > 0;
    useEffect(() => {
        setHighlight(0);
    }, [suggestions.length, value]);
    useEffect(() => {
        const onDoc = (e) => {
            if (!wrapRef.current?.contains(e.target))
                setOpen(false);
        };
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, []);
    const pick = (key) => {
        onSelectSuggestion?.(key);
        setOpen(false);
    };
    return (_jsxs("label", { ref: wrapRef, className: "autocomplete-field", children: [label, _jsx("input", { id: id, value: value, required: required, autoComplete: "off", onChange: (e) => onChange(e.target.value), onFocus: () => setOpen(true), onBlur: () => {
                    window.setTimeout(() => setOpen(false), 180);
                }, onKeyDown: (e) => {
                    if (!showList)
                        return;
                    if (e.key === "ArrowDown") {
                        e.preventDefault();
                        setHighlight((h) => Math.min(h + 1, suggestions.length - 1));
                    }
                    else if (e.key === "ArrowUp") {
                        e.preventDefault();
                        setHighlight((h) => Math.max(h - 1, 0));
                    }
                    else if (e.key === "Enter" && suggestions[highlight]) {
                        e.preventDefault();
                        pick(suggestions[highlight].key);
                    }
                    else if (e.key === "Escape") {
                        setOpen(false);
                    }
                }, "aria-autocomplete": "list", "aria-expanded": showList, "aria-controls": `${id}-listbox` }), hint ? _jsx("span", { className: "autocomplete-hint muted", children: hint }) : null, showList ? (_jsx("ul", { id: `${id}-listbox`, className: "autocomplete-dropdown", role: "listbox", children: suggestions.map((s, i) => (_jsx("li", { role: "option", "aria-selected": i === highlight, children: _jsxs("button", { type: "button", className: `autocomplete-option${i === highlight ? " is-active" : ""}`, onMouseDown: (e) => e.preventDefault(), onClick: () => pick(s.key), children: [_jsx("span", { className: "autocomplete-primary", children: s.primary }), s.secondary ? _jsx("span", { className: "autocomplete-secondary", children: s.secondary }) : null] }) }, s.key))) })) : null] }));
}
