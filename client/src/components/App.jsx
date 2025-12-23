import React, { useState } from "react"
import axios from "axios"
import "./App.css"
import { useNavigate } from "react-router-dom"
import { API_BASE_URL } from "../config"

function App() {
  const navigate = useNavigate()
  const [showDoctorLogin, setShowDoctorLogin] = useState(false)
  const [showCustomerLogin, setShowCustomerLogin] = useState(false)
  const [showDoctorSignup, setShowDoctorSignup] = useState(false)
  const [showCustomerSignup, setShowCustomerSignup] = useState(false)
  const [customerForm, setCustomerForm] = useState({
    FirstName: "",
    LastName: "",
    UserName: "",
    Age: "",
    Gender: "",
    Password: "",
    Email: "",
    Phone: ""
  })
  const [customerSubmitStatus, setCustomerSubmitStatus] = useState(null)
  const [customerLogin, setCustomerLogin] = useState({ Email: "", Password: "" })
  const [customerLoginStatus, setCustomerLoginStatus] = useState(null)
  const [doctorForm, setDoctorForm] = useState({
    FirstName: "",
    LastName: "",
    UserName: "",
    Email: "",
    Phone: "",
    Specialization: "",
    Password: "",
    Availability: "Yes",
  })
  const [doctorSubmitStatus, setDoctorSubmitStatus] = useState(null)
  const [doctorLogin, setDoctorLogin] = useState({ Email: "", Password: "" })
  const [doctorLoginStatus, setDoctorLoginStatus] = useState(null)

  const closeAllModals = () => {
    setShowDoctorLogin(false)
    setShowCustomerLogin(false)
    setShowDoctorSignup(false)
    setShowCustomerSignup(false)
  }

  return (
    <div className="App">
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-logo">
            <span className="logo-icon">⚕️</span>
            <span className="logo-text">Personacura</span>
          </div>
          <ul className="nav-menu">
            <li><a href="#home" onClick={(e) => { e.preventDefault(); document.getElementById('home')?.scrollIntoView({ behavior: 'smooth' }) }}>Home</a></li>
            <li><a href="#about" onClick={(e) => { e.preventDefault(); document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }) }}>About</a></li>
            <li><a href="#services" onClick={(e) => { e.preventDefault(); document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' }) }}>Features</a></li>
            <li><a href="#contact" onClick={(e) => { e.preventDefault(); document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }) }}>Contact</a></li>
          </ul>
          <div className="nav-buttons">
            <button 
              className="btn-nav btn-doctor"
              onClick={() => setShowDoctorLogin(true)}
            >
              Doctor Login
            </button>
            <button 
              className="btn-nav btn-customer"
              onClick={() => setShowCustomerLogin(true)}
            >
              Customer Login
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Your Health, <span className="highlight">Our Priority</span>
          </h1>
          <p className="hero-subtitle">
            Smart Personal Health & Appointment Management System
          </p>
          <p className="hero-description">
            Experience seamless healthcare management with Personacura. 
            Connect with healthcare professionals, manage your appointments, 
            track your health records, and take control of your wellness journey. 
            Join thousands of patients and doctors who trust Personacura for comprehensive 
            healthcare management solutions.
          </p>
          <div className="hero-buttons">
            <button 
              className="btn-primary"
              onClick={() => setShowDoctorSignup(true)}
            >
              Sign Up as Doctor
            </button>
            <button 
              className="btn-secondary"
              onClick={() => setShowCustomerSignup(true)}
            >
              Sign Up as Customer
            </button>
          </div>
        </div>
        <div className="hero-image">
          <div className="floating-card card-1">🏥</div>
          <div className="floating-card card-2">💊</div>
          <div className="floating-card card-3">❤️</div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="features" style={{ backgroundColor: "#f9fafb", padding: "5rem 2rem" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <h2 className="section-title">About Personacura</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem", marginTop: "3rem", alignItems: "center" }}>
            <div>
              <h3 style={{ fontSize: "1.8rem", marginBottom: "1.5rem", color: "#1f2937" }}>
                Revolutionizing Healthcare Management
              </h3>
              <p style={{ fontSize: "1.1rem", lineHeight: "1.8", color: "#4b5563", marginBottom: "1.5rem" }}>
                Personacura is a comprehensive healthcare management platform designed to bridge the gap between patients and healthcare providers. 
                Our mission is to make healthcare more accessible, organized, and efficient for everyone.
              </p>
              <p style={{ fontSize: "1.1rem", lineHeight: "1.8", color: "#4b5563", marginBottom: "1.5rem" }}>
                With Personacura, patients can easily book appointments, track their health records, receive personalized vaccine recommendations, 
                and get preliminary symptom analysis. Doctors can efficiently manage their schedules, access patient histories, 
                and provide better care through our intuitive dashboard.
              </p>
              <p style={{ fontSize: "1.1rem", lineHeight: "1.8", color: "#4b5563" }}>
                Built with modern technology and a focus on user experience, Personacura ensures that your health information is secure, 
                accessible, and always at your fingertips.
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div style={{ padding: "2rem", backgroundColor: "white", borderRadius: "12px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎯</div>
                <h4 style={{ fontSize: "1.3rem", marginBottom: "0.5rem", color: "#1f2937" }}>Our Mission</h4>
                <p style={{ color: "#6b7280" }}>To empower individuals to take control of their health through technology and seamless healthcare management.</p>
              </div>
              <div style={{ padding: "2rem", backgroundColor: "white", borderRadius: "12px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>💡</div>
                <h4 style={{ fontSize: "1.3rem", marginBottom: "0.5rem", color: "#1f2937" }}>Innovation</h4>
                <p style={{ color: "#6b7280" }}>Leveraging cutting-edge technology to provide intelligent health recommendations and streamlined workflows.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="services" className="features">
        <h2 className="section-title">Why Choose Personacura?</h2>
        <p style={{ textAlign: "center", color: "var(--text-light)", marginBottom: "3rem", fontSize: "1.1rem", maxWidth: "800px", margin: "0 auto 3rem" }}>
          Discover the powerful features that make Personacura the leading choice for healthcare management
        </p>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📅</div>
            <h3>Smart Appointment Booking</h3>
            <p>Book appointments with ease, view your schedule on an interactive calendar, and receive instant confirmations. 
            Manage both upcoming and past appointments all in one place.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>Secure & Private</h3>
            <p>Your health data is protected with advanced security measures. We use industry-standard encryption and follow 
            strict privacy protocols to ensure your information remains confidential.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">👨‍⚕️</div>
            <h3>Expert Healthcare Providers</h3>
            <p>Connect with certified doctors and specialists. Search by specialization or doctor name, view ratings and 
            availability, and choose the right healthcare professional for your needs.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Comprehensive Health Tracking</h3>
            <p>Monitor your health records, prescriptions, and medical history. Access your complete health timeline with 
            detailed records of appointments, medications, and treatments.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💉</div>
            <h3>Vaccine Recommendations</h3>
            <p>Receive personalized vaccine recommendations based on your age and gender. Our intelligent system helps you 
            stay up-to-date with mandatory and optional vaccinations.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔍</div>
            <h3>Symptom Analysis</h3>
            <p>Get preliminary health insights with our AI-powered symptom checker. Enter your symptoms to receive 
            potential condition predictions and recommended specialist consultations.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💊</div>
            <h3>Drug Information</h3>
            <p>Access comprehensive drug databases with detailed information about medications, dosages, side effects, 
            and interactions. Make informed decisions about your prescriptions.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📱</div>
            <h3>Mobile Friendly</h3>
            <p>Access your health information on any device, anywhere. Our responsive design ensures a seamless experience 
            whether you're on your phone, tablet, or computer.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Fast & Reliable</h3>
            <p>Experience lightning-fast performance with instant appointment confirmations, real-time updates, and 
            quick access to your medical records whenever you need them.</p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="features" style={{ backgroundColor: "#f9fafb", padding: "5rem 2rem" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <h2 className="section-title">Get in Touch</h2>
          <p style={{ textAlign: "center", color: "var(--text-light)", marginBottom: "3rem", fontSize: "1.1rem" }}>
            Have questions? We're here to help you get started with Personacura
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem", marginTop: "3rem" }}>
            <div style={{ padding: "2.5rem", backgroundColor: "white", borderRadius: "12px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)", textAlign: "center" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📧</div>
              <h3 style={{ fontSize: "1.3rem", marginBottom: "0.5rem", color: "#1f2937" }}>Email Support</h3>
              <p style={{ color: "#6b7280", marginBottom: "1rem" }}>Get help via email</p>
              <a href="mailto:support@personacura.com" style={{ color: "var(--primary-color)", textDecoration: "none", fontWeight: "600" }}>
                support@personacura.com
              </a>
            </div>
            <div style={{ padding: "2.5rem", backgroundColor: "white", borderRadius: "12px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)", textAlign: "center" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📞</div>
              <h3 style={{ fontSize: "1.3rem", marginBottom: "0.5rem", color: "#1f2937" }}>Phone Support</h3>
              <p style={{ color: "#6b7280", marginBottom: "1rem" }}>Call us during business hours</p>
              <a href="tel:+15551234567" style={{ color: "var(--primary-color)", textDecoration: "none", fontWeight: "600" }}>
                (555) 123-4567
              </a>
            </div>
          </div>
          <div style={{ marginTop: "3rem", padding: "2rem", backgroundColor: "white", borderRadius: "12px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
            <h3 style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "#1f2937", textAlign: "center" }}>Ready to Get Started?</h3>
            <p style={{ textAlign: "center", color: "#6b7280", marginBottom: "2rem" }}>
              Join thousands of patients and doctors who trust Personacura for their healthcare management needs.
            </p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap", alignItems: "center" }}>
              <button 
                className="btn-primary"
                onClick={() => setShowCustomerSignup(true)}
                style={{ 
                  padding: "0.9rem 2rem", 
                  fontSize: "1rem", 
                  fontWeight: "600",
                  minWidth: "180px"
                }}
              >
                Sign Up as Patient
              </button>
              <button 
                className="btn-secondary"
                onClick={() => setShowDoctorSignup(true)}
                style={{ 
                  padding: "0.9rem 2rem", 
                  fontSize: "1rem", 
                  fontWeight: "600",
                  minWidth: "180px",
                  backgroundColor: "#6b7280",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "background-color 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#4b5563"
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "#6b7280"
                }}
              >
                Sign Up as Doctor
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Doctor Login Modal */}
      {showDoctorLogin && (
        <div className="modal-overlay" onClick={closeAllModals}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeAllModals}>×</button>
            <h2>Doctor Login</h2>
            <form
              className="login-form"
              onSubmit={async (e) => {
                e.preventDefault()
                setDoctorLoginStatus(null)
                try {
                  const res = await axios.post(`${API_BASE_URL}/api/doctors/login`, {
                    Email: doctorLogin.Email,
                    Password: doctorLogin.Password
                  })
                  navigate("/doctor", { state: { doctor: res.data.doctor } })
                } catch (err) {
                  const msg = err?.response?.data?.message || "Login failed"
                  setDoctorLoginStatus({ ok: false, msg })
                }
              }}
            >
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="doctor@example.com"
                  value={doctorLogin.Email}
                  onChange={(e) => setDoctorLogin({ ...doctorLogin, Email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={doctorLogin.Password}
                  onChange={(e) => setDoctorLogin({ ...doctorLogin, Password: e.target.value })}
                  autoComplete="current-password"
                  required
                />
              </div>
              <button type="submit" className="btn-submit">Login</button>
              {doctorLoginStatus && (
                <p className="form-footer" style={{ color: doctorLoginStatus.ok ? "green" : "red" }}>
                  {doctorLoginStatus.msg}
                </p>
              )}
              <p className="form-footer">
                Don't have an account?{" "}
                <a href="#" onClick={(e) => {
                  e.preventDefault()
                  setShowDoctorLogin(false)
                  setShowDoctorSignup(true)
                }}>Sign Up</a>
              </p>
            </form>
          </div>
        </div>
      )}

      {/* Customer Login Modal */}
      {showCustomerLogin && (
        <div className="modal-overlay" onClick={closeAllModals}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeAllModals}>×</button>
            <h2>Customer Login</h2>
            <form
              className="login-form"
              onSubmit={async (e) => {
                e.preventDefault()
                setCustomerLoginStatus(null)
                try {
                  const res = await axios.post(`${API_BASE_URL}/api/patients/login`, {
                    Email: customerLogin.Email,
                    Password: customerLogin.Password
                  })
                  navigate("/patient", { state: { patient: res.data.patient } })
                } catch (err) {
                  const msg = err?.response?.data?.message || "Login failed"
                  setCustomerLoginStatus({ ok: false, msg })
                }
              }}
            >
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="customer@example.com"
                  value={customerLogin.Email}
                  onChange={(e) => setCustomerLogin({ ...customerLogin, Email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={customerLogin.Password}
                  onChange={(e) => setCustomerLogin({ ...customerLogin, Password: e.target.value })}
                  autoComplete="current-password"
                  required
                />
              </div>
              <button type="submit" className="btn-submit">Login</button>
              {customerLoginStatus && (
                <p className="form-footer" style={{ color: customerLoginStatus.ok ? "green" : "red" }}>
                  {customerLoginStatus.msg}
                </p>
              )}
              <p className="form-footer">
                Don't have an account?{" "}
                <a href="#" onClick={(e) => {
                  e.preventDefault()
                  setShowCustomerLogin(false)
                  setShowCustomerSignup(true)
                }}>Sign Up</a>
              </p>
            </form>
          </div>
        </div>
      )}

      {/* Doctor Signup Modal */}
      {showDoctorSignup && (
        <div className="modal-overlay" onClick={closeAllModals}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeAllModals}>×</button>
            <h2>Doctor Sign Up</h2>
            <form
              className="login-form"
              onSubmit={async (e) => {
                e.preventDefault()
                setDoctorSubmitStatus(null)
                try {
                  const payload = {
                    ...doctorForm,
                    Availability: doctorForm.Availability
                  }
                  const res = await axios.post(`${API_BASE_URL}/api/doctors/signup`, payload)
                  setDoctorSubmitStatus({ ok: true, msg: `Signed up with DoctorID ${res.data.DoctorID}` })

                  // Auto-login using Email + Password, then redirect to doctor dashboard
                  const loginRes = await axios.post(`${API_BASE_URL}/api/doctors/login`, {
                    Email: payload.Email,
                    Password: payload.Password
                  })
                  navigate("/doctor", { state: { doctor: loginRes.data.doctor } })

                  setDoctorForm({
                    FirstName: "",
                    LastName: "",
                    UserName: "",
                    Email: "",
                    Phone: "",
                    Specialization: "",
                    Password: "",
                    Availability: "Yes",
                  })
                } catch (err) {
                  const msg = err?.response?.data?.message || "Signup failed"
                  setDoctorSubmitStatus({ ok: false, msg })
                }
              }}
            >
              <div className="form-group">
                <label>First Name</label>
                <input
                  type="text"
                  value={doctorForm.FirstName}
                  onChange={(e) => setDoctorForm({ ...doctorForm, FirstName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  value={doctorForm.LastName}
                  onChange={(e) => setDoctorForm({ ...doctorForm, LastName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={doctorForm.UserName}
                  onChange={(e) => setDoctorForm({ ...doctorForm, UserName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={doctorForm.Email}
                  onChange={(e) => setDoctorForm({ ...doctorForm, Email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={doctorForm.Phone}
                  onChange={(e) => setDoctorForm({ ...doctorForm, Phone: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Specialization</label>
                <input
                  type="text"
                  value={doctorForm.Specialization}
                  onChange={(e) => setDoctorForm({ ...doctorForm, Specialization: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={doctorForm.Password}
                  onChange={(e) => setDoctorForm({ ...doctorForm, Password: e.target.value })}
                  autoComplete="new-password"
                  required
                />
              </div>
              <div className="form-group">
                <label>Availability</label>
                <select
                  value={doctorForm.Availability}
                  onChange={(e) => setDoctorForm({ ...doctorForm, Availability: e.target.value })}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <button type="submit" className="btn-submit">Sign Up</button>
              {doctorSubmitStatus && (
                <p className="form-footer" style={{ color: doctorSubmitStatus.ok ? "green" : "red" }}>
                  {doctorSubmitStatus.msg}
                </p>
              )}
              <p className="form-footer">
                Already have an account?{" "}
                <a href="#" onClick={(e) => {
                  e.preventDefault()
                  setShowDoctorSignup(false)
                  setShowDoctorLogin(true)
                }}>Login</a>
              </p>
            </form>
          </div>
        </div>
      )}

      {/* Customer Signup Modal */}
      {showCustomerSignup && (
        <div className="modal-overlay" onClick={closeAllModals}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeAllModals}>×</button>
            <h2>Customer Sign Up</h2>
            <form
              className="login-form"
              onSubmit={async (e) => {
                e.preventDefault()
                setCustomerSubmitStatus(null)
                try {
                  const payload = {
                    ...customerForm,
                    Age: Number(customerForm.Age)
                  }
                  const res = await axios.post(`${API_BASE_URL}/api/patients/signup`, payload)
                  setCustomerSubmitStatus({ ok: true, msg: `Signed up with PatientID ${res.data.PatientID}` })

                  // Auto-login using Email + Password, then redirect to dashboard
                  const loginRes = await axios.post(`${API_BASE_URL}/api/patients/login`, {
                    Email: payload.Email,
                    Password: payload.Password
                  })
                  navigate("/patient", { state: { patient: loginRes.data.patient } })

                  setCustomerForm({
                    FirstName: "",
                    LastName: "",
                    UserName: "",
                    Age: "",
                    Gender: "",
                    Password: "",
                    Email: "",
                    Phone: ""
                  })
                } catch (err) {
                  const msg = err?.response?.data?.message || "Signup failed"
                  setCustomerSubmitStatus({ ok: false, msg })
                }
              }}
            >
              <div className="form-group">
                <label>First Name</label>
                <input
                  type="text"
                  value={customerForm.FirstName}
                  onChange={(e) => setCustomerForm({ ...customerForm, FirstName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  value={customerForm.LastName}
                  onChange={(e) => setCustomerForm({ ...customerForm, LastName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={customerForm.UserName}
                  onChange={(e) => setCustomerForm({ ...customerForm, UserName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Age</label>
                <input
                  type="number"
                  min="0"
                  value={customerForm.Age}
                  onChange={(e) => setCustomerForm({ ...customerForm, Age: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Gender</label>
                <input
                  type="text"
                  value={customerForm.Gender}
                  onChange={(e) => setCustomerForm({ ...customerForm, Gender: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={customerForm.Password}
                  onChange={(e) => setCustomerForm({ ...customerForm, Password: e.target.value })}
                  autoComplete="new-password"
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={customerForm.Email}
                  onChange={(e) => setCustomerForm({ ...customerForm, Email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={customerForm.Phone}
                  onChange={(e) => setCustomerForm({ ...customerForm, Phone: e.target.value })}
                  required
                />
              </div>
              <button type="submit" className="btn-submit">Sign Up</button>
              {customerSubmitStatus && (
                <p className="form-footer" style={{ color: customerSubmitStatus.ok ? "green" : "red" }}>
                  {customerSubmitStatus.msg}
                </p>
              )}
              <p className="form-footer">
                Already have an account?{" "}
                <a href="#" onClick={(e) => {
                  e.preventDefault()
                  setShowCustomerSignup(false)
                  setShowCustomerLogin(true)
                }}>Login</a>
              </p>
            </form>
          </div>
        </div>
      )}

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
              <li><a href="#home" onClick={(e) => { e.preventDefault(); document.getElementById('home')?.scrollIntoView({ behavior: 'smooth' }) }}>Home</a></li>
              <li><a href="#about" onClick={(e) => { e.preventDefault(); document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }) }}>About</a></li>
              <li><a href="#services" onClick={(e) => { e.preventDefault(); document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' }) }}>Features</a></li>
              <li><a href="#contact" onClick={(e) => { e.preventDefault(); document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }) }}>Contact</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Contact</h4>
            <p><a href="mailto:support@personacura.com" style={{ color: "inherit", textDecoration: "none" }}>support@personacura.com</a></p>
            <p><a href="tel:+15551234567" style={{ color: "inherit", textDecoration: "none" }}>(555) 123-4567</a></p>
            <p style={{ marginTop: "1rem", fontSize: "0.9rem", color: "rgba(255,255,255,0.7)" }}>Monday - Friday: 9 AM - 6 PM EST</p>
          </div>
          <div className="footer-section">
            <h4>Features</h4>
            <ul>
              <li>Appointment Management</li>
              <li>Health Records</li>
              <li>Vaccine Recommendations</li>
              <li>Symptom Analysis</li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2024 Personacura. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default App


