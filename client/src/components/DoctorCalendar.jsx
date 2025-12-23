import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import { useNavigate, useLocation } from 'react-router-dom' 
import "./App.css"
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios'
import DoctorNav from "./DoctorNav"
import { API_BASE_URL } from "../config"

export default function Calendar() {
  const navigate = useNavigate();
  const location = useLocation(); 

  // State to manage the fetched data and UI status
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0); // Key to force refresh

  // --- Get Doctor ID from Navigation State ---
  // Retrieves DoctorID from the object passed via `Maps("/doctor", { state: { doctor: ... } })`
  const doctor = location.state?.doctor;
  const doctorId = doctor?.DoctorID;

  // --- Data Fetching Function ---
  const fetchAppointments = useCallback(async () => {
      setError(null);
      
      if (!doctorId) {
        setError("Error: Doctor ID missing. Please log in first.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // AXIOS CALL: Fetches appointments data from your server
        const res = await axios.get(`${API_BASE_URL}/api/doctors/calendar/${doctorId}`);
        
        // Filter appointments: only show "Scheduled" and "Completed" statuses
        const filteredAppointments = res.data.appointments.filter(app => 
          app.Status === 'Scheduled' || app.Status === 'Completed'
        );
        
        console.log('All appointments from API:', res.data.appointments);
        console.log('Filtered appointments:', filteredAppointments);
        
        // Success: Map the data to FullCalendar's required event format
        const formattedEvents = filteredAppointments.map(app => {
          // Ensure date is in YYYY-MM-DD format for FullCalendar
          const dateStr = app.Date;
          const formattedDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
          
          return {
            id: app.AppointmentID,
            // FullCalendar uses 'start' for event time - must be in YYYY-MM-DD format
            start: formattedDate,
            title: `${app.Time ? app.Time.substring(0, 5) : ''} - ${app.PatientFirstName} ${app.PatientLastName}`,
          extendedProps: {
            appointmentId: app.AppointmentID,
            date: app.Date,
            time: app.Time,
            reason: app.Reason,
            status: app.Status,
            patientId: app.PatientID,
            patientName: `${app.PatientFirstName} ${app.PatientLastName}`,
            doctorId: doctorId
          },
            // Customize event color: Green for Scheduled, Orange for Completed
            backgroundColor: app.Status === 'Scheduled' ? '#10b981' : '#f59e0b',
            borderColor: app.Status === 'Scheduled' ? '#059669' : '#d97706',
          };
        });
        
        console.log('Formatted events for calendar:', formattedEvents);
        setAppointments(formattedEvents);
        
      } catch (err) {
        // Axios error handling
        const msg = err.response?.data?.message || err.message || "An unknown network error occurred.";
        
        // Special handling for 404 (No appointments found)
        if (err.response && err.response.status === 404) {
            setAppointments([]); // Clear appointments
        } else {
            console.error("Failed to fetch appointments:", msg);
            setError(msg);
        }
        
      } finally {
        setLoading(false);
      }
    }, [doctorId]);

  // --- Data Fetching Effect ---
  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments, refreshKey, location.pathname]); // Refresh when fetchAppointments changes, refreshKey changes, or when navigating to calendar

  // Simple event content - just show time on the calendar
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

  // Hover handlers to show tooltip with full appointment details
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
        <div style="margin-bottom: 4px;"><strong>Patient:</strong> ${extendedProps.patientName}</div>
        <div style="margin-bottom: 4px;"><strong>Patient ID:</strong> ${extendedProps.patientId}</div>
        <div style="margin-bottom: 4px;"><strong>Doctor ID:</strong> ${extendedProps.doctorId}</div>
        <div style="margin-bottom: 4px;"><strong>Status:</strong> ${extendedProps.status}</div>
        <div style="margin-bottom: 4px;"><strong>Reason:</strong> ${extendedProps.reason || "N/A"}</div>
      </div>
    `;

    document.body.appendChild(tooltip);

    // Position tooltip near the event
    const rect = info.el.getBoundingClientRect();
    const tooltipDiv = tooltip.firstElementChild;
    tooltipDiv.style.left = `${rect.left + window.scrollX}px`;
    tooltipDiv.style.top = `${rect.bottom + window.scrollY + 5}px`;

    // Store tooltip reference on the element
    info.el._tooltip = tooltip;
  };

  const handleEventMouseLeave = (info) => {
    if (info.el._tooltip) {
      document.body.removeChild(info.el._tooltip);
      info.el._tooltip = null;
    }
  };

  // --- Conditional Rendering for Calendar Content ---
  let calendarContent;
  
  if (loading) {
    calendarContent = <div className="text-center p-8 text-xl font-medium">Loading appointments...</div>;
  } else if (error) {
    calendarContent = <div className="text-center p-8 text-xl font-bold text-red-600">Error: {error}</div>;
  } else {
    // Render FullCalendar when data is successfully loaded
    calendarContent = (
      <FullCalendar
        plugins={[ dayGridPlugin ]}
        initialView="dayGridMonth"
        weekends={true}
        events={appointments}
        eventContent={renderEventContent}
        eventDisplay="block"
        displayEventTime={false}
        eventMouseEnter={handleEventMouseEnter}
        eventMouseLeave={handleEventMouseLeave}
      />
    );
  }

  // Manual refresh handler
  const handleRefresh = () => {
    setLoading(true);
    setRefreshKey(prev => prev + 1); // Trigger refresh by updating key
  };

  return (
    <div className="App">
      <DoctorNav doctor={doctor} currentPage="schedule" />

      <div style={{ 
        maxWidth: "1200px", 
        margin: "0 auto", 
        padding: "1rem 2rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <h2 className="section-title" style={{ margin: 0 }}>Calendar</h2>
        <button
          onClick={handleRefresh}
          disabled={loading}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: loading ? "#9ca3af" : "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: "600",
            fontSize: "0.9rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem"
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.target.style.backgroundColor = "#2563eb"
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.target.style.backgroundColor = "#3b82f6"
            }
          }}
        >
          <span>🔄</span>
          <span>{loading ? "Refreshing..." : "Refresh"}</span>
        </button>
      </div>

      <div className="calendar-wrapper calendar-box">
        {calendarContent}
      </div>
    </div> 
  );
}