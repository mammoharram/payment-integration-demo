
import { describe, expect, it } from "vitest";

import { adaptPaymentEvent } from "./payment-adapter";

describe("adaptPaymentEvent", () => {
    it("normalizes status and currency", () => {
        const result = adaptPaymentEvent({
            eventId: "evt-1001",
            paymentId: "pay-5001",
            amount: 125.5,
            currency: "usd",
            status: "completed",
        });

        expect(result).toEqual({
            eventId: "evt-1001",
            paymentId: "pay-5001",
            amount: 125.5,
            currency: "USD",
            status: "COMPLETED",
        });
    });

    it("rejects unsupported payment statuses", () => {
        expect(() =>
            adaptPaymentEvent({
                eventId: "evt-1002",
                paymentId: "pay-5002",
                amount: 50,
                currency: "USD",
                status: "REFUNDED",
            })
        ).toThrow("Unsupported payment status: REFUNDED");
    });
});
