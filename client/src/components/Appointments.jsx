import React, { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import axios from "axios"
import PatientNav from "./PatientNav"
import "./App.css"
import { API_BASE_URL } from "../config"

export default function Appointments() {
  const location = useLocation()
  const navigate = useNavigate()
  const patient = location?.state?.patient

  const [appointments, setAppointments] = useState([])
  const [missedAppointments, setMissedAppointments] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showUpcoming, setShowUpcoming] = useState(false)
  const [showMissed, setShowMissed] = useState(false)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [doctors, setDoctors] = useState([])
  const [loadingDoctors, setLoadingDoctors] = useState(false)
  const [formData, setFormData] = useState({
    doctorId: '',
    time: '',
    reason: '',
    speciality: '',
    date: ''
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [])

  useEffect(() => {
    if (!patient) {
      navigate("/")
    }
  }, [patient, navigate])

  const fetchUpcomingAppointments = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // First, mark any past scheduled appointments as "No Show"
      try {
        await axios.post(`${API_BASE_URL}/api/patients/${patient.PatientID}/mark-past-as-no-show`)
      } catch (err) {
        console.error("Error marking past appointments:", err)
        // Continue even if this fails
      }
      
      // Then fetch all appointments
      const res = await axios.get(`${API_BASE_URL}/api/patients/calendar/${patient.PatientID}`)
      const allApps = res.data.appointments || []
      
      // Get today's date string in YYYY-MM-DD format (local timezone)
      const today = new Date()
      const year = today.getFullYear()
      const month = String(today.getMonth() + 1).padStart(2, '0')
      const day = String(today.getDate()).padStart(2, '0')
      const todayStr = `${year}-${month}-${day}`
      
      // Separate upcoming and missed appointments
      const upcoming = []
      const missed = []
      
      allApps.forEach(app => {
        const appDateStr = app.Date.includes('T') ? app.Date.split('T')[0] : app.Date
        
        if (app.Status === "No Show") {
          // All "No Show" appointments go to missed
          missed.push(app)
        } else if (app.Status === "Scheduled") {
          // Check if scheduled appointment time has passed
          const appointmentDateTime = new Date(`${app.Date}T${app.Time}`)
          const now = new Date()
          
          if (appointmentDateTime < now) {
            // Past scheduled appointment - should have been marked as No Show, but handle it anyway
            missed.push(app)
          } else {
            // Future scheduled appointment
            upcoming.push(app)
          }
        }
      })
      
      // Sort upcoming by date and time
      upcoming.sort((a, b) => {
        const dateA = a.Date.includes('T') ? a.Date.split('T')[0] : a.Date
        const dateB = b.Date.includes('T') ? b.Date.split('T')[0] : b.Date
        if (dateA !== dateB) {
          return dateA.localeCompare(dateB)
        }
        return (a.Time || '').localeCompare(b.Time || '')
      })
      
      // Sort missed by date and time (most recent first)
      missed.sort((a, b) => {
        const dateA = a.Date.includes('T') ? a.Date.split('T')[0] : a.Date
        const dateB = b.Date.includes('T') ? b.Date.split('T')[0] : b.Date
        if (dateA !== dateB) {
          return dateB.localeCompare(dateA) // Reverse order for missed
        }
        return (b.Time || '').localeCompare(a.Time || '')
      })
      
      setAppointments(upcoming)
      setMissedAppointments(missed)
      setShowUpcoming(true)
      if (missed.length > 0) {
        setShowMissed(true)
      }
      setTimeout(() => {
        document.getElementById("upcoming-section")?.scrollIntoView({ behavior: "smooth" })
      }, 100)
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || "Failed to load appointments."
      setError(msg)
    } finally {
      setLoading(false)
    }
  }
  
  const fetchMissedAppointments = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Mark any past scheduled appointments as "No Show"
      try {
        await axios.post(`${API_BASE_URL}/api/patients/${patient.PatientID}/mark-past-as-no-show`)
      } catch (err) {
        console.error("Error marking past appointments:", err)
      }
      
      // Fetch all appointments
      const res = await axios.get(`${API_BASE_URL}/api/patients/calendar/${patient.PatientID}`)
      const allApps = res.data.appointments || []
      
      // Filter for "No Show" appointments
      const missed = allApps.filter(app => app.Status === "No Show")
      
      // Sort by date and time (most recent first)
      missed.sort((a, b) => {
        const dateA = a.Date.includes('T') ? a.Date.split('T')[0] : a.Date
        const dateB = b.Date.includes('T') ? b.Date.split('T')[0] : b.Date
        if (dateA !== dateB) {
          return dateB.localeCompare(dateA)
        }
        return (b.Time || '').localeCompare(a.Time || '')
      })
      
      setMissedAppointments(missed)
      setShowMissed(true)
      setTimeout(() => {
        document.getElementById("missed-section")?.scrollIntoView({ behavior: "smooth" })
      }, 100)
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || "Failed to load missed appointments."
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const fetchDoctors = async () => {
    setLoadingDoctors(true)
    try {
      const response = await axios.get(`${API_BASE_URL}/api/doctors`)
      setDoctors(response.data.doctors || [])
    } catch (err) {
      console.error('Failed to fetch doctors:', err)
      alert('Failed to load doctors list')
    } finally {
      setLoadingDoctors(false)
    }
  }

  const handleUpdateClick = (appointment) => {
    setSelectedAppointment(appointment)
    setFormData({
      doctorId: appointment.DoctorID.toString(),
      time: appointment.Time?.substring(0, 5) || '',
      reason: appointment.Reason || '',
      speciality: appointment.Specialization || '',
      date: appointment.Date
    })
    fetchDoctors()
    setShowUpdateModal(true)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    if (name === 'doctorId') {
      const selectedDoctor = doctors.find(doc => doc.DoctorID === parseInt(value))
      if (selectedDoctor) {
        setFormData(prev => ({
          ...prev,
          doctorId: value,
          speciality: selectedDoctor.Specialization || ''
        }))
      }
    }
  }

  const handleUpdateSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      await axios.put(`${API_BASE_URL}/api/patients/appointments/${selectedAppointment.AppointmentID}`, {
        patientId: patient.PatientID,
        date: formData.date,
        time: formData.time,
        doctorId: parseInt(formData.doctorId),
        reason: formData.reason,
        speciality: formData.speciality
      })
      setShowUpdateModal(false)
      alert('Appointment updated successfully!')
      await fetchUpcomingAppointments()
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to update appointment."
      alert('Error: ' + msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancelClick = async (appointmentId, isUpcoming = false) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) {
      return
    }

    try {
      await axios.put(`${API_BASE_URL}/api/appointments/${appointmentId}/status`, {
        status: 'Cancelled'
      })
      
      // Remove from the appropriate list based on where it was cancelled
      if (isUpcoming) {
        setAppointments(prev => prev.filter(app => app.AppointmentID !== appointmentId))
      } else {
        setMissedAppointments(prev => prev.filter(app => app.AppointmentID !== appointmentId))
      }
      alert('Appointment cancelled successfully!')
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to cancel appointment."
      alert('Error: ' + msg)
    }
  }

  const handleDeleteClick = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to delete this appointment?')) {
      return
    }

    try {
      await axios.delete(`${API_BASE_URL}/api/patients/appointments/${appointmentId}`)
      
      setAppointments(prev => prev.filter(app => app.AppointmentID !== appointmentId))
      setMissedAppointments(prev => prev.filter(app => app.AppointmentID !== appointmentId))
      alert('Appointment deleted successfully!')
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to delete appointment."
      alert('Error: ' + msg)
    }
  }

  if (!patient) {
    return null
  }

  return (
    <div className="App">
      <PatientNav patient={patient} currentPage="appointments" />
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
          <h2 className="section-title">Appointments</h2>
          <p style={{ color: "var(--text-light)", marginBottom: "3rem", textAlign: "center" }}>
            Manage your appointments and schedule new ones
          </p>

          <div className="features-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem" }}>
            <div className="feature-card" id="book-appointment" style={{ cursor: "pointer", transition: "transform 0.3s" }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-5px)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
            >
              <div className="feature-icon" style={{ fontSize: "3rem" }}>📅</div>
              <h3>Book an Appointment</h3>
              <p>Schedule a new appointment with a healthcare professional</p>
              <button 
                className="btn-primary" 
                style={{ marginTop: "1rem", width: "100%" }}
                onClick={() => navigate("/patient/calendar", { state: { patient } })}
              >
                Book Now
              </button>
            </div>
            <div className="feature-card" id="upcoming-appointments" style={{ cursor: "pointer", transition: "transform 0.3s" }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-5px)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
            >
              <div className="feature-icon" style={{ fontSize: "3rem" }}>⏰</div>
              <h3>My Upcoming Appointments</h3>
              <p>View and manage your scheduled appointments</p>
              <button 
                className="btn-primary" 
                style={{ marginTop: "1rem", width: "100%" }}
                onClick={fetchUpcomingAppointments}
              >
                View Upcoming
              </button>
            </div>
            <div className="feature-card" id="missed-appointments" style={{ cursor: "pointer", transition: "transform 0.3s" }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-5px)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
            >
              <div className="feature-icon" style={{ fontSize: "3rem" }}>⚠️</div>
              <h3>Missed Appointments</h3>
              <p>View appointments you missed</p>
              <button 
                className="btn-primary" 
                style={{ marginTop: "1rem", width: "100%" }}
                onClick={fetchMissedAppointments}
              >
                View Missed
              </button>
            </div>
            <div className="feature-card" id="past-appointments" style={{ cursor: "pointer", transition: "transform 0.3s" }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-5px)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
            >
              <div className="feature-icon" style={{ fontSize: "3rem" }}>📋</div>
              <h3>Past Appointments</h3>
              <p>Review your appointment history</p>
              <button 
                className="btn-primary" 
                style={{ marginTop: "1rem", width: "100%" }}
                onClick={() => navigate("/past-appointments", { state: { patient } })}
              >
                View History
              </button>
            </div>
          </div>
        </div>
      </section>

      {showUpcoming && (
        <section id="upcoming-section" className="features" style={{ paddingTop: "2rem", paddingBottom: "4rem", backgroundColor: "#f9fafb" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
              <h2 className="section-title" style={{ marginBottom: 0 }}>Your Upcoming Appointments</h2>
              <button
                onClick={() => setShowUpcoming(false)}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "#e5e7eb",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "500"
                }}
              >
                Hide
              </button>
            </div>

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
              <div style={{ 
                textAlign: "center", 
                padding: "3rem",
                backgroundColor: "white",
                borderRadius: "12px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
              }}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📭</div>
                <p style={{ color: "var(--text-light)", fontSize: "1.1rem" }}>
                  You have no upcoming appointments.
                </p>
                <button 
                  className="btn-primary" 
                  style={{ marginTop: "1rem" }}
                  onClick={() => navigate("/patient/calendar", { state: { patient } })}
                >
                  Book an Appointment
                </button>
              </div>
            )}

            {!loading && !error && appointments.length > 0 && (
              <div className="features-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
                {appointments.map(app => (
                  <div key={app.AppointmentID} className="feature-card" style={{ padding: "1.5rem", backgroundColor: "white" }}>
                    <div className="feature-icon" style={{ fontSize: "2.5rem" }}>📅</div>
                    <h3 style={{ marginBottom: "0.5rem", color: "#1e40af" }}>
                      Dr. {app.DoctorFirstName} {app.DoctorLastName}
                    </h3>
                    <p style={{ marginBottom: "0.5rem", color: "var(--text-light)", fontSize: "0.9rem" }}>
                      <strong>Specialty:</strong> {app.Specialization || "-"}
                    </p>
                    <div style={{ 
                      borderTop: "1px solid #e5e7eb", 
                      marginTop: "1rem", 
                      paddingTop: "1rem" 
                    }}>
                      <p style={{ marginBottom: "0.25rem", display: "flex", justifyContent: "space-between" }}>
                        <strong>Date:</strong> 
                        <span>{new Date(app.Date).toLocaleDateString("en-US", { 
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}</span>
                      </p>
                      <p style={{ marginBottom: "0.25rem", display: "flex", justifyContent: "space-between" }}>
                        <strong>Time:</strong> 
                        <span>{app.Time?.substring(0, 5) || "-"}</span>
                      </p>
                      <p style={{ marginBottom: "0.25rem", display: "flex", justifyContent: "space-between" }}>
                        <strong>Status:</strong> 
                        <span style={{ 
                          backgroundColor: "#dcfce7", 
                          color: "#166534",
                          padding: "0.25rem 0.75rem",
                          borderRadius: "12px",
                          fontSize: "0.85rem",
                          fontWeight: "500"
                        }}>
                          {app.Status}
                        </span>
                      </p>
                      <p style={{ marginTop: "0.75rem", color: "var(--text-light)" }}>
                        <strong>Reason:</strong> {app.Reason || "-"}
                      </p>
                    </div>
                    
                    <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
                      <button
                        onClick={() => handleUpdateClick(app)}
                        style={{
                          flex: 1,
                          padding: "0.5rem",
                          backgroundColor: "#3b82f6",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontWeight: "500",
                          fontSize: "0.9rem"
                        }}
                      >
                        Update
                      </button>
                      <button
                        onClick={() => handleCancelClick(app.AppointmentID, true)}
                        style={{
                          flex: 1,
                          padding: "0.5rem",
                          backgroundColor: "#f59e0b",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontWeight: "500",
                          fontSize: "0.9rem"
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {showMissed && (
        <section id="missed-section" className="features" style={{ paddingTop: "2rem", paddingBottom: "4rem", backgroundColor: "#fef2f2" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
              <h2 className="section-title" style={{ marginBottom: 0 }}>Missed Appointments</h2>
              <button
                onClick={() => setShowMissed(false)}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "#e5e7eb",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "500"
                }}
              >
                Hide
              </button>
            </div>

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

            {!loading && !error && missedAppointments.length === 0 && (
              <div style={{ 
                textAlign: "center", 
                padding: "3rem",
                backgroundColor: "white",
                borderRadius: "12px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
              }}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✅</div>
                <p style={{ color: "var(--text-light)", fontSize: "1.1rem" }}>
                  You have no missed appointments.
                </p>
              </div>
            )}

            {!loading && !error && missedAppointments.length > 0 && (
              <div className="features-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
                {missedAppointments.map(app => (
                  <div key={app.AppointmentID} className="feature-card" style={{ padding: "1.5rem", backgroundColor: "white", border: "2px solid #fca5a5" }}>
                    <div className="feature-icon" style={{ fontSize: "2.5rem" }}>⚠️</div>
                    <h3 style={{ marginBottom: "0.5rem", color: "#dc2626" }}>
                      Dr. {app.DoctorFirstName} {app.DoctorLastName}
                    </h3>
                    <p style={{ marginBottom: "0.5rem", color: "var(--text-light)", fontSize: "0.9rem" }}>
                      <strong>Specialty:</strong> {app.Specialization || "-"}
                    </p>
                    <div style={{ 
                      borderTop: "1px solid #e5e7eb", 
                      marginTop: "1rem", 
                      paddingTop: "1rem" 
                    }}>
                      <p style={{ marginBottom: "0.25rem", display: "flex", justifyContent: "space-between" }}>
                        <strong>Date:</strong> 
                        <span>{new Date(app.Date).toLocaleDateString("en-US", { 
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}</span>
                      </p>
                      <p style={{ marginBottom: "0.25rem", display: "flex", justifyContent: "space-between" }}>
                        <strong>Time:</strong> 
                        <span>{app.Time?.substring(0, 5) || "-"}</span>
                      </p>
                      <p style={{ marginBottom: "0.25rem", display: "flex", justifyContent: "space-between" }}>
                        <strong>Status:</strong> 
                        <span style={{ 
                          backgroundColor: "#fee2e2", 
                          color: "#991b1b",
                          padding: "0.25rem 0.75rem",
                          borderRadius: "12px",
                          fontSize: "0.85rem",
                          fontWeight: "500"
                        }}>
                          {app.Status}
                        </span>
                      </p>
                      <p style={{ marginTop: "0.75rem", color: "var(--text-light)" }}>
                        <strong>Reason:</strong> {app.Reason || "-"}
                      </p>
                    </div>
                    
                    <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
                      <button
                        onClick={() => handleCancelClick(app.AppointmentID, false)}
                        style={{
                          width: "100%",
                          padding: "0.5rem",
                          backgroundColor: "#f59e0b",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontWeight: "500",
                          fontSize: "0.9rem"
                        }}
                      >
                        Cancel Appointment
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {showUpdateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
          }}>
            <h2 style={{ marginBottom: '1.5rem', color: '#333', fontSize: '1.5rem' }}>
              Update Appointment
            </h2>
            
            <form onSubmit={handleUpdateSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#555' }}>
                  Date *
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#555' }}>
                  Select Doctor *
                </label>
                {loadingDoctors ? (
                  <div style={{ padding: '0.75rem', color: '#666' }}>Loading doctors...</div>
                ) : (
                  <select
                    name="doctorId"
                    value={formData.doctorId}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '1rem',
                      backgroundColor: 'white'
                    }}
                  >
                    <option value="">-- Choose a doctor --</option>
                    {doctors.map(doctor => (
                      <option key={doctor.DoctorID} value={doctor.DoctorID}>
                        Dr. {doctor.FirstName} {doctor.LastName} - {doctor.Specialization}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#555' }}>
                  Time *
                </label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#555' }}>
                  Speciality *
                </label>
                <input
                  type="text"
                  name="speciality"
                  value={formData.speciality}
                  onChange={handleInputChange}
                  required
                  readOnly
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    backgroundColor: '#f9f9f9',
                    cursor: 'not-allowed'
                  }}
                  placeholder="Auto-filled when doctor is selected"
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#555' }}>
                  Reason *
                </label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  required
                  rows="4"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    resize: 'vertical'
                  }}
                  placeholder="Describe the reason for your visit"
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowUpdateModal(false)}
                  disabled={submitting}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    color: '#666',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    fontSize: '1rem',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    fontWeight: '500',
                    opacity: submitting ? 0.7 : 1
                  }}
                >
                  {submitting ? 'Updating...' : 'Update Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
              <li>
                <button 
                  className="footer-link-btn"
                  onClick={() => navigate("/records", { state: { patient } })}
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