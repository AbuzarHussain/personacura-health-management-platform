const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../project.env") });
const mysql = require("mysql2/promise");
const fs = require("fs");

async function checkTrigger() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
  });

  try {
    console.log("=== Checking Trigger Setup ===\n");

    // Check if AppointmentAuditLog table exists
    console.log("1. Checking AppointmentAuditLog table...");
    try {
      const [tableCheck] = await connection.query(
        "SHOW TABLES LIKE 'AppointmentAuditLog'"
      );
      if (tableCheck.length > 0) {
        console.log("   ✓ AppointmentAuditLog table exists");
        
        // Check table structure
        const [columns] = await connection.query("DESCRIBE AppointmentAuditLog");
        console.log("   Table structure:");
        columns.forEach(col => {
          console.log(`     - ${col.Field} (${col.Type})`);
        });
      } else {
        console.log("   ✗ AppointmentAuditLog table does NOT exist");
        console.log("   → You need to run the SQL script to create it");
      }
    } catch (error) {
      console.log("   ✗ Error checking table:", error.message);
    }

    // Check if trigger exists
    console.log("\n2. Checking trigger...");
    try {
      const [triggers] = await connection.query(
        "SHOW TRIGGERS WHERE `Trigger` = 'log_appointment_completion'"
      );
      if (triggers.length > 0) {
        console.log("   ✓ Trigger 'log_appointment_completion' exists");
        triggers.forEach(trigger => {
          console.log(`     Event: ${trigger.Event}`);
          console.log(`     Timing: ${trigger.Timing}`);
          console.log(`     Table: ${trigger.Table}`);
        });
      } else {
        console.log("   ✗ Trigger 'log_appointment_completion' does NOT exist");
        console.log("   → You need to run the SQL script to create it");
      }
    } catch (error) {
      console.log("   ✗ Error checking trigger:", error.message);
    }

    // Check for existing audit logs
    console.log("\n3. Checking existing audit logs...");
    try {
      const [logs] = await connection.query(
        "SELECT COUNT(*) as count FROM AppointmentAuditLog"
      );
      console.log(`   Found ${logs[0].count} audit log entries`);
      
      if (logs[0].count > 0) {
        const [recentLogs] = await connection.query(
          "SELECT * FROM AppointmentAuditLog ORDER BY ChangedAt DESC LIMIT 3"
        );
        console.log("   Recent logs:");
        recentLogs.forEach(log => {
          console.log(`     - LogID: ${log.LogID}, AppointmentID: ${log.AppointmentID}, ChangedAt: ${log.ChangedAt}`);
        });
      }
    } catch (error) {
      if (error.code === 'ER_NO_SUCH_TABLE') {
        console.log("   ✗ AppointmentAuditLog table does not exist");
      } else {
        console.log("   ✗ Error:", error.message);
      }
    }

    // Instructions
    console.log("\n=== Setup Instructions ===");
    console.log("If the trigger or table doesn't exist, run:");
    console.log("  mysql -u [username] -p [database] < server/sql/createAppointmentAuditTrigger.sql");
    console.log("\nOr manually execute the SQL file in your MySQL client.");

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await connection.end();
  }
}

checkTrigger().catch(console.error);


