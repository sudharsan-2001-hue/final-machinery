# PowerShell Script to export SQL Server tables to JSON
$instance = "localhost\SQLEXPRESS"
$db = "SudharsanMachineryDB"
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Definition
$outDir = Join-Path $scriptPath "temp_data"

if (!(Test-Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir | Out-Null
    Write-Output "Created directory: $outDir"
}

$tables = @(
    "Users", "MachineryCategories", "MachineryProducts", "CustomerAddresses",
    "Orders", "OrderItems", "Payments", "Complaints", "CustomerMessages",
    "StockHistory", "Shops"
)

$connString = "Server=$instance;Database=$db;Integrated Security=True;TrustServerCertificate=True"
Write-Output "Connecting to SQL Server: $instance ($db)..."

try {
    $conn = New-Object System.Data.SqlClient.SqlConnection($connString)
    $conn.Open()
    Write-Output "Connected successfully!"

    foreach ($table in $tables) {
        Write-Output "Exporting table: $table..."
        $cmd = $conn.CreateCommand()
        $cmd.CommandText = "SELECT * FROM [$table]"
        
        $adapter = New-Object System.Data.SqlClient.SqlDataAdapter($cmd)
        $dt = New-Object System.Data.DataTable
        $adapter.Fill($dt) | Out-Null
        
        # Convert DataTable to array of custom objects to handle nulls properly
        $rows = @()
        foreach ($row in $dt.Rows) {
            $obj = New-Object PSObject
            foreach ($col in $dt.Columns) {
                $val = $row[$col.ColumnName]
                if ($val -eq [DBNull]::Value) {
                    $val = $null
                } elseif ($val -is [DateTime]) {
                    # Format dates cleanly
                    $val = $val.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
                }
                $obj | Add-Member -MemberType NoteProperty -Name $col.ColumnName -Value $val
            }
            $rows += $obj
        }
        
        $jsonPath = Join-Path $outDir "$table.json"
        $rows | ConvertTo-Json -Depth 5 | Out-File -FilePath $jsonPath -Encoding utf8
        Write-Output "Saved to $jsonPath (Rows: $($rows.Count))"
    }

    $conn.Close()
    Write-Output "Data export finished successfully!"
} catch {
    Write-Error "Database operation failed: $($_.Exception.Message)"
    exit 1
}
