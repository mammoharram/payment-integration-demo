# SQL Setup for Local Development

This folder contains the minimum SQL Server setup needed to run the demo locally.

## Prerequisites

Install one of the following SQL Server options:

- SQL Server 2022 Developer Edition
- SQL Server LocalDB
- SQL Server running in Docker

Recommended tools:

- SQL Server Management Studio (SSMS)
- Azure Data Studio
- ODBC Driver 18 for SQL Server

The application is configured to connect by default to:

- Server: `localhost`
- Database: `PaymentIntegrationDemo`
- Driver: `ODBC Driver 18 for SQL Server`

The code uses Windows trusted authentication (`trustedConnection: true`), so if you are running SQL Server locally on Windows, the current user usually needs access to the database.

## Setup order

Run the scripts in this order:

1. `01-create-database.sql`
2. `02-create-schema.sql`
3. `03-grant-access.sql` (if you want to explicitly grant permissions to a Windows or SQL login)

## Example environment variables

```env
DB_SERVER=localhost
DB_NAME=PaymentIntegrationDemo
DB_DRIVER=ODBC Driver 18 for SQL Server
```

## Notes

This repository does not yet include the full event queue implementation as a completed production feature. The SQL scripts below are only for the prerequisite database setup required to try the payment flow locally.
