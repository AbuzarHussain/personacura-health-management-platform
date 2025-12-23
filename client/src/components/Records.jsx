import React, { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import axios from "axios"
import PatientNav from "./PatientNav"
import "./App.css"
import { API_BASE_URL } from "../config"

export default function Records() {
  const location = useLocation()
  const navigate = useNavigate()
  const patient = location?.state?.patient

  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  if (!patient) {
    navigate("/")
    return null
  }

  // Always start at top when visiting Records page
  useEffect(() => {
    if (!patient) return
    window.scrollTo({ top: 0, behavior: "smooth" })

    const fetchPrescriptions = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await axios.get(`${API_BASE_URL}/api/patients/${patient.PatientID}/prescriptions`)
        setPrescriptions(res.data.prescriptions || [])
      } catch (err) {
        const msg = err?.response?.data?.message || err.message || "Failed to load records."
        setError(msg)
      } finally {
        setLoading(false)
      }
    }

    fetchPrescriptions()
  }, [patient])

  return (
    <div className="App">
      <PatientNav patient={patient} currentPage="records" />

      <section className="features" style={{ paddingTop: "4rem", minHeight: "60vh" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "2rem" }}>
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
          <h2 className="section-title">Medical Records</h2>
          <p style={{ color: "var(--text-light)", marginTop: "1rem", marginBottom: "2rem", textAlign: "center" }}>
            View prescriptions that your doctors have added for you.
          </p>

          {loading && (
            <p style={{ textAlign: "center", color: "var(--text-light)" }}>
              Loading records...
            </p>
          )}

          {error && !loading && (
            <p style={{ textAlign: "center", color: "#b91c1c", fontWeight: 500 }}>
              {error}
            </p>
          )}

          {!loading && !error && prescriptions.length === 0 && (
            <p style={{ textAlign: "center", color: "var(--text-light)" }}>
              No prescriptions found yet.
            </p>
          )}

          {!loading && !error && prescriptions.length > 0 && (
            <div className="features-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
              {prescriptions.map((pr) => {
                // Format time for display
                const formatTime = (time) => {
                  if (!time) return ""
                  const [hours, minutes] = time.split(":")
                  const hour = parseInt(hours)
                  const ampm = hour >= 12 ? "PM" : "AM"
                  const displayHour = hour % 12 || 12
                  return `${displayHour}:${minutes} ${ampm}`
                }

                return (
                  <div key={pr.PrescriptionID} className="feature-card" style={{ padding: "1.5rem", textAlign: "left" }}>
                    <div className="feature-icon" style={{ fontSize: "2.2rem" }}>💊</div>
                    <h3 style={{ marginBottom: "1rem", color: "#1f2937" }}>Prescription #{pr.PrescriptionID}</h3>
                    
                    {/* Drug Information */}
                    <div style={{ marginBottom: "1rem", paddingBottom: "1rem", borderBottom: "1px solid #e5e7eb" }}>
                      <p style={{ marginBottom: "0.5rem", fontWeight: "600", color: "#1f2937" }}>
                        <span style={{ color: "#6b7280" }}>Drug:</span> {pr.DrugName || `Drug ID: ${pr.DrugID || "-"}`}
                      </p>
                      {pr.Dosage && (
                        <p style={{ marginBottom: "0.5rem", color: "#374151" }}>
                          <strong>Dosage:</strong> {pr.Dosage}
                        </p>
                      )}
                      {pr.Instructions && (
                        <p style={{ marginBottom: "0.5rem", color: "#374151" }}>
                          <strong>Instructions:</strong> {pr.Instructions}
                        </p>
                      )}
                    </div>

                    {/* Appointment Information */}
                    {pr.AppointmentID && pr.AppointmentDate && (
                      <div style={{ marginBottom: "1rem", paddingBottom: "1rem", borderBottom: "1px solid #e5e7eb" }}>
                        <p style={{ marginBottom: "0.5rem", fontWeight: "600", color: "#1f2937", fontSize: "0.95rem" }}>
                          📅 Appointment Details
                        </p>
                        <p style={{ marginBottom: "0.4rem", color: "#374151", fontSize: "0.9rem" }}>
                          <strong>Date:</strong> {new Date(pr.AppointmentDate).toLocaleDateString("en-US", { 
                            month: "short", 
                            day: "numeric", 
                            year: "numeric" 
                          })}
                          {pr.AppointmentTime && ` • ${formatTime(pr.AppointmentTime)}`}
                        </p>
                        {pr.AppointmentReason && (
                          <p style={{ marginBottom: "0.4rem", color: "#374151", fontSize: "0.9rem" }}>
                            <strong>Symptom/Reason:</strong> {pr.AppointmentReason}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Doctor Information */}
                    {(pr.DoctorFirstName || pr.DoctorLastName) && (
                      <div style={{ marginBottom: "1rem", paddingBottom: "1rem", borderBottom: "1px solid #e5e7eb" }}>
                        <p style={{ marginBottom: "0.5rem", fontWeight: "600", color: "#1f2937", fontSize: "0.95rem" }}>
                          👨‍⚕️ Prescribed By
                        </p>
                        <p style={{ marginBottom: "0.4rem", color: "#374151", fontSize: "0.9rem" }}>
                          <strong>Doctor:</strong> Dr. {pr.DoctorFirstName || ""} {pr.DoctorLastName || ""}
                        </p>
                        {pr.DoctorSpecialization && (
                          <p style={{ marginBottom: "0.4rem", color: "#374151", fontSize: "0.9rem" }}>
                            <strong>Specialty:</strong> {pr.DoctorSpecialization}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Additional Information */}
                    <div style={{ fontSize: "0.9rem", color: "#6b7280" }}>
                      <p style={{ marginBottom: "0.4rem" }}>
                        <strong>Date Issued:</strong> {pr.DateIssued ? new Date(pr.DateIssued).toLocaleDateString("en-US") : "N/A"}
                      </p>
                      {pr.FollowUpDate && (
                        <p style={{ marginBottom: "0.4rem", color: "#f59e0b", fontWeight: "500" }}>
                          🔔 <strong>Follow-up Date:</strong> {new Date(pr.FollowUpDate).toLocaleDateString("en-US")}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
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
                  onClick={() => {
                    navigate("/patient", { state: { patient } });
                  }}
                >
                  User Info
                </button>
              </li>
              <li>
                <button 
                  className="footer-link-btn"
                  onClick={() => {
                    navigate("/patient", { state: { patient } });
                  }}
                >
                  Quick Actions
                </button>
              </li>
              <li>
                <button 
                  className="footer-link-btn"
                  onClick={() => {
                    navigate("/records", { state: { patient } });
                  }}
                >
                  Records
                </button>
              </li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Contact</h4>
            <p>Email: support@personacura.com</p>
            <p>Phone: (xxx) xxx-xxxx</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2024 Personacura. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

