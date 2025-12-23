const { getDB } = require("../utils/initiateDBConnection")

/**
 * Gets vaccine recommendations based on age and gender (not patient ID)
 * 
 * @route GET /api/vaccines/recommendations?age=25&gender=Male
 */
const getVaccinesByAgeGender = async (req, res) => {
  try {
    const age = parseInt(req.query.age)
    const gender = req.query.gender

    if (!age || isNaN(age) || age < 0 || age > 150) {
      return res.status(400).json({ message: "Valid age is required (0-150)" })
    }

    if (!gender || !['Male', 'Female', 'Other'].includes(gender)) {
      return res.status(400).json({ message: "Valid gender is required (Male, Female, or Other)" })
    }

    const db = getDB()

    // Query vaccines directly based on age and gender
    const [vaccines] = await db.query(
      `SELECT
        v.VaccineID,
        v.VaccineName,
        v.Type,
        v.RecommendedGender,
        v.MinAge,
        v.MaxAge,
        v.NumberOfDosages,
        v.IntervalBetweenDosesMonths,
        ? AS PatientAge,
        ? AS PatientGender,
        CASE
          WHEN v.Type = 'Mandatory' THEN 1
          ELSE 0
        END AS IsMandatory
      FROM Vaccination v
      WHERE
        v.RecommendedGender = ?
        AND ? >= v.MinAge
        AND ? <= v.MaxAge
      ORDER BY
        IsMandatory DESC,
        v.VaccineName ASC`,
      [age, gender, gender, age, age]
    )

    // Separate mandatory and optional vaccines
    const mandatory = vaccines.filter(v => v.Type === 'Mandatory')
    const optional = vaccines.filter(v => v.Type === 'Optional')

    return res.json({
      age: age,
      gender: gender,
      totalRecommendations: vaccines.length,
      mandatory: mandatory,
      optional: optional,
      allVaccines: vaccines
    })

  } catch (error) {
    console.error("[Vaccine Recommendations] Error getting vaccine recommendations:", error)
    return res.status(500).json({
      message: "Internal server error while fetching vaccine recommendations.",
      error: error.message
    })
  }
}

module.exports = getVaccinesByAgeGender


