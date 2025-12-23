import React, { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import axios from "axios"
import DoctorNav from "./DoctorNav"
import "./App.css"
import { API_BASE_URL } from "../config"

export default function DoctorAppointments() {
  const location = useLocation()
  const navigate = useNavigate()
  const doctor = location?.state?.doctor

  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updatingStatus, setUpdatingStatus] = useState({})

  useEffect(() => {
    if (!doctor) {
      navigate("/")
      return
    }

    const fetchAppointments = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await axios.get(`${API_BASE_URL}/api/doctors/calendar/${doctor.DoctorID}`)
        const allApps = res.data.appointments || []

        // Only show Scheduled appointments (regardless of date/time)
        const upcoming = allApps.filter(app => {
          return app.Status === "Scheduled"
        })
        console.log("All appointments:", allApps)
        console.log("Scheduled appointments:", upcoming)
        setAppointments(upcoming)
      } catch (err) {
        const msg = err?.response?.data?.message || err.message || "Failed to load appointments."
        setError(msg)
      } finally {
        setLoading(false)
      }
    }

    window.scrollTo({ top: 0, behavior: "smooth" })
    fetchAppointments()
  }, [doctor, navigate])

  const handleMarkAsCompleted = async (appointmentId) => {
    setUpdatingStatus(prev => ({ ...prev, [appointmentId]: true }))
    
    try {
      await axios.put(`${API_BASE_URL}/api/appointments/${appointmentId}/status`, {
        status: "Completed"
      })
      
      // Refresh the appointments list
      const res = await axios.get(`${API_BASE_URL}/api/doctors/calendar/${doctor.DoctorID}`)
      const allApps = res.data.appointments || []
      
      // Only show Scheduled appointments
      const upcoming = allApps.filter(app => {
        return app.Status === "Scheduled"
      })
      setAppointments(upcoming)
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || "Failed to mark appointment as completed."
      alert('Error: ' + msg)
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [appointmentId]: false }))
    }
  }

  if (!doctor) {
    return null
  }

  return (
    <div className="App">
      <DoctorNav doctor={doctor} currentPage="appointments-list" />

      <section className="features" style={{ paddingTop: "4rem", minHeight: "60vh" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
          <h2 className="section-title">Upcoming Appointments</h2>
          <p style={{ color: "var(--text-light)", marginBottom: "2rem", textAlign: "center" }}>
            View all your upcoming appointments with patient details.
          </p>

          {loading && (
            <p style={{ textAlign: "center", color: "var(--text-light)" }}>
              Loading appointments...
            </p>
          )}

          {error && !loading && (
            <p style={{ textAlign: "center", color: "#b91c1c", fontWeight: 500 }}>
              {error}
            </p>
          )}

          {!loading && !error && appointments.length === 0 && (
            <p style={{ textAlign: "center", color: "var(--text-light)" }}>
              You have no upcoming appointments.
            </p>
          )}

          {!loading && !error && appointments.length > 0 && (
            <div className="features-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
              {appointments.map(app => (
                <div key={app.AppointmentID} className="feature-card" style={{ padding: "1.5rem" }}>
                  <div className="feature-icon" style={{ fontSize: "2.5rem" }}>📅</div>
                  <h3 style={{ marginBottom: "0.5rem" }}>
                    {app.PatientFirstName} {app.PatientLastName}
                  </h3>
                  <p style={{ marginBottom: "0.25rem", color: "var(--text-light)" }}>
                    Date: {new Date(app.Date).toLocaleDateString("en-US")}
                  </p>
                  <p style={{ marginBottom: "0.25rem" }}>
                    Time: {app.Time?.substring(0, 5) || "-"}
                  </p>
                  <p style={{ marginBottom: "0.25rem" }}>
                    Status: {app.Status}
                  </p>
                  <p style={{ marginBottom: "0.25rem" }}>
                    Reason: {app.Reason || "-"}
                  </p>
                  <div style={{ 
                    marginTop: "1rem", 
                    paddingTop: "1rem", 
                    borderTop: "2px solid #e5e7eb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    <button
                      type="button"
                      onClick={() => handleMarkAsCompleted(app.AppointmentID)}
                      disabled={updatingStatus[app.AppointmentID]}
                      style={{ 
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.75rem 1.5rem",
                        backgroundColor: updatingStatus[app.AppointmentID] ? "#9ca3af" : "#10b981",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        cursor: updatingStatus[app.AppointmentID] ? "not-allowed" : "pointer",
                        fontWeight: "600",
                        fontSize: "0.95rem",
                        width: "100%",
                        justifyContent: "center",
                        transition: "background-color 0.2s"
                      }}
                      onMouseEnter={(e) => {
                        if (!updatingStatus[app.AppointmentID]) {
                          e.target.style.backgroundColor = "#059669"
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!updatingStatus[app.AppointmentID]) {
                          e.target.style.backgroundColor = "#10b981"
                        }
                      }}
                    >
                      <span>✓</span>
                      <span>
                        {updatingStatus[app.AppointmentID] ? "Marking as completed..." : "Mark as Completed"}
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}


