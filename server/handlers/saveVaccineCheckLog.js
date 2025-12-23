const { getDB } = require("../utils/initiateDBConnection")

/**
 * Saves vaccine check results to the log table
 * 
 * @route POST /api/vaccines/save-check
 */
const saveVaccineCheckLog = async (req, res) => {
  try {
    const { patientId, age, gender, receivedVaccines, mandatoryVaccines, optionalVaccines } = req.body

    if (!age || !gender) {
      return res.status(400).json({ message: "Age and gender are required" })
    }

    if (isNaN(age) || age < 0 || age > 150) {
      return res.status(400).json({ message: "Valid age is required (0-150)" })
    }

    if (!['Male', 'Female', 'Other'].includes(gender)) {
      return res.status(400).json({ message: "Valid gender is required" })
    }

    const db = getDB()

    // First, check if table exists, if not create it
    try {
      await db.query(`SELECT 1 FROM VaccineCheckLog LIMIT 1`)
    } catch (tableError) {
      if (tableError.code === 'ER_NO_SUCH_TABLE') {
        // Table doesn't exist, create it
        console.log('[Vaccine Check Log] Creating VaccineCheckLog table...')
        try {
          // Try with JSON type first (MySQL 5.7.8+)
          await db.query(`
            CREATE TABLE IF NOT EXISTS VaccineCheckLog (
              LogID INT AUTO_INCREMENT PRIMARY KEY,
              PatientID INT NULL,
              Age INT NOT NULL,
              Gender VARCHAR(10) NOT NULL,
              ReceivedVaccines JSON,
              MandatoryVaccines JSON,
              OptionalVaccines JSON,
              CheckedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `)
        } catch (jsonError) {
          // If JSON type not supported, use TEXT instead
          console.log('[Vaccine Check Log] JSON type not supported, using TEXT instead...')
          await db.query(`
            CREATE TABLE IF NOT EXISTS VaccineCheckLog (
              LogID INT AUTO_INCREMENT PRIMARY KEY,
              PatientID INT NULL,
              Age INT NOT NULL,
              Gender VARCHAR(10) NOT NULL,
              ReceivedVaccines TEXT,
              MandatoryVaccines TEXT,
              OptionalVaccines TEXT,
              CheckedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `)
        }
        console.log('[Vaccine Check Log] Table created successfully')
      } else {
        throw tableError
      }
    }

    // Convert arrays to JSON strings for storage
    const receivedVaccinesJSON = JSON.stringify(receivedVaccines || [])
    const mandatoryVaccinesJSON = JSON.stringify(mandatoryVaccines || [])
    const optionalVaccinesJSON = JSON.stringify(optionalVaccines || [])

    const [result] = await db.query(
      `INSERT INTO VaccineCheckLog 
       (PatientID, Age, Gender, ReceivedVaccines, MandatoryVaccines, OptionalVaccines) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        patientId || null,
        parseInt(age),
        gender,
        receivedVaccinesJSON,
        mandatoryVaccinesJSON,
        optionalVaccinesJSON
      ]
    )

    console.log(`[Vaccine Check Log] Saved log ID: ${result.insertId} for age: ${age}, gender: ${gender}`)

    return res.json({
      message: "Vaccine check log saved successfully",
      logId: result.insertId
    })

  } catch (error) {
    console.error("[Vaccine Check Log] Error saving log:", error)
    return res.status(500).json({
      message: "Internal server error while saving vaccine check log.",
      error: error.message
    })
  }
}

module.exports = saveVaccineCheckLog

