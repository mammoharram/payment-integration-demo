import sqlClient = require("mssql/msnodesqlv8");
import type { Transaction, ConnectionPool, IResult } from "mssql";
import type { Payment } from "../adapters/payment-adapter";
import type { IPaymentRepository } from "./iPayment.repo";

export class SqlPaymentRepository implements IPaymentRepository {

    async insertPayment(transaction: Transaction, payment: Payment) {
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

    async insertProcessedEvent(transaction: Transaction, payment: Payment) {
        await new sqlClient.Request(transaction)
            .input("EventId", sqlClient.NVarChar(100), payment.eventId)
            .input("PaymentId", sqlClient.NVarChar(100), payment.paymentId)
            .query(`
                INSERT INTO dbo.ProcessedEvents (EventId, PaymentId)
                VALUES (@EventId, @PaymentId);
            `);
    }

    async processedEventExists(pool: ConnectionPool, eventId: string): Promise<IResult<any>> {
        return await pool
            .request()
            .input("EventId", sqlClient.NVarChar(100), eventId)
            .query(`
                SELECT EventId
                FROM dbo.ProcessedEvents
                WHERE EventId = @EventId;
            `);
    }
}
