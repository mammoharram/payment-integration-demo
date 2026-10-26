import { ConnectionPool } from "mssql";
import type { ITransactionFactory } from "./iTransaction-factory";
import { IPaymentRepository } from "../repositories/iPayment.repo";
import { IPaymentService, ProcessPaymentResult } from "./iPayment.service";
import { Payment } from "../adapters/payment-adapter";

export class PaymentService implements IPaymentService {
    constructor(
        private readonly paymentRepository: IPaymentRepository,
        private readonly getPool: () => Promise<ConnectionPool>,
        private readonly transactionFactory: ITransactionFactory,
    ) { }

    async processPayment(payment: Payment): Promise<ProcessPaymentResult> {
        const pool = await this.getPool();

        const transaction = this.transactionFactory.create(pool);

        try {
            await transaction.begin();

            // Record the event first. EventId's primary key
            // prevents the same event from being processed twice.
            await this.paymentRepository.insertProcessedEvent(transaction, payment);

            // Insert the payment
            await this.paymentRepository.insertPayment(transaction, payment);

            await transaction.commit();
            return { status: "processed" }

        } catch (error) {
            // If either insert fails, undo the transaction.
            try {
                await transaction.rollback();
            } catch (rollbackError) {
                console.error("Transaction rollback failed:", rollbackError);
            }

            const dbError = error as { number?: number }

            // SQL Server duplicate-key errors are commonly 2627 or 2601.
            if (dbError.number === 2627 || dbError.number === 2601) {
                // Distinguish a repeated event from a different event
                // that happens to reuse an existing PaymentId.
                const existingEvent = await this.paymentRepository.processedEventExists(pool, payment.eventId);

                if (existingEvent.recordset.length > 0) {
                    return { status: "duplicate" };
                }
            }

            throw error;
        }
    }
}

