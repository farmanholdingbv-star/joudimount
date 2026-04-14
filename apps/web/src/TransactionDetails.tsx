import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "./api";
import type { MessageKey } from "./i18n/messages";
import { useI18n } from "./i18n/I18nContext";
import ShippingPaperModal from "./ShippingPaperModal";
import { API_BASE, Role, Transaction } from "./types";

export default function TransactionDetails({ role }: { role: Role }) {
  const { t, numberLocale } = useI18n();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [shippingPaperOpen, setShippingPaperOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    apiFetch(`/api/transactions/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("not-found");
        return res.json();
      })
      .then((data) => setTransaction(data))
      .catch(() => setError(t("details.loadError")));
  }, [id, t]);

  const onDelete = async () => {
    if (!id) return;
    if (!window.confirm(t("details.deleteConfirm"))) return;
    setDeleting(true);
    try {
      const res = await apiFetch(`/api/transactions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete-failed");
      navigate("/");
    } catch {
      setError(t("details.deleteError"));
    } finally {
      setDeleting(false);
    }
  };

  const onAccountingAction = async (action: "pay" | "release") => {
    if (!id) return;
    setProcessing(true);
    setError("");
    try {
      const res = await apiFetch(`/api/transactions/${id}/${action}`, { method: "POST" });
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "failed");
      }
      const data = await res.json();
      setTransaction(data);
    } catch (eventError) {
      const message = eventError instanceof Error ? eventError.message : "";
      setError(message && message !== "failed" ? message : t("details.actionError"));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <main className="container">
      <div className="page-actions">
        <Link to="/" className="link-button">
          {t("details.back")}
        </Link>
        {id ? (
          <>
            {" | "}
            {role !== "accountant" ? (
              <>
                <Link to={`/transactions/${id}/edit`} className="link-button">
                  {t("details.edit")}
                </Link>
                {" | "}
                <button className="danger-button" onClick={onDelete} disabled={deleting}>
                  {deleting ? t("details.deleting") : t("details.delete")}
                </button>
              </>
            ) : null}
            {role === "manager" || role === "accountant" ? (
              <>
                {" | "}
                <button
                  className="primary-button"
                  onClick={() => onAccountingAction("pay")}
                  disabled={processing || transaction?.paymentStatus === "paid"}
                >
                  {t("details.markPaid")}
                </button>
                {" "}
                <button
                  className="primary-button"
                  onClick={() => onAccountingAction("release")}
                  disabled={
                    processing ||
                    transaction?.paymentStatus !== "paid" ||
                    (transaction?.documentStatus !== "original_received" && transaction?.documentStatus !== "telex_release")
                  }
                >
                  {t("details.release")}
                </button>
              </>
            ) : null}
            {transaction ? (
              <>
                {" | "}
                <button type="button" className="primary-button" onClick={() => setShippingPaperOpen(true)}>
                  {t("details.shippingPaperButton")}
                </button>
              </>
            ) : null}
          </>
        ) : null}
      </div>
      <h1>{t("details.title")}</h1>
      {error ? <p className="error">{error}</p> : null}
      {!transaction && !error ? <p>{t("details.loading")}</p> : null}
      {transaction && (
        <section className="details-card">
          <div className="details-grid">
          <h2 className="form-section-title full-row">Transaction Snapshot (Read-only)</h2>
          <p className="details-item">
            <strong>{t("details.createdAt")}:</strong> {new Date(transaction.createdAt).toLocaleString(numberLocale)}
          </p>
          <p className="details-item">
            <strong>Declaration Number:</strong> {transaction.declarationNumber}
          </p>
          <p className="details-item">
            <strong>{t("details.duty")}:</strong> {transaction.customsDuty.toLocaleString(numberLocale)} {t("details.currencySuffix")}
          </p>
          <p className="details-item">
            <strong>{t("details.status")}:</strong> {transaction.clearanceStatus}
          </p>
          {transaction.releaseCode ? (
            <p className="details-item full-row">
              <strong>{t("details.releaseCode")}:</strong> {transaction.releaseCode}
            </p>
          ) : null}

          <h2 className="form-section-title full-row">Parties</h2>
          <p className="details-item">
            <strong>{t("details.client")}:</strong> {transaction.clientName}
          </p>
          <p className="details-item">
            <strong>{t("details.shippingCompany")}:</strong> {transaction.shippingCompanyName}
          </p>
          {transaction.shippingCompanyId ? (
            <p className="details-item">
              <strong>{t("form.shippingCompanyId")}:</strong> {transaction.shippingCompanyId}
            </p>
          ) : null}

          <h2 className="form-section-title full-row">Customs Declaration</h2>
          <p className="details-item">
            <strong>Declaration Number:</strong> {transaction.declarationNumber}
          </p>
          {transaction.declarationDate ? (
            <p className="details-item">
              <strong>Declaration Date:</strong> {new Date(transaction.declarationDate).toLocaleString(numberLocale)}
            </p>
          ) : null}
          {transaction.declarationType ? (
            <p className="details-item">
              <strong>Declaration Type:</strong> {transaction.declarationType}
            </p>
          ) : null}
          {transaction.portType ? (
            <p className="details-item">
              <strong>Port Type:</strong> {transaction.portType}
            </p>
          ) : null}

          <h2 className="form-section-title full-row">Shipment Core</h2>
          <p className="details-item">
            <strong>{t("details.airwayBill")}:</strong> {transaction.airwayBill}
          </p>
          <p className="details-item">
            <strong>{t("details.hsCode")}:</strong> {transaction.hsCode}
          </p>
          <p className="details-item">
            <strong>{t("details.goods")}:</strong> {transaction.goodsDescription}
          </p>
          <p className="details-item">
            <strong>{t("details.origin")}:</strong> {transaction.originCountry}
          </p>
          <p className="details-item">
            <strong>{t("form.invoiceValue")}:</strong> {transaction.invoiceValue.toLocaleString(numberLocale)} {t("details.currencySuffix")}
          </p>

          <h2 className="form-section-title full-row">Cargo & Containers</h2>
          {transaction.containerCount != null ? (
            <p className="details-item">
              <strong>{t("details.containerCount")}:</strong> {transaction.containerCount}
            </p>
          ) : null}
          {transaction.goodsWeightKg != null ? (
            <p className="details-item">
              <strong>{t("details.goodsWeightKg")}:</strong> {transaction.goodsWeightKg.toLocaleString(numberLocale)}
            </p>
          ) : null}
          {transaction.invoiceToWeightRateAedPerKg != null ? (
            <p className="details-item">
              <strong>{t("details.invoiceToWeightRate")}:</strong>{" "}
              {transaction.invoiceToWeightRateAedPerKg.toLocaleString(numberLocale)}
            </p>
          ) : null}
          {transaction.containerArrivalDate ? (
            <p className="details-item">
              <strong>{t("details.containerArrivalDate")}:</strong>{" "}
              {new Date(transaction.containerArrivalDate).toLocaleString(numberLocale)}
            </p>
          ) : null}
          {transaction.documentArrivalDate ? (
            <p className="details-item">
              <strong>{t("details.documentArrivalDate")}:</strong>{" "}
              {new Date(transaction.documentArrivalDate).toLocaleString(numberLocale)}
            </p>
          ) : null}
          {transaction.fileNumber ? (
            <p className="details-item">
              <strong>File Number:</strong> {transaction.fileNumber}
            </p>
          ) : null}
          {transaction.containerNumbers && transaction.containerNumbers.length > 0 ? (
            <p className="details-item">
              <strong>Container Numbers:</strong> {transaction.containerNumbers.join(", ")}
            </p>
          ) : null}
          {transaction.unitCount != null ? (
            <p className="details-item">
              <strong>Number of Units:</strong> {transaction.unitCount}
            </p>
          ) : null}

          <h2 className="form-section-title full-row">Workflow & Status</h2>
          <p className="details-item">
            <strong>{t("details.document")}:</strong> {transaction.documentStatus}
          </p>
          <p className="details-item">
            <strong>{t("details.payment")}:</strong> {transaction.paymentStatus}
          </p>
          <p className="details-item">
            <strong>Stopped:</strong> {transaction.isStopped ? "Yes" : "No"}
          </p>
          {transaction.isStopped && transaction.stopReason ? (
            <p className="details-item">
              <strong>Stop Reason:</strong> {transaction.stopReason}
            </p>
          ) : null}
          {transaction.goodsQuantity != null ? (
            <p className="details-item">
              <strong>{t("details.goodsQuantity")}:</strong> {transaction.goodsQuantity.toLocaleString(numberLocale)}
            </p>
          ) : null}
          {transaction.goodsUnit ? (
            <p className="details-item">
              <strong>{t("details.goodsUnit")}:</strong> {t(`form.unit.${transaction.goodsUnit}` as MessageKey)}
            </p>
          ) : null}
          {transaction.documentAttachments && transaction.documentAttachments.length > 0 ? (
            <div className="details-item full-row">
              <p>
                <strong>{t("details.documentPhotos")}</strong>
              </p>
              <ul className="attachment-grid">
                {transaction.documentAttachments.map((a) => {
                  const href = `${API_BASE}${a.path}`;
                  const isImg = /\.(png|jpe?g|gif|webp)$/i.test(a.originalName);
                  return (
                    <li key={a.path} className="attachment-tile">
                      {isImg ? (
                        <a href={href} target="_blank" rel="noreferrer">
                          <img src={href} alt="" className="attachment-thumb" />
                        </a>
                      ) : null}
                      <a href={href} target="_blank" rel="noreferrer">
                        {a.originalName} ({t("details.openAttachment")})
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
          </div>
        </section>
      )}
      <ShippingPaperModal open={shippingPaperOpen} transaction={transaction} onClose={() => setShippingPaperOpen(false)} />
    </main>
  );
}
