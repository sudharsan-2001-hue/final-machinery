-- Migration: Recreate Complaints table with new structure
-- Run against SudharsanMachineryDB

USE SudharsanMachineryDB;
GO

-- Drop existing Complaints table if it exists
IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Complaints')
BEGIN
    DROP TABLE [Complaints];
    PRINT 'Existing Complaints table dropped.';
END
GO

-- Create Complaints table with new structure
CREATE TABLE [Complaints] (
    [ComplaintID] INT IDENTITY(1,1) PRIMARY KEY,
    [CustomerID] INT NULL,
    [CustomerName] NVARCHAR(100),
    [Mobile] NVARCHAR(20),
    [OrderID] NVARCHAR(50),
    [ComplaintType] NVARCHAR(100),
    [Subject] NVARCHAR(200),
    [Description] NVARCHAR(MAX),
    [ImageUrl] NVARCHAR(500),
    [Status] NVARCHAR(50) DEFAULT 'Pending',
    [CreatedDate] DATETIME DEFAULT GETDATE(),
    [AdminReply] NVARCHAR(MAX) NULL,
    [VoiceReplyUrl] NVARCHAR(500) NULL,
    [ReplyDate] DATETIME NULL
);
GO

CREATE INDEX [IX_Complaints_CustomerID] ON [Complaints]([CustomerID]);
CREATE INDEX [IX_Complaints_Status] ON [Complaints]([Status]);
CREATE INDEX [IX_Complaints_CreatedDate] ON [Complaints]([CreatedDate] DESC);
GO

PRINT 'Complaints table created with new structure successfully.';
GO
