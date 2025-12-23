const { getDB } = require("../utils/initiateDBConnection")

const createDoctor = async (req, res) => {
    try {
        const {
            FirstName,
            LastName,
            UserName,
            Email,
            Phone,
            Specialization,
            Password,
            Availability,
        } = req.body || {}

        if (!FirstName || !LastName || !UserName || !Email || !Password) {
            return res.status(400).json({ message: "Missing required fields" })
        }

        const db = getDB()
        const [idRows] = await db.query("SELECT COALESCE(MAX(DoctorID), 0) + 1 AS nextId FROM Doctors")
        const nextId = idRows[0]?.nextId
        if (!nextId) {
            return res.status(500).json({ message: "Failed to determine next DoctorID" })
        }

        const insertSql = `
            INSERT INTO Doctors
                (DoctorID, FirstName, LastName, UserName, Email, Phone, Specialization, Password, Availability)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
        const params = [
            nextId,
            FirstName,
            LastName,
            UserName,
            Email,
            Phone || null,
            Specialization || null,
            Password,
            Availability === "No" ? "No" : "Yes",
        ]
        await db.query(insertSql, params)

        return res.status(201).json({ message: "Doctor created", DoctorID: nextId })
    } catch (error) {
        if (error && error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: "Duplicate entry for a unique field" })
        }
        console.error("Error creating doctor:", error)
        return res.status(500).json({ message: "Internal server error" })
    }
}

module.exports = createDoctor


