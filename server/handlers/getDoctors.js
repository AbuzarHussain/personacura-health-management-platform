const {getDB} = require("./../utils/initiateDBConnection")

const getDoctors = async(req,res) => {
    try {
        const db = getDB()
        const [rows] = await db.query(`SELECT DoctorID,FirstName,LastName,Specialization from Doctors`)

        if (!rows || rows.length === 0) {
            return res.status(404).json({ message: "No doctors found" })
        }
        return res.json({ doctors: rows })
    } catch (error) {
        console.error("Error retrieving doctors data:", error)
        return res.status(500).json({ message: "Internal server error occurred while retriving doctors data"})
    }
}

module.exports = getDoctors