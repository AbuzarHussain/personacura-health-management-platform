import React, { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import axios from "axios"
import DoctorNav from "./DoctorNav"
import "./App.css"
import { API_BASE_URL } from "../config"

export default function DoctorPatientProfile() {
  const location = useLocation()
  const navigate = useNavigate()
  const doctor = location?.state?.doctor
  const patient = location?.state?.patient

  const [formData, setFormData] = useState({
    DrugID: "",
    DrugName: "",
    Dosage: "",
    Instructions: "",
    FollowUpDate: ""
  })
  const [status, setStatus] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [drugSuggestions, setDrugSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  useEffect(() => {
    if (!doctor || !patient) {
      navigate("/")
      return
    }
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [doctor, patient, navigate])

  if (!doctor || !patient) {
    return null
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Fetch drug suggestions when typing in DrugName field
    if (name === "DrugName") {
      if (value.trim() !== "") {
        fetchDrugSuggestions(value)
        setShowSuggestions(true)
      } else {
        setDrugSuggestions([])
        setShowSuggestions(false)
        setFormData(prev => ({ ...prev, DrugID: "" }))
      }
    }
  }

  const fetchDrugSuggestions = async (text) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/drugs/suggestions`, {
        params: { text: text }
      })
      setDrugSuggestions(res.data || [])
    } catch (err) {
      console.error("Error fetching drug suggestions:", err)
      setDrugSuggestions([])
    }
  }

  const handleDrugSelect = async (drugName) => {
    try {
      // Fetch drug details to get DrugID
      const res = await axios.get(`${API_BASE_URL}/api/drugs/details`, {
        params: { selection: drugName }
      })
      
      if (res.data && res.data.length > 0) {
        const drug = res.data[0]
        setFormData(prev => ({
          ...prev,
          DrugName: drug.DrugName,
          DrugID: drug.DrugID
        }))
        setShowSuggestions(false)
        setDrugSuggestions([])
      }
    } catch (err) {
      console.error("Error fetching drug details:", err)
      setStatus({ ok: false, msg: "Failed to fetch drug details. Please try again." })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setStatus(null)

    // Validate that a drug has been selected (either DrugID or DrugName)
    if (!formData.DrugID && !formData.DrugName) {
      setStatus({ ok: false, msg: "Please select a drug from the suggestions." })
      setSubmitting(false)
      return
    }

    // Validate doctor and patient objects exist
    if (!doctor || !doctor.DoctorID) {
      setStatus({ ok: false, msg: "Doctor information is missing. Please log in again." })
      setSubmitting(false)
      return
    }

    if (!patient || !patient.PatientID) {
      setStatus({ ok: false, msg: "Patient information is missing. Please try again." })
      setSubmitting(false)
      return
    }

    try {
      // Build payload - send AppointmentID if available, otherwise send DoctorID and PatientID
      // Send DrugName so backend can look up DrugID, but also send DrugID if available
      const payload = {
        AppointmentID: patient.UpcomingAppointmentID || null,
        // Only send DoctorID/PatientID if AppointmentID is not available
        ...(patient.UpcomingAppointmentID ? {} : {
          DoctorID: doctor.DoctorID,
          PatientID: patient.PatientID
        }),
        // Send DrugName for lookup, DrugID as fallback
        DrugName: formData.DrugName || null,
        DrugID: formData.DrugID || null,
        Dosage: formData.Dosage,
        Instructions: formData.Instructions,
        FollowUpDate: formData.FollowUpDate || null
      }

      console.log("Submitting prescription with payload:", payload)

      await axios.post(`${API_BASE_URL}/api/prescriptions`, payload)

      setStatus({ ok: true, msg: "Report (prescription) added successfully." })
      setFormData({
        DrugID: "",
        DrugName: "",
        Dosage: "",
        Instructions: "",
        FollowUpDate: ""
      })
      setDrugSuggestions([])
      setShowSuggestions(false)
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to add report. Please try again."
      setStatus({ ok: false, msg })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="App">
      <DoctorNav doctor={doctor} currentPage="patient-profile" />

      <section className="features" style={{ paddingTop: "4rem", minHeight: "60vh" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
            <button
              onClick={() => navigate("/doctor/patients", { state: { doctor } })}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.5rem 1rem",
                backgroundColor: "#6b7280",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "0.9rem",
                transition: "background-color 0.2s"
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#4b5563"
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "#6b7280"
              }}
            >
              <span>←</span>
              <span>Back to Patients</span>
            </button>
          </div>
          <h2 className="section-title">Patient Profile</h2>
          <p style={{ color: "var(--text-light)", marginBottom: "2rem", textAlign: "center" }}>
            Detailed information about the selected patient.
          </p>

          <div className="features-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            <div className="feature-card">
              <div className="feature-icon">🧑‍⚕️</div>
              <h3>Identity</h3>
              <p>Name: {patient.FirstName} {patient.LastName}</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Demographics</h3>
              <p>Age: {patient.Age ?? "-"}</p>
              <p>Gender: {patient.Gender ?? "-"}</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">✉️</div>
              <h3>Contact</h3>
              <p>Email: {patient.Email ?? "-"}</p>
              <p>Phone: {patient.Phone ?? "-"}</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📅</div>
              <h3>Last Visit</h3>
              <p>
                {patient.LastVisitDate
                  ? new Date(patient.LastVisitDate).toLocaleDateString("en-US")
                  : "N/A"}
              </p>
            </div>
          </div>

          {status && (
            <div
              style={{
                marginTop: "2rem",
                padding: "1rem",
                borderRadius: "8px",
                backgroundColor: status.ok ? "#d1fae5" : "#fee2e2",
                color: status.ok ? "#065f46" : "#991b1b",
                textAlign: "center",
                fontWeight: 500
              }}
            >
              {status.msg}
            </div>
          )}

          {/* Only show prescription form for upcoming patients */}
          {patient.HasUpcoming && (
            <div style={{ marginTop: "2.5rem" }}>
              <h3 className="section-title" style={{ fontSize: "1.5rem" }}>Add Report / Prescription</h3>
              
              {/* Debug info - can be removed later */}
              {(process.env.NODE_ENV === 'development') && (
                <div style={{ 
                  marginBottom: "1rem", 
                  padding: "0.75rem", 
                  backgroundColor: "#f3f4f6", 
                  borderRadius: "6px",
                  fontSize: "0.85rem",
                  color: "#6b7280"
                }}>
                  <strong>Debug Info:</strong> DoctorID: {doctor?.DoctorID || "Missing"}, PatientID: {patient?.PatientID || "Missing"}
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="login-form" style={{ maxWidth: "600px", margin: "1.5rem auto 0" }}>
                <div className="form-group" style={{ position: "relative" }}>
                  <label>Drug Name *</label>
                  <input
                    type="text"
                    name="DrugName"
                    value={formData.DrugName}
                    onChange={handleChange}
                    onBlur={() => {
                      // Delay hiding suggestions to allow click
                      setTimeout(() => setShowSuggestions(false), 200)
                    }}
                    onFocus={() => {
                      if (drugSuggestions.length > 0) {
                        setShowSuggestions(true)
                      }
                    }}
                    required
                    placeholder="Start typing drug name..."
                    style={{ width: "100%" }}
                  />
                  {showSuggestions && drugSuggestions.length > 0 && (
                    <ul style={{
                      listStyle: "none",
                      padding: "0",
                      margin: "5px 0 0 0",
                      position: "absolute",
                      width: "100%",
                      backgroundColor: "white",
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                      zIndex: 1000,
                      maxHeight: "200px",
                      overflowY: "auto"
                    }}>
                      {drugSuggestions.map((drugName, index) => (
                        <li
                          key={index}
                          onClick={() => handleDrugSelect(drugName)}
                          style={{
                            padding: "10px 15px",
                            cursor: "pointer",
                            borderBottom: index !== drugSuggestions.length - 1 ? "1px solid #f0f0f0" : "none",
                            color: "#333"
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = "#f9f9f9"}
                          onMouseLeave={(e) => e.target.style.backgroundColor = "white"}
                        >
                          {drugName}
                        </li>
                      ))}
                    </ul>
                  )}
                  {formData.DrugID && (
                    <p style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "var(--text-light)" }}>
                      Selected Drug ID: {formData.DrugID}
                    </p>
                  )}
                </div>
                <div className="form-group">
                  <label>Dosage</label>
                  <input
                    type="text"
                    name="Dosage"
                    value={formData.Dosage}
                    onChange={handleChange}
                    placeholder="e.g., 10mg once daily"
                  />
                </div>
                <div className="form-group">
                  <label>Instructions</label>
                  <textarea
                    name="Instructions"
                    value={formData.Instructions}
                    onChange={handleChange}
                    placeholder="Add any special instructions for the patient"
                    style={{
                      width: "100%",
                      minHeight: "120px",
                      padding: "0.75rem",
                      border: "1px solid var(--border-color)",
                      borderRadius: "8px",
                      fontFamily: "inherit",
                      fontSize: "1rem"
                    }}
                  />
                </div>
                <div className="form-group">
                  <label>Follow Up Date</label>
                  <input
                    type="date"
                    name="FollowUpDate"
                    value={formData.FollowUpDate}
                    onChange={handleChange}
                  />
                </div>
                <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={submitting}
                    style={{ padding: "0.9rem 2.5rem", fontSize: "1rem", opacity: submitting ? 0.8 : 1 }}
                  >
                    {submitting ? "Saving..." : "Submit Report"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}


