import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import "./App.css"

export default function DoctorNav({ doctor, currentPage = "" }) {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const closeSidebar = () => {
    setSidebarOpen(false)
  }

  const handleNavClick = (path, scrollId = null) => {
    if (path === "/doctor" && scrollId) {
      navigate(path, { state: { doctor } })
      setTimeout(() => {
        document.getElementById(scrollId)?.scrollIntoView({ behavior: "smooth" })
      }, 100)
    } else {
      navigate(path, { state: { doctor } })
    }
    closeSidebar()
  }

  const handleEditProfile = () => {
    navigate("/doctor/edit-profile", { state: { doctor } })
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }, 50)
  }

  return (
    <>
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="nav-container">
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button
              className="sidebar-toggle"
              onClick={toggleSidebar}
              style={{
                background: "none",
                border: "none",
                fontSize: "1.5rem",
                cursor: "pointer",
                padding: "0.5rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              ☰
            </button>
            <div className="nav-logo">
              <span className="logo-icon">⚕️</span>
              <span className="logo-text">Personacura</span>
            </div>
          </div>
          <div className="nav-buttons">
            <button
              className="btn-nav"
              onClick={() => {
                navigate("/doctor", { state: { doctor } })
                setTimeout(() => {
                  window.scrollTo({ top: 0, behavior: "smooth" })
                }, 50)
              }}
            >
              Dashboard
            </button>
            <button
              className="btn-nav btn-doctor"
              onClick={handleEditProfile}
            >
              Edit Profile
            </button>
            <button
              className="btn-nav btn-customer"
              onClick={() => navigate("/", { replace: true })}
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Side Panel */}
      <div className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`} onClick={closeSidebar}></div>
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h3>Menu</h3>
          <button className="sidebar-close" onClick={closeSidebar}>×</button>
        </div>

        {/* Doctor snapshot */}
        {doctor && (
          <div
            style={{
              padding: "1rem 1.5rem",
              borderBottom: "1px solid var(--border-color)",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              backgroundColor: "var(--bg-light)",
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "999px",
                backgroundColor: "var(--primary-color)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
              }}
            >
              {doctor.FirstName?.[0]}
            </div>
            <div style={{ fontSize: "0.9rem" }}>
              <div style={{ fontWeight: 600 }}>
                Dr. {doctor.FirstName} {doctor.LastName}
              </div>
              <div style={{ color: "var(--text-light)", fontSize: "0.8rem" }}>
                ID: {doctor.DoctorID} • {doctor.Specialization || "No specialization"}
              </div>
            </div>
          </div>
        )}

        <ul className="sidebar-menu">
          <li>
            <button 
              className={`sidebar-link ${currentPage === 'overview' ? 'active' : ''}`}
              onClick={() => handleNavClick("/doctor", "doctor-info")}
            >
              <span>👤</span> User Info
            </button>
          </li>
          <li>
            <button 
              className={`sidebar-link ${currentPage === 'appointments' ? 'active' : ''}`}
              onClick={() => handleNavClick("/doctor", "appointments")}
            >
              <span>⚡</span> Quick Actions
            </button>
          </li>
          <li>
            <button 
              className={`sidebar-link ${currentPage === 'schedule' ? 'active' : ''}`}
              onClick={() => handleNavClick("/doctor/calendar")}
            >
              <span>🗓️</span> Schedule
            </button>
          </li>
          <li>
            <button 
              className={`sidebar-link ${currentPage === 'appointments-list' ? 'active' : ''}`}
              onClick={() => handleNavClick("/doctor/appointments")}
            >
              <span>📋</span> Appointments
            </button>
          </li>
          <li>
            <button 
              className={`sidebar-link ${currentPage === 'patients' ? 'active' : ''}`}
              onClick={() => handleNavClick("/doctor/patients")}
            >
              <span>🧑‍🤝‍🧑</span> Patients
            </button>
          </li>
          <li>
            <button 
              className={`sidebar-link ${currentPage === 'drug-search' ? 'active' : ''}`}
              onClick={() => handleNavClick("/doctor/drug-search")}
            >
              <span>💊</span> Drug Search
            </button>
          </li>
          <li>
            <button 
              className={`sidebar-link ${currentPage === 'audit-logs' ? 'active' : ''}`}
              onClick={() => handleNavClick("/doctor/audit-logs")}
            >
              <span>📋</span> Audit Logs
            </button>
          </li>
          <li>
            <button 
              className={`sidebar-link ${currentPage === 'settings' ? 'active' : ''}`}
              onClick={handleEditProfile}
            >
              <span>⚙️</span> Profile & Availability
            </button>
          </li>
        </ul>
      </div>
    </>
  )
}


