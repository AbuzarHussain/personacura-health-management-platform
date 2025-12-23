import React, { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import axios from "axios"
import PatientNav from "./PatientNav"
import "./App.css"
import { API_BASE_URL } from "../config"

export default function EditProfile() {
  const location = useLocation()
  const navigate = useNavigate()
  const patient = location?.state?.patient

  const [formData, setFormData] = useState({
    FirstName: "",
    LastName: "",
    UserName: "",
    Age: "",
    Gender: "",
    Email: "",
    Phone: "",
    Password: ""
  })
  const [updateStatus, setUpdateStatus] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [currentPatient, setCurrentPatient] = useState(patient)

  useEffect(() => {
    if (!patient && !currentPatient) {
      navigate("/")
      return
    }
    const patientData = currentPatient || patient
    // Initialize form with current patient data
    setFormData({
      FirstName: patientData.FirstName || "",
      LastName: patientData.LastName || "",
      UserName: patientData.UserName || "",
      Age: patientData.Age || "",
      Gender: patientData.Gender || "",
      Email: patientData.Email || "",
      Phone: patientData.Phone || "",
      Password: "" // Don't pre-fill password
    })

    // Always start at top when opening Edit Profile
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [patient, currentPatient, navigate])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setUpdateStatus(null)

    const activePatient = currentPatient || patient

    try {
      const payload = {
        PatientID: activePatient.PatientID,
        FirstName: formData.FirstName,
        LastName: formData.LastName,
        UserName: formData.UserName,
        Age: Number(formData.Age),
        Gender: formData.Gender,
        Email: formData.Email,
        Phone: formData.Phone
      }

      // Only include password if it's been changed
      if (formData.Password && formData.Password.trim() !== "") {
        payload.Password = formData.Password
      }

      console.log("Sending update payload:", payload)
      // Try POST first, fallback to PUT if needed
      const res = await axios.post(`${API_BASE_URL}/api/patients/update`, payload)
      
      // Update the current patient state with new data
      setCurrentPatient(res.data.patient)
      
      // Clear password field after successful update
      setFormData(prev => ({ ...prev, Password: "" }))
      
      setUpdateStatus({ ok: true, msg: "Profile updated successfully!" })
      
      // Scroll to top of the page
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch (err) {
      console.error("Update profile error:", err)
      console.error("Error response:", err?.response)
      const msg = err?.response?.data?.message || err?.message || "Failed to update profile. Please check the console for details."
      setUpdateStatus({ ok: false, msg })
    } finally {
      setIsLoading(false)
    }
  }

  const displayPatient = currentPatient || patient
  
  if (!displayPatient) {
    return null
  }

  return (
    <div className="App">
      <PatientNav patient={displayPatient} currentPage="edit-profile" />

      {/* Edit Profile Form */}
      <section className="features" style={{ paddingTop: "4rem", minHeight: "60vh" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem" }}>
          <button
            onClick={() => {
              navigate("/patient", { state: { patient: displayPatient } })
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
          <h2 className="section-title">Edit Profile</h2>
          <p style={{ color: "var(--text-light)", marginBottom: "2rem", textAlign: "center" }}>
            Update your profile information below
          </p>

          {updateStatus && (
            <div
              style={{
                padding: "1rem",
                marginBottom: "1.5rem",
                borderRadius: "8px",
                backgroundColor: updateStatus.ok ? "#d1fae5" : "#fee2e2",
                color: updateStatus.ok ? "#065f46" : "#991b1b",
                textAlign: "center",
                fontWeight: "500"
              }}
            >
              {updateStatus.msg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form" style={{ maxWidth: "600px", margin: "0 auto" }}>
            <div className="form-group">
              <label>First Name *</label>
              <input
                type="text"
                name="FirstName"
                value={formData.FirstName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Last Name *</label>
              <input
                type="text"
                name="LastName"
                value={formData.LastName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Username *</label>
              <input
                type="text"
                name="UserName"
                value={formData.UserName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Age *</label>
              <input
                type="number"
                name="Age"
                value={formData.Age}
                onChange={handleChange}
                min="0"
                required
              />
            </div>

            <div className="form-group">
              <label>Gender *</label>
              <select
                name="Gender"
                value={formData.Gender}
                onChange={handleChange}
                required
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid var(--border-color)",
                  borderRadius: "8px",
                  fontSize: "1rem"
                }}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                name="Email"
                value={formData.Email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Phone *</label>
              <input
                type="tel"
                name="Phone"
                value={formData.Phone}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>New Password (leave blank to keep current password)</label>
              <input
                type="password"
                name="Password"
                value={formData.Password}
                onChange={handleChange}
                autoComplete="new-password"
                placeholder="Enter new password or leave blank"
              />
            </div>

            <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
              <button
                type="submit"
                className="btn-primary"
                disabled={isLoading}
                style={{ 
                  flex: 1,
                  padding: "0.75rem 2rem",
                  borderRadius: "8px",
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                  fontWeight: "600"
                }}
              >
                {isLoading ? "Updating..." : "Update Profile"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/patient", { state: { patient: displayPatient } })}
                style={{ 
                  flex: 1,
                  padding: "0.75rem 2rem",
                  borderRadius: "8px",
                  backgroundColor: "white",
                  color: "#6b7280",
                  border: "1px solid #e5e7eb",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.3s",
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#f9fafb"
                  e.target.style.transform = "translateY(-1px)"
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "white"
                  e.target.style.transform = "translateY(0)"
                }}
              >
                Cancel
              </button>
            </div>
          </form>
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
                    navigate("/patient", { state: { patient } });
                  }}
                >
                  User Info
                </button>
              </li>
              <li>
                <button 
                  className="footer-link-btn"
                  onClick={() => {
                    navigate("/patient", { state: { patient } });
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

