import { useEffect, useState } from "react";
import type { MessageKey } from "./i18n/messages";
import { useI18n } from "./i18n/I18nContext";
import type { Transaction } from "./types";

export type ShippingPaperState = {
  toCompany: string;
  client: string;
  declaration: string;
  airwayBill: string;
  hsCode: string;
  goods: string;
  origin: string;
  invoiceValue: string;
  releaseCode: string;
  weight: string;
  quantity: string;
  notes: string;
};

function buildInitialPaper(tx: Transaction, numberLocale: string): ShippingPaperState {
  const weight =
    tx.goodsWeightKg != null ? tx.goodsWeightKg.toLocaleString(numberLocale) : "";
  const qty = tx.goodsQuantity != null ? tx.goodsQuantity.toLocaleString(numberLocale) : "";
  return {
    toCompany: tx.shippingCompanyName,
    client: tx.clientName,
    declaration: tx.declarationNumber,
    airwayBill: tx.airwayBill,
    hsCode: tx.hsCode,
    goods: tx.goodsDescription,
    origin: tx.originCountry,
    invoiceValue: `${tx.invoiceValue.toLocaleString(numberLocale)}`,
    releaseCode: tx.releaseCode ?? "",
    weight,
    quantity: qty,
    notes: "",
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
  const { t, numberLocale } = useI18n();
  const [paper, setPaper] = useState<ShippingPaperState | null>(null);

  useEffect(() => {
    if (open && transaction) {
      setPaper(buildInitialPaper(transaction, numberLocale));
    } else if (!open) {
      setPaper(null);
    }
  }, [open, transaction, numberLocale]);

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

  const effectivePaper = paper ?? buildInitialPaper(transaction, numberLocale);

  const setField = (field: keyof ShippingPaperState, value: string) => {
    setPaper((p) => {
      const base = p ?? buildInitialPaper(transaction, numberLocale);
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
          <div className="shipping-paper-modal-buttons">
            <button type="button" className="primary-button" onClick={handlePrint}>
              {t("details.shippingPaperPrint")}
            </button>
            <button type="button" className="link-button" onClick={onClose}>
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
                <span>{label("details.declaration")}</span>
                <input
                  value={effectivePaper.declaration}
                  onChange={(e) => setField("declaration", e.target.value)}
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
              <label className="shipping-print-label">
                <span>{label("details.hsCode")}</span>
                <input
                  value={effectivePaper.hsCode}
                  onChange={(e) => setField("hsCode", e.target.value)}
                  className="shipping-print-input"
                />
              </label>
              <label className="shipping-print-label">
                <span>{label("details.origin")}</span>
                <input
                  value={effectivePaper.origin}
                  onChange={(e) => setField("origin", e.target.value)}
                  className="shipping-print-input"
                />
              </label>
              <label className="shipping-print-label">
                <span>{label("details.invoiceValue")}</span>
                <input
                  value={effectivePaper.invoiceValue}
                  onChange={(e) => setField("invoiceValue", e.target.value)}
                  className="shipping-print-input"
                />
              </label>
              <label className="shipping-print-label">
                <span>{label("details.releaseCode")}</span>
                <input
                  value={effectivePaper.releaseCode}
                  onChange={(e) => setField("releaseCode", e.target.value)}
                  className="shipping-print-input"
                />
              </label>
              <label className="shipping-print-label">
                <span>{label("details.goodsWeightKg")}</span>
                <input
                  value={effectivePaper.weight}
                  onChange={(e) => setField("weight", e.target.value)}
                  className="shipping-print-input"
                />
              </label>
              <label className="shipping-print-label">
                <span>{label("details.goodsQuantity")}</span>
                <input
                  value={effectivePaper.quantity}
                  onChange={(e) => setField("quantity", e.target.value)}
                  className="shipping-print-input"
                />
              </label>
              <label className="shipping-print-label full">
                <span>{label("details.goods")}</span>
                <textarea
                  value={effectivePaper.goods}
                  onChange={(e) => setField("goods", e.target.value)}
                  className="shipping-print-textarea"
                  rows={4}
                />
              </label>
              <label className="shipping-print-label full">
                <span>{label("details.shippingPaperNotes")}</span>
                <textarea
                  value={effectivePaper.notes}
                  onChange={(e) => setField("notes", e.target.value)}
                  className="shipping-print-textarea"
                  rows={3}
                  placeholder={t("details.shippingPaperNotesPlaceholder")}
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
