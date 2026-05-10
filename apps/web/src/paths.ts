/** List page route for imports, transfers, or exports (imports live at `/transactions`). */
export type TransactionListModule = "transactions" | "transfers" | "exports";

export function transactionListPath(module: TransactionListModule): string {
  return module === "transactions" ? "/transactions" : `/${module}`;
}
