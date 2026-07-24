-- Migration: Create messaging tables for customer-admin communication
-- Run against SudharsanMachineryDB

USE SudharsanMachineryDB;
GO

-- Create Conversations table
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Conversations')
BEGIN
    CREATE TABLE [Conversations] (
        [ConversationID] INT IDENTITY(1,1) PRIMARY KEY,
        [CustomerID] INT NOT NULL,
        [AdminID] INT NULL,
        [Subject] NVARCHAR(200) NOT NULL,
        [Status] NVARCHAR(50) DEFAULT 'Open',
        [CreatedDate] DATETIME DEFAULT GETDATE(),
        [LastMessageDate] DATETIME DEFAULT GETDATE(),
        CONSTRAINT [FK_Conversations_Customers] FOREIGN KEY ([CustomerID]) REFERENCES [Users]([UserID])
    );
    
    CREATE INDEX [IX_Conversations_CustomerID] ON [Conversations]([CustomerID]);
    CREATE INDEX [IX_Conversations_Status] ON [Conversations]([Status]);
    PRINT 'Conversations table created successfully.';
END
ELSE
BEGIN
    PRINT 'Conversations table already exists.';
END
GO

-- Create Messages table
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Messages')
BEGIN
    CREATE TABLE [Messages] (
        [MessageID] INT IDENTITY(1,1) PRIMARY KEY,
        [ConversationID] INT NOT NULL,
        [SenderID] INT NOT NULL,
        [SenderType] NVARCHAR(20) NOT NULL, -- 'customer' or 'admin'
        [MessageText] NVARCHAR(MAX) NOT NULL,
        [VoiceUrl] NVARCHAR(500) NULL,
        [IsRead] BIT DEFAULT 0,
        [CreatedDate] DATETIME DEFAULT GETDATE(),
        CONSTRAINT [FK_Messages_Conversations] FOREIGN KEY ([ConversationID]) REFERENCES [Conversations]([ConversationID])
    );
    
    CREATE INDEX [IX_Messages_ConversationID] ON [Messages]([ConversationID]);
    CREATE INDEX [IX_Messages_CreatedDate] ON [Messages]([CreatedDate] DESC);
    PRINT 'Messages table created successfully.';
END
ELSE
BEGIN
    PRINT 'Messages table already exists.';
END
GO

PRINT 'Messaging tables created successfully.';
GO
