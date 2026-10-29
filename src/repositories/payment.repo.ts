import sqlClient = require("mssql/msnodesqlv8");
import type { Transaction, ConnectionPool } from "mssql";
import type { PaymentEvent, PaymentStatus } from "../adapters/payment-adapter";
import type { IPaymentRepository } from "./iPayment.repo";

export class SqlPaymentRepository implements IPaymentRepository {

    async insertPayment(transaction: Transaction, event: PaymentEvent): Promise<void> {
        await new sqlClient.Request(transaction)
            .input("PaymentId", sqlClient.NVarChar(100), event.paymentId)
            .input("Amount", sqlClient.Decimal(18, 2), event.amount)
            .input("Currency", sqlClient.Char(3), event.currency)
            .input("Status", sqlClient.NVarChar(30), event.status)
            .query(`
                INSERT INTO dbo.Payments
                (PaymentId, Amount, Currency, Status)
                VALUES
                (@PaymentId, @Amount, @Currency, @Status);
            `);
    }

    async insertProcessedEvent(transaction: Transaction, event: PaymentEvent): Promise<void> {
        await new sqlClient.Request(transaction)
            .input("EventId", sqlClient.NVarChar(100), event.eventId)
            .input("PaymentId", sqlClient.NVarChar(100), event.paymentId)
            .input("Status", sqlClient.NVarChar(30), event.status)
            .query(`
                INSERT INTO dbo.ProcessedEvents (EventId, PaymentId, Status)
                VALUES (@EventId, @PaymentId, @Status);
            `);
    }

    async processedEventExists(pool: ConnectionPool, eventId: string): Promise<boolean> {
        const result = await pool
            .request()
            .input("EventId", sqlClient.NVarChar(100), eventId)
            .query(`
                SELECT EventId
                FROM dbo.ProcessedEvents
                WHERE EventId = @EventId;
            `);

        return result.recordset.length > 0;
    }

    async getPaymentStatus(transaction: Transaction, paymentId: string): Promise<PaymentStatus | null> {
        const result = await new sqlClient.Request(transaction)
            .input("PaymentId", sqlClient.NVarChar(100), paymentId)
            .query(`
                SELECT Status
                FROM dbo.Payments
                WHERE PaymentId = @PaymentId;
            `);

        if (result.recordset.length === 0) {
            return null;
        }

        return result.recordset[0].Status as PaymentStatus;
    }

    async updatePaymentStatus(
        transaction: Transaction,
        paymentId: string,
        expectedStatus: PaymentStatus,
        nextStatus: PaymentStatus
    ): Promise<boolean> {
        const result = await new sqlClient.Request(transaction)
            .input("PaymentId", sqlClient.NVarChar(100), paymentId)
            .input("ExpectedStatus", sqlClient.NVarChar(30), expectedStatus)
            .input("NextStatus", sqlClient.NVarChar(30), nextStatus)
            .query(`
                UPDATE dbo.Payments
                SET Status = @NextStatus
                WHERE PaymentId = @PaymentId
                AND Status = @ExpectedStatus;
            `);

        return result.rowsAffected[0] === 1;
    }

}
