
import { beforeEach, describe, expect, it, vi } from "vitest";

// Shared mocks must be created with vi.hoisted because
// Vitest hoists vi.mock() declarations.
const mocks = vi.hoisted(() => ({
    transaction: {
        begin: vi.fn(),
        commit: vi.fn(),
        rollback: vi.fn(),
    },
    database: {
        getPool: vi.fn(),
    },
    insertProcessedEvent: vi.fn(),
    insertPayment: vi.fn(),
    isProcessedEventExist: vi.fn(),
}));

vi.mock("mssql/msnodesqlv8", () => ({
    default: {
        Transaction: vi.fn(function () {
            return mocks.transaction;
        }),
    },
}));

vi.mock("../config/database", () => ({
    default: {
        getPool: mocks.database.getPool,
    },
}));

vi.mock("../repositories/payment.repo", () => ({
    insertProcessedEvent: mocks.insertProcessedEvent,
    insertPayment: mocks.insertPayment,
    isProcessedEventExist: mocks.isProcessedEventExist,
}));

import { processPayment } from "./payment.service";

const payment = {
    eventId: "evt-1001",
    paymentId: "pay-5001",
    amount: 125.5,
    currency: "USD",
    status: "COMPLETED" as const,
};

describe("processPayment", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mocks.database.getPool.mockResolvedValue({});
        mocks.transaction.begin.mockResolvedValue(undefined);
        mocks.transaction.commit.mockResolvedValue(undefined);
        mocks.transaction.rollback.mockResolvedValue(undefined);

        mocks.insertProcessedEvent.mockResolvedValue(undefined);
        mocks.insertPayment.mockResolvedValue(undefined);
        mocks.isProcessedEventExist.mockResolvedValue({ recordset: [] });
    });

    it("commits when both inserts succeed", async () => {
        const result = await processPayment(payment);

        expect(result).toEqual({ status: "processed" });

        expect(mocks.transaction.begin).toHaveBeenCalledOnce();
        expect(mocks.insertProcessedEvent).toHaveBeenCalledOnce();
        expect(mocks.insertPayment).toHaveBeenCalledOnce();
        expect(mocks.transaction.commit).toHaveBeenCalledOnce();
        expect(mocks.transaction.rollback).not.toHaveBeenCalled();
    });

    it("rolls back when inserting the payment fails", async () => {
        mocks.insertPayment.mockRejectedValueOnce(
            new Error("Simulated database failure")
        );

        await expect(processPayment(payment)).rejects.toThrow(
            "Simulated database failure"
        );

        expect(mocks.transaction.rollback).toHaveBeenCalledOnce();
        expect(mocks.transaction.commit).not.toHaveBeenCalled();
    });

    it("returns duplicate when the event already exists", async () => {
        mocks.insertProcessedEvent.mockRejectedValueOnce({
            number: 2627,
        });

        mocks.isProcessedEventExist.mockResolvedValueOnce({
            recordset: [{ EventId: payment.eventId }],
        });

        const result = await processPayment(payment);

        expect(result).toEqual({ status: "duplicate" });
        expect(mocks.transaction.rollback).toHaveBeenCalledOnce();
        expect(mocks.transaction.commit).not.toHaveBeenCalled();
    });

    it("propagates an unrelated database error", async () => {
        mocks.insertPayment.mockRejectedValueOnce(
            new Error("Database unavailable")
        );

        await expect(processPayment(payment)).rejects.toThrow(
            "Database unavailable"
        );

        expect(mocks.transaction.rollback).toHaveBeenCalledOnce();
    });
});
