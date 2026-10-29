
import type { PaymentEvent } from "../adapters/payment-adapter";

export interface IEventQueue {
    publish(event: PaymentEvent): Promise<void>;

    consume(
        handler: (event: PaymentEvent) => Promise<void>
    ): Promise<void>;
}
