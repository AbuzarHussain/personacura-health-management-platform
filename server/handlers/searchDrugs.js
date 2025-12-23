const { getDB } = require("../utils/initiateDBConnection")


const fetchDrugSuggestions = async (req, res) => {
  try {
    const text = req.query.text || ""
    const db = getDB()
    const wildcard = `%${text}%`

    const [rows] = await db.query(
      `SELECT DISTINCT DrugName AS result 
       FROM Drug 
       WHERE DrugName LIKE ? 
       LIMIT 10`, 
      [wildcard]
    )

    return res.json(rows.map((row) => row.result))

  } catch (error) {
    console.error("Error fetching drug suggestions:", error)
    return res.status(500).json({ message: "Error fetching drug suggestions." })
  }
}


const fetchDrugDetails = async (req, res) => {
  try {
    const selection = req.query.selection
    const db = getDB()

    const [rows] = await db.query(
      `SELECT
          DrugID,
          DrugName,
          MedicalCondition,
          SideEffects,
          GenericName,
          DrugClasses,
          RxOTC,
          PregnancyCategory
       FROM Drug
       WHERE DrugName = ?`,
      [selection]
    )

    return res.json(rows)

  } catch (error) {
    console.error("Error fetching drug details:", error)
    return res.status(500).json({ message: "Error fetching drug details." })
  }
}

module.exports = { fetchDrugSuggestions, fetchDrugDetails }
