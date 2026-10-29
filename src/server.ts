import express from "express";
import database from "./config/database";
import { createPaymentRouter } from "./routers/payment.router";
import { eventQueue, paymentEventConsumer } from "./manual-di-container";

const app = express();
const port = 3000;

app.use(express.json());

app.get("/health", (_req, res) => {
    res.status(200).json({
        status: "healthy",
        service: "payment-integration-demo",
    });
});

app.get("/db-health", async (_req, res) => {
    try {
        const pool = await database.getPool();

        const result = await pool.request().query(`
            SELECT
            DB_NAME() AS databaseName,
            SUSER_SNAME() AS loginName
        `);

        res.status(200).json({
            status: "healthy",
            ...result.recordset[0],
        });
    } catch (error) {
        res.status(500).json({
            status: "unhealthy",
            service: "payment-integration-demo",
            error: (error as Error).message,
        });
    }
});

// Endpoints
app.use("/api/payments", createPaymentRouter(eventQueue));
// app.use("/api/payments", createPaymentRouter(paymentService));

// Start the consumer before accepting API requests.
async function startServer() {
    await paymentEventConsumer.start();

    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}

startServer().catch((error) => {
    console.error("Failed to start application:", error);
    process.exitCode = 1;
});