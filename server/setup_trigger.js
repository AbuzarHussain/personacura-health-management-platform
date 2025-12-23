const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../project.env") });
const mysql = require("mysql2/promise");
const fs = require("fs");

async function setupTrigger() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
  });

  try {
    console.log("=== Setting up Appointment Audit Trigger ===\n");

    // Step 1: Create the table
    console.log("1. Creating AppointmentAuditLog table...");
    try {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS AppointmentAuditLog (
          LogID INT AUTO_INCREMENT PRIMARY KEY,
          AppointmentID INT NOT NULL,
          DoctorID INT NOT NULL,
          PatientID INT NOT NULL,
          OldStatus VARCHAR(20),
          NewStatus VARCHAR(20) NOT NULL,
          ChangedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          Notes VARCHAR(255),
          FOREIGN KEY (AppointmentID) REFERENCES Appointments(AppointmentID) ON DELETE CASCADE,
          FOREIGN KEY (DoctorID) REFERENCES Doctors(DoctorID) ON DELETE CASCADE,
          FOREIGN KEY (PatientID) REFERENCES Patient(PatientID) ON DELETE CASCADE
        )
      `);
      console.log("   ✓ Table created (or already exists)\n");
    } catch (error) {
      if (error.code === 'ER_TABLE_EXISTS_ERROR') {
        console.log("   ✓ Table already exists\n");
      } else {
        console.error("   ✗ Error creating table:", error.message);
        throw error;
      }
    }

    // Step 2: Drop existing trigger if it exists
    console.log("2. Dropping existing trigger (if any)...");
    try {
      await connection.query("DROP TRIGGER IF EXISTS log_appointment_completion");
      console.log("   ✓ Old trigger dropped (if it existed)\n");
    } catch (error) {
      console.log("   (No existing trigger to drop)\n");
    }

    // Step 3: Create the trigger
    console.log("3. Creating trigger...");
    try {
      // We need to execute this as a single statement with DELIMITER handling
      // MySQL2 doesn't support DELIMITER, so we'll execute the trigger creation directly
      await connection.query(`
        CREATE TRIGGER log_appointment_completion
        AFTER UPDATE ON Appointments
        FOR EACH ROW
        BEGIN
          IF NEW.Status = 'Completed' AND (OLD.Status IS NULL OR OLD.Status != 'Completed') THEN
            INSERT INTO AppointmentAuditLog (
              AppointmentID,
              DoctorID,
              PatientID,
              OldStatus,
              NewStatus,
              ChangedAt,
              Notes
            ) VALUES (
              NEW.AppointmentID,
              NEW.DoctorID,
              NEW.PatientID,
              OLD.Status,
              NEW.Status,
              NOW(),
              CONCAT('Appointment completed on ', NEW.Date, ' at ', NEW.Time, '. Reason: ', COALESCE(NEW.Reason, 'N/A'))
            );
          END IF;
        END
      `);
      console.log("   ✓ Trigger created successfully\n");
    } catch (error) {
      if (error.code === 'ER_TRG_ALREADY_EXISTS') {
        console.log("   ✓ Trigger already exists\n");
      } else {
        console.error("   ✗ Error creating trigger:", error.message);
        console.error("   Full error:", error);
        throw error;
      }
    }

    // Verify setup
    console.log("=== Verifying Setup ===");
    
    // Check table
    const [tables] = await connection.query("SHOW TABLES LIKE 'AppointmentAuditLog'");
    if (tables.length > 0) {
      console.log("✓ AppointmentAuditLog table exists");
    } else {
      console.log("✗ AppointmentAuditLog table not found");
    }

    // Check trigger
    const [triggers] = await connection.query(
      "SHOW TRIGGERS WHERE `Trigger` = 'log_appointment_completion'"
    );
    if (triggers.length > 0) {
      console.log("✓ Trigger 'log_appointment_completion' exists");
      console.log(`  Event: ${triggers[0].Event}, Timing: ${triggers[0].Timing}, Table: ${triggers[0].Table}`);
    } else {
      console.log("✗ Trigger not found");
    }

    console.log("\n=== Setup Complete ===");
    console.log("The trigger will now automatically log when appointments are marked as 'Completed'.");
    console.log("You can view the logs at: /doctor/audit-logs");
    console.log("\nTry marking an appointment as completed to test the trigger!");

  } catch (error) {
    console.error("\n✗ Error setting up trigger:", error.message);
    console.error("\nYou may need to run the SQL file manually in your MySQL client.");
    console.error("File location: server/sql/createAppointmentAuditTrigger.sql");
    process.exit(1);
  } finally {
    await connection.end();
  }
}

setupTrigger().catch(console.error);
