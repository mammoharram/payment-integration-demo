
import { z } from "zod";

export const paymentEventSchema = z.object({
    eventId: z.string().trim().min(1).max(100),
    paymentId: z.string().trim().min(1).max(100),
    amount: z.number().positive(),
    currency: z.string().trim().regex(/^[A-Za-z]{3}$/),
    status: z.string().trim().min(1),
});

export type ValidatedPaymentEvent = z.infer<typeof paymentEventSchema>;
