-- Migration: Add Razorpay columns and unique phone constraint
-- Run against SudharsanMachineryDB

USE SudharsanMachineryDB;
GO

-- Unique phone number for login
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UQ_Users_PhoneNumber')
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX [UQ_Users_PhoneNumber]
    ON [Users] ([PhoneNumber])
    WHERE [PhoneNumber] IS NOT NULL;
END
GO

-- Razorpay payment fields
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Payments') AND name = 'RazorpayOrderID')
    ALTER TABLE [Payments] ADD [RazorpayOrderID] NVARCHAR(100) NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Payments') AND name = 'RazorpayPaymentID')
    ALTER TABLE [Payments] ADD [RazorpayPaymentID] NVARCHAR(100) NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Payments') AND name = 'RazorpaySignature')
    ALTER TABLE [Payments] ADD [RazorpaySignature] NVARCHAR(255) NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Payments') AND name = 'Currency')
    ALTER TABLE [Payments] ADD [Currency] NVARCHAR(10) NULL DEFAULT 'INR';
GO

PRINT 'Migration completed successfully.';
GO
