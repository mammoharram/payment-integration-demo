
import { Router } from "express";
import type { IPaymentService } from "../services/iPayment.service";
import { paymentEventSchema } from "../validation/payment.schema";
import { adaptPaymentEvent } from "../adapters/payment-adapter";


export function createPaymentRouter(paymentService: IPaymentService) {
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
        let payment;

        try {
            payment = adaptPaymentEvent(validation.data);
        } catch (error) {
            return res.status(422).json({
                error: error instanceof Error
                    ? error.message
                    : "Unsupported payment event",
            });
        }

        try {
            const result = await paymentService.processPayment(payment);
            if (result.status === "duplicate") {
                return res.status(200).json({
                    status: "duplicate",
                    eventId: payment.eventId,
                    message: "This event has already been processed"
                });
            }
            return res.status(200).json({
                status: "processed",
                eventId: payment.eventId,
                paymentId: payment.paymentId,
            });

        } catch (error) {
            console.error("Payment processing failed:", error);

            return res.status(500).json({
                error: "Payment processing failed",
            });
        }
    });

    return router;
}