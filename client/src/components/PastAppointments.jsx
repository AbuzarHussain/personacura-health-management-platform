import React, { useState, useEffect } from "react"
import axios from "axios"
import { useLocation, useNavigate } from "react-router-dom"
import PatientNav from "./PatientNav"
import "./App.css"
import { API_BASE_URL } from "../config"

export default function PastAppointments() {
  const location = useLocation()
  const navigate = useNavigate()
  const patient = location?.state?.patient

  const [pastAppointments, setPastAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [rating, setRating] = useState("")
  const [review, setReview] = useState("")
  const [status, setStatus] = useState(null)

  useEffect(() => {
    if (!patient) {
      navigate("/")
      return
    }
    window.scrollTo({ top: 0, behavior: "smooth" })
    fetchPastAppointments()
  }, [patient, navigate])

  const fetchPastAppointments = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await axios.get(`${API_BASE_URL}/api/patients/past-appointments/${patient.PatientID}`)
      setPastAppointments(res.data.appointments || [])
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setPastAppointments([])
      } else {
        const msg = err?.response?.data?.message || err.message || "Failed to load past appointments."
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRateClick = (appointment) => {
    setSelectedAppointment(appointment)
    setRating("")
    setReview("")
    setStatus(null)
  }

  const submitFeedback = async (e) => {
    e.preventDefault()
    if (!selectedAppointment) return
    
    try {
      const res = await axios.post(`${API_BASE_URL}/api/feedback`, {
        Rating: Number(rating),
        Review: review,
        PatientID: patient.PatientID,
        DoctorID: selectedAppointment.DoctorID 
      })
      console.log (res)
      setStatus({ ok: true, msg: "Thank you! Your feedback was submitted." })
      setSelectedAppointment(null)
      setRating("")
      setReview("")
    } catch (error) {
      console.error(error)
      const msg = error?.response?.data?.message || "Failed to submit feedback. Please try again."
      setStatus({ ok: false, msg })

      
    }

    
  }

  if (!patient) return null

  return (
    <div className="App">
      <PatientNav patient={patient} currentPage="past-appointments" />

      <section className="features" style={{ paddingTop: "4rem", minHeight: "60vh" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
          <button
            onClick={() => {
              navigate("/patient", { state: { patient } })
              setTimeout(() => {
                document.getElementById("quick-actions")?.scrollIntoView({ behavior: "smooth" })
              }, 100)
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 1rem",
              marginBottom: "1.5rem",
              background: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "0.95rem",
              color: "#374151",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f9fafb"
              e.currentTarget.style.borderColor = "#3b82f6"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "white"
              e.currentTarget.style.borderColor = "#e5e7eb"
            }}
          >
            <span>←</span> Back to Dashboard
          </button>
        </div>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
          <h2 className="section-title">Past Appointments</h2>
          <p style={{ color: "var(--text-light)", marginBottom: "2rem", textAlign: "center" }}>
            Review your past appointments and share feedback about your doctors.
          </p>

          {status && (
            <div
              style={{
                padding: "1rem",
                borderRadius: "8px",
                backgroundColor: status.ok ? "#d1fae5" : "#fee2e2",
                color: status.ok ? "#065f46" : "#991b1b",
                textAlign: "center",
                fontWeight: "500",
                marginBottom: "1.5rem"
              }}
            >
              {status.msg}
            </div>
          )}

          {loading && (
            <p style={{ textAlign: "center", color: "var(--text-light)", fontSize: "1.1rem" }}>
              Loading past appointments...
            </p>
          )}

          {error && !loading && (
            <p style={{ textAlign: "center", color: "#b91c1c", fontWeight: 500 }}>
              {error}
            </p>
          )}

          {!loading && !error && pastAppointments.length === 0 && (
            <div style={{ 
              textAlign: "center", 
              padding: "3rem",
              backgroundColor: "white",
              borderRadius: "12px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
            }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📋</div>
              <p style={{ color: "var(--text-light)", fontSize: "1.1rem" }}>
                You have no past appointments.
              </p>
            </div>
          )}

          {!loading && !error && pastAppointments.length > 0 && (
            <div className="features-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem" }}>
              {pastAppointments.map((appointment) => (
                <div key={appointment.AppointmentID} className="feature-card" style={{ padding: "1.5rem", position: "relative" }}>
                  <div className="feature-icon" style={{ fontSize: "2.5rem" }}>🏥</div>
                  <h3 style={{ marginBottom: "0.5rem" }}>
                    Dr. {appointment.DoctorFirstName} {appointment.DoctorLastName}
                  </h3>
                  <p style={{ marginBottom: "0.25rem", color: "var(--text-light)" }}>
                    {appointment.Specialization || "General Practice"}
                  </p>
                  <p style={{ fontWeight: "600", marginBottom: "0.5rem" }}>
                    {new Date(appointment.Date).toLocaleDateString("en-US", { 
                      year: "numeric", 
                      month: "long", 
                      day: "numeric" 
                    })}
                  </p>
                  <p style={{ marginBottom: "0.5rem", color: "#6b7280" }}>
                    Time: {appointment.Time?.substring(0, 5) || "-"}
                  </p>
                  {appointment.Reason && (
                    <p style={{ marginBottom: "0.5rem", color: "#6b7280", fontStyle: "italic" }}>
                      Reason: {appointment.Reason}
                    </p>
                  )}
                  <div style={{
                    padding: "0.5rem",
                    backgroundColor: "#dcfce7",
                    color: "#166534",
                    borderRadius: "6px",
                    marginBottom: "1rem",
                    textAlign: "center",
                    fontSize: "0.9rem",
                    fontWeight: "500"
                  }}>
                    Status: {appointment.Status}
                  </div>
                  
                  {/* Display Prescriptions */}
                  {appointment.prescriptions && appointment.prescriptions.length > 0 && (
                    <div style={{
                      marginTop: "1rem",
                      marginBottom: "1rem",
                      padding: "1rem",
                      backgroundColor: "#f0f9ff",
                      borderRadius: "8px",
                      border: "1px solid #bae6fd"
                    }}>
                      <h4 style={{ marginBottom: "0.75rem", color: "#0369a1", fontSize: "1rem", fontWeight: "600" }}>
                        Prescriptions:
                      </h4>
                      {appointment.prescriptions.map((prescription, idx) => (
                        <div key={prescription.PrescriptionID || idx} style={{
                          marginBottom: idx < appointment.prescriptions.length - 1 ? "1rem" : "0",
                          paddingBottom: idx < appointment.prescriptions.length - 1 ? "1rem" : "0",
                          borderBottom: idx < appointment.prescriptions.length - 1 ? "1px solid #bae6fd" : "none"
                        }}>
                          <p style={{ marginBottom: "0.25rem", fontWeight: "600", color: "#1e40af" }}>
                            {prescription.DrugName || `Drug ID: ${prescription.DrugID}`}
                          </p>
                          {prescription.Dosage && (
                            <p style={{ marginBottom: "0.25rem", fontSize: "0.9rem", color: "#475569" }}>
                              <strong>Dosage:</strong> {prescription.Dosage}
                            </p>
                          )}
                          {prescription.Instructions && (
                            <p style={{ marginBottom: "0.25rem", fontSize: "0.9rem", color: "#475569" }}>
                              <strong>Instructions:</strong> {prescription.Instructions}
                            </p>
                          )}
                          {prescription.FollowUpDate && (
                            <p style={{ marginBottom: "0.25rem", fontSize: "0.9rem", color: "#475569" }}>
                              <strong>Follow-up Date:</strong> {new Date(prescription.FollowUpDate).toLocaleDateString("en-US")}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {(!appointment.prescriptions || appointment.prescriptions.length === 0) && (
                    <p style={{ 
                      marginBottom: "1rem", 
                      color: "#94a3b8", 
                      fontSize: "0.9rem", 
                      fontStyle: "italic",
                      textAlign: "center"
                    }}>
                      No prescriptions for this appointment
                    </p>
                  )}
                  
                  <button
                    className="btn-primary"
                    style={{ width: "100%" }}
                    onClick={() => handleRateClick(appointment)}
                  >
                    Rate This Doctor
                  </button>
                </div>
              ))}
            </div>
          )}

          {selectedAppointment && (
            <div className="feature-card" style={{ padding: "2rem", marginTop: "3rem" }}>
              <h3 style={{ marginBottom: "1rem" }}>
                Rate Dr. {selectedAppointment.DoctorFirstName} {selectedAppointment.DoctorLastName}
              </h3>
              <form onSubmit={submitFeedback} className="login-form">
                <div className="form-group">
                  <label>Rating (1 - 5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Review</label>
                  <textarea
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    placeholder="Share your experience with the doctor..."
                    style={{
                      width: "100%",
                      minHeight: "120px",
                      padding: "0.75rem",
                      border: "1px solid var(--border-color)",
                      borderRadius: "8px",
                      fontFamily: "inherit",
                      fontSize: "1rem"
                    }}
                  />
                </div>
                <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
                  <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                    Submit Feedback
                  </button>
                  <button
                    type="button"
                    style={{ 
                      flex: 1,
                      padding: "0.75rem 2rem",
                      borderRadius: "8px",
                      backgroundColor: "white",
                      color: "#6b7280",
                      border: "1px solid #e5e7eb",
                      fontWeight: "600",
                      cursor: "pointer",
                      transition: "all 0.3s"
                    }}
                    onClick={() => {
                      setSelectedAppointment(null)
                      setRating("")
                      setReview("")
                      setStatus(null)
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </section>

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h3>Personacura</h3>
            <p>Your trusted healthcare management platform</p>
          </div>
          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li>
                <button 
                  className="footer-link-btn"
                  onClick={() => navigate("/patient", { state: { patient } })}
                >
                  User Info
                </button>
              </li>
              <li>
                <button 
                  className="footer-link-btn"
                  onClick={() => navigate("/appointments", { state: { patient } })}
                >
                  Appointments
                </button>
              </li>
              <li>
                <button 
                  className="footer-link-btn"
                  onClick={() => navigate("/past-appointments", { state: { patient } })}
                >
                  Past Appointments
                </button>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2024 Personacura. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}