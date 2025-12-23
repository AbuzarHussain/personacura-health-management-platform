import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import "./App.css"

export default function PatientNav({ patient, currentPage = "" }) {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const closeSidebar = () => {
    setSidebarOpen(false)
  }

  const handleNavClick = (path, scrollId = null) => {
    if (path === "/patient" && scrollId) {
      navigate(path, { state: { patient } })
      setTimeout(() => {
        document.getElementById(scrollId)?.scrollIntoView({ behavior: "smooth" })
      }, 100)
    } else {
      navigate(path, { state: { patient } })
      // Scroll to top for appointments page
      if (path === "/appointments") {
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: "smooth" })
        }, 100)
      }
    }
    closeSidebar()
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
                navigate("/patient", { state: { patient } });
                setTimeout(() => {
                  window.scrollTo({ top: 0, behavior: "smooth" })
                }, 50)
              }}
            >
              Dashboard
            </button>
            <button
              className="btn-nav btn-doctor"
              onClick={() => {
                navigate("/edit-profile", { state: { patient } });
              }}
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

        {/* User snapshot */}
        {patient && (
          <div
            style={{
              padding: "1rem 1.5rem",
              borderBottom: "1px solid var(--border-color)",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              backgroundColor: "var(--bg-light)"
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
                fontWeight: 700
              }}
            >
              {patient.FirstName?.[0]}
            </div>
            <div style={{ fontSize: "0.9rem" }}>
              <div style={{ fontWeight: 600 }}>
                {patient.FirstName} {patient.LastName}
              </div>
              <div style={{ color: "var(--text-light)", fontSize: "0.8rem" }}>
                ID: {patient.PatientID} • {patient.Email}
              </div>
            </div>
          </div>
        )}

        <ul className="sidebar-menu">
          <li>
            <button 
              className={`sidebar-link ${currentPage === 'overview' ? 'active' : ''}`}
              onClick={() => handleNavClick("/patient", "patient-info")}
            >
              <span>👤</span> User Info
            </button>
          </li>
          <li>
            <button 
              className={`sidebar-link ${currentPage === 'quick-actions' ? 'active' : ''}`}
              onClick={() => handleNavClick("/patient", "quick-actions")}
            >
              <span>⚡</span> Quick Actions
            </button>
          </li>
          <li>
            <button 
              className={`sidebar-link ${currentPage === 'appointments' ? 'active' : ''}`}
              onClick={() => handleNavClick("/appointments")}
            >
              <span>📅</span> Appointments
            </button>
          </li>
          <li>
            <button 
              className={`sidebar-link ${currentPage === 'past-appointments' ? 'active' : ''}`}
              onClick={() => handleNavClick("/past-appointments")}
            >
              <span>🕒</span> Past Appointments
            </button>
          </li>
          <li>
            <button 
              className={`sidebar-link ${currentPage === 'records' ? 'active' : ''}`}
              onClick={() => handleNavClick("/records")}
            >
              <span>📄</span> Records
            </button>
          </li>
          <li>
            <button 
              className={`sidebar-link ${currentPage === 'health-timeline' ? 'active' : ''}`}
              onClick={() => handleNavClick("/health-timeline")}
            >
              <span>📊</span> Health Timeline
            </button>
          </li>
          <li>
            <button 
              className={`sidebar-link ${currentPage === 'health-trends' ? 'active' : ''}`}
              onClick={() => handleNavClick("/health-trends")}
            >
              <span>📈</span> Health Trends
            </button>
          </li>
          <li>
            <button 
              className={`sidebar-link ${currentPage === 'search-doctors' ? 'active' : ''}`}
              onClick={() => handleNavClick("/search-doctors")}
            >
              <span>🔍</span> Search Doctors
            </button>
          </li>
          <li>
            <button 
              className={`sidebar-link ${currentPage === 'vaccination-check' ? 'active' : ''}`}
              onClick={() => handleNavClick("/vaccination-check")}
            >
              <span>💉</span> Vaccination Check
            </button>
          </li>
          <li>
            <button 
              className={`sidebar-link ${currentPage === 'symptom-analyser' ? 'active' : ''}`}
              onClick={() => handleNavClick("/symptom-analyser")}
            >
              <span>🔬</span> Smart Symptom Analyser
            </button>
          </li>
        </ul>
      </div>
    </>
  )
}
