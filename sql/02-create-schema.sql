USE [PaymentIntegrationDemo];
GO

IF OBJECT_ID(N'dbo.Payments', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Payments (
        PaymentId       NVARCHAR(100) NOT NULL PRIMARY KEY,
        Amount          DECIMAL(18, 2) NOT NULL,
        Currency        CHAR(3) NOT NULL,
        Status          NVARCHAR(30) NOT NULL,
        CreatedAt       DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END;
GO

IF OBJECT_ID(N'dbo.ProcessedEvents', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ProcessedEvents (
        EventId NVARCHAR(100) NOT NULL PRIMARY KEY,
        PaymentId NVARCHAR(100) NOT NULL,
        ProcessedAt     DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        Status NVARCHAR(30) NOT NULL,
        CONSTRAINT FK_ProcessedEvents_Payments
            FOREIGN KEY (PaymentId) REFERENCES dbo.Payments(PaymentId)
    );
END;
GO
