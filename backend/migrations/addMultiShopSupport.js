const { sql, poolPromise } = require("../db");

async function runMigration() {
  try {
    const pool = await poolPromise;
    
    console.log("Starting multi-shop migration...");
    
    // 1. Create Shops Table
    console.log("Creating Shops table...");
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Shops')
      BEGIN
        CREATE TABLE [Shops] (
          [ShopID] INT IDENTITY(1,1) NOT NULL,
          [ShopName] NVARCHAR(100) NOT NULL,
          [ShopDescription] NVARCHAR(500) NULL,
          [ShopImage] NVARCHAR(MAX) NULL,
          [OwnerUserID] INT NULL,
          [Status] NVARCHAR(20) NOT NULL DEFAULT 'Active',
          [CreatedDate] DATETIME NOT NULL DEFAULT GETDATE(),
          [UpdatedDate] DATETIME NULL,
          CONSTRAINT [PK_Shops] PRIMARY KEY CLUSTERED ([ShopID] ASC),
          CONSTRAINT [FK_Shops_Users] FOREIGN KEY ([OwnerUserID]) 
            REFERENCES [Users] ([UserID]) ON DELETE SET NULL,
          CONSTRAINT [CK_Shops_Status] CHECK ([Status] IN ('Active', 'Inactive', 'Suspended'))
        )
      END
    `);
    console.log("Shops table created successfully.");
    
    // 2. Add shop_id column to MachineryProducts
    console.log("Adding ShopID column to MachineryProducts...");
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('MachineryProducts') AND name = 'ShopID')
      BEGIN
        ALTER TABLE [MachineryProducts] ADD [ShopID] INT NULL
      END
    `);
    console.log("ShopID column added to MachineryProducts.");
    
    // 3. Add foreign key constraint for shop_id in MachineryProducts
    console.log("Adding foreign key constraint for MachineryProducts.ShopID...");
    try {
      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_MachineryProducts_Shops')
        BEGIN
          ALTER TABLE [MachineryProducts]
          ADD CONSTRAINT [FK_MachineryProducts_Shops] 
          FOREIGN KEY ([ShopID]) REFERENCES [Shops] ([ShopID]) ON DELETE SET NULL
        END
      `);
      console.log("Foreign key constraint added for MachineryProducts.ShopID.");
    } catch (err) {
      console.log("Foreign key constraint may already exist or error:", err.message);
    }
    
    // 4. Add shop_id column to Orders
    console.log("Adding ShopID column to Orders...");
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'ShopID')
      BEGIN
        ALTER TABLE [Orders] ADD [ShopID] INT NULL
      END
    `);
    console.log("ShopID column added to Orders.");
    
    // 5. Add foreign key constraint for shop_id in Orders
    console.log("Adding foreign key constraint for Orders.ShopID...");
    try {
      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Orders_Shops')
        BEGIN
          ALTER TABLE [Orders]
          ADD CONSTRAINT [FK_Orders_Shops] 
          FOREIGN KEY ([ShopID]) REFERENCES [Shops] ([ShopID]) ON DELETE SET NULL
        END
      `);
      console.log("Foreign key constraint added for Orders.ShopID.");
    } catch (err) {
      console.log("Foreign key constraint may already exist or error:", err.message);
    }
    
    // 6. Update Users table to allow ShopAdmin role
    console.log("Updating Users table role constraint...");
    await pool.request().query(`
      IF EXISTS (SELECT * FROM sys.check_constraints WHERE parent_object_id = OBJECT_ID('Users') AND name = 'CK_Users_Role')
      BEGIN
        ALTER TABLE [Users] DROP CONSTRAINT CK_Users_Role
      END
    `);
    
    // Update existing Seller users to ShopAdmin
    console.log("Updating existing Seller users to ShopAdmin...");
    await pool.request().query(`
      UPDATE [Users] SET Role = 'ShopAdmin' WHERE Role = 'Seller'
    `);
    
    await pool.request().query(`
      ALTER TABLE [Users]
      ADD CONSTRAINT CK_Users_Role
      CHECK (Role IN ('Customer','ShopAdmin','Admin'))
    `);
    console.log("Users table role constraint updated.");
    
    // 7. Create index for shop_id in Products
    console.log("Creating index for MachineryProducts.ShopID...");
    try {
      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_MachineryProducts_ShopID' AND object_id = OBJECT_ID('MachineryProducts'))
        BEGIN
          CREATE NONCLUSTERED INDEX [IX_MachineryProducts_ShopID] 
          ON [MachineryProducts] ([ShopID] ASC)
        END
      `);
      console.log("Index created for MachineryProducts.ShopID.");
    } catch (err) {
      console.log("Index may already exist:", err.message);
    }
    
    // 8. Create index for shop_id in Orders
    console.log("Creating index for Orders.ShopID...");
    try {
      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Orders_ShopID' AND object_id = OBJECT_ID('Orders'))
        BEGIN
          CREATE NONCLUSTERED INDEX [IX_Orders_ShopID] 
          ON [Orders] ([ShopID] ASC)
        END
      `);
      console.log("Index created for Orders.ShopID.");
    } catch (err) {
      console.log("Index may already exist:", err.message);
    }
    
    // 9. Seed default shop
    console.log("Seeding default shop...");
    const shopCheck = await pool.request().query("SELECT COUNT(*) as count FROM Shops WHERE ShopID = 1");
    if (shopCheck.recordset[0].count === 0) {
      await pool.request().query(`
        INSERT INTO [Shops] ([ShopName], [ShopDescription], [ShopImage], [OwnerUserID], [Status])
        VALUES ('Sudharsan Cottage Machinery', 'Premium industrial machinery for cottage industries', 'shop1.jpg', NULL, 'Active')
      `);
      console.log("Default shop created with ShopID = 1");
    } else {
      console.log("Default shop already exists.");
    }
    
    // 10. Update existing products to belong to default shop
    console.log("Updating existing products to belong to default shop...");
    await pool.request().query(`
      UPDATE [MachineryProducts]
      SET [ShopID] = 1
      WHERE [ShopID] IS NULL
    `);
    console.log("Existing products updated to belong to default shop.");
    
    // 11. Update existing orders to belong to default shop
    console.log("Updating existing orders to belong to default shop...");
    await pool.request().query(`
      UPDATE [Orders]
      SET [ShopID] = 1
      WHERE [ShopID] IS NULL
    `);
    console.log("Existing orders updated to belong to default shop.");
    
    console.log("Multi-shop migration completed successfully!");
    console.log("Default shop created with ShopID = 1");
    console.log("Existing products and orders assigned to default shop");
    
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

runMigration();
