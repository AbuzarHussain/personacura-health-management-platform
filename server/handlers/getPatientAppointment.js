
const { getDB } = require("../utils/initiateDBConnection");

/**
 * Retrieves all appointment details for a specific patient.
 * Input: PatientID via URL parameter (e.g., /api/patients/calendar/:patientId)
 * Output: JSON object containing an array of appointment objects, including doctor names.
 */
const getPatientAppointments = async (req, res) => {
    try {
        // 1. Get PatientID from the URL parameters
        const patientId = req.params.patientId;
        console.log(`[Patient Calendar] Request received for patientId: ${patientId}`);

        if (!patientId) {
            return res.status(400).json({ message: "Patient ID is required in the URL." });
        }

        // 2. Validate PatientID is numeric before querying
        if (isNaN(patientId)) {
            return res.status(400).json({ message: "Invalid Patient ID format. Must be a number." });
        }

        const db = getDB();

        // 3. SQL Query to fetch appointments and join with Doctor details
        console.log(`[Patient Calendar] Querying appointments for patientId: ${patientId}`);
        const [rows] = await db.query(
            `SELECT
                A.AppointmentID,
                A.Date,
                A.Time,
                A.Status,
                A.Reason,
                A.DoctorID,
                D.FirstName AS DoctorFirstName,
                D.LastName AS DoctorLastName,
                D.Specialization
            FROM Appointments A
            LEFT JOIN Doctors D ON A.DoctorID = D.DoctorID
            WHERE A.PatientID = ?
            ORDER BY A.Date ASC, A.Time ASC`,
            [patientId]
        );

        console.log(`[Patient Calendar] Found ${rows.length} appointments for patientId: ${patientId}`);
        if (rows.length > 0) {
            console.log(`[Patient Calendar] Sample appointment:`, rows[0]);
        }

        // 4. Check if any appointments were found
        if (!rows || rows.length === 0) {
            // Return 404 status and message, handled by the client-side fetch logic.
            console.log(`[Patient Calendar] No appointments found for patientId: ${patientId}`);
            return res.status(404).json({ message: "No appointments found for this patient." });
        }

        // 5. Success: Return the list of appointments as JSON
        // Returns: { appointments: [...] }
        return res.json({ appointments: rows });

    } catch (error) {
        console.error("[Patient Calendar] Error retrieving patient appointments:", error);
        // Respond with a 500 status and a descriptive message for internal errors
        return res.status(500).json({ message: "Internal server error during appointment retrieval." });
    }
};

module.exports = getPatientAppointments