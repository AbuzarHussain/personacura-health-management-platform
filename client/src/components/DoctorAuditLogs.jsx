import React, { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import axios from "axios"
import DoctorNav from "./DoctorNav"
import "./App.css"
import { API_BASE_URL } from "../config"

export default function DoctorAuditLogs() {
  const location = useLocation()
  const navigate = useNavigate()
  const doctor = location?.state?.doctor

  const [auditLogs, setAuditLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!doctor) {
      navigate("/")
      return
    }

    const fetchAuditLogs = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await axios.get(`${API_BASE_URL}/api/doctors/${doctor.DoctorID}/audit-logs`)
        setAuditLogs(res.data.auditLogs || [])
      } catch (err) {
        const msg = err?.response?.data?.message || err.message || "Failed to load audit logs."
        setError(msg)
        console.error("Error fetching audit logs:", err)
      } finally {
        setLoading(false)
      }
    }

    window.scrollTo({ top: 0, behavior: "smooth" })
    fetchAuditLogs()
  }, [doctor, navigate])

  if (!doctor) {
    return null
  }

  return (
    <div className="App">
      <DoctorNav doctor={doctor} currentPage="audit-logs" />

      <section className="features" style={{ paddingTop: "4rem", minHeight: "60vh" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
          <h2 className="section-title">Appointment Completion Logs</h2>
          <p style={{ color: "var(--text-light)", marginBottom: "2rem", textAlign: "center" }}>
            Automatic audit trail of appointments marked as completed (triggered by database trigger).
          </p>

          {loading && (
            <p style={{ textAlign: "center", color: "var(--text-light)" }}>
              Loading audit logs...
            </p>
          )}

          {error && !loading && (
            <div style={{ 
              textAlign: "center", 
              padding: "1rem",
              backgroundColor: "#fee2e2",
              color: "#991b1b",
              borderRadius: "8px",
              marginBottom: "2rem"
            }}>
              <p style={{ fontWeight: 500 }}>Error: {error}</p>
              {error.includes("table not found") && (
                <p style={{ fontSize: "0.9rem", marginTop: "0.5rem" }}>
                  Please run the SQL script: <code>server/sql/createAppointmentAuditTrigger.sql</code>
                </p>
              )}
            </div>
          )}

          {!loading && !error && auditLogs.length === 0 && (
            <div style={{ 
              textAlign: "center", 
              padding: "2rem",
              backgroundColor: "#f9fafb",
              borderRadius: "8px"
            }}>
              <p style={{ color: "var(--text-light)", fontSize: "1.1rem" }}>
                No audit logs found yet.
              </p>
              <p style={{ color: "var(--text-light)", marginTop: "0.5rem", fontSize: "0.9rem" }}>
                Logs will appear here automatically when you mark appointments as completed.
              </p>
            </div>
          )}

          {!loading && !error && auditLogs.length > 0 && (
            <div style={{ marginTop: "2rem" }}>
              <p style={{ 
                marginBottom: "1rem", 
                color: "var(--text-light)",
                fontSize: "0.9rem"
              }}>
                Total logs: <strong>{auditLogs.length}</strong>
              </p>
              
              <div className="features-grid" style={{ 
                gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", 
                gap: "1.5rem" 
              }}>
                {auditLogs.map((log) => (
                  <div key={log.LogID} className="feature-card" style={{ padding: "1.5rem" }}>
                    <div className="feature-icon" style={{ fontSize: "2.5rem" }}>📋</div>
                    <h3 style={{ marginBottom: "0.5rem", fontSize: "1.1rem" }}>
                      Log #{log.LogID}
                    </h3>
                    
                    <div style={{ marginBottom: "0.75rem", paddingBottom: "0.75rem", borderBottom: "1px solid #e5e7eb" }}>
                      <p style={{ marginBottom: "0.25rem", fontWeight: "600", color: "#6366f1" }}>
                        Patient: {log.PatientFirstName} {log.PatientLastName}
                      </p>
                      <p style={{ marginBottom: "0.25rem", fontSize: "0.9rem" }}>
                        <strong>Appointment ID:</strong> {log.AppointmentID}
                      </p>
                      <p style={{ marginBottom: "0.25rem", fontSize: "0.9rem" }}>
                        <strong>Date:</strong> {new Date(log.AppointmentDate).toLocaleDateString("en-US")}
                      </p>
                      {log.AppointmentTime && (
                        <p style={{ marginBottom: "0.25rem", fontSize: "0.9rem" }}>
                          <strong>Time:</strong> {log.AppointmentTime.substring(0, 5)}
                        </p>
                      )}
                    </div>

                    <div style={{ marginBottom: "0.75rem" }}>
                      <p style={{ marginBottom: "0.25rem", fontSize: "0.9rem" }}>
                        <strong>Status Change:</strong>{" "}
                        <span style={{ 
                          color: log.OldStatus ? "#f59e0b" : "#9ca3af",
                          textDecoration: "line-through"
                        }}>
                          {log.OldStatus || "N/A"}
                        </span>
                        {" → "}
                        <span style={{ color: "#10b981", fontWeight: "600" }}>
                          {log.NewStatus}
                        </span>
                      </p>
                      <p style={{ marginBottom: "0.25rem", fontSize: "0.9rem", color: "var(--text-light)" }}>
                        <strong>Completed At:</strong> {new Date(log.ChangedAt).toLocaleString("en-US")}
                      </p>
                    </div>

                    {log.Notes && (
                      <div style={{ 
                        marginTop: "0.75rem", 
                        paddingTop: "0.75rem", 
                        borderTop: "1px solid #e5e7eb" 
                      }}>
                        <p style={{ fontSize: "0.85rem", color: "var(--text-light)", fontStyle: "italic" }}>
                          {log.Notes}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

