
import type { PaymentEvent } from "../adapters/payment-adapter";
import type { IEventQueue } from "./IEventQueue";

export class InMemoryEventQueue implements IEventQueue {
    private readonly events: PaymentEvent[] = [];
    private handler?: (event: PaymentEvent) => Promise<void>;
    private processing = false;

    async publish(event: PaymentEvent): Promise<void> {
        this.events.push(event);

        // Start processing without waiting for it to finish.
        void this.processNext();
    }

    async consume(
        handler: (event: PaymentEvent) => Promise<void>
    ): Promise<void> {
        this.handler = handler;
        void this.processNext();
    }

    private async processNext(): Promise<void> {
        if (this.processing || !this.handler) {
            return;
        }

        this.processing = true;

        try {
            while (this.events.length > 0 && this.handler) {
                const event = this.events[0]!;
                let processed = false;

                for (let attempt = 1; attempt <= 3; attempt++) {
                    try {
                        await this.handler(event);
                        processed = true;
                        break;
                    } catch (error) {
                        console.error(
                            `Attempt ${attempt}/3 failed for event ${event.eventId}:`,
                            error
                        );
                    }
                }

                if (processed) {
                    this.events.shift();
                } else {
                    console.error(
                        `Event ${event.eventId} failed after 3 attempts; removing it from the in-memory queue.`
                    );
                    this.events.shift();
                }
            }
        } finally {
            this.processing = false;
        }
    }

}
