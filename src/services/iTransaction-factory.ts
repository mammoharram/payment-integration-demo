
import type { ConnectionPool, Transaction } from "mssql";

export interface ITransactionFactory {
    create(pool: ConnectionPool): Transaction;
}
