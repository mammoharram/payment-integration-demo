import database from "../config/database";
import sqlClient from "mssql/msnodesqlv8";
import { Payment } from "../adapters/payment-adapter";
import { insertPayment, insertProcessedEvent, isProcessedEventExist } from "../repositories/payment.repo";

type ProcessPaymentResult = { status: "processed" | "duplicate" };

export async function processPayment(payment: Payment): Promise<ProcessPaymentResult> {
    const pool = await database.getPool();

    const transaction = new sqlClient.Transaction(pool);

    try {
        await transaction.begin();

        // Record the event first. EventId's primary key
        // prevents the same event from being processed twice.
        await insertProcessedEvent(transaction, payment);

        // Insert the payment
        await insertPayment(transaction, payment);

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
            const existingEvent = await isProcessedEventExist(pool, payment);

            if (existingEvent.recordset.length > 0) {
                return { status: "duplicate" };
            }
        }

        throw error;
    }
}

