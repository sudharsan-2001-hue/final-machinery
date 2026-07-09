require("dotenv").config();
const sql = require("mssql");
const serverEnv = process.env.DB_SERVER || "localhost";
sql.connect({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: serverEnv.split("\\")[0],
  database: process.env.DB_DATABASE,
  options: { encrypt: false, trustServerCertificate: true, instanceName: serverEnv.includes("\\") ? serverEnv.split("\\")[1] : undefined },
}).then(async (pool) => {
  const statuses = await pool.request().query("SELECT DISTINCT Status FROM MachineryProducts");
  console.log("Statuses:", statuses.recordset.map(r => r.Status));
  const check = await pool.request().query(`
    SELECT definition FROM sys.check_constraints
    WHERE parent_object_id = OBJECT_ID('MachineryProducts')
  `);
  check.recordset.forEach(r => console.log("Constraint:", r.definition));
  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
