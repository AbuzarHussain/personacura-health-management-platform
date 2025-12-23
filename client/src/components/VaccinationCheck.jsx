import React, { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import axios from "axios"
import PatientNav from "./PatientNav"
import "./App.css"
import { API_BASE_URL } from "../config"

// Vaccine Check History Component
function VaccineCheckHistory({ patient, refreshTrigger }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const fetchHistory = React.useCallback(async () => {
    try {
      setLoading(true)
      const response = await axios.get(
        `${API_BASE_URL}/api/vaccines/check-history${patient?.PatientID ? `?patientId=${patient.PatientID}` : ''}`
      )
      setHistory(response.data.logs || [])
    } catch (err) {
      console.error("Error fetching vaccine check history:", err)
      setHistory([])
    } finally {
      setLoading(false)
    }
  }, [patient])

  useEffect(() => {
    if (showHistory) {
      fetchHistory()
    }
  }, [showHistory, refreshTrigger, fetchHistory])

  return (
    <div className="feature-card" style={{ padding: "2rem", marginTop: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h3 style={{ marginBottom: 0 }}>📜 Vaccine Check History</h3>
        <button
          className="btn-primary"
          onClick={() => {
            setShowHistory(!showHistory)
            if (!showHistory) {
              fetchHistory()
            }
          }}
          style={{ padding: "0.5rem 1rem", fontSize: "0.9rem" }}
        >
          {showHistory ? "Hide History" : "View History"}
        </button>
      </div>

      {showHistory && (
        <>
          {loading ? (
            <p style={{ textAlign: "center", color: "var(--text-light)" }}>Loading history...</p>
          ) : history.length === 0 ? (
            <p style={{ textAlign: "center", color: "var(--text-light)", fontStyle: "italic" }}>
              No vaccine check history found
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxHeight: "500px", overflowY: "auto" }}>
              {history.map((log, idx) => (
                <div
                  key={log.logId || idx}
                  style={{
                    padding: "1rem",
                    backgroundColor: "#f9fafb",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <div style={{ fontWeight: "600" }}>
                      Check #{log.logId} - {log.age} years old, {log.gender}
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-light)" }}>
                      {new Date(log.checkedAt).toLocaleString()}
                    </div>
                  </div>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem", marginTop: "0.75rem" }}>
                    <div>
                      <strong style={{ fontSize: "0.85rem", color: "#16a34a" }}>
                        Received ({log.receivedVaccines?.length || 0}):
                      </strong>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-light)", marginTop: "0.25rem" }}>
                        {log.receivedVaccines?.length > 0 
                          ? log.receivedVaccines.map(v => v.name).join(", ")
                          : "None"
                        }
                      </div>
                    </div>
                    <div>
                      <strong style={{ fontSize: "0.85rem", color: "#dc2626" }}>
                        Mandatory ({log.mandatoryVaccines?.length || 0}):
                      </strong>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-light)", marginTop: "0.25rem" }}>
                        {log.mandatoryVaccines?.length > 0
                          ? log.mandatoryVaccines.map(v => v.name).join(", ")
                          : "None"
                        }
                      </div>
                    </div>
                    <div>
                      <strong style={{ fontSize: "0.85rem", color: "#3b82f6" }}>
                        Optional ({log.optionalVaccines?.length || 0}):
                      </strong>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-light)", marginTop: "0.25rem" }}>
                        {log.optionalVaccines?.length > 0
                          ? log.optionalVaccines.map(v => v.name).join(", ")
                          : "None"
                        }
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function VaccinationCheck() {
  const location = useLocation()
  const navigate = useNavigate()
  const patient = location?.state?.patient

  const [age, setAge] = useState("")
  const [gender, setGender] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const [allVaccines, setAllVaccines] = useState([])
  const [receivedVaccines, setReceivedVaccines] = useState([])
  const [saveStatus, setSaveStatus] = useState(null)
  const [refreshHistory, setRefreshHistory] = useState(0)

  if (!patient) {
    navigate("/")
    return null
  }

  const fetchVaccines = async () => {
    if (!age || !gender) {
      setError("Please enter both age and gender")
      return
    }

    const ageNum = parseInt(age)
    if (isNaN(ageNum) || ageNum < 0 || ageNum > 150) {
      setError("Please enter a valid age (0-150)")
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await axios.get(
        `${API_BASE_URL}/api/vaccines/recommendations?age=${ageNum}&gender=${gender}`
      )

      const { mandatory, optional } = response.data

      // Transform and combine all vaccines
      const transformVaccine = (v) => ({
        id: v.VaccineID,
        name: v.VaccineName,
        type: v.Type,
        ageRange: `Ages ${v.MinAge}-${v.MaxAge} years`,
        doses: v.NumberOfDosages,
        interval: v.IntervalBetweenDosesMonths
      })

      const allVaccinesList = [
        ...mandatory.map(transformVaccine),
        ...optional.map(transformVaccine)
      ]

      setAllVaccines(allVaccinesList)
      setReceivedVaccines([]) // Reset received vaccines when fetching new recommendations
    } catch (err) {
      console.error("Error fetching vaccine recommendations:", err)
      setError(err.response?.data?.message || "Failed to load vaccine recommendations")
    } finally {
      setLoading(false)
    }
  }

  const handleVaccineToggle = (vaccineId) => {
    setReceivedVaccines(prev => 
      prev.includes(vaccineId)
        ? prev.filter(id => id !== vaccineId)
        : [...prev, vaccineId]
    )
  }

  const saveVaccineCheck = async () => {
    if (allVaccines.length === 0) {
      setSaveStatus({ ok: false, msg: "Please get vaccine recommendations first" })
      setTimeout(() => setSaveStatus(null), 3000)
      return
    }

    try {
      const receivedList = getReceivedVaccinesList()
      const mandatoryList = allVaccines.filter(v => v.type === 'Mandatory')
      const optionalList = allVaccines.filter(v => v.type === 'Optional')

      const response = await axios.post(
        `${API_BASE_URL}/api/vaccines/save-check`,
        {
          patientId: patient?.PatientID || null,
          age: parseInt(age),
          gender: gender,
          receivedVaccines: receivedList,
          mandatoryVaccines: mandatoryList,
          optionalVaccines: optionalList
        }
      )

      setSaveStatus({ ok: true, msg: "Vaccine check results saved successfully!" })
      setTimeout(() => setSaveStatus(null), 3000)
      // Refresh history after saving
      setRefreshHistory(prev => prev + 1)
    } catch (err) {
      console.error("Error saving vaccine check:", err)
      setSaveStatus({ 
        ok: false, 
        msg: err.response?.data?.message || "Failed to save vaccine check results" 
      })
      setTimeout(() => setSaveStatus(null), 3000)
    }
  }

  // Calculate remaining mandatory vaccines
  const getRemainingMandatoryVaccines = () => {
    const mandatoryVaccines = allVaccines.filter(v => v.type === 'Mandatory')
    return mandatoryVaccines.filter(v => !receivedVaccines.includes(v.id))
  }

  // Get received vaccines list
  const getReceivedVaccinesList = () => {
    return allVaccines.filter(v => receivedVaccines.includes(v.id))
  }

  // Get optional vaccines (not received)
  const getOptionalVaccines = () => {
    const optionalVaccines = allVaccines.filter(v => v.type === 'Optional')
    return optionalVaccines.filter(v => !receivedVaccines.includes(v.id))
  }

  const remainingMandatory = getRemainingMandatoryVaccines()
  const receivedList = getReceivedVaccinesList()
  const optionalList = getOptionalVaccines()

  return (
    <div className="App">
      <PatientNav patient={patient} currentPage="vaccination-check" />

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
          <h2 className="section-title">Vaccination Check</h2>
          <p style={{ color: "var(--text-light)", marginBottom: "2rem", textAlign: "center" }}>
            Enter age and gender to get personalized vaccine recommendations
          </p>

          {/* Input Form */}
          <div className="feature-card" style={{ padding: "2rem", marginBottom: "2rem" }}>
            <h3 style={{ marginBottom: "1.5rem" }}>Enter Information</h3>
            <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
              <div style={{ flex: "1", minWidth: "200px" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                  Age *
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Enter age"
                  min="0"
                  max="150"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    fontSize: "1rem"
                  }}
                />
              </div>
              <div style={{ flex: "1", minWidth: "200px" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                  Gender *
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    fontSize: "1rem"
                  }}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <button
              className="btn-primary"
              onClick={fetchVaccines}
              disabled={loading}
              style={{ width: "100%" }}
            >
              {loading ? "Loading..." : "Get Vaccine Recommendations"}
            </button>
          </div>

          {error && (
            <div
              style={{
                padding: "1rem",
                borderRadius: "8px",
                backgroundColor: "#fee2e2",
                color: "#991b1b",
                textAlign: "center",
                fontWeight: "500",
                marginBottom: "2rem"
              }}
            >
              {error}
            </div>
          )}

          {saveStatus && (
            <div
              style={{
                padding: "1rem",
                borderRadius: "8px",
                backgroundColor: saveStatus.ok ? "#d1fae5" : "#fee2e2",
                color: saveStatus.ok ? "#065f46" : "#991b1b",
                textAlign: "center",
                fontWeight: "500",
                marginBottom: "2rem"
              }}
            >
              {saveStatus.msg}
            </div>
          )}

          {/* Vaccine Recommendations */}
          {allVaccines.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem" }}>
              {/* Remaining Mandatory Vaccines */}
              <div className="feature-card" style={{ padding: "1.5rem" }}>
                <h3 style={{ marginBottom: "1rem", color: "#dc2626" }}>
                  📋 Mandatory Vaccines to Take ({remainingMandatory.length})
                </h3>
                {remainingMandatory.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {remainingMandatory.map(vaccine => (
                      <div
                        key={vaccine.id}
                        style={{
                          padding: "0.75rem",
                          backgroundColor: "#fee2e2",
                          borderRadius: "6px",
                          borderLeft: "3px solid #dc2626"
                        }}
                      >
                        <div style={{ fontWeight: "600", fontSize: "0.9rem", marginBottom: "0.25rem" }}>
                          {vaccine.name}
                        </div>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-light)" }}>
                          {vaccine.ageRange}
                        </div>
                        <label
                          style={{
                            display: "flex",
                            alignItems: "center",
                            marginTop: "0.5rem",
                            cursor: "pointer"
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={receivedVaccines.includes(vaccine.id)}
                            onChange={() => handleVaccineToggle(vaccine.id)}
                            style={{ marginRight: "0.5rem", cursor: "pointer" }}
                          />
                          <span style={{ fontSize: "0.85rem" }}>Mark as received</span>
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: "#16a34a", fontWeight: "500" }}>
                    ✅ All mandatory vaccines have been received!
                  </p>
                )}
              </div>

              {/* Received Vaccines */}
              <div className="feature-card" style={{ padding: "1.5rem" }}>
                <h3 style={{ marginBottom: "1rem", color: "#16a34a" }}>
                  ✅ Vaccines Received ({receivedList.length})
                </h3>
                {receivedList.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {receivedList.map(vaccine => (
                      <div
                        key={vaccine.id}
                        style={{
                          padding: "0.75rem",
                          backgroundColor: "#d1fae5",
                          borderRadius: "6px",
                          borderLeft: "3px solid #16a34a"
                        }}
                      >
                        <div style={{ fontWeight: "600", fontSize: "0.9rem", marginBottom: "0.25rem" }}>
                          {vaccine.name}
                        </div>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-light)" }}>
                          {vaccine.ageRange} • {vaccine.type}
                        </div>
                        <label
                          style={{
                            display: "flex",
                            alignItems: "center",
                            marginTop: "0.5rem",
                            cursor: "pointer"
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={true}
                            onChange={() => handleVaccineToggle(vaccine.id)}
                            style={{ marginRight: "0.5rem", cursor: "pointer" }}
                          />
                          <span style={{ fontSize: "0.85rem" }}>Received</span>
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: "var(--text-light)", fontStyle: "italic" }}>
                    No vaccines marked as received yet
                  </p>
                )}
              </div>

              {/* Optional Vaccines */}
              <div className="feature-card" style={{ padding: "1.5rem" }}>
                <h3 style={{ marginBottom: "1rem", color: "#3b82f6" }}>
                  💊 Optional Vaccines ({optionalList.length})
                </h3>
                {optionalList.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {optionalList.map(vaccine => (
                      <div
                        key={vaccine.id}
                        style={{
                          padding: "0.75rem",
                          backgroundColor: "#eff6ff",
                          borderRadius: "6px",
                          borderLeft: "3px solid #3b82f6"
                        }}
                      >
                        <div style={{ fontWeight: "600", fontSize: "0.9rem", marginBottom: "0.25rem" }}>
                          {vaccine.name}
                        </div>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-light)" }}>
                          {vaccine.ageRange}
                        </div>
                        <label
                          style={{
                            display: "flex",
                            alignItems: "center",
                            marginTop: "0.5rem",
                            cursor: "pointer"
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={receivedVaccines.includes(vaccine.id)}
                            onChange={() => handleVaccineToggle(vaccine.id)}
                            style={{ marginRight: "0.5rem", cursor: "pointer" }}
                          />
                          <span style={{ fontSize: "0.85rem" }}>Mark as received</span>
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: "var(--text-light)", fontStyle: "italic" }}>
                    No optional vaccines available for this age and gender
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Save Button - Below Vaccine List */}
          {allVaccines.length > 0 && (
            <div className="feature-card" style={{ padding: "1.5rem", marginTop: "2rem" }}>
              <button
                className="btn-primary"
                onClick={saveVaccineCheck}
                style={{ width: "100%" }}
              >
                💾 Save Vaccine Check Results
              </button>
            </div>
          )}

          {/* Vaccine Check History */}
          <VaccineCheckHistory patient={patient} refreshTrigger={refreshHistory} />
        </div>
      </section>

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
                  onClick={() => navigate("/patient", { state: { patient } })}
                >
                  User Info
                </button>
              </li>
              <li>
                <button 
                  className="footer-link-btn"
                  onClick={() => navigate("/appointments", { state: { patient } })}
                >
                  Appointments
                </button>
              </li>
              <li>
                <button 
                  className="footer-link-btn"
                  onClick={() => navigate("/vaccination-check", { state: { patient } })}
                >
                  Vaccination Check
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
