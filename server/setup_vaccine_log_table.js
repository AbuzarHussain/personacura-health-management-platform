const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../project.env') });

async function setupVaccineLogTable() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'personacura'
    });

    console.log('Connected to database');

    // Read SQL file
    const sqlFile = path.join(__dirname, 'sql', 'createVaccineCheckLogTable.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    // Execute SQL
    await connection.query(sql);
    console.log('✅ VaccineCheckLog table created successfully!');

  } catch (error) {
    console.error('❌ Error setting up VaccineCheckLog table:', error.message);
    if (error.code === 'ER_TABLE_EXISTS_ERROR') {
      console.log('Table already exists. Skipping...');
    } else {
      throw error;
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupVaccineLogTable()
  .then(() => {
    console.log('Setup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Setup failed:', error);
    process.exit(1);
  });


