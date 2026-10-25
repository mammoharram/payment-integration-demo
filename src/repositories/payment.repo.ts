import sqlClient = require("mssql/msnodesqlv8");
import { Payment } from "../adapters/payment-adapter";

async function insertPayment(transaction: sqlClient.Transaction, payment: Payment) {
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
}

async function insertProcessedEvent(transaction: sqlClient.Transaction, payment: Payment) {
    await new sqlClient.Request(transaction)
        .input("EventId", sqlClient.NVarChar(100), payment.eventId)
        .input("PaymentId", sqlClient.NVarChar(100), payment.paymentId)
        .query(`
            INSERT INTO dbo.ProcessedEvents (EventId, PaymentId)
            VALUES (@EventId, @PaymentId);
        `);
}

async function isProcessedEventExist(pool: sqlClient.ConnectionPool, payment: Payment) {
    return await pool
        .request()
        .input("EventId", sqlClient.NVarChar(100), payment.eventId)
        .query(`
            SELECT EventId
            FROM dbo.ProcessedEvents
            WHERE EventId = @EventId;
        `);
}
export { insertPayment, insertProcessedEvent, isProcessedEventExist };