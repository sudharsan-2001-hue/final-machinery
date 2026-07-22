-- Combined Migration: Create Complaints table and add reply columns
-- Run against SudharsanMachineryDB

USE SudharsanMachineryDB;
GO

-- Create Complaints table if it doesn't exist
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Complaints')
BEGIN
    CREATE TABLE [Complaints] (
        [ComplaintID] INT IDENTITY(1,1) PRIMARY KEY,
        [UserID] INT NOT NULL,
        [Subject] NVARCHAR(200) NOT NULL,
        [Description] NVARCHAR(MAX) NOT NULL,
        [OrderID] NVARCHAR(50) NULL,
        [Status] NVARCHAR(50) NOT NULL DEFAULT 'Pending',
        [CreatedDate] DATETIME NOT NULL DEFAULT GETDATE(),
        [UpdatedDate] DATETIME NULL,
        [AdminResponse] NVARCHAR(MAX) NULL,
        CONSTRAINT [FK_Complaints_Users] FOREIGN KEY ([UserID]) REFERENCES [Users]([UserID])
    );
    
    CREATE INDEX [IX_Complaints_UserID] ON [Complaints]([UserID]);
    CREATE INDEX [IX_Complaints_Status] ON [Complaints]([Status]);
    CREATE INDEX [IX_Complaints_CreatedDate] ON [Complaints]([CreatedDate] DESC);
    
    PRINT 'Complaints table created successfully.';
END
ELSE
BEGIN
    PRINT 'Complaints table already exists.';
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

PRINT 'Complaints table setup completed successfully.';
GO
