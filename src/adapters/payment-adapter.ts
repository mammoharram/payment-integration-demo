export interface ExternalPaymentEvent {
    eventId: string;
    paymentId: string;
    amount: number;
    currency: string;
    status: string;
}

export interface Payment {
    eventId: string;
    paymentId: string;
    amount: number;
    currency: string;
    status: "PENDING" | "COMPLETED" | "FAILED";
}

export function adaptPaymentEvent(
    event: ExternalPaymentEvent
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
        status: status as Payment["status"],
    };
}