
import sql from "mssql/msnodesqlv8";

import database from "./config/database";
import { SqlPaymentRepository } from "./repositories/payment.repo";
import { PaymentService } from "./services/payment.service";
import type { ITransactionFactory } from "./services/iTransaction-factory";

const paymentRepository = new SqlPaymentRepository();

const transactionFactory: ITransactionFactory = {
    create: (pool) => new sql.Transaction(pool),
};

export const paymentService = new PaymentService(
    paymentRepository,
    database.getPool,
    transactionFactory
);
