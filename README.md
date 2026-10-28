# Payment Integration Demo

A lightweight Express-based payment integration backend for demoing payment workflows, database health checks, and event-driven processing.

## Overview

This project exposes an API for payment operations and includes a simple in-memory event queue to demonstrate decoupled processing. It is built with TypeScript and uses Express for the HTTP layer.

## Features

- Payment API routes and service layer
- Manual dependency injection container
- Database health endpoint for SQL Server connectivity checks
- Vitest test setup
- Upcoming feature: event-driven processing via an in-memory event queue (currently in progress and not yet committed as a completed implementation)

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Set up the local SQL Server prerequisites from the scripts in the `sql/` folder.

   For example:

   ```sql
   -- Run in SQL Server Management Studio or Azure Data Studio
   :r .\sql\01-create-database.sql
   :r .\sql\02-create-schema.sql
   ```

   See [sql/README.md](sql/README.md) for the tool list and setup notes.

3. Configure your environment variables in a `.env` file if your database configuration requires them.

4. Start the application in development mode:

   ```bash
   npm run dev
   ```

4. Or run the built TypeScript entry point directly:

   ```bash
   npm run start
   ```

## Available Scripts

```bash
npm run dev
npm run start
npm test
```

## API Health

The application exposes the following basic endpoints:

- `GET /health` — returns the service health status
- `GET /db-health` — checks database connectivity and returns database metadata
- `GET /api/payments` and related routes — payment operations

## Project Structure

```text
src/
  config/
  adapters/
  messaging/
  repositories/
  routers/
  services/
  server.ts
```

## Notes

This repository is intended as a demo project and may require database credentials and environment-specific configuration for full runtime behavior.

The event queue and consumer flow are planned as an upcoming feature. The queue-related code is not yet considered a completed or committed implementation in this repository.
