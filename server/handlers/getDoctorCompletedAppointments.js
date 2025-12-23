const { getDB } = require("../utils/initiateDBConnection")

/**
 * Retrieves completed appointments for a doctor, grouped by appointment.
 * Each appointment includes patient info and prescriptions for that specific appointment.
 */
const getDoctorCompletedAppointments = async (req, res) => {
  try {
    const doctorId = req.params.doctorId

    if (!doctorId) {
      return res.status(400).json({ message: "Doctor ID is required in the URL." })
    }

    if (isNaN(doctorId)) {
      return res.status(400).json({ message: "Invalid Doctor ID format. Must be a number." })
    }

    const db = getDB()

    // Get all completed appointments with patient info
    const [appointments] = await db.query(
      `SELECT
         A.AppointmentID,
         A.Date AS AppointmentDate,
         A.Time AS AppointmentTime,
         A.Reason AS AppointmentReason,
         A.Status,
         P.PatientID,
         P.FirstName,
         P.LastName,
         P.Age,
         P.Gender,
         P.Email,
         P.Phone
       FROM Appointments A
       INNER JOIN Patient P ON A.PatientID = P.PatientID
       WHERE A.DoctorID = ?
         AND A.Status = 'Completed'
       ORDER BY A.Date DESC, A.Time DESC`,
      [doctorId]
    )

    // For each appointment, get prescriptions for that specific appointment
    // Match by AppointmentID if set, otherwise match by PatientID, DoctorID, and DateIssued close to appointment date
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
            appointment.PatientID,
            doctorId,
            appointment.AppointmentID,
            appointment.AppointmentDate,
            appointment.AppointmentDate
          ]
        )

        // Debug logging
        console.log(`Appointment ${appointment.AppointmentID}: Found ${prescriptions.length} prescriptions`)
        if (prescriptions.length > 0) {
          console.log('Sample prescription:', prescriptions[0])
        }

        return {
          ...appointment,
          prescriptions: prescriptions || []
        }
      })
    )

    console.log(`Total completed appointments: ${appointmentsWithPrescriptions.length}`)
    
    // Debug: Check if there are any prescriptions for these patients at all
    if (appointments.length > 0) {
      const patientIds = appointments.map(a => a.PatientID)
      const [allPrescriptions] = await db.query(
        `SELECT PrescriptionID, PatientID, AppointmentID, DateIssued 
         FROM Prescription 
         WHERE DoctorID = ? AND PatientID IN (?)`,
        [doctorId, patientIds]
      )
      console.log(`Total prescriptions found for these patients: ${allPrescriptions.length}`)
      if (allPrescriptions.length > 0) {
        console.log('Sample prescriptions:', allPrescriptions.slice(0, 3))
      }
    }
    
    return res.json({ appointments: appointmentsWithPrescriptions })
    
  } catch (error) {
    console.error("Error retrieving completed appointments:", error)
    return res.status(500).json({ message: "Internal server error during completed appointments retrieval." })
  }
}

module.exports = getDoctorCompletedAppointments

