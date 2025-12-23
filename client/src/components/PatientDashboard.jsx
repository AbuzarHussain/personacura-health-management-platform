import React from "react"
import { useLocation, useNavigate } from "react-router-dom"
import PatientNav from "./PatientNav"
import "./App.css"

export default function PatientDashboard() {
  const location = useLocation()
  const navigate = useNavigate()
  const patient = location?.state?.patient

  if (!patient) {
    navigate("/")
    return null
  }

  return (
    <div className="App">
      <PatientNav patient={patient} currentPage="overview" />

      {/* Hero / Welcome */}
      <section id="overview" className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Welcome, <span className="highlight">{patient.FirstName}</span>
          </h1>
          <p className="hero-subtitle">
            Your personalized health dashboard
          </p>
          <p className="hero-description">
            View your profile, manage appointments, and access your medical records all in one place.
          </p>
          <div className="hero-buttons" style={{ marginTop: "2rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <button 
              className="btn-primary"
              onClick={() => {
                navigate("/records", { state: { patient } });
              }}
            >
              📄 View Records
            </button>
            <button 
              className="btn-primary"
              onClick={() => {
                navigate("/edit-profile", { state: { patient } });
              }}
            >
              ⚙️ Edit Profile
            </button>
          </div>
        </div>
        <div className="hero-image">
          <div className="floating-card card-1">🩺</div>
          <div className="floating-card card-2">📅</div>
          <div className="floating-card card-3">📄</div>
        </div>
      </section>

      {/* User Info */}
      <section id="patient-info" className="features" style={{ paddingTop: "9rem" }}>
        <h2 className="section-title">User Info</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🆔</div>
            <h3>Identity</h3>
            <p>Name: {patient.FirstName} {patient.LastName}</p>
            <p>Username: {patient.UserName}</p>
            <p>ID: {patient.PatientID}</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">👤</div>
            <h3>Demographics</h3>
            <p>Age: {patient.Age}</p>
            <p>Gender: {patient.Gender}</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">✉️</div>
            <h3>Contact</h3>
            <p>Email: {patient.Email}</p>
            <p>Phone: {patient.Phone}</p>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section id="quick-actions" className="features">
        <h2 className="section-title">Quick Actions</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">➕</div>
            <h3>Book Appointment</h3>
            <p>Schedule a visit with a healthcare professional</p>
            <button className="btn-primary" style={{ marginTop: 8 }} onClick={()=>navigate("/patient/calendar", { state: { patient: patient } })}>Book Now</button>
          </div>
          <div className="feature-card" id="records">
            <div className="feature-icon">🗂️</div>
            <h3>View Records</h3>
            <p>Access your medical history and lab reports</p>
            <button 
              className="btn-primary" 
              style={{ marginTop: 8 }}
              onClick={() => {
                navigate("/records", { state: { patient } });
              }}
            >
              View Records
            </button>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🕒</div>
            <h3>Past Appointments</h3>
            <p>Review visits and leave feedback for your doctors</p>
            <button 
              className="btn-primary" 
              style={{ marginTop: 8 }}
              onClick={() => {
                navigate("/past-appointments", { state: { patient } });
              }}
            >
              View Past Visits
            </button>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📋</div>
            <h3>My Appointments</h3>
            <p>View and manage your upcoming appointments</p>
            <button 
              className="btn-primary" 
              style={{ marginTop: 8 }}
              onClick={() => {
                navigate("/appointments", { state: { patient } });
              }}
            >
              View Appointments
            </button>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Health Timeline</h3>
            <p>Visual timeline of your health events</p>
            <button 
              className="btn-primary" 
              style={{ marginTop: 8 }}
              onClick={() => {
                navigate("/health-timeline", { state: { patient } });
              }}
            >
              View Timeline
            </button>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📈</div>
            <h3>Health Trends</h3>
            <p>Analyze prescription trends over time</p>
            <button 
              className="btn-primary" 
              style={{ marginTop: 8 }}
              onClick={() => {
                navigate("/health-trends", { state: { patient } });
              }}
            >
              View Trends
            </button>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔬</div>
            <h3>Symptom Analyser</h3>
            <p>Get insights about your symptoms</p>
            <button 
              className="btn-primary" 
              style={{ marginTop: 8 }}
              onClick={() => {
                navigate("/symptom-analyser", { state: { patient } });
              }}
            >
              Analyze Symptoms
            </button>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💉</div>
            <h3>Vaccination Check</h3>
            <p>Check recommended vaccinations</p>
            <button 
              className="btn-primary" 
              style={{ marginTop: 8 }}
              onClick={() => {
                navigate("/vaccination-check", { state: { patient } });
              }}
            >
              Check Vaccines
            </button>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔍</div>
            <h3>Search Doctors</h3>
            <p>Find and search for healthcare providers</p>
            <button 
              className="btn-primary" 
              style={{ marginTop: 8 }}
              onClick={() => {
                navigate("/search-doctors", { state: { patient } });
              }}
            >
              Search Doctors
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
              <li>
                <button 
                  className="footer-link-btn"
                  onClick={() => {
                    document.getElementById("patient-info")?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  User Info
                </button>
              </li>
              <li>
                <button 
                  className="footer-link-btn"
                  onClick={() => {
                    document.getElementById("quick-actions")?.scrollIntoView({ behavior: "smooth" });
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
