const { getDB } = require("../utils/initiateDBConnection")

/**
 * Updates the status of an appointment
 * Expects: appointmentId in params, status in body
 */
const updateAppointmentStatus = async (req, res) => {
  try {
    const { appointmentId } = req.params
    const { status } = req.body

    if (!appointmentId) {
      return res.status(400).json({ message: "Appointment ID is required" })
    }

    if (!status) {
      return res.status(400).json({ message: "Status is required" })
    }

    // Validate status value
    const validStatuses = ['Scheduled', 'Completed', 'Cancelled', 'No Show']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` })
    }

    const db = getDB()

    // Check if appointment exists
    const [existing] = await db.query(
      `SELECT AppointmentID, Status FROM Appointments WHERE AppointmentID = ?`,
      [appointmentId]
    )

    if (existing.length === 0) {
      return res.status(404).json({ message: "Appointment not found" })
    }

    // Update the status
    // Note: If the trigger exists, it will automatically create an audit log entry
    const [result] = await db.query(
      `UPDATE Appointments SET Status = ? WHERE AppointmentID = ?`,
      [status, appointmentId]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Appointment not found or could not be updated" })
    }

    // Check if trigger created an audit log (for debugging)
    if (status === 'Completed') {
      try {
        const [auditCheck] = await db.query(
          `SELECT LogID FROM AppointmentAuditLog WHERE AppointmentID = ? ORDER BY ChangedAt DESC LIMIT 1`,
          [appointmentId]
        )
        if (auditCheck.length > 0) {
          console.log(`[Trigger] Audit log created successfully for appointment ${appointmentId}, LogID: ${auditCheck[0].LogID}`)
        } else {
          console.log(`[Trigger] Warning: No audit log found for appointment ${appointmentId}. Trigger may not be set up.`)
        }
      } catch (err) {
        if (err.code === 'ER_NO_SUCH_TABLE') {
          console.log(`[Trigger] Warning: AppointmentAuditLog table does not exist. Please run the SQL script.`)
        } else {
          console.log(`[Trigger] Error checking audit log:`, err.message)
        }
      }
    }

    return res.json({ 
      message: "Appointment status updated successfully",
      appointmentId: appointmentId,
      newStatus: status
    })
  } catch (error) {
    console.error("Error updating appointment status:", error)
    return res.status(500).json({ message: "Internal server error while updating appointment status." })
  }
}

module.exports = updateAppointmentStatus

