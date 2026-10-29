
import { Router } from "express";
import { paymentEventSchema } from "../validation/payment.schema";
import { adaptPaymentEvent } from "../adapters/payment-adapter";
import type { IEventQueue } from "../messaging/IEventQueue";


export function createPaymentRouter(eventQueue: IEventQueue) {
    const router = Router();

    router.post("/", async (req, res) => {
        // 1. Validate the incoming payload at runtime.
        const validation = paymentEventSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({
                error: "Invalid payment event",
                details: validation.error.issues.map((issue) => ({
                    field: issue.path.join("."),
                    message: issue.message,
                })),
            });
        }

        // 2. Convert the external event to our internal model.
        let event;

        try {
            event = adaptPaymentEvent(validation.data);
        } catch (error) {
            return res.status(422).json({
                error: error instanceof Error
                    ? error.message
                    : "Unsupported payment event",
            });
        }

        try {
            await eventQueue.publish(event);

            return res.status(202).json({
                status: "accepted",
                eventId: event.eventId,
            });

        } catch (error) {
            console.error("Payment processing failed:", error);

            return res.status(500).json({
                error: "Failed to queue payment event",
                details: (error instanceof Error ? error.message : "Unknown error"),
            });
        }
    });

    return router;
}