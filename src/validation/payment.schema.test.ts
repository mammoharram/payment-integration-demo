
import { describe, expect, it } from "vitest";

import { paymentEventSchema } from "./payment.schema";

const validEvent = {
    eventId: "evt-1001",
    paymentId: "pay-5001",
    amount: 125.5,
    currency: "USD",
    status: "completed",
};

describe("paymentEventSchema", () => {
    it("accepts a valid payment event", () => {
        const result = paymentEventSchema.safeParse(validEvent);

        expect(result.success).toBe(true);
    });

    it("rejects a missing event ID", () => {
        const result = paymentEventSchema.safeParse({
            ...validEvent,
            eventId: "",
        });

        expect(result.success).toBe(false);
    });

    it("rejects a negative amount", () => {
        const result = paymentEventSchema.safeParse({
            ...validEvent,
            amount: -10,
        });

        expect(result.success).toBe(false);
    });

    it("rejects a non-numeric amount", () => {
        const result = paymentEventSchema.safeParse({
            ...validEvent,
            amount: "125.50",
        });

        expect(result.success).toBe(false);
    });

    it("rejects an invalid currency code", () => {
        const result = paymentEventSchema.safeParse({
            ...validEvent,
            currency: "US",
        });

        expect(result.success).toBe(false);
    });

    it("rejects a missing payment ID", () => {
        const result = paymentEventSchema.safeParse({
            ...validEvent,
            paymentId: "",
        });

        expect(result.success).toBe(false);
    });
});
