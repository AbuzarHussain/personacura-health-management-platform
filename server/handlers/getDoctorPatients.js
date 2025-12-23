const { getDB } = require("../utils/initiateDBConnection")

const getDoctorPatients = async (req, res) => {
  try {
    const doctorId = req.params.doctorId

    if (!doctorId) {
      return res.status(400).json({ message: "Doctor ID is required in the URL." })
    }

    if (isNaN(doctorId)) {
      return res.status(400).json({ message: "Invalid Doctor ID format. Must be a number." })
    }

    const db = getDB()

    const [rows] = await db.query(
      `SELECT
         P.PatientID,
         P.FirstName,
         P.LastName,
         P.Age,
         P.Gender,
         P.Email,
         P.Phone,
         MAX(CASE 
           WHEN TIMESTAMP(A.Date, A.Time) <= DATE_SUB(NOW(), INTERVAL 5 MINUTE)
             AND A.Status = 'Completed'
           THEN A.Date
           ELSE NULL
         END) AS LastVisitDate,
         (SELECT A2.Reason 
          FROM Appointments A2 
          WHERE A2.PatientID = P.PatientID 
            AND A2.DoctorID = ?
            AND TIMESTAMP(A2.Date, A2.Time) <= DATE_SUB(NOW(), INTERVAL 5 MINUTE)
            AND A2.Status = 'Completed'
          ORDER BY A2.Date DESC, A2.Time DESC 
          LIMIT 1
         ) AS LastVisitReason,
         (SELECT A3.Date 
          FROM Appointments A3 
          WHERE A3.PatientID = P.PatientID 
            AND A3.DoctorID = ?
            AND A3.Status = 'Scheduled'
          ORDER BY A3.Date ASC, A3.Time ASC 
          LIMIT 1
         ) AS UpcomingAppointmentDate,
         (SELECT A3.Time 
          FROM Appointments A3 
          WHERE A3.PatientID = P.PatientID 
            AND A3.DoctorID = ?
            AND A3.Status = 'Scheduled'
          ORDER BY A3.Date ASC, A3.Time ASC 
          LIMIT 1
         ) AS UpcomingAppointmentTime,
         (SELECT A3.Reason 
          FROM Appointments A3 
          WHERE A3.PatientID = P.PatientID 
            AND A3.DoctorID = ?
            AND A3.Status = 'Scheduled'
          ORDER BY A3.Date ASC, A3.Time ASC 
          LIMIT 1
         ) AS UpcomingAppointmentReason,
         (SELECT A3.AppointmentID 
          FROM Appointments A3 
          WHERE A3.PatientID = P.PatientID 
            AND A3.DoctorID = ?
            AND A3.Status = 'Scheduled'
          ORDER BY A3.Date ASC, A3.Time ASC 
          LIMIT 1
         ) AS UpcomingAppointmentID,
         MAX(CASE 
           WHEN A.Status = 'Scheduled'
           THEN 1 ELSE 0 
         END) AS HasUpcoming,
         MAX(CASE 
           WHEN TIMESTAMP(A.Date, A.Time) <= DATE_SUB(NOW(), INTERVAL 5 MINUTE) 
             AND A.Status = 'Completed'
           THEN 1 ELSE 0 
         END) AS HasPast,
         (SELECT JSON_ARRAYAGG(
           JSON_OBJECT(
             'PrescriptionID', Pr.PrescriptionID,
             'DrugID', Pr.DrugID,
             'DrugName', D.DrugName,
             'Dosage', Pr.Dosage,
             'Instructions', Pr.Instructions,
             'DateIssued', Pr.DateIssued,
             'FollowUpDate', Pr.FollowUpDate,
             'AppointmentID', Pr.AppointmentID
           )
         )
         FROM Prescription Pr
         LEFT JOIN Drug D ON Pr.DrugID = D.DrugID
         WHERE Pr.PatientID = P.PatientID
           AND Pr.DoctorID = ?
           AND Pr.AppointmentID IN (
             SELECT A4.AppointmentID
             FROM Appointments A4
             WHERE A4.PatientID = P.PatientID
               AND A4.DoctorID = ?
               AND TIMESTAMP(A4.Date, A4.Time) <= DATE_SUB(NOW(), INTERVAL 5 MINUTE)
               AND A4.Status = 'Completed'
           )
         ) AS PastPrescriptions
       FROM Appointments A
       INNER JOIN Patient P ON A.PatientID = P.PatientID
       WHERE A.DoctorID = ?
         AND A.Status IN ('Scheduled', 'Completed')
       GROUP BY
         P.PatientID,
         P.FirstName,
         P.LastName,
         P.Age,
         P.Gender,
         P.Email,
         P.Phone
       ORDER BY LastVisitDate DESC`,
      [doctorId, doctorId, doctorId, doctorId, doctorId, doctorId, doctorId, doctorId]
    )

    return res.json({ patients: rows })
    
  } catch (error) {
    console.error("Error retrieving doctor patients:", error)
    return res.status(500).json({ message: "Internal server error during doctor patients retrieval." })
  }
}

module.exports = getDoctorPatients