const { getDB } = require("../utils/initiateDBConnection")

const deleteAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.params

        if (!appointmentId) {
            return res.status(400).json({ message: "Appointment ID is required" })
        }

        const db = getDB()
        
        const [result] = await db.query(
            `DELETE FROM Appointments 
             WHERE AppointmentID = ? AND Status = 'Scheduled'`,
            [appointmentId]
        )

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Appointment not found or cannot be deleted" })
        }

        res.json({ message: "Appointment deleted successfully" })
    } catch (error) {
        console.error("Error deleting appointment:", error)
        res.status(500).json({ message: "Failed to delete appointment" })
    }
}

module.exports = deleteAppointment