const { getDB } = require("../utils/initiateDBConnection")

/**
 * Marks scheduled appointments that have passed their time as "No Show"
 * This should be called when fetching patient appointments
 */
const markPastAppointmentsAsNoShow = async (req, res) => {
  try {
    const { patientId } = req.params

    if (!patientId) {
      return res.status(400).json({ message: "Patient ID is required" })
    }

    if (isNaN(patientId)) {
      return res.status(400).json({ message: "Invalid Patient ID format. Must be a number." })
    }

    const db = getDB()

    // Set session timezone to CDT (America/Chicago) for accurate time comparison
    // This ensures NOW() and TIMESTAMP comparisons are done in CDT
    await db.query(`SET time_zone = 'America/Chicago'`)

    // Find all scheduled appointments for this patient that have passed
    // Only mark as "No Show" if current time (in CDT) is equal to or past the appointment time
    // Both NOW() and TIMESTAMP(Date, Time) are now in CDT timezone
    const [pastScheduled] = await db.query(
      `SELECT 
         AppointmentID, 
         Date, 
         Time, 
         Status, 
         TIMESTAMP(Date, Time) AS AppointmentDateTime,
         NOW() AS CurrentTimeCDT
       FROM Appointments
       WHERE PatientID = ? 
         AND Status = 'Scheduled'
         AND TIMESTAMP(Date, Time) <= NOW()`,
      [patientId]
    )

    // Debug logging
    if (pastScheduled.length > 0) {
      console.log(`[Mark No Show] Found ${pastScheduled.length} appointments to mark as No Show:`)
      pastScheduled.forEach(app => {
        console.log(`  - Appointment ${app.AppointmentID}: ${app.Date} ${app.Time} (Appointment: ${app.AppointmentDateTime}, Current CDT: ${app.CurrentTimeCDT})`)
      })
    }

    if (pastScheduled.length === 0) {
      return res.json({ 
        message: "No past scheduled appointments found",
        updatedCount: 0
      })
    }

    // Update all past scheduled appointments to "No Show"
    const appointmentIds = pastScheduled.map(app => app.AppointmentID)
    const placeholders = appointmentIds.map(() => '?').join(',')

    const [result] = await db.query(
      `UPDATE Appointments 
       SET Status = 'No Show' 
       WHERE AppointmentID IN (${placeholders}) AND Status = 'Scheduled'`,
      appointmentIds
    )

    console.log(`[Mark No Show] Updated ${result.affectedRows} appointment(s) to "No Show" for patient ${patientId}`)

    return res.json({ 
      message: "Past scheduled appointments marked as No Show",
      updatedCount: result.affectedRows,
      appointmentIds: appointmentIds
    })
  } catch (error) {
    console.error("Error marking past appointments as No Show:", error)
    return res.status(500).json({ message: "Internal server error while updating appointment status." })
  }
}

module.exports = markPastAppointmentsAsNoShow

