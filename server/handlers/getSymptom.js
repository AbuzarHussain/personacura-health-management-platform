const { getDB } = require("../utils/initiateDBConnection")

const analyzeSymptoms = async (req, res) => {
  try {
    const { symptoms } = req.body
    
    if (!symptoms) {
      return res.status(400).json({ message: "No symptoms provided" })
    }

    const symptomList = symptoms.split(",").map(s => s.trim()).filter(s => s.length > 0)

    if (symptomList.length === 0) {
      return res.status(400).json({ message: "Invalid symptom format" })
    }

    const db = getDB()

    const conditions = symptomList.map(() => "InputSymptoms LIKE ?").join(" OR ")
    const queryParams = symptomList.map(s => `%${s}%`) 

    const query = `
      SELECT 
        CheckID,
        InputSymptoms, 
        PredictedDiseases, 
        RecommendedDoctorSpecialization 
      FROM Symptom_Check 
      WHERE ${conditions}
    `

    const [rows] = await db.query(query, queryParams)

    if (rows.length === 0) {
      return res.json({ 
        ok: true, 
        data: [] 
      })
    }

    const scoredRows = rows.map(row => {
      let matchCount = 0
      const rowSymptoms = row.InputSymptoms.toLowerCase()
      
      symptomList.forEach(symptom => {
        if (rowSymptoms.includes(symptom.toLowerCase())) {
          matchCount++
        }
      })

      return { ...row, matchCount }
    })

    scoredRows.sort((a, b) => b.matchCount - a.matchCount)

    const total = scoredRows.length
    const oneThird = Math.ceil(total / 3)
    const twoThirds = oneThird * 2

    const finalResults = scoredRows.map((row, index) => {
      let prob = "Low"
      if (index < oneThird) prob = "High"
      else if (index < twoThirds) prob = "Medium"

      return {
        disease: row.PredictedDiseases,
        matchedSymptoms: row.InputSymptoms, 
        specialization: row.RecommendedDoctorSpecialization,
        probability: prob
      }
    })

    return res.json({ ok: true, data: finalResults })

  } catch (error) {
    console.error("Error analyzing symptoms:", error)
    return res.status(500).json({ message: "Error analyzing symptoms." })
  }
}


const fetchSymptomSuggestions = async (req, res) => {
  try {
    const db = getDB()
    // Get InputSymptoms values from Symptom_Check table
    const [rows] = await db.query(`SELECT InputSymptoms FROM Symptom_Check WHERE InputSymptoms IS NOT NULL AND InputSymptoms != ''`)

    const suggestionsSet = new Set()
    rows.forEach(r => {
      const val = r.InputSymptoms
      if (!val) return
      // Split by common separators and normalize
      const parts = val.split(/[,;\n]/).map(s => s.trim()).filter(s => s.length > 0)
      parts.forEach(p => suggestionsSet.add(p.toLowerCase()))
    })

    const suggestions = Array.from(suggestionsSet).sort()
    return res.json(suggestions)
  } catch (error) {
    console.error('Error fetching symptom suggestions:', error)
    return res.status(500).json({ message: 'Error fetching symptom suggestions' })
  }
}

module.exports = { analyzeSymptoms, fetchSymptomSuggestions }
