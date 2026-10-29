
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ConnectionPool, Transaction } from "mssql";
import type { PaymentEvent, PaymentStatus } from "../adapters/payment-adapter";
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

    const event: PaymentEvent = {
        eventId: "evt-1001",
        paymentId: "pay-5001",
        amount: 125.5,
        currency: "USD",
        status: "PENDING",
    };

    beforeEach(() => {
        vi.clearAllMocks();

        begin = vi.fn().mockResolvedValue(undefined);
        commit = vi.fn().mockResolvedValue(undefined);
        rollback = vi.fn().mockResolvedValue(undefined);

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
            getPaymentStatus: vi.fn().mockResolvedValue(null),
            updatePaymentStatus: vi.fn().mockResolvedValue(true),
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

    it("creates a new payment from a PENDING event", async () => {
        const result = await service.processPayment(event);

        expect(result).toEqual({ status: "processed" });
        expect(repository.insertProcessedEvent).toHaveBeenCalledWith(
            transaction,
            event
        );
        expect(repository.insertPayment).toHaveBeenCalledWith(
            transaction,
            event
        );
        expect(commit).toHaveBeenCalledOnce();
        expect(rollback).not.toHaveBeenCalled();
    });

    it("updates an existing PENDING payment to COMPLETED", async () => {
        vi.mocked(repository.getPaymentStatus).mockResolvedValue(
            "PENDING" as PaymentStatus
        );

        const completedEvent: PaymentEvent = {
            ...event,
            eventId: "evt-1002",
            status: "COMPLETED",
        };

        const result = await service.processPayment(completedEvent);

        expect(result).toEqual({ status: "processed" });
        expect(repository.updatePaymentStatus).toHaveBeenCalledWith(
            transaction,
            event.paymentId,
            "PENDING",
            "COMPLETED"
        );
        expect(commit).toHaveBeenCalledOnce();
    });

    it("rejects an invalid transition and rolls back", async () => {
        vi.mocked(repository.getPaymentStatus).mockResolvedValue(
            "COMPLETED" as PaymentStatus
        );

        const failedEvent: PaymentEvent = {
            ...event,
            eventId: "evt-1003",
            status: "FAILED",
        };

        await expect(
            service.processPayment(failedEvent)
        ).rejects.toThrow("Invalid payment status transition");

        expect(repository.insertProcessedEvent).not.toHaveBeenCalled();
        expect(commit).not.toHaveBeenCalled();
        expect(rollback).toHaveBeenCalledOnce();
    });

    it("returns duplicate when the event ID already exists", async () => {
        const duplicateError = Object.assign(
            new Error("Duplicate key"),
            { number: 2627 }
        );

        vi.mocked(repository.insertProcessedEvent).mockRejectedValue(
            duplicateError
        );
        vi.mocked(repository.processedEventExists).mockResolvedValue(true);

        const result = await service.processPayment(event);

        expect(result).toEqual({ status: "duplicate" });
        expect(rollback).toHaveBeenCalledOnce();
        expect(commit).not.toHaveBeenCalled();
    });

    it("rolls back and rethrows an unexpected database error", async () => {
        const dbError = new Error("Database unavailable");

        vi.mocked(repository.insertProcessedEvent).mockRejectedValue(dbError);

        await expect(service.processPayment(event)).rejects.toThrow(
            "Database unavailable"
        );

        expect(rollback).toHaveBeenCalledOnce();
        expect(commit).not.toHaveBeenCalled();
    });
});
