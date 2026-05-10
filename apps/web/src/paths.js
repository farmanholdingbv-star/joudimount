export function transactionListPath(module) {
    return module === "transactions" ? "/transactions" : `/${module}`;
}
