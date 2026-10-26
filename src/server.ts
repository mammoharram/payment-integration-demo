import express from "express";
import database from "./config/database";
import paymentRoutes from "./routers/payment.router";

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

        // const query = "SELECT BD_NAME AS DatabaseName, SUSER_NAME AS UserName";
        // const result = await pool.request().query(query);
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
app.use("/api/payments", paymentRoutes);

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});