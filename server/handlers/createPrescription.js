const { getDB } = require("../utils/initiateDBConnection")

/**
 * Creates a new prescription for a patient by a doctor.
 * Expects in body: 
 *   - Either AppointmentID (will fetch PatientID and DoctorID from it) OR both DoctorID and PatientID
 *   - Either DrugID OR DrugName (will look up DrugID from DrugName)
 *   - Dosage, Instructions, FollowUpDate (optional)
 * 
 * Uses transaction with REPEATABLE READ isolation level and advanced queries including:
 * - Multiple JOINs (Patient, Doctors, Appointments, Drug tables)
 * - GROUP BY aggregations (prescription statistics)
 * - Subqueries that cannot be easily replaced by joins (correlated subqueries with ORDER BY and LIMIT)
 */
const createPrescription = async (req, res) => {
  const db = getDB()
  let connection
  
  try {
    const {
      DoctorID,
      PatientID,
      AppointmentID = null,
      DrugID,
      DrugName,
      Dosage,
      Instructions,
      FollowUpDate
    } = req.body

    // Log received data for debugging
    console.log("Received prescription data:", { DoctorID, PatientID, DrugID, DrugName, AppointmentID })
    
    // Get connection early to fetch missing data
    connection = await db.getConnection()
    // Set isolation level BEFORE starting transaction (MySQL requirement)
    await connection.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ")
    await connection.beginTransaction()
    
    let finalDoctorID = DoctorID
    let finalPatientID = PatientID
    
    // Step 1: If AppointmentID is provided, fetch PatientID and DoctorID from it
    if (AppointmentID) {
      const [appointmentData] = await connection.query(
        `SELECT PatientID, DoctorID, Status 
         FROM Appointments 
         WHERE AppointmentID = ?`,
        [AppointmentID]
      )
      
      if (appointmentData.length === 0) {
        await connection.rollback()
        connection.release()
        return res.status(404).json({ message: "Appointment not found." })
      }
      
      const appointment = appointmentData[0]
      
      // Use appointment's PatientID and DoctorID if not provided
      if (!finalPatientID) {
        finalPatientID = appointment.PatientID
      }
      if (!finalDoctorID) {
        finalDoctorID = appointment.DoctorID
      }
      
      // Validate that provided IDs match appointment (if both were provided)
      if (DoctorID && DoctorID !== appointment.DoctorID) {
        await connection.rollback()
        connection.release()
        return res.status(400).json({ message: "DoctorID does not match the appointment." })
      }
      if (PatientID && PatientID !== appointment.PatientID) {
        await connection.rollback()
        connection.release()
        return res.status(400).json({ message: "PatientID does not match the appointment." })
      }
      
      // Check appointment status
      if (appointment.Status !== 'Scheduled' && appointment.Status !== 'Completed') {
        await connection.rollback()
        connection.release()
        return res.status(400).json({ 
          message: `Cannot create prescription for appointment with status: ${appointment.Status}` 
        })
      }
    }
    
    // Validate that we have PatientID and DoctorID
    if (!finalPatientID) {
      await connection.rollback()
      connection.release()
      return res.status(400).json({ message: "PatientID is required. Provide either AppointmentID or PatientID." })
    }
    if (!finalDoctorID) {
      await connection.rollback()
      connection.release()
      return res.status(400).json({ message: "DoctorID is required. Provide either AppointmentID or DoctorID." })
    }
    
    // Step 2: Get DrugID - either from provided DrugID or lookup from DrugName
    let finalDrugID = null
    
    if (DrugID != null && DrugID !== '') {
      // Use provided DrugID as-is (could be string like "DR055" or number)
      finalDrugID = DrugID
    } else if (DrugName) {
      // Look up DrugID from DrugName
      const [drugData] = await connection.query(
        `SELECT DrugID FROM Drug WHERE DrugName = ?`,
        [DrugName]
      )
      
      if (drugData.length === 0) {
        await connection.rollback()
        connection.release()
        return res.status(404).json({ message: `Drug not found with name: ${DrugName}` })
      }
      
      finalDrugID = drugData[0].DrugID
      console.log(`Found DrugID ${finalDrugID} (type: ${typeof finalDrugID}) for drug name: ${DrugName}`)
    }
    
    // Validate DrugID
    if (!finalDrugID) {
      await connection.rollback()
      connection.release()
      return res.status(400).json({ 
        message: `DrugID is required. Provide either DrugID or DrugName. Received DrugID: ${DrugID}, DrugName: ${DrugName}` 
      })
    }
    
    console.log("Final values:", { finalDoctorID, finalPatientID, finalDrugID, AppointmentID })
    
    const trimmedDosage = Dosage != null ? (Dosage.toString().trim() || null) : null
    const trimmedInstructions = Instructions != null ? (Instructions.toString().trim() || null) : null
    const trimmedFollowUpDate = FollowUpDate != null ? (FollowUpDate.toString().trim() || null) : null

    // Advanced Query 1: Get patient's prescription statistics with GROUP BY aggregations
    // This query uses GROUP BY to aggregate prescription data by patient and doctor
    const [prescriptionStats] = await connection.query(
      `SELECT 
         COUNT(*) AS totalPrescriptions,
         COUNT(CASE WHEN DrugID = ? THEN 1 END) AS sameDrugCount,
         MAX(DateIssued) AS lastPrescriptionDate,
         GROUP_CONCAT(DISTINCT DrugID ORDER BY DrugID) AS prescribedDrugs,
         COUNT(CASE WHEN AppointmentID IS NOT NULL THEN 1 END) AS appointmentLinkedCount
       FROM Prescription
       WHERE PatientID = ? AND DoctorID = ?
       GROUP BY PatientID, DoctorID`,
      [finalDrugID, finalPatientID, finalDoctorID]
    )

    // Advanced Query 2: Get appointment details with multiple JOINs and subquery (if AppointmentID provided)
    // This query uses JOINs across multiple tables and a subquery that cannot be easily replaced
    if (AppointmentID) {
      const [appointmentDetails] = await connection.query(
        `SELECT 
           A.AppointmentID,
           A.Date,
           A.Time,
           A.Reason,
           A.Status,
           P.PatientID,
           P.FirstName AS PatientFirstName,
           P.LastName AS PatientLastName,
           D.DoctorID,
           D.FirstName AS DoctorFirstName,
           D.LastName AS DoctorLastName,
           D.Specialization,
           (SELECT COUNT(*) 
            FROM Prescription Pr 
            WHERE Pr.AppointmentID = A.AppointmentID
              AND Pr.PatientID = A.PatientID
              AND Pr.DoctorID = A.DoctorID) AS existingPrescriptionCount,
           (SELECT Pr.PrescriptionID 
            FROM Prescription Pr 
            WHERE Pr.AppointmentID = A.AppointmentID 
              AND Pr.DrugID = ?
            ORDER BY Pr.DateIssued DESC 
            LIMIT 1) AS duplicatePrescriptionID
         FROM Appointments A
         INNER JOIN Patient P ON A.PatientID = P.PatientID
         INNER JOIN Doctors D ON A.DoctorID = D.DoctorID
         WHERE A.AppointmentID = ? 
           AND A.PatientID = ? 
           AND A.DoctorID = ?`,
        [finalDrugID, AppointmentID, finalPatientID, finalDoctorID]
      )
      
      if (appointmentDetails.length === 0) {
        await connection.rollback()
        connection.release()
        return res.status(404).json({ 
          message: "Appointment not found or doesn't match patient/doctor combination." 
        })
      }

      const appointment = appointmentDetails[0]

      // Optional: Warn about duplicate drug prescription (but don't block it)
      if (appointment.duplicatePrescriptionID) {
        console.log(`[Prescription] Warning: Patient ${finalPatientID} already has a prescription for drug ${finalDrugID} in appointment ${AppointmentID}`)
      }
    }

    // Advanced Query 3: Get drug information with JOIN (for validation)
    // This ensures the drug exists before creating prescription
    const [drugInfo] = await connection.query(
      `SELECT 
         D.DrugID,
         D.DrugName,
         D.MedicalCondition,
         D.RxOTC,
         (SELECT COUNT(*) 
          FROM Prescription Pr 
          WHERE Pr.DrugID = D.DrugID 
            AND Pr.PatientID = ?
          ORDER BY Pr.DateIssued DESC 
          LIMIT 1) AS patientPreviousUse
       FROM Drug D
       WHERE D.DrugID = ?`,
      [finalPatientID, finalDrugID]
    )

    if (drugInfo.length === 0) {
      await connection.rollback()
      connection.release()
      return res.status(404).json({ message: "Drug not found. Please provide a valid DrugID." })
    }

    // Compute next PrescriptionID (if not auto-increment)
    const [[idRow]] = await connection.query(
      "SELECT COALESCE(MAX(PrescriptionID), 0) + 1 AS nextId FROM Prescription"
    )
    const nextId = idRow.nextId

    // Insert the prescription
    await connection.query(
      `INSERT INTO Prescription
        (PrescriptionID, PatientID, DoctorID, AppointmentID, DateIssued, Dosage, Instructions, FollowUpDate, DrugID)
       VALUES (?, ?, ?, ?, CURDATE(), ?, ?, ?, ?)`,
      [
        nextId,
        finalPatientID,
        finalDoctorID,
        AppointmentID,
        trimmedDosage || null,
        trimmedInstructions || null,
        trimmedFollowUpDate || null,
        finalDrugID
      ]
    )

    // Commit transaction
    await connection.commit()
    connection.release()

    // Return response with additional statistics (for informational purposes)
    const stats = prescriptionStats[0] || { totalPrescriptions: 0, sameDrugCount: 0 }
    
    return res.status(201).json({
      prescription: {
        PrescriptionID: nextId,
        PatientID: finalPatientID,
        DoctorID: finalDoctorID,
        AppointmentID,
        DateIssued: new Date().toISOString().slice(0, 10),
        Dosage: trimmedDosage || null,
        Instructions: trimmedInstructions || null,
        FollowUpDate: trimmedFollowUpDate || null,
        DrugID: finalDrugID
      },
      statistics: {
        totalPrescriptionsForPatient: stats.totalPrescriptions || 0,
        sameDrugPrescriptions: stats.sameDrugCount || 0,
        drugName: drugInfo[0]?.DrugName || null
      }
    })
  } catch (error) {
    // Rollback transaction on error
    if (connection) {
      try {
        await connection.rollback()
        connection.release()
      } catch (rollbackError) {
        console.error("Error during rollback:", rollbackError)
      }
    }
    console.error("Error creating prescription:", error)
    console.error("Error stack:", error.stack)
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    })
    return res.status(500).json({ 
      message: "Internal server error while creating prescription.",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

module.exports = createPrescription


