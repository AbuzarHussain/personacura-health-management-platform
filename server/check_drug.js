const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../project.env") });
const mysql = require("mysql2/promise");

async function checkDrug() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
  });

  // Check if DR012 exists in Drug table
  const [rows] = await connection.query(
    "SELECT * FROM Drug WHERE DrugID = ?",
    ["DR012"]
  );
  
  console.log("Drug DR012:", JSON.stringify(rows, null, 2));
  
  // Check Drug table structure
  const [columns] = await connection.query(
    "DESCRIBE Drug"
  );
  
  console.log("\nDrug table structure:", JSON.stringify(columns, null, 2));
  
  // Check Prescription table structure
  const [prescColumns] = await connection.query(
    "DESCRIBE Prescription"
  );
  
  console.log("\nPrescription table structure:", JSON.stringify(prescColumns, null, 2));

  await connection.end();
}

checkDrug().catch(console.error);
