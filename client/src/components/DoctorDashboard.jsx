import React from "react"
import { useLocation, useNavigate } from "react-router-dom"
import DoctorNav from "./DoctorNav"
import "./App.css"

export default function DoctorDashboard() {
  const location = useLocation()
  const navigate = useNavigate()
  const doctor = location?.state?.doctor

  if (!doctor) {
    navigate("/")
    return null
  }

  return (
    <div className="App">
      <DoctorNav doctor={doctor} currentPage="overview" />

      {/* Hero / Welcome */}
      <section id="overview" className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Welcome, <span className="highlight">Dr. {doctor.FirstName}</span>
          </h1>
          <p className="hero-subtitle">
            Your personalized practice dashboard
          </p>
          <p className="hero-description">
            View your profile, manage your schedule, and stay on top of your patients all in one place.
          </p>
          <div
            className="hero-buttons"
            style={{ marginTop: "2rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}
          >
            <button
              className="btn-primary"
              onClick={() => {
                navigate("/doctor/calendar", { state: { doctor } })
              }}
            >
              📅 View Schedule
            </button>
            <button
              className="btn-primary"
              onClick={() => {
                navigate("/doctor/edit-profile", { state: { doctor } })
              }}
            >
              ⚙️ Edit Profile
            </button>
          </div>
        </div>
        <div className="hero-image">
          <div className="floating-card card-1">🩺</div>
          <div className="floating-card card-2">📅</div>
          <div className="floating-card card-3">👥</div>
        </div>
      </section>

      {/* User Info */}
      <section id="doctor-info" className="features" style={{ paddingTop: "9rem" }}>
        <h2 className="section-title">User Info</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🆔</div>
            <h3>Identity</h3>
            <p>Name: Dr. {doctor.FirstName} {doctor.LastName}</p>
            <p>Username: {doctor.UserName}</p>
            <p>ID: {doctor.DoctorID}</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📧</div>
            <h3>Contact</h3>
            <p>Email: {doctor.Email}</p>
            <p>Phone: {doctor.Phone || "-"}</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🏥</div>
            <h3>Practice</h3>
            <p>Specialization: {doctor.Specialization || "-"}</p>
            <p>Availability: {doctor.Availability}</p>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section id="appointments" className="features">
        <h2 className="section-title">Quick Actions</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">➕</div>
            <h3>Manage Schedule</h3>
            <p>Review today’s schedule and upcoming visits</p>
            <button
              className="btn-primary"
              style={{ marginTop: 8 }}
              onClick={() => navigate("/doctor/calendar", { state: { doctor } })}
            >
              Open Schedule
            </button>
          </div>
          <div className="feature-card" id="patients">
            <div className="feature-icon">🗂️</div>
            <h3>Patient List</h3>
            <p>Browse your patients and recent consultations</p>
            <button
              className="btn-primary"
              style={{ marginTop: 8 }}
              onClick={() => {
                navigate("/doctor/patients", { state: { doctor } })
              }}
            >
              View Patients
            </button>
          </div>
          <div className="feature-card" id="settings">
            <div className="feature-icon">⚙️</div>
            <h3>Profile & Availability</h3>
            <p>Update your availability and profile settings</p>
            <button
              className="btn-primary"
              style={{ marginTop: 8 }}
              onClick={() => {
                navigate("/doctor/edit-profile", { state: { doctor } })
              }}
            >
              Edit Profile
            </button>
          </div>
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
              <li><a href="#overview">Overview</a></li>
              <li><a href="#appointments">Appointments</a></li>
              <li><a href="#patients">Patients</a></li>
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

