const { getDB } = require("../utils/initiateDBConnection")

const updatePatient = async (req, res) => {
    try {
        const {
            PatientID,
            FirstName,
            LastName,
            UserName,
            Age,
            Gender,
            Password,
            Email,
            Phone
        } = req.body || {}

        if (!PatientID) {
            return res.status(400).json({ message: "PatientID is required" })
        }

        // Build dynamic update query based on provided fields
        const updates = []
        const params = []

        if (FirstName !== undefined) {
            updates.push("FirstName = ?")
            params.push(FirstName)
        }
        if (LastName !== undefined) {
            updates.push("LastName = ?")
            params.push(LastName)
        }
        if (UserName !== undefined) {
            updates.push("UserName = ?")
            params.push(UserName)
        }
        if (Age !== undefined) {
            updates.push("Age = ?")
            params.push(Number(Age))
        }
        if (Gender !== undefined) {
            updates.push("Gender = ?")
            params.push(Gender)
        }
        if (Password !== undefined && Password !== "") {
            updates.push("Password = ?")
            params.push(Password)
        }
        if (Email !== undefined) {
            updates.push("Email = ?")
            params.push(Email)
        }
        if (Phone !== undefined) {
            updates.push("Phone = ?")
            params.push(Phone)
        }

        if (updates.length === 0) {
            return res.status(400).json({ message: "No fields to update" })
        }

        params.push(PatientID) // Add PatientID for WHERE clause

        const db = getDB()
        const updateSql = `
            UPDATE Patient
            SET ${updates.join(", ")}
            WHERE PatientID = ?
        `

        await db.query(updateSql, params)

        // Fetch updated patient data
        const [rows] = await db.query(
            "SELECT PatientID, FirstName, LastName, UserName, Age, Gender, Email, Phone FROM Patient WHERE PatientID = ? LIMIT 1",
            [PatientID]
        )

        if (!rows || rows.length === 0) {
            return res.status(404).json({ message: "Patient not found" })
        }

        return res.status(200).json({ 
            message: "Patient updated successfully", 
            patient: rows[0] 
        })
    } catch (error) {
        if (error && error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: "UserName, Email, or Phone already exists" })
        }
        console.error("Error updating patient:", error)
        return res.status(500).json({ message: "Internal server error" })
    }
}

module.exports = updatePatient

