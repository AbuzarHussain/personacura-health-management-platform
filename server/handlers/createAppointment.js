const { getDB } = require("../utils/initiateDBConnection")

const createAppointment = async (req, res) => {
    const db = getDB()
    let connection
    
    try {
        const { patientId, date, time, doctorId, reason, speciality } = req.body

        connection = await db.getConnection()
        await connection.beginTransaction()

        const [existingAppointments] = await connection.query(
            `SELECT AppointmentID FROM Appointments 
             WHERE DoctorID = ? AND Date = ? AND Time = ? AND Status = 'Scheduled'`,
            [doctorId, date, time])

        if (existingAppointments.length > 0) {
            await connection.rollback()
            connection.release()
            return res.status(409).json({ 
                message: "This time slot is already booked. Please choose another time." 
            })
        }

        const [result] = await connection.query(
            `INSERT INTO Appointments (PatientID, DoctorID, Date, Time, Reason, Status) 
             VALUES (?, ?, ?, ?, ?, 'Scheduled')`,
            [patientId, doctorId, date, time, reason])
        
        await connection.commit()
        connection.release()
        res.json({ 
            message: "Appointment booked successfully",
            appointmentId: result.insertId 
        })
    } catch (error) {
        if (connection) {
            await connection.rollback()
            connection.release()
        }
        console.error("Error booking appointment:", error)
        res.status(500).json({ message: "Failed to book appointment" })
    }
}

module.exports = createAppointment