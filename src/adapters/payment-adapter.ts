import { ValidatedPaymentEvent } from "../validation/payment.schema";

export interface Payment {
    eventId: string;
    paymentId: string;
    amount: number;
    currency: string;
    status: PaymentStatus;
}

export function adaptPaymentEvent(
    event: ValidatedPaymentEvent
): Payment {
    const status = event.status.toUpperCase();

    if (!["PENDING", "COMPLETED", "FAILED"].includes(status)) {
        throw new Error(`Unsupported payment status: ${event.status}`);
    }

    return {
        eventId: event.eventId,
        paymentId: event.paymentId,
        amount: event.amount,
        currency: event.currency.toUpperCase(),
        status: status as PaymentStatus,
    };
}

export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED";