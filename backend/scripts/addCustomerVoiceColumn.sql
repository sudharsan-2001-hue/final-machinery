-- Migration: Add CustomerVoiceUrl column to Complaints table
-- Run against SudharsanMachineryDB

USE SudharsanMachineryDB;
GO

-- Add CustomerVoiceUrl column if it doesn't exist
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Complaints') AND name = 'CustomerVoiceUrl')
BEGIN
    ALTER TABLE [Complaints] ADD [CustomerVoiceUrl] NVARCHAR(500) NULL;
    PRINT 'CustomerVoiceUrl column added successfully.';
END
ELSE
BEGIN
    PRINT 'CustomerVoiceUrl column already exists.';
END
GO

PRINT 'CustomerVoiceUrl column added successfully.';
GO
