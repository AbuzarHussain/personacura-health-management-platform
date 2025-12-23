const { getDB } = require("../utils/initiateDBConnection")

const createPatient = async (req, res) => {
    try {
        const {
            FirstName,
            LastName,
            UserName,
            Age,
            Gender,
            Password,
            Email,
            Phone
        } = req.body || {}

        if (!FirstName || !LastName || !UserName || !Age || !Gender || !Password || !Email || !Phone) {
            return res.status(400).json({ message: "Missing required fields" })
        }

        const db = getDB()

        const [idRows] = await db.query("SELECT COALESCE(MAX(PatientID), 0) + 1 AS nextId FROM Patient")
        const nextId = idRows[0]?.nextId
        if (!nextId) {
            return res.status(500).json({ message: "Failed to determine next PatientID" })
        }

        const insertSql = `
            INSERT INTO Patient
                (PatientID, FirstName, LastName, UserName, Age, Gender, Password, Email, Phone)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
        const params = [nextId, FirstName, LastName, UserName, Age, Gender, Password, Email, Phone]
        await db.query(insertSql, params)

        return res.status(201).json({ message: "Patient created", PatientID: nextId })
    } catch (error) {
        if (error && error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: "UserName, Email, or Phone already exists" })
        }
        console.error("Error creating patient:", error)
        return res.status(500).json({ message: "Internal server error" })
    }
}

module.exports = createPatient


