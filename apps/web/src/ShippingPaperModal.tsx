import { useEffect, useState } from "react";
import { apiFetch } from "./api";
import type { MessageKey } from "./i18n/messages";
import { useI18n } from "./i18n/I18nContext";
import type { ShippingCompany, Transaction } from "./types";

export type ShippingPaperState = {
  toCompany: string;
  client: string;
  airwayBill: string;
  message: string;
};

function buildInitialPaper(tx: Transaction): ShippingPaperState {
  return {
    toCompany: tx.shippingCompanyName,
    client: tx.clientName,
    airwayBill: tx.airwayBill,
    message: "",
  };
}

export default function ShippingPaperModal({
  open,
  transaction,
  onClose,
}: {
  open: boolean;
  transaction: Transaction | null;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [paper, setPaper] = useState<ShippingPaperState | null>(null);

  useEffect(() => {
    if (!open || !transaction) {
      setPaper(null);
      return;
    }
    setPaper(buildInitialPaper(transaction));
    let cancelled = false;
    (async () => {
      let template = "";
      try {
        const res = await apiFetch("/api/shipping-companies");
        if (res.ok) {
          const list = (await res.json()) as ShippingCompany[];
          const match = transaction.shippingCompanyId
            ? list.find((c) => c.id === transaction.shippingCompanyId)
            : list.find(
                (c) => c.companyName?.trim() === transaction.shippingCompanyName?.trim(),
              );
          template = (match?.dispatchFormTemplate ?? "").trim();
        }
      } catch {
        /* ignore */
      }
      if (cancelled || !template) return;
      setPaper((p) => {
        const base = p ?? buildInitialPaper(transaction);
        if (base.message.trim() !== "") return base;
        return { ...base, message: template };
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [open, transaction]);

  useEffect(() => {
    if (!open) {
      document.body.classList.remove("shipping-paper-printing");
      return;
    }
    const onBeforePrint = () => {
      document.body.classList.add("shipping-paper-printing");
    };
    const onAfterPrint = () => {
      document.body.classList.remove("shipping-paper-printing");
    };
    window.addEventListener("beforeprint", onBeforePrint);
    window.addEventListener("afterprint", onAfterPrint);
    return () => {
      window.removeEventListener("beforeprint", onBeforePrint);
      window.removeEventListener("afterprint", onAfterPrint);
      document.body.classList.remove("shipping-paper-printing");
    };
  }, [open]);

  if (!open || !transaction) return null;

  const effectivePaper = paper ?? buildInitialPaper(transaction);

  const setField = (field: keyof ShippingPaperState, value: string) => {
    setPaper((p) => {
      const base = p ?? buildInitialPaper(transaction);
      return { ...base, [field]: value };
    });
  };

  const handlePrint = () => {
    document.body.classList.add("shipping-paper-printing");
    window.print();
  };

  const label = (key: MessageKey) => t(key);

  return (
    <div className="shipping-paper-modal" role="dialog" aria-modal="true" aria-labelledby="shipping-paper-title">
      <div className="shipping-paper-modal-backdrop no-print" onClick={onClose} />
      <div className="shipping-paper-modal-panel">
        <div className="shipping-paper-modal-actions no-print">
          <h2 id="shipping-paper-title">{t("details.shippingPaperTitle")}</h2>
          <div className="shipping-paper-modal-buttons d-flex flex-wrap gap-2">
            <button type="button" className="btn btn-primary btn-sm" onClick={handlePrint}>
              {t("details.shippingPaperPrint")}
            </button>
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onClose}>
              {t("details.shippingPaperClose")}
            </button>
          </div>
        </div>

        <div className="shipping-print-target">
          <div className="shipping-print-sheet">
            <header className="shipping-print-header">
              <h3>{t("details.shippingPaperHeading")}</h3>
              <p className="shipping-print-sub muted">{t("details.shippingPaperSub")}</p>
            </header>

            <div className="shipping-print-grid">
              <label className="shipping-print-label">
                <span>{label("details.shippingPaperTo")}</span>
                <input
                  value={effectivePaper.toCompany}
                  onChange={(e) => setField("toCompany", e.target.value)}
                  className="shipping-print-input"
                />
              </label>
              <label className="shipping-print-label">
                <span>{label("details.shippingPaperFrom")}</span>
                <input
                  value={effectivePaper.client}
                  onChange={(e) => setField("client", e.target.value)}
                  className="shipping-print-input"
                />
              </label>
              <label className="shipping-print-label">
                <span>{label("details.airwayBill")}</span>
                <input
                  value={effectivePaper.airwayBill}
                  onChange={(e) => setField("airwayBill", e.target.value)}
                  className="shipping-print-input"
                />
              </label>
              <label className="shipping-print-label full">
                <span>{label("details.shippingPaperMessage")}</span>
                <textarea
                  value={effectivePaper.message}
                  onChange={(e) => setField("message", e.target.value)}
                  className="shipping-print-textarea"
                  rows={8}
                  placeholder={t("details.shippingPaperMessagePlaceholder")}
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
