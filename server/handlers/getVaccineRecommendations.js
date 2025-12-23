const { getDB } = require("../utils/initiateDBConnection")

/**
 * Calls the RecommendVaccines stored procedure to get vaccine recommendations
 * for a patient based on their age and gender.
 *
 * @route GET /api/patients/:patientId/vaccines/recommendations
 */
const getVaccineRecommendations = async (req, res) => {
  try {
    const patientId = req.params.patientId
    console.log(`[Vaccine Recommendations] Request received for patientId: ${patientId}`)

    if (!patientId) {
      return res.status(400).json({ message: "Patient ID is required in the URL." })
    }

    if (isNaN(patientId)) {
      return res.status(400).json({ message: "Invalid Patient ID format. Must be a number." })
    }

    const db = getDB()

    // Call the stored procedure
    // Note: The stored procedure returns 2 result sets:
    // results[0] = vaccine recommendations (main query)
    // results[1] = vaccine statistics (advanced query with aggregations)
    console.log(`[Vaccine Recommendations] Calling RecommendVaccines stored procedure for patientId: ${patientId}`)
    const [results] = await db.query("CALL RecommendVaccines(?)", [patientId])
    console.log(`[Vaccine Recommendations] Stored procedure returned ${results[0]?.length || 0} vaccine recommendations`)

    // The stored procedure returns vaccine recommendations in the first element of the array
    const vaccines = results[0] || []
    
    // Optional: Get statistics from second result set (for logging/debugging)
    const statistics = results[1] || []
    if (statistics.length > 0) {
      console.log(`[Vaccine Recommendations] Statistics:`, statistics)
    }

    // Separate mandatory and optional vaccines
    const mandatory = vaccines.filter(v => v.Type === 'Mandatory')
    const optional = vaccines.filter(v => v.Type === 'Optional')

    console.log(`[Vaccine Recommendations] Found ${mandatory.length} mandatory and ${optional.length} optional vaccines`)

    return res.json({
      patientId: parseInt(patientId),
      totalRecommendations: vaccines.length,
      mandatory: mandatory,
      optional: optional,
      allVaccines: vaccines
    })

  } catch (error) {
    console.error("[Vaccine Recommendations] Error getting vaccine recommendations:", error)

    // Check if patient doesn't exist
    if (error.message && error.message.includes("NULL")) {
      return res.status(404).json({
        message: "Patient not found. Please check the Patient ID."
      })
    }

    return res.status(500).json({
      message: "Internal server error while fetching vaccine recommendations.",
      error: error.message
    })
  }
}

module.exports = getVaccineRecommendations
