
import type { PaymentEvent } from "../adapters/payment-adapter";

export type ProcessPaymentResult =
    | { status: "processed" }
    | { status: "duplicate" };

export interface IPaymentService {
    processPayment(
        event: PaymentEvent
    ): Promise<ProcessPaymentResult>;
}
