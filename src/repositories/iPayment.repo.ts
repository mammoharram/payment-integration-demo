
import type { ConnectionPool, IResult, Transaction } from "mssql";
import type { PaymentEvent, PaymentStatus, Payment } from "../adapters/payment-adapter";

export interface IPaymentRepository {
    insertProcessedEvent(
        transaction: Transaction,
        event: PaymentEvent
    ): Promise<void>;

    insertPayment(
        transaction: Transaction,
        event: PaymentEvent
    ): Promise<void>;

    processedEventExists(
        pool: ConnectionPool,
        eventId: string
    ): Promise<boolean>;

    getPaymentStatus(
        transaction: Transaction,
        paymentId: string
    ): Promise<PaymentStatus | null>;

    // Update the status only if the current status matches expectations.
    updatePaymentStatus(
        transaction: Transaction,
        paymentId: string,
        expectedStatus: PaymentStatus,
        nextStatus: PaymentStatus
    ): Promise<boolean>;
}