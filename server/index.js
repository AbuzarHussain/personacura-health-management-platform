const path = require("path")
// Make dotenv optional - Cloud Run sets env vars directly
try {
  require("dotenv").config({ path: path.resolve(__dirname, "../project.env") })
} catch (e) {
  // project.env is optional - environment variables will be set by Cloud Run
  console.log("Note: project.env not found, using environment variables")
}
const express = require("express")
const cors = require("cors")

const getMessage = require("./handlers/getMessage")
const loginPatient = require("./handlers/loginPatient")
const loginDoctor = require("./handlers/loginDoctor")
const createPatient = require("./handlers/createPatient")
const createDoctor = require("./handlers/createDoctor")
const getDoctorAppointments = require("./handlers/getDoctorAppointment")
const getPatientAppointments = require("./handlers/getPatientAppointment")
const SearchDoctors = require("./handlers/searchDoctor")
const SearchDrugs = require("./handlers/searchDrugs")
const SymptomAnalysis = require("./handlers/getSymptom")
const deleteAppointment = require("./handlers/deleteAppointment")
const updateAppointment = require("./handlers/updateAppointment")
const updateAppointmentStatus = require("./handlers/updateAppointmentStatus")
const createFeedback = require("./handlers/createFeedback") 
const createPrescription = require("./handlers/createPrescription")
const updatePatient = require("./handlers/updatePatient")
const updateDoctor = require("./handlers/updateDoctor")
const getPatientPrescriptions = require("./handlers/getPatientPrescriptions")
const getDoctors = require("./handlers/getDoctors")
const createAppointment = require("./handlers/createAppointment")
const getPatientPastAppointments = require("./handlers/getPatientPastAppointments")
const getVaccineRecommendations = require("./handlers/getVaccineRecommendations")
const { initDB } = require("./utils/initiateDBConnection")
const getDoctorPatients = require("./handlers/getDoctorPatients")
const getDoctorCompletedAppointments = require("./handlers/getDoctorCompletedAppointments")
const getAppointmentAuditLog = require("./handlers/getAppointmentAuditLog")
const updateFeedback = require("./handlers/updateFeedback")
const markPastAppointmentsAsNoShow = require("./handlers/markPastAppointmentsAsNoShow")
const getVaccinesByAgeGender = require("./handlers/getVaccinesByAgeGender")
const saveVaccineCheckLog = require("./handlers/saveVaccineCheckLog")
const getVaccineCheckHistory = require("./handlers/getVaccineCheckHistory")
const getPrescriptionTrends = require("./handlers/getPrescriptionTrends")

const app = express()
const router = express.Router()
const PORT = process.env.PORT || 6969

app.use(cors())
app.use(express.json())

// Static file serving removed for backend-only deployment
// Frontend is deployed separately on Cloud Run
// app.use(express.static(path.join(__dirname, "../client/build")))
// app.get('/', (_, res) => {
//   res.sendFile(path.join(__dirname, "../client/build", "index.html"))
// })

const startServer = async() => {
  try {
    console.log("Starting server initialization...")
    console.log("PORT:", PORT)
    console.log("DB_USER:", process.env.DB_USER ? "SET" : "NOT SET")
    console.log("DB_SOCKET_PATH:", process.env.DB_SOCKET_PATH || "NOT SET")
    console.log("DB_HOST:", process.env.DB_HOST || "NOT SET")
    
    await initDB()
    console.log("Database connected successfully")
    router.get("/status", getMessage)
    router.post("/doctors/login", loginDoctor)
    router.post("/patients/login", loginPatient)
    router.post("/patients/signup", createPatient)
    router.post("/doctors/signup", createDoctor)
    router.post("/feedback", createFeedback)
    router.post("/prescriptions", createPrescription)
    router.put("/patients/update", updatePatient)
    router.post("/patients/update", updatePatient)
    router.put("/doctors/update", updateDoctor)
    router.post("/doctors/update", updateDoctor)
    router.get("/doctors/calendar/:doctorId", getDoctorAppointments)
    router.get("/patients/calendar/:patientId", getPatientAppointments)
    router.post("/patients/appointments", createAppointment)
    router.post("/patients/:patientId/mark-past-as-no-show", markPastAppointmentsAsNoShow)
    router.get("/patients/past-appointments/:patientId", getPatientPastAppointments)
    router.post("/appointments/past", getPatientPastAppointments)
    router.get("/search/suggestions", SearchDoctors.fetchSuggestions)
    router.get("/search/doctors", SearchDoctors.fetchDoctors)
    router.get("/doctors", getDoctors)
    router.get("/drugs/suggestions", SearchDrugs.fetchDrugSuggestions)
    router.get("/drugs/details", SearchDrugs.fetchDrugDetails)
    router.get("/patients/:patientId/prescriptions", getPatientPrescriptions)
    router.get("/patients/:patientId/prescription-trends", getPrescriptionTrends)
    router.get("/patients/:patientId/vaccines/recommendations", getVaccineRecommendations)
    router.get("/vaccines/recommendations", getVaccinesByAgeGender)
    router.post("/vaccines/save-check", saveVaccineCheckLog)
    router.get("/vaccines/check-history", getVaccineCheckHistory)
    router.get('/doctors/:doctorId/patients', getDoctorPatients)
    router.get('/doctors/:doctorId/completed-appointments', getDoctorCompletedAppointments)
    router.get('/doctors/:doctorId/audit-logs', getAppointmentAuditLog)
    router.get("/symptoms/suggestions", SymptomAnalysis.fetchSymptomSuggestions)
    router.post("/analyze-symptoms", SymptomAnalysis.analyzeSymptoms)
    router.post("/feedback/update", updateFeedback)
    router.get("/patients/symptom-search", (req, res) => {
      req.body = { symptoms: req.query.query || '' }
      return SymptomAnalysis.analyzeSymptoms(req, res)
    })
    router.get("/symptom-search", (req, res) => {
      req.body = { symptoms: req.query.query || '' }
      return SymptomAnalysis.analyzeSymptoms(req, res)
    })
    router.put("/patients/appointments/:appointmentId", updateAppointment)
    router.delete("/patients/appointments/:appointmentId", deleteAppointment)
    router.put("/appointments/:appointmentId/status", updateAppointmentStatus)

    app.use("/api", router)
    
    // Listen on 0.0.0.0 for Cloud Run (required for external access)
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server is running on port ${PORT}`)
      console.log(`Server is listening on 0.0.0.0:${PORT}`)
    })
  } catch (error) {
    console.error("Error starting server:", error)
    console.error("Error message:", error.message)
    console.error("Error stack:", error.stack)
    // Don't exit immediately - give time for logs to be sent to Cloud Run
    setTimeout(() => {
      console.error("Exiting due to startup error")
      process.exit(1)
    }, 5000)
  }
}

startServer()
