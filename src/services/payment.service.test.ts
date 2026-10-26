
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ConnectionPool, Transaction } from "mssql";
import type { Payment } from "../adapters/payment-adapter";
import type { IPaymentRepository } from "../repositories/iPayment.repo";
import type { ITransactionFactory } from "./iTransaction-factory";
import { PaymentService } from "./payment.service";

describe("PaymentService", () => {
    let service: PaymentService;

    let repository: IPaymentRepository;
    let transactionFactory: ITransactionFactory;

    let pool: ConnectionPool;
    let transaction: Transaction;

    let getPool: () => Promise<ConnectionPool>;

    let begin: ReturnType<typeof vi.fn>;
    let commit: ReturnType<typeof vi.fn>;
    let rollback: ReturnType<typeof vi.fn>;

    const payment: Payment = {
        eventId: "evt-1001",
        paymentId: "pay-5001",
        amount: 125.5,
        currency: "USD",
        status: "COMPLETED",
    };

    beforeEach(() => {
        vi.clearAllMocks();

        begin = vi.fn().mockResolvedValue(undefined);
        commit = vi.fn().mockResolvedValue(undefined);
        rollback = vi.fn().mockResolvedValue(undefined);

        // A fake transaction: no real SQL Server connection.
        transaction = {
            begin,
            commit,
            rollback,
        } as unknown as Transaction;

        pool = {} as ConnectionPool;

        getPool = vi.fn<() => Promise<ConnectionPool>>().mockResolvedValue(pool);

        repository = {
            insertProcessedEvent: vi.fn().mockResolvedValue(undefined),
            insertPayment: vi.fn().mockResolvedValue(undefined),
            processedEventExists: vi.fn().mockResolvedValue(false),
        };

        transactionFactory = {
            create: vi.fn().mockReturnValue(transaction),
        };

        service = new PaymentService(
            repository,
            getPool,
            transactionFactory
        );
    });

    it("commits when both database operations succeed", async () => {
        const result = await service.processPayment(payment);

        expect(result).toEqual({ status: "processed" });

        expect(getPool).toHaveBeenCalledOnce();
        expect(transactionFactory.create).toHaveBeenCalledWith(pool);

        expect(repository.insertProcessedEvent).toHaveBeenCalledWith(
            transaction,
            payment
        );

        expect(repository.insertPayment).toHaveBeenCalledWith(
            transaction,
            payment
        );

        expect(begin).toHaveBeenCalledOnce();
        expect(commit).toHaveBeenCalledOnce();
        expect(rollback).not.toHaveBeenCalled();
    });

    it("rolls back when inserting a payment fails", async () => {
        vi.mocked(repository.insertPayment).mockRejectedValueOnce(
            new Error("Simulated database failure")
        );

        await expect(
            service.processPayment(payment)
        ).rejects.toThrow("Simulated database failure");

        expect(begin).toHaveBeenCalledOnce();
        expect(commit).not.toHaveBeenCalled();
        expect(rollback).toHaveBeenCalledOnce();
    });

    it("returns duplicate when the event already exists", async () => {
        vi.mocked(repository.insertProcessedEvent).mockRejectedValueOnce({
            number: 2627,
        });

        vi.mocked(repository.processedEventExists).mockResolvedValueOnce({
            recordset: [{}],
        } as any);

        const result = await service.processPayment(payment);

        expect(result).toEqual({ status: "duplicate" });

        expect(rollback).toHaveBeenCalledOnce();
        expect(commit).not.toHaveBeenCalled();
        expect(repository.processedEventExists).toHaveBeenCalledWith(
            pool,
            payment.eventId
        );

        expect(repository.insertPayment).not.toHaveBeenCalled();
    });

    it("rethrows unrelated database errors", async () => {
        vi.mocked(repository.insertPayment).mockRejectedValueOnce(
            new Error("Database unavailable")
        );

        await expect(
            service.processPayment(payment)
        ).rejects.toThrow("Database unavailable");

        expect(rollback).toHaveBeenCalledOnce();
        expect(commit).not.toHaveBeenCalled();
        expect(repository.processedEventExists).not.toHaveBeenCalled();
    });
});
