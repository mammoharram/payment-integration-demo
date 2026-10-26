
import type { Payment } from "../adapters/payment-adapter";

export type ProcessPaymentResult =
    | { status: "processed" }
    | { status: "duplicate" };

export interface IPaymentService {
    processPayment(
        payment: Payment
    ): Promise<ProcessPaymentResult>;
}
