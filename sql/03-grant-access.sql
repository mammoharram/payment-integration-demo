USE [PaymentIntegrationDemo];
GO

-- Replace the value below with the Windows user or SQL login you want to grant access to.
-- Example: [DOMAIN\YourUserName]
-- Example SQL login: [payment_app_user]

DECLARE @PrincipalName NVARCHAR(128) = N'YOUR_WINDOWS_USER_OR_SQL_LOGIN';

IF NOT EXISTS (
    SELECT 1
    FROM sys.database_principals
    WHERE name = @PrincipalName
)
BEGIN
    CREATE USER [YOUR_WINDOWS_USER_OR_SQL_LOGIN] FOR LOGIN [YOUR_WINDOWS_USER_OR_SQL_LOGIN];
END;
GO

ALTER ROLE db_datareader ADD MEMBER [YOUR_WINDOWS_USER_OR_SQL_LOGIN];
ALTER ROLE db_datawriter ADD MEMBER [YOUR_WINDOWS_USER_OR_SQL_LOGIN];
GO

-- Optional: allow the user to create objects in the database during local experimentation.
-- ALTER ROLE db_ddladmin ADD MEMBER [YOUR_WINDOWS_USER_OR_SQL_LOGIN];
-- GO
