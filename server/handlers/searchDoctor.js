const { getDB } = require("../utils/initiateDBConnection")

const fetchSuggestions = async (req, res) => {
  try {
    const text = req.query.text || ""
    const db = getDB()
    const wildcard = `%${text}%`

    const [rows] = await db.query(
      `SELECT DISTINCT Specialization AS result FROM Doctors WHERE Specialization LIKE ?
       UNION
       SELECT DISTINCT CONCAT(FirstName, ' ', LastName) AS result FROM Doctors WHERE CONCAT(FirstName, ' ', LastName) LIKE ?`,
      [wildcard, wildcard]
    )

    return res.json(rows.map((row) => row.result))

  } catch (error) {
    console.error("Error fetching suggestions:", error)
    return res.status(500).json({ message: "Error fetching suggestions." })
  }
}


const fetchDoctors = async (req, res) => {
  try {
    const selection = req.query.selection
    const db = getDB()

    // Use LIKE for case-insensitive partial matching
    const searchPattern = `%${selection}%`

    const [rows] = await db.query(
      `SELECT 
         DoctorID, 
         FirstName, 
         LastName, 
         Email,
         Phone,
         Specialization, 
         Rating,
         Availability
       FROM Doctors 
       WHERE Specialization LIKE ? OR CONCAT(FirstName, ' ', LastName) LIKE ?`,
      [searchPattern, searchPattern]
    )

    const doctors = rows.map((row) => ({
      id: row.DoctorID,
      name: `${row.FirstName} ${row.LastName}`,
      email: row.Email,
      phone: row.Phone,
      specialization: row.Specialization,
      rating: row.Rating,
      availability: row.Availability,
    }))

    return res.json(doctors)

  } catch (error) {
    console.error("Error fetching doctors:", error)
    return res.status(500).json({ message: "Error fetching doctors." })
  }
}

module.exports = { fetchSuggestions, fetchDoctors }
