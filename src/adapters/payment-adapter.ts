import { ValidatedPaymentEvent } from "../validation/payment.schema";

export interface Payment {
    paymentId: string;
    amount: number;
    currency: string;
    status: PaymentStatus;
}

export interface PaymentEvent extends Payment {
    eventId: string;
    // paymentId, amount, currency, and status are inherited from Payment
}
export function adaptPaymentEvent(
    event: ValidatedPaymentEvent
): PaymentEvent {
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