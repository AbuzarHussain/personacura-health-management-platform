const { getDB } = require("../utils/initiateDBConnection")

/**
 * Gets vaccine check history for a patient or all checks
 * 
 * @route GET /api/vaccines/check-history?patientId=123 (optional)
 */
const getVaccineCheckHistory = async (req, res) => {
  try {
    const patientId = req.query.patientId
    const db = getDB()

    let query = `
      SELECT 
        LogID,
        PatientID,
        Age,
        Gender,
        ReceivedVaccines,
        MandatoryVaccines,
        OptionalVaccines,
        CheckedAt
      FROM VaccineCheckLog
    `
    const params = []

    if (patientId && !isNaN(patientId)) {
      query += ` WHERE PatientID = ?`
      params.push(parseInt(patientId))
    }

    query += ` ORDER BY CheckedAt DESC LIMIT 50`

    const [logs] = await db.query(query, params)

    // Parse JSON fields
    const parsedLogs = logs.map(log => ({
      logId: log.LogID,
      patientId: log.PatientID,
      age: log.Age,
      gender: log.Gender,
      receivedVaccines: typeof log.ReceivedVaccines === 'string' 
        ? JSON.parse(log.ReceivedVaccines) 
        : log.ReceivedVaccines,
      mandatoryVaccines: typeof log.MandatoryVaccines === 'string'
        ? JSON.parse(log.MandatoryVaccines)
        : log.MandatoryVaccines,
      optionalVaccines: typeof log.OptionalVaccines === 'string'
        ? JSON.parse(log.OptionalVaccines)
        : log.OptionalVaccines,
      checkedAt: log.CheckedAt
    }))

    return res.json({
      logs: parsedLogs,
      totalLogs: parsedLogs.length
    })

  } catch (error) {
    console.error("[Vaccine Check History] Error fetching history:", error)
    
    // If table doesn't exist, return empty array
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return res.json({ logs: [], totalLogs: 0 })
    }

    return res.status(500).json({
      message: "Internal server error while fetching vaccine check history.",
      error: error.message
    })
  }
}

module.exports = getVaccineCheckHistory


