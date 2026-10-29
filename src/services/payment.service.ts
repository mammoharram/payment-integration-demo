import { ConnectionPool } from "mssql";
import type { ITransactionFactory } from "./iTransaction-factory";
import { IPaymentRepository } from "../repositories/iPayment.repo";
import { IPaymentService, ProcessPaymentResult } from "./iPayment.service";
import { PaymentEvent, PaymentStatus } from "../adapters/payment-adapter";

export class PaymentService implements IPaymentService {
    constructor(
        private readonly paymentRepository: IPaymentRepository,
        private readonly getPool: () => Promise<ConnectionPool>,
        private readonly transactionFactory: ITransactionFactory,
    ) { }

    async processPayment(event: PaymentEvent): Promise<ProcessPaymentResult> {
        const pool = await this.getPool();

        const transaction = this.transactionFactory.create(pool);

        try {
            await transaction.begin();

            // 1. Read the payment's current status.
            const currentStatus = await this.paymentRepository.getPaymentStatus(transaction, event.paymentId);

            // 2. Validate the event before recording it.
            if (currentStatus === null) {
                if (event.status !== "PENDING") {
                    throw new Error(`A new payment must start as PENDING. Received: ${event.status}`);
                }
            } else if (!this.canTransition(currentStatus, event.status)) {
                throw new Error(`Invalid payment status transition: ${currentStatus} -> ${event.status}`);
            }


            // Record the event first. EventId's primary key
            // prevents the same event from being processed twice.
            await this.paymentRepository.insertProcessedEvent(transaction, event);

            // 4. Create the payment or update its current status.
            if (currentStatus === null) {
                await this.paymentRepository.insertPayment(transaction, event);
            } else {
                const updated = await this.paymentRepository.updatePaymentStatus(
                    transaction,
                    event.paymentId,
                    currentStatus,
                    event.status
                );

                if (!updated) {
                    throw new Error(
                        "Payment status changed unexpectedly. Please retry the event."
                    );
                }
            }

            await transaction.commit();
            return { status: "processed" };

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
                const existingEvent = await this.paymentRepository.processedEventExists(pool, event.eventId);

                if (existingEvent) {
                    return { status: "duplicate" };
                }
            }

            throw error;
        }
    }

    canTransition(current: PaymentStatus, next: PaymentStatus): boolean {
        if (current === "PENDING") {
            return next === "COMPLETED" || next === "FAILED";
        }
        return false;
    }

}

