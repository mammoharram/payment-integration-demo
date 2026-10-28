USE master;
GO

IF DB_ID(N'PaymentIntegrationDemo') IS NULL
BEGIN
    CREATE DATABASE [PaymentIntegrationDemo];
END;
GO
