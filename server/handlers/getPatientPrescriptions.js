const { getDB } = require("../utils/initiateDBConnection")

/**
 * Returns all prescriptions for a given patient.
 */
const getPatientPrescriptions = async (req, res) => {
  try {
    const patientId = req.params.patientId

    if (!patientId) {
      return res.status(400).json({ message: "Patient ID is required in the URL." })
    }

    if (isNaN(patientId)) {
      return res.status(400).json({ message: "Invalid Patient ID format. Must be a number." })
    }

    const db = getDB()

    const [rows] = await db.query(
      `SELECT
         Pr.PrescriptionID,
         Pr.PatientID,
         Pr.DoctorID,
         Pr.AppointmentID,
         Pr.DateIssued,
         Pr.Dosage,
         Pr.Instructions,
         Pr.FollowUpDate,
         Pr.DrugID,
         D.DrugName,
         A.Date AS AppointmentDate,
         A.Time AS AppointmentTime,
         A.Reason AS AppointmentReason,
         Doc.FirstName AS DoctorFirstName,
         Doc.LastName AS DoctorLastName,
         Doc.Specialization AS DoctorSpecialization,
         Doc.Email AS DoctorEmail,
         Doc.Phone AS DoctorPhone
       FROM Prescription Pr
       LEFT JOIN Drug D ON Pr.DrugID = D.DrugID
       LEFT JOIN Appointments A ON Pr.AppointmentID = A.AppointmentID
       LEFT JOIN Doctors Doc ON Pr.DoctorID = Doc.DoctorID
       WHERE Pr.PatientID = ?
       ORDER BY Pr.DateIssued DESC, Pr.PrescriptionID DESC`,
      [patientId]
    )

    // Return empty array if no prescriptions found (200 OK, not 404)
    return res.json({ prescriptions: rows || [] })
  } catch (error) {
    console.error("Error retrieving patient prescriptions:", error)
    return res.status(500).json({ message: "Internal server error during prescription retrieval." })
  }
}

module.exports = getPatientPrescriptions


