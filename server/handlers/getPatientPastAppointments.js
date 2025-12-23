const { getDB } = require("../utils/initiateDBConnection")

const getPatientPastAppointments = async (req, res) => {
    try {
        const { patientId } = req.params
        
        if (!patientId) {
            return res.status(400).json({ message: "Patient ID is required" })
        }
        
        if (isNaN(patientId)) {
            return res.status(400).json({ message: "Invalid Patient ID format. Must be a number." })
        }
        
        const db = getDB()
        
        // Get only "Completed" appointments (exclude "No Show" and "Cancelled")
        const [appointments] = await db.query(
            `SELECT 
                a.AppointmentID,
                a.Date,
                a.Time,
                a.Status,
                a.Reason,
                d.DoctorID,
                d.FirstName AS DoctorFirstName,
                d.LastName AS DoctorLastName,
                d.Specialization
            FROM Appointments a
            JOIN Doctors d ON a.DoctorID = d.DoctorID
            WHERE a.PatientID = ? AND a.Status = 'Completed'
            ORDER BY a.Date DESC, a.Time DESC`,
            [patientId]
        )

        if (!appointments || appointments.length === 0) {
            return res.status(404).json({ message: "No completed appointments found" })
        }

        // For each appointment, get prescriptions for that specific appointment
        const appointmentsWithPrescriptions = await Promise.all(
            appointments.map(async (appointment) => {
                const [prescriptions] = await db.query(
                    `SELECT
                       Pr.PrescriptionID,
                       Pr.DrugID,
                       D.DrugName,
                       Pr.Dosage,
                       Pr.Instructions,
                       Pr.DateIssued,
                       Pr.FollowUpDate,
                       Pr.AppointmentID
                     FROM Prescription Pr
                     LEFT JOIN Drug D ON Pr.DrugID = D.DrugID
                     WHERE Pr.PatientID = ?
                       AND Pr.DoctorID = ?
                       AND (
                         Pr.AppointmentID = ?
                         OR (
                           Pr.AppointmentID IS NULL
                           AND Pr.DateIssued BETWEEN DATE_SUB(?, INTERVAL 1 DAY) AND DATE_ADD(?, INTERVAL 1 DAY)
                         )
                       )
                     ORDER BY Pr.DateIssued DESC`,
                    [
                        patientId,
                        appointment.DoctorID,
                        appointment.AppointmentID,
                        appointment.Date,
                        appointment.Date
                    ]
                )

                return {
                    ...appointment,
                    prescriptions: prescriptions || []
                }
            })
        )

        res.json({ appointments: appointmentsWithPrescriptions })
    } catch (error) {
        console.error("Error retrieving past appointments:", error)
        res.status(500).json({ message: "Internal server error while retrieving past appointments" })
    }
}

module.exports = getPatientPastAppointments