import "dotenv/config";
import sql from "mssql/msnodesqlv8";

const config = {
    server: process.env.DB_SERVER ?? "localhost",
    database: process.env.DB_NAME ?? "PaymentIntegrationDemo",
    driver: process.env.DB_DRIVER ?? "ODBC Driver 18 for SQL Server",

    options: {
        trustedConnection: true,
        trustServerCertificate: true,
    },

    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
    },
};

async function getPool() {
    return sql.connect(config);
}

export default { getPool };