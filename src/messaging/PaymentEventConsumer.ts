
import type { IEventQueue } from "./IEventQueue";
import type { IPaymentService } from "../services/iPayment.service";

export class PaymentEventConsumer {
    constructor(
        private readonly queue: IEventQueue,
        private readonly paymentService: IPaymentService
    ) { }

    async start(): Promise<void> {
        await this.queue.consume(async (event) => {
            const result = await this.paymentService.processPayment(event);

            console.log(
                `Payment event ${event.eventId}: ${result.status}`
            );
        });
    }

    // // method to simulate transient failures and retries
    // async start(): Promise<void> {
    //     const attempts = new Map<string, number>();

    //     await this.queue.consume(async (event) => {
    //         const attempt = (attempts.get(event.eventId) ?? 0) + 1;
    //         attempts.set(event.eventId, attempt);

    //         // Simulate a transient failure on the first attempt.
    //         if (attempt === 1) {
    //             throw new Error("Simulated transient failure");
    //         }

    //         const result = await this.paymentService.processPayment(event);

    //         console.log(
    //             `Payment event ${event.eventId}: ${result.status} (attempt ${attempt})`
    //         );
    //     });
    // }
}
