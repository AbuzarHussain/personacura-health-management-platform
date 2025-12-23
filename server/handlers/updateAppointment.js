const { getDB } = require("../utils/initiateDBConnection")

const updateAppointment = async (req, res) => {
    const db = getDB()
    let connection
    
    try {
        const { appointmentId } = req.params
        const { patientId, date, time, doctorId, reason, speciality } = req.body

        if (!appointmentId || !patientId || !date || !time || !doctorId) {
            return res.status(400).json({ message: "Missing required fields" })
        }

        connection = await db.getConnection()
        await connection.beginTransaction()

        const [oldAppointment] = await connection.query(
            `SELECT DoctorID, Date, Time FROM Appointments 
             WHERE AppointmentID = ? AND PatientID = ? AND Status = 'Scheduled'`,
            [appointmentId, patientId]
        )

        if (oldAppointment.length === 0) {
            await connection.rollback()
            connection.release()
            return res.status(404).json({ 
                message: "Appointment not found or cannot be updated" 
            })
        }
        const oldDoctorId = oldAppointment[0].DoctorID
        const oldDate = oldAppointment[0].Date
        const oldTime = oldAppointment[0].Time
        const isSlotChanged = (oldDoctorId !== doctorId || oldDate !==date || oldTime !== time)

        if (isSlotChanged) {
            const [existingAppointments] = await connection.query(
                `SELECT AppointmentID FROM Appointments 
                 WHERE DoctorID = ? AND Date = ? AND Time = ? 
                 AND Status = 'Scheduled' AND AppointmentID != ?`,
                [doctorId, date, time, appointmentId])

            if (existingAppointments.length > 0) {
                await connection.rollback()
                connection.release()
                return res.status(409).json({ 
                    message: "This time slot is already booked. Please choose another time." 
                })
            }
        }
        
        const [result] = await connection.query(
            `UPDATE Appointments 
             SET DoctorID = ?, Date = ?, Time = ?, Reason = ?
             WHERE AppointmentID = ? AND PatientID = ? AND Status = 'Scheduled'`,
            [doctorId, date, time, reason, appointmentId, patientId])
        
        await connection.commit()
        connection.release()
        res.json({ message: "Appointment updated successfully" })
    } catch (error) {
        if (connection) {
            await connection.rollback()
            connection.release()
        }
        console.error("Error updating appointment:", error)
        res.status(500).json({ message: "Failed to update appointment" })
    }
}

module.exports = updateAppointment