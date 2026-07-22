-- Migration: Add missing columns to Complaints table
-- Run against SudharsanMachineryDB

USE SudharsanMachineryDB;
GO

-- Add ReplyDate column if it doesn't exist
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Complaints') AND name = 'ReplyDate')
BEGIN
    ALTER TABLE [Complaints] ADD [ReplyDate] DATETIME NULL;
    PRINT 'ReplyDate column added successfully.';
END
ELSE
BEGIN
    PRINT 'ReplyDate column already exists.';
END
GO

-- Add AdminReply column if it doesn't exist
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Complaints') AND name = 'AdminReply')
BEGIN
    ALTER TABLE [Complaints] ADD [AdminReply] NVARCHAR(MAX) NULL;
    PRINT 'AdminReply column added successfully.';
END
ELSE
BEGIN
    PRINT 'AdminReply column already exists.';
END
GO

-- Add VoiceReplyUrl column if it doesn't exist
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Complaints') AND name = 'VoiceReplyUrl')
BEGIN
    ALTER TABLE [Complaints] ADD [VoiceReplyUrl] NVARCHAR(500) NULL;
    PRINT 'VoiceReplyUrl column added successfully.';
END
ELSE
BEGIN
    PRINT 'VoiceReplyUrl column already exists.';
END
GO

PRINT 'Missing columns added successfully.';
GO
