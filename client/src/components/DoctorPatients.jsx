import React, { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import axios from "axios"
import DoctorNav from "./DoctorNav"
import "./App.css"
import { API_BASE_URL } from "../config"

export default function DoctorPatients() {
  const location = useLocation()
  const navigate = useNavigate()
  const doctor = location?.state?.doctor

  const [patients, setPatients] = useState([])
  const [scheduledAppointments, setScheduledAppointments] = useState([])
  const [completedAppointments, setCompletedAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updatingStatus, setUpdatingStatus] = useState({})

  useEffect(() => {
    if (!doctor) {
      navigate("/")
      return
    }

    const fetchPatients = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch all appointments to get scheduled ones separately
        const appointmentsRes = await axios.get(`${API_BASE_URL}/api/doctors/calendar/${doctor.DoctorID}`)
        const allAppointments = appointmentsRes.data.appointments || []
        
        // Filter scheduled appointments - each one separately
        const scheduled = allAppointments.filter(app => app.Status === 'Scheduled')
        setScheduledAppointments(scheduled)
        
        // Fetch patient list for reference (if needed)
        const res = await axios.get(`${API_BASE_URL}/api/doctors/${doctor.DoctorID}/patients`)
        setPatients(res.data.patients || [])
        
        // Fetch completed appointments (one per appointment)
        const completedRes = await axios.get(`${API_BASE_URL}/api/doctors/${doctor.DoctorID}/completed-appointments`)
        console.log('Completed appointments response:', completedRes.data)
        setCompletedAppointments(completedRes.data.appointments || [])
      } catch (err) {
        const msg = err?.response?.data?.message || err.message || "Failed to load patients."
        setError(msg)
      } finally {
        setLoading(false)
      }
    }

    // Always start at top and then load data
    window.scrollTo({ top: 0, behavior: "smooth" })
    fetchPatients()
  }, [doctor, navigate])

  if (!doctor) {
    return null
  }

  const handleMarkAsCompleted = async (appointmentId, patientId) => {
    setUpdatingStatus(prev => ({ ...prev, [appointmentId]: true }))
    
    try {
      await axios.put(`${API_BASE_URL}/api/appointments/${appointmentId}/status`, {
        status: "Completed"
      })
      
      // Refresh the appointments, patients list and completed appointments
      const appointmentsRes = await axios.get(`${API_BASE_URL}/api/doctors/calendar/${doctor.DoctorID}`)
      const allAppointments = appointmentsRes.data.appointments || []
      const scheduled = allAppointments.filter(app => app.Status === 'Scheduled')
      setScheduledAppointments(scheduled)
      
      const res = await axios.get(`${API_BASE_URL}/api/doctors/${doctor.DoctorID}/patients`)
      setPatients(res.data.patients || [])
      const completedRes = await axios.get(`${API_BASE_URL}/api/doctors/${doctor.DoctorID}/completed-appointments`)
      setCompletedAppointments(completedRes.data.appointments || [])
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || "Failed to mark appointment as completed."
      alert('Error: ' + msg)
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [appointmentId]: false }))
    }
  }

  return (
    <div className="App">
      <DoctorNav doctor={doctor} currentPage="patients" />

      <section className="features" style={{ paddingTop: "4rem", minHeight: "60vh" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
          <h2 className="section-title">Patients</h2>
          <p style={{ color: "var(--text-light)", marginBottom: "2rem", textAlign: "center" }}>
            View scheduled and completed patients based on your appointments.
          </p>

          {loading && (
            <p style={{ textAlign: "center", color: "var(--text-light)" }}>
              Loading patients...
            </p>
          )}

          {error && !loading && (
            <p style={{ textAlign: "center", color: "#b91c1c", fontWeight: 500 }}>
              {error}
            </p>
          )}

          {!loading && !error && patients.length === 0 && (
            <p style={{ textAlign: "center", color: "var(--text-light)" }}>
              No patients found yet.
            </p>
          )}

          {!loading && !error && (
            <>
              {/* Scheduled Appointments - Each appointment separately */}
              <h3 className="section-title" style={{ marginTop: "1rem", fontSize: "1.5rem" }}>Scheduled</h3>
              {scheduledAppointments.length === 0 ? (
                <p style={{ textAlign: "center", color: "var(--text-light)", marginBottom: "1.5rem" }}>
                  No scheduled appointments.
                </p>
              ) : (
                <div className="features-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
                  {scheduledAppointments.map((appointment) => {
                    // Find patient info for this appointment
                    const patientInfo = patients.find(p => p.PatientID === appointment.PatientID) || {}
                    
                    return (
                      <div key={appointment.AppointmentID} className="feature-card" style={{ padding: "1.5rem" }}>
                        <div className="feature-icon" style={{ fontSize: "2.5rem" }}>📅</div>
                        <h3 style={{ marginBottom: "0.5rem" }}>
                          {appointment.PatientFirstName} {appointment.PatientLastName}
                        </h3>
                        <p style={{ marginBottom: "0.25rem", color: "#10b981", fontWeight: "500" }}>
                          Date: {new Date(appointment.Date).toLocaleDateString("en-US")}
                        </p>
                        <p style={{ marginBottom: "0.25rem", color: "#10b981" }}>
                          Time: {appointment.Time ? appointment.Time.substring(0, 5) : "-"}
                        </p>
                        {appointment.Reason && (
                          <p style={{ marginBottom: "0.25rem", color: "#10b981", fontStyle: "italic" }}>
                            Reason: {appointment.Reason}
                          </p>
                        )}
                        <p style={{ marginBottom: "0.25rem", color: "var(--text-light)" }}>
                          Status: {appointment.Status}
                        </p>
                        {patientInfo.LastVisitDate && (
                          <p style={{ marginBottom: "0.25rem", color: "var(--text-light)" }}>
                            Last Visit: {new Date(patientInfo.LastVisitDate).toLocaleDateString("en-US")}
                          </p>
                        )}
                        {patientInfo.Age && (
                          <p style={{ marginBottom: "0.25rem" }}>
                            Age: {patientInfo.Age}
                          </p>
                        )}
                        {patientInfo.Gender && (
                          <p style={{ marginBottom: "0.25rem" }}>
                            Gender: {patientInfo.Gender}
                          </p>
                        )}
                        {patientInfo.Email && (
                          <p style={{ marginBottom: "0.25rem" }}>
                            Email: {patientInfo.Email}
                          </p>
                        )}
                        {patientInfo.Phone && (
                          <p style={{ marginBottom: "0.5rem" }}>
                            Phone: {patientInfo.Phone}
                          </p>
                        )}
                        <button
                          type="button"
                          onClick={() => handleMarkAsCompleted(appointment.AppointmentID, appointment.PatientID)}
                          disabled={updatingStatus[appointment.AppointmentID]}
                          style={{ 
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            padding: "0.75rem 1rem",
                            backgroundColor: updatingStatus[appointment.AppointmentID] ? "#9ca3af" : "#10b981",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            cursor: updatingStatus[appointment.AppointmentID] ? "not-allowed" : "pointer",
                            fontWeight: "600",
                            fontSize: "0.9rem",
                            width: "100%",
                            justifyContent: "center",
                            marginTop: "0.5rem",
                            transition: "background-color 0.2s"
                          }}
                          onMouseEnter={(e) => {
                            if (!updatingStatus[appointment.AppointmentID]) {
                              e.target.style.backgroundColor = "#059669"
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!updatingStatus[appointment.AppointmentID]) {
                              e.target.style.backgroundColor = "#10b981"
                            }
                          }}
                        >
                          <span>✓</span>
                          <span>
                            {updatingStatus[appointment.AppointmentID] ? "Marking..." : "Mark as Completed"}
                          </span>
                        </button>
                        <button
                          className="btn-primary"
                          style={{ marginTop: "0.5rem", width: "100%" }}
                          onClick={() => {
                            // Find full patient object
                            const fullPatient = patients.find(p => p.PatientID === appointment.PatientID)
                            if (fullPatient) {
                              navigate("/doctor/patient-profile", {
                                state: { doctor, patient: fullPatient }
                              })
                            }
                          }}
                        >
                          Go to Profile
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Completed Appointments - One card per appointment */}
              <h3 className="section-title" style={{ marginTop: "1rem", fontSize: "1.5rem" }}>Completed</h3>
              {completedAppointments.length === 0 ? (
                <p style={{ textAlign: "center", color: "var(--text-light)" }}>
                  No completed appointments yet.
                </p>
              ) : (
                <div className="features-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
                  {completedAppointments.map((appointment, idx) => (
                    <div key={`completed-${appointment.AppointmentID}-${idx}`} className="feature-card" style={{ padding: "1.5rem" }}>
                      <div className="feature-icon" style={{ fontSize: "2.5rem" }}>🧑‍⚕️</div>
                      <h3 style={{ marginBottom: "0.5rem" }}>
                        {appointment.FirstName} {appointment.LastName}
                      </h3>
                      
                      {/* Appointment Details */}
                      <div style={{ marginBottom: "1rem", paddingBottom: "0.75rem", borderBottom: "1px solid #e5e7eb" }}>
                        <p style={{ marginBottom: "0.25rem", color: "#6366f1", fontWeight: "600" }}>
                          Appointment Date: {new Date(appointment.AppointmentDate).toLocaleDateString("en-US")}
                        </p>
                        {appointment.AppointmentTime && (
                          <p style={{ marginBottom: "0.25rem", color: "#6366f1" }}>
                            Time: {appointment.AppointmentTime.substring(0, 5)}
                          </p>
                        )}
                        {appointment.AppointmentReason && (
                          <p style={{ marginBottom: "0.25rem", color: "#6366f1", fontStyle: "italic" }}>
                            Reason: {appointment.AppointmentReason}
                          </p>
                        )}
                      </div>
                      
                      {/* Patient Info */}
                      <p style={{ marginBottom: "0.25rem" }}>
                        Age: {appointment.Age ?? "-"}
                      </p>
                      <p style={{ marginBottom: "0.25rem" }}>
                        Gender: {appointment.Gender ?? "-"}
                      </p>
                      <p style={{ marginBottom: "0.25rem" }}>
                        Email: {appointment.Email ?? "-"}
                      </p>
                      <p style={{ marginBottom: "0.5rem" }}>
                        Phone: {appointment.Phone ?? "-"}
                      </p>
                      
                      {/* Prescriptions for this specific appointment */}
                      {appointment.prescriptions && appointment.prescriptions.length > 0 ? (
                        <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #e5e7eb" }}>
                          <h4 style={{ marginBottom: "0.75rem", fontSize: "1rem", fontWeight: "600", color: "#333" }}>
                            Prescriptions:
                          </h4>
                          {appointment.prescriptions.map((presc, prescIdx) => (
                            <div key={prescIdx} style={{ 
                              marginBottom: "0.75rem", 
                              padding: "0.75rem", 
                              backgroundColor: "#f9fafb", 
                              borderRadius: "6px",
                              fontSize: "0.9rem"
                            }}>
                              <p style={{ marginBottom: "0.25rem", fontWeight: "500" }}>
                                <strong>Drug:</strong> {presc.DrugName || presc.DrugID || "N/A"}
                              </p>
                              {presc.Dosage && (
                                <p style={{ marginBottom: "0.25rem" }}>
                                  <strong>Dosage:</strong> {presc.Dosage}
                                </p>
                              )}
                              {presc.Instructions && (
                                <p style={{ marginBottom: "0.25rem" }}>
                                  <strong>Instructions:</strong> {presc.Instructions}
                                </p>
                              )}
                              {presc.DateIssued && (
                                <p style={{ marginBottom: "0.25rem", color: "var(--text-light)", fontSize: "0.85rem" }}>
                                  <strong>Issued:</strong> {new Date(presc.DateIssued).toLocaleDateString("en-US")}
                                </p>
                              )}
                              {presc.FollowUpDate && (
                                <p style={{ marginBottom: "0.25rem", color: "var(--text-light)", fontSize: "0.85rem" }}>
                                  <strong>Follow-up:</strong> {new Date(presc.FollowUpDate).toLocaleDateString("en-US")}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #e5e7eb", color: "var(--text-light)", fontStyle: "italic", fontSize: "0.9rem" }}>
                          No prescriptions for this appointment.
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  )
}


