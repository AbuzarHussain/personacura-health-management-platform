import React, { useState, useEffect, useCallback } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import axios from "axios"
import PatientNav from "./PatientNav"
import "./App.css"
import { API_BASE_URL } from "../config"

export default function HealthTimeline() {
  const location = useLocation()
  const navigate = useNavigate()
  const patient = location?.state?.patient

  const [timelineItems, setTimelineItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [filter, setFilter] = useState("All") // All, Past, Upcoming

  // Fetch health data
  const fetchHealthData = useCallback(async () => {
    if (!patient) return

    try {
      setLoading(true)

      // First, mark past scheduled appointments as No Show
      try {
        await axios.post(`${API_BASE_URL}/api/patients/${patient.PatientID}/mark-past-as-no-show`)
      } catch (err) {
        console.error("Error marking past appointments:", err)
      }

      // Fetch appointments and prescriptions in parallel
      const [appointmentsRes, prescriptionsRes] = await Promise.allSettled([
        axios.get(`${API_BASE_URL}/api/patients/calendar/${patient.PatientID}`),
        axios.get(`${API_BASE_URL}/api/patients/${patient.PatientID}/prescriptions`)
      ])

      // Extract data from successful requests
      const allAppointments = appointmentsRes.status === 'fulfilled'
        ? (appointmentsRes.value.data.appointments || [])
        : []

      const allPrescriptions = prescriptionsRes.status === 'fulfilled'
        ? (prescriptionsRes.value.data.prescriptions || [])
        : []

      // Filter out No Show and Cancelled appointments
      const validAppointments = allAppointments.filter(
        app => app.Status !== 'No Show' && app.Status !== 'Cancelled'
      )

      // Get current date/time for comparison
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

      // Transform appointments into timeline items
      const appointmentItems = validAppointments.map(app => {
        const appointmentDate = new Date(app.Date)
        const appointmentDateTime = new Date(`${app.Date}T${app.Time}`)
        const isPast = appointmentDateTime < now
        const isToday = appointmentDate.toDateString() === today.toDateString()

        return {
          id: `apt-${app.AppointmentID}`,
          type: "appointment",
          date: appointmentDate,
          dateTime: appointmentDateTime,
          isPast,
          isUpcoming: !isPast,
          status: app.Status,
          title: `${app.Status === 'Scheduled' ? 'Upcoming' : 'Completed'} Appointment`,
          doctor: `Dr. ${app.DoctorFirstName} ${app.DoctorLastName}`,
          specialization: app.Specialization,
          symptom: app.Reason || 'General checkup',
          time: app.Time,
          appointmentId: app.AppointmentID
        }
      })

      // Create a map of appointments by AppointmentID for quick lookup
      const appointmentMap = new Map()
      validAppointments.forEach(app => {
        appointmentMap.set(app.AppointmentID, app)
      })

      // Transform prescriptions into timeline items
      const prescriptionItems = allPrescriptions.map(presc => {
        const prescriptionDate = new Date(presc.DateIssued)
        const followUpDate = presc.FollowUpDate ? new Date(presc.FollowUpDate) : null
        const isPast = prescriptionDate < now
        const isFollowUpUpcoming = followUpDate && followUpDate >= now

        // Find the related appointment if AppointmentID exists
        const relatedAppointment = presc.AppointmentID ? appointmentMap.get(presc.AppointmentID) : null

        return {
          id: `presc-${presc.PrescriptionID}`,
          type: "prescription",
          date: prescriptionDate,
          dateTime: prescriptionDate,
          isPast,
          isUpcoming: false, // Prescriptions are always past when issued
          drugName: presc.DrugName || `Drug ID: ${presc.DrugID}`,
          dosage: presc.Dosage,
          instructions: presc.Instructions,
          followUpDate: followUpDate,
          isFollowUpUpcoming: isFollowUpUpcoming,
          prescriptionId: presc.PrescriptionID,
          appointmentId: presc.AppointmentID,
          relatedAppointment: relatedAppointment,
          appointmentDate: presc.AppointmentDate || null,
          appointmentTime: presc.AppointmentTime || null,
          appointmentReason: presc.AppointmentReason || null,
          doctorName: presc.DoctorFirstName || presc.DoctorLastName 
            ? `Dr. ${presc.DoctorFirstName || ""} ${presc.DoctorLastName || ""}`.trim()
            : null,
          doctorEmail: presc.DoctorEmail || null,
          doctorPhone: presc.DoctorPhone || null,
          doctorSpecialization: presc.DoctorSpecialization || null
        }
      })

      // Create follow-up visit items from prescriptions
      const followUpItems = allPrescriptions
        .filter(presc => presc.FollowUpDate)
        .map(presc => {
          const followUpDate = new Date(presc.FollowUpDate)
          const isUpcoming = followUpDate >= now

          // Find the related appointment if AppointmentID exists
          const relatedAppointment = presc.AppointmentID ? appointmentMap.get(presc.AppointmentID) : null

          return {
            id: `followup-${presc.PrescriptionID}`,
            type: "followup",
            date: followUpDate,
            dateTime: followUpDate,
            isPast: !isUpcoming,
            isUpcoming: isUpcoming,
            drugName: presc.DrugName || `Drug ID: ${presc.DrugID}`,
            prescriptionId: presc.PrescriptionID,
            appointmentId: presc.AppointmentID,
            relatedAppointment: relatedAppointment,
            doctorName: presc.DoctorFirstName || presc.DoctorLastName 
              ? `Dr. ${presc.DoctorFirstName || ""} ${presc.DoctorLastName || ""}`.trim()
              : null,
            doctorEmail: presc.DoctorEmail || null,
            doctorPhone: presc.DoctorPhone || null,
            title: "Follow-up Visit Recommended"
          }
        })

      // Combine all items and sort by date (most recent first for past, earliest first for upcoming)
      const allItems = [...appointmentItems, ...prescriptionItems, ...followUpItems]
        .sort((a, b) => {
          // Separate past and upcoming
          if (a.isPast !== b.isPast) {
            return a.isPast ? -1 : 1 // Past items first
          }
          // Within same category, sort by date
          if (a.isPast) {
            return b.dateTime - a.dateTime // Most recent past first
          } else {
            return a.dateTime - b.dateTime // Earliest upcoming first
          }
        })

      setTimelineItems(allItems)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching health timeline data:", error)
      setLoading(false)
    }
  }, [patient])

  useEffect(() => {
    fetchHealthData()
  }, [fetchHealthData, refreshKey])

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  // Filter items based on selected filter
  const filteredItems = timelineItems.filter(item => {
    if (filter === "All") return true
    if (filter === "Past") return item.isPast
    if (filter === "Upcoming") return item.isUpcoming
    return true
  })

  // Format date for display
  const formatDate = (date) => {
    if (!date) return ""
    const d = new Date(date)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (d.toDateString() === today.toDateString()) {
      return "Today"
    } else if (d.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow"
    } else if (d.toDateString() === yesterday.toDateString()) {
      return "Yesterday"
    } else {
      return d.toLocaleDateString("en-US", { 
        month: "short", 
        day: "numeric", 
        year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined 
      })
    }
  }

  // Format time for display
  const formatTime = (time) => {
    if (!time) return ""
    const [hours, minutes] = time.split(":")
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  if (!patient) {
    navigate("/")
    return null
  }

  return (
    <div className="App">
      <PatientNav patient={patient} currentPage="health-timeline" />
      
      <section className="features" style={{ paddingTop: "4rem", minHeight: "80vh" }}>
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
        <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "2rem" }}>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            marginBottom: "2rem",
            flexWrap: "wrap",
            gap: "1rem"
          }}>
            <div>
              <h2 className="section-title" style={{ marginBottom: "0.5rem" }}>Health Timeline</h2>
              <p style={{ color: "var(--text-light)", margin: 0 }}>
                Complete history and upcoming schedule of your health journey
              </p>
            </div>
            <button
              onClick={handleRefresh}
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "8px",
                border: "none",
                background: "var(--primary-color)",
                color: "white",
                fontWeight: "600",
                cursor: "pointer",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                transition: "all 0.3s",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)"
                e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.15)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)"
                e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)"
              }}
            >
              <span>🔄</span> Refresh
            </button>
          </div>

          {/* Filter Buttons */}
          <div style={{ 
            display: "flex", 
            gap: "0.5rem", 
            marginBottom: "2rem",
            flexWrap: "wrap"
          }}>
            {["All", "Past", "Upcoming"].map(filterType => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                style={{
                  padding: "0.6rem 1.2rem",
                  borderRadius: "8px",
                  border: filter === filterType ? "2px solid var(--primary-color)" : "2px solid #e5e7eb",
                  background: filter === filterType ? "#eff6ff" : "white",
                  color: filter === filterType ? "var(--primary-color)" : "#6b7280",
                  fontWeight: filter === filterType ? "600" : "500",
                  cursor: "pointer",
                  fontSize: "14px",
                  transition: "all 0.2s"
                }}
              >
                {filterType}
              </button>
            ))}
          </div>

          {/* Loading state */}
          {loading && (
            <div style={{ textAlign: "center", padding: "4rem", color: "#6b7280" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⏳</div>
              <p>Loading your health timeline...</p>
            </div>
          )}

          {/* Timeline */}
          {!loading && filteredItems.length > 0 && (
            <div style={{ position: "relative" }}>
              {/* Vertical timeline line */}
              <div style={{
                position: "absolute",
                left: "30px",
                top: 0,
                bottom: 0,
                width: "3px",
                background: "linear-gradient(to bottom, #3b82f6, #8b5cf6, #10b981)",
                borderRadius: "2px"
              }}></div>

              {/* Timeline items */}
              <div style={{ position: "relative" }}>
                {filteredItems.map((item, index) => {
                  const isAppointment = item.type === "appointment"
                  const isPrescription = item.type === "prescription"
                  const isFollowUp = item.type === "followup"

                  return (
                    <div
                      key={item.id}
                      style={{
                        position: "relative",
                        marginBottom: "2rem",
                        paddingLeft: "80px",
                        animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`
                      }}
                    >
                      {/* Timeline dot */}
                      <div style={{
                        position: "absolute",
                        left: "18px",
                        top: "20px",
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        background: isAppointment 
                          ? (item.status === 'Scheduled' ? '#10b981' : '#3b82f6')
                          : isFollowUp 
                            ? '#f59e0b'
                            : '#8b5cf6',
                        border: "4px solid white",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                        zIndex: 2
                      }}></div>

                      {/* Card */}
                      <div style={{
                        background: "white",
                        borderRadius: "12px",
                        padding: "1.5rem",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        borderLeft: `4px solid ${
                          isAppointment 
                            ? (item.status === 'Scheduled' ? '#10b981' : '#3b82f6')
                            : isFollowUp 
                              ? '#f59e0b'
                              : '#8b5cf6'
                        }`,
                        transition: "all 0.3s",
                        cursor: "pointer"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateX(5px)"
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)"
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateX(0)"
                        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)"
                      }}
                      >
                        {/* Header */}
                        <div style={{ 
                          display: "flex", 
                          justifyContent: "space-between", 
                          alignItems: "flex-start",
                          marginBottom: "1rem",
                          flexWrap: "wrap",
                          gap: "0.5rem"
                        }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ 
                              display: "flex", 
                              alignItems: "center", 
                              gap: "0.5rem",
                              marginBottom: "0.5rem"
                            }}>
                              <span style={{ fontSize: "1.5rem" }}>
                                {isAppointment ? "📅" : isFollowUp ? "🔔" : "💊"}
                              </span>
                              <h3 style={{ 
                                margin: 0, 
                                fontSize: "1.1rem", 
                                fontWeight: "600",
                                color: "#1f2937"
                              }}>
                                {isAppointment 
                                  ? item.title
                                  : isFollowUp
                                    ? item.title
                                    : "Prescription"
                                }
                              </h3>
                            </div>
                            <div style={{ 
                              fontSize: "0.9rem", 
                              color: "#6b7280",
                              fontWeight: "500"
                            }}>
                              {formatDate(item.date)}
                              {isAppointment && item.time && ` • ${formatTime(item.time)}`}
                            </div>
                          </div>
                          <div style={{
                            padding: "0.4rem 0.8rem",
                            borderRadius: "20px",
                            fontSize: "0.75rem",
                            fontWeight: "600",
                            background: item.isUpcoming 
                              ? "#eff6ff" 
                              : "#f0fdf4",
                            color: item.isUpcoming 
                              ? "#3b82f6" 
                              : "#10b981"
                          }}>
                            {item.isUpcoming ? "Upcoming" : "Past"}
                          </div>
                        </div>

                        {/* Content */}
                        {isAppointment && (
                          <div style={{ color: "#374151", lineHeight: "1.6" }}>
                            <div style={{ marginBottom: "0.75rem" }}>
                              <strong style={{ color: "#1f2937" }}>Doctor:</strong> {item.doctor}
                              {item.specialization && (
                                <span style={{ color: "#6b7280", fontSize: "0.9rem" }}>
                                  {" • "}{item.specialization}
                                </span>
                              )}
                            </div>
                            <div>
                              <strong style={{ color: "#1f2937" }}>Symptom/Reason:</strong>{" "}
                              <span style={{ color: "#6b7280" }}>{item.symptom}</span>
                            </div>
                            {item.status === 'Completed' && (
                              <div style={{ 
                                marginTop: "0.75rem", 
                                padding: "0.75rem",
                                background: "#f0f9ff",
                                borderRadius: "6px",
                                fontSize: "0.9rem",
                                color: "#0369a1"
                              }}>
                                ✓ Appointment completed
                              </div>
                            )}
                          </div>
                        )}

                        {isPrescription && (
                          <div style={{ color: "#374151", lineHeight: "1.6" }}>
                            {/* Drug Information */}
                            <div style={{ marginBottom: "1rem", paddingBottom: "1rem", borderBottom: "1px solid #e5e7eb" }}>
                              <div style={{ marginBottom: "0.75rem" }}>
                                <strong style={{ color: "#1f2937" }}>Drug:</strong>{" "}
                                <span style={{ color: "#6b7280", fontWeight: "500" }}>
                                  {item.drugName}
                                </span>
                              </div>
                              {item.dosage && (
                                <div style={{ marginBottom: "0.75rem" }}>
                                  <strong style={{ color: "#1f2937" }}>Dosage:</strong>{" "}
                                  <span style={{ color: "#6b7280" }}>{item.dosage}</span>
                                </div>
                              )}
                              {item.instructions && (
                                <div style={{ marginBottom: "0.75rem" }}>
                                  <strong style={{ color: "#1f2937" }}>Instructions:</strong>{" "}
                                  <span style={{ color: "#6b7280" }}>{item.instructions}</span>
                                </div>
                              )}
                            </div>

                            {/* Appointment Information */}
                            {(item.appointmentDate || item.relatedAppointment) && (
                              <div style={{ 
                                marginBottom: "1rem",
                                padding: "0.75rem",
                                background: "#f0f9ff",
                                borderRadius: "6px",
                                border: "1px solid #bae6fd"
                              }}>
                                <div style={{ fontSize: "0.85rem", marginBottom: "0.5rem", color: "#0369a1", fontWeight: "600" }}>
                                  📅 Appointment Details:
                                </div>
                                <div style={{ fontSize: "0.9rem", color: "#374151" }}>
                                  {(item.appointmentDate || item.relatedAppointment?.Date) && (
                                    <div style={{ marginBottom: "0.25rem" }}>
                                      <strong>Date:</strong> {formatDate(item.appointmentDate || item.relatedAppointment.Date)}
                                      {(item.appointmentTime || item.relatedAppointment?.Time) && ` • ${formatTime(item.appointmentTime || item.relatedAppointment.Time)}`}
                                    </div>
                                  )}
                                  {(item.appointmentReason || item.relatedAppointment?.Reason) && (
                                    <div>
                                      <strong>Symptom/Reason:</strong> {item.appointmentReason || item.relatedAppointment.Reason || 'General checkup'}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Doctor Information */}
                            {(item.doctorName || item.doctorEmail || item.doctorPhone || item.doctorSpecialization) && (
                              <div style={{ 
                                marginBottom: "1rem",
                                padding: "0.75rem",
                                background: "#f0fdf4",
                                borderRadius: "6px",
                                border: "1px solid #86efac"
                              }}>
                                <div style={{ fontSize: "0.85rem", marginBottom: "0.5rem", color: "#166534", fontWeight: "600" }}>
                                  👨‍⚕️ Prescribed By:
                                </div>
                                <div style={{ fontSize: "0.9rem", color: "#374151" }}>
                                  {item.doctorName && (
                                    <div style={{ marginBottom: "0.25rem" }}>
                                      <strong>Doctor:</strong> {item.doctorName}
                                      {item.doctorSpecialization && (
                                        <span style={{ color: "#6b7280", fontSize: "0.85rem" }}>
                                          {" • "}{item.doctorSpecialization}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  {item.doctorEmail && (
                                    <div style={{ marginBottom: "0.25rem" }}>
                                      <strong>Email:</strong>{" "}
                                      <a 
                                        href={`mailto:${item.doctorEmail}`}
                                        style={{ color: "#3b82f6", textDecoration: "none" }}
                                        onMouseEnter={(e) => e.target.style.textDecoration = "underline"}
                                        onMouseLeave={(e) => e.target.style.textDecoration = "none"}
                                      >
                                        {item.doctorEmail}
                                      </a>
                                    </div>
                                  )}
                                  {item.doctorPhone && (
                                    <div>
                                      <strong>Phone:</strong>{" "}
                                      <a 
                                        href={`tel:${item.doctorPhone}`}
                                        style={{ color: "#3b82f6", textDecoration: "none" }}
                                        onMouseEnter={(e) => e.target.style.textDecoration = "underline"}
                                        onMouseLeave={(e) => e.target.style.textDecoration = "none"}
                                      >
                                        {item.doctorPhone}
                                      </a>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Follow-up Date */}
                            {item.followUpDate && (
                              <div style={{ 
                                padding: "0.75rem",
                                background: item.isFollowUpUpcoming ? "#fef3c7" : "#f0f9ff",
                                borderRadius: "6px",
                                fontSize: "0.9rem",
                                color: item.isFollowUpUpcoming ? "#92400e" : "#0369a1"
                              }}>
                                {item.isFollowUpUpcoming ? (
                                  <>🔔 <strong>Follow-up visit recommended:</strong> {formatDate(item.followUpDate)}</>
                                ) : (
                                  <>✓ Follow-up date: {formatDate(item.followUpDate)}</>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {isFollowUp && (
                          <div style={{ color: "#374151", lineHeight: "1.6" }}>
                            <div style={{ marginBottom: "0.75rem" }}>
                              <strong style={{ color: "#1f2937" }}>Related to:</strong>{" "}
                              <span style={{ color: "#6b7280", fontWeight: "500" }}>{item.drugName}</span>
                            </div>
                            
                            {item.relatedAppointment && (
                              <div style={{ 
                                marginBottom: "0.75rem",
                                padding: "0.75rem",
                                background: "#f0f9ff",
                                borderRadius: "6px",
                                border: "1px solid #bae6fd"
                              }}>
                                <div style={{ fontSize: "0.85rem", marginBottom: "0.5rem", color: "#0369a1" }}>
                                  <strong>Original Appointment:</strong>
                                </div>
                                <div style={{ fontSize: "0.9rem", color: "#374151" }}>
                                  <div style={{ marginBottom: "0.25rem" }}>
                                    <strong>Date:</strong> {formatDate(item.relatedAppointment.Date)}
                                    {item.relatedAppointment.Time && ` • ${formatTime(item.relatedAppointment.Time)}`}
                                  </div>
                                  <div>
                                    <strong>Symptom/Reason:</strong> {item.relatedAppointment.Reason || 'General checkup'}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Doctor Contact Information */}
                            {(item.doctorName || item.doctorEmail || item.doctorPhone) && (
                              <div style={{ 
                                marginBottom: "0.75rem",
                                padding: "0.75rem",
                                background: "#f0fdf4",
                                borderRadius: "6px",
                                border: "1px solid #86efac"
                              }}>
                                <div style={{ fontSize: "0.85rem", marginBottom: "0.5rem", color: "#166534", fontWeight: "600" }}>
                                  👨‍⚕️ Contact Your Doctor:
                                </div>
                                <div style={{ fontSize: "0.9rem", color: "#374151" }}>
                                  {item.doctorName && (
                                    <div style={{ marginBottom: "0.25rem" }}>
                                      <strong>Doctor:</strong> {item.doctorName}
                                    </div>
                                  )}
                                  {item.doctorEmail && (
                                    <div style={{ marginBottom: "0.25rem" }}>
                                      <strong>Email:</strong>{" "}
                                      <a 
                                        href={`mailto:${item.doctorEmail}`}
                                        style={{ color: "#3b82f6", textDecoration: "none" }}
                                        onMouseEnter={(e) => e.target.style.textDecoration = "underline"}
                                        onMouseLeave={(e) => e.target.style.textDecoration = "none"}
                                      >
                                        {item.doctorEmail}
                                      </a>
                                    </div>
                                  )}
                                  {item.doctorPhone && (
                                    <div>
                                      <strong>Phone:</strong>{" "}
                                      <a 
                                        href={`tel:${item.doctorPhone}`}
                                        style={{ color: "#3b82f6", textDecoration: "none" }}
                                        onMouseEnter={(e) => e.target.style.textDecoration = "underline"}
                                        onMouseLeave={(e) => e.target.style.textDecoration = "none"}
                                      >
                                        {item.doctorPhone}
                                      </a>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            <div style={{ 
                              padding: "0.75rem",
                              background: "#fef3c7",
                              borderRadius: "6px",
                              fontSize: "0.9rem",
                              color: "#92400e"
                            }}>
                              🔔 Doctor recommended a follow-up visit on this date
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!loading && filteredItems.length === 0 && (
            <div className="feature-card" style={{ padding: "4rem", textAlign: "center" }}>
              <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>📊</div>
              <h3 style={{ marginBottom: "0.5rem" }}>No Health Records Yet</h3>
              <p style={{ color: "var(--text-light)" }}>
                {filter === "Past" 
                  ? "You don't have any past appointments or prescriptions yet."
                  : filter === "Upcoming"
                    ? "You don't have any upcoming appointments or follow-ups scheduled."
                    : "Your health timeline will appear here as you add appointments and prescriptions."
                }
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Add CSS animation */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
