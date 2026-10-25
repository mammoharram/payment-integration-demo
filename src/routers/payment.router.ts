
import { Router } from "express";
import database = require("../config/database");
import sqlClient = require("mssql/msnodesqlv8");
import { adaptPaymentEvent, type ExternalPaymentEvent } from "../adapters/payment-adapter";

const router = Router();


router.post("/", async (req, res) => {
    // 1. Validate the incoming payload at runtime.
    // 2. Convert the external event to our internal model.
    let payment;

    try {
        payment = adaptPaymentEvent(req.body as ExternalPaymentEvent);
        // payment = adaptPaymentEvent(validation.data);
    } catch (error) {
        return res.status(422).json({
            error: error instanceof Error
                ? error.message
                : "Unsupported payment event",
        });
    }

    let pool: Awaited<ReturnType<typeof database.getPool>>;

    try {
        pool = await database.getPool();
    } catch (error) {
        console.error("Database connection failed:", error);
        return res.status(500).json({
            error: "Unable to connect to the database",
        });
    }

    const transaction = new sqlClient.Transaction(pool);

    try {
        // 3. Start the transaction.
        await transaction.begin();

        // 4a. Record the event first. EventId's primary key
        // prevents the same event from being processed twice.
        await new sqlClient.Request(transaction)
            .input("EventId", sqlClient.NVarChar(100), payment.eventId)
            .input("PaymentId", sqlClient.NVarChar(100), payment.paymentId)
            .query(`
                INSERT INTO dbo.ProcessedEvents (EventId, PaymentId)
                VALUES (@EventId, @PaymentId);
            `);

        // 4b. Insert the payment using parameterized SQL.
        await new sqlClient.Request(transaction)
            .input("PaymentId", sqlClient.NVarChar(100), payment.paymentId)
            .input("Amount", sqlClient.Decimal(18, 2), payment.amount)
            .input("Currency", sqlClient.Char(3), payment.currency)
            .input("Status", sqlClient.NVarChar(30), payment.status)
            .query(`
                INSERT INTO dbo.Payments
                (PaymentId, Amount, Currency, Status)
                VALUES
                (@PaymentId, @Amount, @Currency, @Status);
            `);

        // 5. Both inserts succeeded.
        await transaction.commit();

        return res.status(201).json({
            status: "processed",
            eventId: payment.eventId,
            paymentId: payment.paymentId,
        });
    } catch (error) {
        // If either insert fails, undo the transaction.
        try {
            await transaction.rollback();
        } catch (rollbackError) {
            console.error("Transaction rollback failed:", rollbackError);
        }

        const dbError = error as { number?: number; message?: string };

        // SQL Server duplicate-key errors are commonly 2627 or 2601.
        if (dbError.number === 2627 || dbError.number === 2601) {
            try {
                // Distinguish a repeated event from a different event
                // that happens to reuse an existing PaymentId.
                const existingEvent = await pool
                    .request()
                    .input("EventId", sqlClient.NVarChar(100), payment.eventId)
                    .query(`
                        SELECT EventId
                        FROM dbo.ProcessedEvents
                        WHERE EventId = @EventId;
                    `);

                if (existingEvent.recordset.length > 0) {
                    return res.status(200).json({
                        status: "duplicate",
                        eventId: payment.eventId,
                        message: "This event has already been processed",
                    });
                }
            } catch (lookupError) {
                console.error("Duplicate-event lookup failed:", lookupError);
            }
        }

        console.error("Payment processing failed:", error);

        return res.status(500).json({
            error: "Payment processing failed",
        });
    }
});

export default router;