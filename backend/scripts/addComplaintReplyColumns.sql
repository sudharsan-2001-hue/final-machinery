-- Migration: Add AdminReply, VoiceReplyUrl, ReplyDate columns to Complaints table
-- Run against SudharsanMachineryDB

USE SudharsanMachineryDB;
GO

-- Add AdminReply column if it doesn't exist
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Complaints') AND name = 'AdminReply')
BEGIN
    ALTER TABLE [Complaints] ADD [AdminReply] NVARCHAR(MAX) NULL;
END
GO

-- Add VoiceReplyUrl column if it doesn't exist
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Complaints') AND name = 'VoiceReplyUrl')
BEGIN
    ALTER TABLE [Complaints] ADD [VoiceReplyUrl] NVARCHAR(500) NULL;
END
GO

-- Add ReplyDate column if it doesn't exist
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Complaints') AND name = 'ReplyDate')
BEGIN
    ALTER TABLE [Complaints] ADD [ReplyDate] DATETIME NULL;
END
GO

PRINT 'Complaints table updated successfully with AdminReply, VoiceReplyUrl, and ReplyDate columns.';
GO
