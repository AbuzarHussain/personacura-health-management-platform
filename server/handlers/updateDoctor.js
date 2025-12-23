const { getDB } = require("../utils/initiateDBConnection")

const updateDoctor = async (req, res) => {
    try {
        const {
            DoctorID,
            FirstName,
            LastName,
            UserName,
            Email,
            Phone,
            Specialization,
            Password,
            Availability,
        } = req.body || {}

        if (!DoctorID) {
            return res.status(400).json({ message: "DoctorID is required" })
        }

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
        if (Email !== undefined) {
            updates.push("Email = ?")
            params.push(Email)
        }
        if (Phone !== undefined) {
            updates.push("Phone = ?")
            params.push(Phone)
        }
        if (Specialization !== undefined) {
            updates.push("Specialization = ?")
            params.push(Specialization)
        }
        if (Password !== undefined && Password !== "") {
            updates.push("Password = ?")
            params.push(Password)
        }
        if (Availability !== undefined) {
            updates.push("Availability = ?")
            params.push(Availability === "No" ? "No" : "Yes")
        }

        if (updates.length === 0) {
            return res.status(400).json({ message: "No fields to update" })
        }

        params.push(DoctorID)

        const db = getDB()
        const updateSql = `
            UPDATE Doctors
            SET ${updates.join(", ")}
            WHERE DoctorID = ?
        `

        await db.query(updateSql, params)

        const [rows] = await db.query(
            "SELECT DoctorID, FirstName, LastName, UserName, Email, Phone, Specialization, Availability FROM Doctors WHERE DoctorID = ? LIMIT 1",
            [DoctorID]
        )

        if (!rows || rows.length === 0) {
            return res.status(404).json({ message: "Doctor not found" })
        }

        return res.status(200).json({
            message: "Doctor updated successfully",
            doctor: rows[0],
        })
    } catch (error) {
        if (error && error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ message: "UserName, Email, or Phone already exists" })
        }
        console.error("Error updating doctor:", error)
        return res.status(500).json({ message: "Internal server error" })
    }
}

module.exports = updateDoctor


