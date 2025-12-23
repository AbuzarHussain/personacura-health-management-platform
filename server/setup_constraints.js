const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../project.env") });
const mysql = require("mysql2/promise");
const fs = require("fs");

async function setupConstraints() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
  });

  try {
    console.log("=== Setting up Database Constraints ===\n");

    const sqlFile = path.join(__dirname, 'sql', 'addConstraints.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    // Split by semicolon and filter out empty statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`Found ${statements.length} constraint statements to execute\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      // Skip comment-only lines
      if (statement.startsWith('--')) continue;
      
      try {
        console.log(`[${i + 1}/${statements.length}] Executing constraint...`);
        await connection.query(statement + ';');
        console.log(`   ✓ Constraint added successfully\n`);
      } catch (error) {
        if (error.code === 'ER_DUP_KEYNAME' || error.code === 'ER_DUP_CONSTRAINT_NAME') {
          console.log(`   ⚠ Constraint already exists (skipping)\n`);
        } else if (error.code === 'ER_CHECK_CONSTRAINT_VIOLATED') {
          console.error(`   ✗ Constraint violation: ${error.message}`);
          console.error(`   → Some existing data violates this constraint. Please fix the data first.\n`);
        } else {
          console.error(`   ✗ Error: ${error.message}`);
          console.error(`   Code: ${error.code}\n`);
        }
      }
    }

    // Verify constraints
    console.log("=== Verifying Constraints ===");
    
    // Check UNIQUE constraints
    try {
      const [uniqueConstraints] = await connection.query(`
        SELECT CONSTRAINT_NAME, TABLE_NAME, COLUMN_NAME
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = DATABASE()
          AND CONSTRAINT_NAME LIKE 'uk_%'
        ORDER BY TABLE_NAME, CONSTRAINT_NAME
      `);
      
      if (uniqueConstraints.length > 0) {
        console.log("\n✓ UNIQUE Constraints:");
        uniqueConstraints.forEach(constraint => {
          console.log(`   - ${constraint.CONSTRAINT_NAME} on ${constraint.TABLE_NAME}.${constraint.COLUMN_NAME}`);
        });
      } else {
        console.log("\n⚠ No UNIQUE constraints found");
      }
    } catch (error) {
      console.log("\n⚠ Could not verify UNIQUE constraints:", error.message);
    }

    // Check CHECK constraints (MySQL 8.0.16+)
    try {
      const [checkConstraints] = await connection.query(`
        SELECT CONSTRAINT_NAME, TABLE_NAME, CHECK_CLAUSE
        FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS
        WHERE CONSTRAINT_SCHEMA = DATABASE()
          AND CONSTRAINT_NAME LIKE 'chk_%'
        ORDER BY TABLE_NAME, CONSTRAINT_NAME
      `);
      
      if (checkConstraints.length > 0) {
        console.log("\n✓ CHECK Constraints:");
        checkConstraints.forEach(constraint => {
          console.log(`   - ${constraint.CONSTRAINT_NAME} on ${constraint.TABLE_NAME}`);
        });
      } else {
        console.log("\n⚠ No CHECK constraints found (may not be supported in your MySQL version)");
        console.log("   Note: CHECK constraints require MySQL 8.0.16 or later");
      }
    } catch (error) {
      if (error.code === 'ER_UNKNOWN_TABLE') {
        console.log("\n⚠ CHECK constraints not supported in your MySQL version");
        console.log("   MySQL 8.0.16+ is required for CHECK constraint enforcement");
      } else {
        console.log("\n⚠ Could not verify CHECK constraints:", error.message);
      }
    }

    console.log("\n=== Setup Complete ===");
    console.log("\nNote: If you're using MySQL < 8.0.16, CHECK constraints will be parsed but not enforced.");
    console.log("Consider upgrading to MySQL 8.0.16+ for full constraint support.");

  } catch (error) {
    console.error("Error setting up constraints:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run if called directly
if (require.main === module) {
  setupConstraints().catch(console.error);
}

module.exports = setupConstraints;


