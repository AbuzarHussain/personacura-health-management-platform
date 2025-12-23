
const { getDB } = require("../utils/initiateDBConnection")

/**
 * Retrieves all appointment details for a specific doctor.
 * Input: DoctorID via URL parameter (e.g., /api/doctors/calendar/:doctorId)
 * Output: JSON object containing an array of appointment objects, including patient names.
 */
const getDoctorAppointments = async (req, res) => {
  console.log("[Doctor Calendar] Route hit")
  console.log("[Doctor Calendar] Method:", req.method, "URL:", req.originalUrl)

  try {
    // 1. Get DoctorID from the URL parameters
    const doctorId = req.params.doctorId
    console.log("[Doctor Calendar] doctorId:", doctorId)

    if (!doctorId) {
      return res.status(400).json({ message: "Doctor ID is required in the URL." })
    }

    // 2. Validate DoctorID is numeric before querying
    if (isNaN(doctorId)) {
      return res.status(400).json({ message: "Invalid Doctor ID format. Must be a number." })
    }

    const db = getDB()

    // 3. SQL Query to fetch appointments and join with Patient details
    const [rows] = await db.query(
      `SELECT 
          A.AppointmentID, 
          A.Date, 
          A.Time, 
          A.Status, 
          A.Reason, 
          A.PatientID,
          P.FirstName AS PatientFirstName,
          P.LastName AS PatientLastName
        FROM Appointments A
        LEFT JOIN Patient P ON A.PatientID = P.PatientID
        WHERE A.DoctorID = ?
        ORDER BY A.Date ASC, A.Time ASC`,
      [doctorId]
    )

    console.log("[Doctor Calendar] found rows:", rows.length)

    if (!rows || rows.length === 0) {
      // Return 404 status and message, handled by the client-side fetch logic.
      return res.status(404).json({ message: "No appointments found for this doctor." })
    }

    // 5. Success: Return the list of appointments as JSON
    // Returns: { appointments: [...] }
    return res.json({ appointments: rows })
  } catch (error) {
    console.error("Error retrieving doctor appointments:", error)
    // Respond with a 500 status and a descriptive message for internal errors
    return res
      .status(500)
      .json({ message: "Internal server error during appointment retrieval." })
  }
}

module.exports = getDoctorAppointments