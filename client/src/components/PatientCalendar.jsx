import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { useNavigate, useLocation } from 'react-router-dom' 
import "./App.css"
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PatientNav from "./PatientNav"
import { API_BASE_URL } from "../config"

export default function Calendar() {
  const navigate = useNavigate();
  const location = useLocation(); 

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [formData, setFormData] = useState({
    doctorId: '',
    time: '',
    reason: '',
    speciality: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [timeError, setTimeError] = useState('');

  const patient = location.state?.patient;
  const patientId = patient?.PatientID;

  useEffect(() => {
    if (!patient) {
      navigate("/");
    }
  }, [patient, navigate]);

  const fetchAppointments = React.useCallback(async () => {
    setError(null)

    if (!patientId) {
      setError("Error: patient ID missing. Please log in first.")
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const res = await axios.get(`${API_BASE_URL}/api/patients/calendar/${patientId}`)

      // Guard against missing / invalid data before calling .filter()
      if (!res.data || !Array.isArray(res.data.appointments)) {
        console.error("Invalid appointments response:", res.data)
        setAppointments([])
        setLoading(false)
        return
      }

      // Filter appointments: only show "Scheduled" and "Completed" statuses (exclude "No Show" and "Cancelled")
      const filteredAppointments = res.data.appointments.filter(
        app => app.Status === "Scheduled" || app.Status === "Completed"
      )

      // Get current date/time in CST timezone
      const nowCST = new Date().toLocaleString("en-US", { timeZone: "America/Chicago" })
      const todayCST = new Date(nowCST)
      todayCST.setHours(0, 0, 0, 0)

      const formattedEvents = filteredAppointments.map(app => {
        const appointmentDate = new Date(app.Date)
        appointmentDate.setHours(0, 0, 0, 0)
        const isPastAppointment = appointmentDate < todayCST

        return {
          id: app.AppointmentID,
          start: `${app.Date}`,
          title: `${app.Time.substring(0, 5)} - Dr. ${app.DoctorFirstName} ${app.DoctorLastName}`,
          extendedProps: {
            appointmentId: app.AppointmentID,
            date: app.Date,
            time: app.Time,
            reason: app.Reason,
            status: app.Status,
            doctorId: app.DoctorID,
            doctorName: `Dr. ${app.DoctorFirstName} ${app.DoctorLastName}`,
            specialization: app.Specialization,
            patientId: patientId
          },
          backgroundColor: app.Status === "Scheduled" ? "#10b981" : "#f59e0b",
          borderColor: app.Status === "Scheduled" ? "#059669" : "#d97706"
        }
      })

      setAppointments(formattedEvents)
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "An unknown network error occurred."

      if (err.response && err.response.status === 404) {
        // No appointments for this patient – treat as empty calendar, not an error
        setAppointments([])
      } else {
        console.error("Failed to fetch appointments:", msg)
        setError(msg)
        setAppointments([])
      }
    } finally {
      setLoading(false)
    }
  }, [patientId])

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments, refreshKey, location.pathname]);

  const handleRefresh = () => {
    setLoading(true);
    setRefreshKey(prev => prev + 1);
  };

  // Handle date click
  const handleDateClick = (info) => {
    // Parse the clicked date (format: YYYY-MM-DD)
    const clickedDateStr = info.dateStr;
    
    // Get today's date string in YYYY-MM-DD format for comparison (local timezone)
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    
    // Only open modal if clicked date is today or future
    // Compare date strings directly to avoid timezone issues
    if (clickedDateStr >= todayStr) {
      setSelectedDate(clickedDateStr);
      setShowModal(true);
      setFormData({
        doctorId: '',
        time: '',
        reason: '',
        speciality: ''
      });
      fetchDoctors();
    }
  };

  // Fetch available doctors
  const fetchDoctors = async () => {
    setLoadingDoctors(true)
    try {
      const response = await axios.get(`${API_BASE_URL}/api/doctors`)
      setDoctors(response.data.doctors || [])
    } catch (err) {
      console.error("Failed to fetch doctors:", err)
      alert("Failed to load doctors list")
    } finally {
      setLoadingDoctors(false)
    }
  }

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-fill specialty when doctor is selected
    if (name === 'doctorId') {
      const selectedDoctor = doctors.find(doc => doc.DoctorID === parseInt(value));
      if (selectedDoctor) {
        setFormData(prev => ({
          ...prev,
          doctorId: value,
          speciality: selectedDoctor.Specialization || ''
        }));
      }
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeError('');

    // Validate that appointment is at least 5 minutes in the future
    if (selectedDate && formData.time) {
      const appointmentDateTime = new Date(`${selectedDate}T${formData.time}`);
      const now = new Date();
      const minDateTime = new Date(now.getTime() + 5 * 60 * 1000); // Current time + 5 minutes

      if (appointmentDateTime <= now) {
        setTimeError('Appointment time must be in the future. Please select a time after the current time.');
        setSubmitting(false);
        return;
      }

      if (appointmentDateTime < minDateTime) {
        setTimeError('Appointment must be at least 5 minutes in the future. Please select a later time.');
        setSubmitting(false);
        return;
      }
    }

    try {
      // Make API call to book appointment
      const response = await axios.post(`${API_BASE_URL}/api/patients/appointments`, {
        patientId: patientId,
        date: selectedDate,
        time: formData.time,
        doctorId: parseInt(formData.doctorId, 10),
        reason: formData.reason,
        speciality: formData.speciality
      })

      // Close modal and refresh appointments
      setShowModal(false)
      alert("Appointment booked successfully!")

      // Refresh appointments list
      await fetchAppointments()
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to book appointment."
      alert("Error: " + msg)
    } finally {
      setSubmitting(false)
    }
  }

  const renderEventContent = (eventInfo) => {
    return (
      <div
        style={{
          padding: "4px",
          fontSize: "11px",
          color: "white",
          fontWeight: 500,
          cursor: "pointer"
        }}
      >
        {eventInfo.timeText}
      </div>
    );
  };

  const handleEventMouseEnter = (info) => {
    const { extendedProps } = info.event;
    const tooltip = document.createElement('div');
    tooltip.className = 'appointment-tooltip';
    tooltip.innerHTML = `
      <div style="
        position: absolute;
        background: white;
        border: 2px solid ${info.event.backgroundColor};
        border-radius: 8px;
        padding: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        min-width: 250px;
        font-size: 13px;
        color: #333;
      ">
        <div style="font-weight: bold; margin-bottom: 8px; color: ${info.event.backgroundColor}; font-size: 14px;">
          Appointment Details
        </div>
        <div style="margin-bottom: 4px;"><strong>ID:</strong> ${extendedProps.appointmentId}</div>
        <div style="margin-bottom: 4px;"><strong>Time:</strong> ${extendedProps.time}</div>
        <div style="margin-bottom: 4px;"><strong>Doctor:</strong> ${extendedProps.doctorName}</div>
        <div style="margin-bottom: 4px;"><strong>Doctor ID:</strong> ${extendedProps.doctorId}</div>
        <div style="margin-bottom: 4px;"><strong>Patient ID:</strong> ${extendedProps.patientId}</div>
        <div style="margin-bottom: 4px;"><strong>Status:</strong> ${extendedProps.status}</div>
        <div style="margin-bottom: 4px;"><strong>Reason:</strong> ${extendedProps.reason || "N/A"}</div>
        <div><strong>Specialty:</strong> ${extendedProps.specialization || "N/A"}</div>
      </div>
    `;

    document.body.appendChild(tooltip);

    const rect = info.el.getBoundingClientRect();
    const tooltipDiv = tooltip.firstElementChild;
    tooltipDiv.style.left = `${rect.left + window.scrollX}px`;
    tooltipDiv.style.top = `${rect.bottom + window.scrollY + 5}px`;

    info.el._tooltip = tooltip;
  };

  const handleEventMouseLeave = (info) => {
    if (info.el._tooltip) {
      document.body.removeChild(info.el._tooltip);
      info.el._tooltip = null;
    }
  };

  let calendarContent;
  
  if (!patient) {
    calendarContent = null;
  } else if (loading) {
    calendarContent = <div className="text-center p-8 text-xl font-medium">Loading appointments...</div>;
  } else if (error) {
    calendarContent = <div className="text-center p-8 text-xl font-bold text-red-600">Error: {error}</div>;
  } else {
    calendarContent = (
      <FullCalendar
        plugins={[ dayGridPlugin, interactionPlugin ]}
        initialView="dayGridMonth"
        weekends={true}
        events={appointments}
        eventContent={renderEventContent}
        eventDisplay="block"
        displayEventTime={false}
        eventMouseEnter={handleEventMouseEnter}
        eventMouseLeave={handleEventMouseLeave}
        dateClick={handleDateClick}
        selectable={true}
      />
    );
  }

  if (!patient) {
    return null;
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 className="section-title" style={{ marginBottom: 0 }}>My Appointment Calendar</h2>
            <button
              onClick={handleRefresh}
              disabled={loading}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: loading ? "not-allowed" : "pointer",
                fontWeight: "500",
                fontSize: "0.9rem",
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? "Refreshing..." : "🔄 Refresh"}
            </button>
          </div>
          <p style={{ color: "var(--text-light)", marginBottom: "2rem", textAlign: "center" }}>
            View all scheduled and completed appointments in a monthly calendar view. Click on a future date to book a new appointment.
          </p>

          <div className="calendar-wrapper calendar-box">
            {calendarContent}
          </div>
        </div>
      </section>

      {/* Booking Modal */}
      {showModal && (
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
              Book Appointment for {selectedDate}
            </h2>
            
            <form onSubmit={handleSubmit}>
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
                  onChange={(e) => {
                    handleInputChange(e);
                    setTimeError('');
                  }}
                  required
                  min={(() => {
                    // If selected date is today, set min time to current time + 5 minutes
                    if (selectedDate) {
                      const today = new Date().toISOString().split('T')[0];
                      if (selectedDate === today) {
                        const now = new Date();
                        const minTime = new Date(now.getTime() + 5 * 60 * 1000); // +5 minutes
                        const hours = String(minTime.getHours()).padStart(2, '0');
                        const minutes = String(minTime.getMinutes()).padStart(2, '0');
                        return `${hours}:${minutes}`;
                      }
                    }
                    return '';
                  })()}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: timeError ? '1px solid #ef4444' : '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                />
                {timeError && (
                  <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                    {timeError}
                  </p>
                )}
                {selectedDate && (() => {
                  const today = new Date().toISOString().split('T')[0];
                  if (selectedDate === today) {
                    const now = new Date();
                    const minTime = new Date(now.getTime() + 5 * 60 * 1000);
                    const hours = String(minTime.getHours()).padStart(2, '0');
                    const minutes = String(minTime.getMinutes()).padStart(2, '0');
                    return (
                      <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                        Minimum time: {hours}:{minutes} (5 minutes from now)
                      </p>
                    );
                  }
                  return null;
                })()}
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
                  onClick={() => setShowModal(false)}
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
                    backgroundColor: '#10b981',
                    color: 'white',
                    fontSize: '1rem',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    fontWeight: '500',
                    opacity: submitting ? 0.7 : 1
                  }}
                >
                  {submitting ? 'Booking...' : 'Book Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div> 
  );
}