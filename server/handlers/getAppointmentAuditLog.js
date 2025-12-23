const { getDB } = require("../utils/initiateDBConnection")

/**
 * Retrieves appointment audit logs for a doctor
 * Shows when appointments were marked as completed (triggered by the database trigger)
 * 
 * @route GET /api/doctors/:doctorId/audit-logs
 */
const getAppointmentAuditLog = async (req, res) => {
  try {
    const doctorId = req.params.doctorId

    if (!doctorId) {
      return res.status(400).json({ message: "Doctor ID is required in the URL." })
    }

    if (isNaN(doctorId)) {
      return res.status(400).json({ message: "Invalid Doctor ID format. Must be a number." })
    }

    const db = getDB()

    const [logs] = await db.query(
      `SELECT 
         AAL.LogID,
         AAL.AppointmentID,
         AAL.PatientID,
         AAL.OldStatus,
         AAL.NewStatus,
         AAL.ChangedAt,
         AAL.Notes,
         P.FirstName AS PatientFirstName,
         P.LastName AS PatientLastName,
         A.Date AS AppointmentDate,
         A.Time AS AppointmentTime,
         A.Reason
       FROM AppointmentAuditLog AAL
       INNER JOIN Patient P ON AAL.PatientID = P.PatientID
       INNER JOIN Appointments A ON AAL.AppointmentID = A.AppointmentID
       WHERE AAL.DoctorID = ?
       ORDER BY AAL.ChangedAt DESC
       LIMIT 50`,
      [doctorId]
    )

    return res.json({ 
      auditLogs: logs || [],
      totalLogs: logs.length 
    })
    
  } catch (error) {
    console.error("Error retrieving appointment audit logs:", error)
    
    // If table doesn't exist yet, return empty array with helpful message
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return res.json({ 
        auditLogs: [],
        totalLogs: 0,
        message: "Audit log table not found. Please run the SQL script to create it."
      })
    }
    
    return res.status(500).json({ 
      message: "Internal server error during audit log retrieval." 
    })
  }
}

module.exports = getAppointmentAuditLog


