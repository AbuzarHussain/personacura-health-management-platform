const { getDB } = require("../utils/initiateDBConnection")

const loginDoctor = async (req, res) => {
    try {
        const { Email, Password } = req.body || {}
        if (!Email || !Password) {
            return res.status(400).json({ message: "Email and Password are required" })
        }
        const db = getDB()
        const [rows] = await db.query(
            "SELECT DoctorID, FirstName, LastName, UserName, Email, Phone, Specialization, Availability FROM Doctors WHERE Email = ? AND Password = ? LIMIT 1",
            [Email, Password]
        )
        if (!rows || rows.length === 0) {
            return res.status(401).json({ message: "Invalid credentials" })
        }
        return res.json({ doctor: rows[0] })
    } catch (error) {
        console.error("Error during doctor login:", error)
        return res.status(500).json({ message: "Internal server error" })
    }
}

module.exports = loginDoctor


