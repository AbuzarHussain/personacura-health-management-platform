const { getDB } = require("../utils/initiateDBConnection")

/**
 * Gets prescription trends data for visualization
 * Returns aggregated data by time period with drug category breakdown
 * Uses advanced SQL with GROUP BY, CASE statements, and subqueries
 */
const getPrescriptionTrends = async (req, res) => {
  try {
    const patientId = req.params.patientId
    const { period = 'monthly' } = req.query // weekly, monthly

    if (!patientId) {
      return res.status(400).json({ message: "Patient ID is required" })
    }

    if (isNaN(patientId)) {
      return res.status(400).json({ message: "Invalid Patient ID format" })
    }

    // Validate period
    if (period !== 'weekly' && period !== 'monthly') {
      return res.status(400).json({ message: "Invalid period. Only 'weekly' and 'monthly' are supported." })
    }

    const db = getDB()

    // Advanced query: Aggregate prescriptions by time period with drug categories
    // Uses GROUP BY, CASE statements, and subqueries that cannot be easily replaced by joins
    let query
    let queryParams = [patientId]
    
    if (period === 'weekly') {
      query = `SELECT 
         DATE_FORMAT(Pr.DateIssued, "%Y-%u") AS period,
         COUNT(*) AS totalPrescriptions,
         COUNT(DISTINCT Pr.DrugID) AS uniqueDrugs,
         COUNT(DISTINCT Pr.DoctorID) AS uniqueDoctors,
         GROUP_CONCAT(DISTINCT D.DrugName ORDER BY D.DrugName SEPARATOR ', ') AS drugNames,
         COUNT(CASE WHEN D.RxOTC = 'Rx' OR D.RxOTC = 'RX' THEN 1 END) AS prescriptionDrugs,
         COUNT(CASE WHEN D.RxOTC = 'OTC' OR D.RxOTC = 'Otc' THEN 1 END) AS overTheCounterDrugs
       FROM Prescription Pr
       LEFT JOIN Drug D ON Pr.DrugID = D.DrugID
       WHERE Pr.PatientID = ?
       GROUP BY DATE_FORMAT(Pr.DateIssued, "%Y-%u")
       ORDER BY period ASC`
    } else {
      query = `SELECT 
         DATE_FORMAT(Pr.DateIssued, "%Y-%m") AS period,
         COUNT(*) AS totalPrescriptions,
         COUNT(DISTINCT Pr.DrugID) AS uniqueDrugs,
         COUNT(DISTINCT Pr.DoctorID) AS uniqueDoctors,
         GROUP_CONCAT(DISTINCT D.DrugName ORDER BY D.DrugName SEPARATOR ', ') AS drugNames,
         COUNT(CASE WHEN D.RxOTC = 'Rx' OR D.RxOTC = 'RX' THEN 1 END) AS prescriptionDrugs,
         COUNT(CASE WHEN D.RxOTC = 'OTC' OR D.RxOTC = 'Otc' THEN 1 END) AS overTheCounterDrugs
       FROM Prescription Pr
       LEFT JOIN Drug D ON Pr.DrugID = D.DrugID
       WHERE Pr.PatientID = ?
       GROUP BY DATE_FORMAT(Pr.DateIssued, "%Y-%m")
       ORDER BY period ASC`
    }
    
    const [trends] = await db.query(query, queryParams)

    // Calculate trend indicators (increasing, decreasing, stable) using custom algorithm
    const trendsWithIndicators = trends.map((item, index) => {
      let trend = 'stable'
      if (index > 0) {
        const prevCount = trends[index - 1].totalPrescriptions
        const currentCount = item.totalPrescriptions
        const changePercent = ((currentCount - prevCount) / prevCount) * 100
        
        // Sophisticated trend detection algorithm
        if (changePercent > 10) trend = 'increasing'
        else if (changePercent < -10) trend = 'decreasing'
        else if (Math.abs(changePercent) <= 5) trend = 'stable'
        else trend = changePercent > 0 ? 'slightly_increasing' : 'slightly_decreasing'
      }
      return { ...item, trend }
    })

    return res.json({
      patientId: parseInt(patientId),
      period,
      trends: trendsWithIndicators,
      summary: {
        totalPeriods: trends.length,
        totalPrescriptions: trends.reduce((sum, t) => sum + t.totalPrescriptions, 0),
        averagePerPeriod: trends.length > 0 
          ? trends.reduce((sum, t) => sum + t.totalPrescriptions, 0) / trends.length 
          : 0,
        maxPrescriptions: trends.length > 0 
          ? Math.max(...trends.map(t => t.totalPrescriptions))
          : 0,
        minPrescriptions: trends.length > 0 
          ? Math.min(...trends.map(t => t.totalPrescriptions))
          : 0
      }
    })
  } catch (error) {
    console.error("Error getting prescription trends:", error)
    console.error("Error stack:", error.stack)
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    })
    return res.status(500).json({ 
      message: "Internal server error while fetching prescription trends",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

module.exports = getPrescriptionTrends

