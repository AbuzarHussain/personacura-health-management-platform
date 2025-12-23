import React, { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import axios from "axios"
import DoctorNav from "./DoctorNav"
import "./App.css"
import { API_BASE_URL } from "../config"

export default function DoctorEditProfile() {
  const location = useLocation()
  const navigate = useNavigate()
  const doctor = location?.state?.doctor

  const [formData, setFormData] = useState({
    FirstName: "",
    LastName: "",
    UserName: "",
    Email: "",
    Phone: "",
    Specialization: "",
    Availability: "",
    Password: "",
  })
  const [updateStatus, setUpdateStatus] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [currentDoctor, setCurrentDoctor] = useState(doctor)

  useEffect(() => {
    if (!doctor && !currentDoctor) {
      navigate("/")
      return
    }
    const doctorData = currentDoctor || doctor
    setFormData({
      FirstName: doctorData.FirstName || "",
      LastName: doctorData.LastName || "",
      UserName: doctorData.UserName || "",
      Email: doctorData.Email || "",
      Phone: doctorData.Phone || "",
      Specialization: doctorData.Specialization || "",
      Availability: doctorData.Availability || "Yes",
      Password: "",
    })
    // Always start at top when opening Edit Profile
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [doctor, currentDoctor, navigate])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setUpdateStatus(null)

    const activeDoctor = currentDoctor || doctor

    try {
      const payload = {
        DoctorID: activeDoctor.DoctorID,
        FirstName: formData.FirstName,
        LastName: formData.LastName,
        UserName: formData.UserName,
        Email: formData.Email,
        Phone: formData.Phone,
        Specialization: formData.Specialization,
        Availability: formData.Availability,
      }

      if (formData.Password && formData.Password.trim() !== "") {
        payload.Password = formData.Password
      }

      console.log("Sending doctor update payload:", payload)
      // fixed
      const res = await axios.post(`${API_BASE_URL}/api/doctors/update`, payload)

      setCurrentDoctor(res.data.doctor)
      setFormData((prev) => ({ ...prev, Password: "" }))

      setUpdateStatus({ ok: true, msg: "Profile updated successfully!" })
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch (err) {
      console.error("Update doctor profile error:", err)
      console.error("Error response:", err?.response)
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update profile. Please check the console for details."
      setUpdateStatus({ ok: false, msg })
    } finally {
      setIsLoading(false)
    }
  }

  const displayDoctor = currentDoctor || doctor

  if (!displayDoctor) {
    return null
  }

  return (
    <div className="App">
      <DoctorNav doctor={displayDoctor} currentPage="edit-profile" />

      <section className="features" style={{ paddingTop: "4rem", minHeight: "60vh" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem" }}>
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
                fontWeight: "500",
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
              <label>Phone</label>
              <input
                type="tel"
                name="Phone"
                value={formData.Phone}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Specialization</label>
              <input
                type="text"
                name="Specialization"
                value={formData.Specialization}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Availability</label>
              <select
                name="Availability"
                value={formData.Availability}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid var(--border-color)",
                  borderRadius: "8px",
                  fontSize: "1rem",
                }}
              >
                <option value="Yes">Available</option>
                <option value="No">Not Available</option>
              </select>
            </div>

            <div className="form-group">
              <label>New Password (leave blank to keep current password)</label>
              <input
                type="password"
                name="Password"
                value={formData.Password}
                onChange={handleChange}
                placeholder="Enter new password or leave blank"
                autoComplete="new-password"
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
                  fontWeight: "600",
                }}
              >
                {isLoading ? "Updating..." : "Update Profile"}
              </button>
              <button
                type="button"
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
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#f9fafb"
                  e.target.style.transform = "translateY(-1px)"
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "white"
                  e.target.style.transform = "translateY(0)"
                }}
                onClick={() => navigate("/doctor", { state: { doctor: displayDoctor } })}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  )
}


