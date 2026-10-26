
import type { ConnectionPool, IResult, Transaction } from "mssql";
import type { Payment } from "../adapters/payment-adapter";

export interface IPaymentRepository {
    insertProcessedEvent(
        transaction: Transaction,
        payment: Payment
    ): Promise<void>;

    insertPayment(
        transaction: Transaction,
        payment: Payment
    ): Promise<void>;

    processedEventExists(
        pool: ConnectionPool,
        eventId: string
    ): Promise<IResult<any>>;
}
