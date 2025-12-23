import React, { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import PatientNav from "./PatientNav"
import "./App.css"
import { API_BASE_URL } from "../config"

export default function SymptomAnalyser() {
  const location = useLocation()
  const navigate = useNavigate()
  const patient = location?.state?.patient

  const [symptoms, setSymptoms] = useState("")
  const [analysisResult, setAnalysisResult] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleAnalyze = async () => {
    if (!symptoms.trim()) {
      setAnalysisResult({ 
        ok: false, 
        message: "Please enter your symptoms to analyze" 
      })
      return
    }

    setIsAnalyzing(true)
    setAnalysisResult(null) 

    try {
      const response = await fetch(`${API_BASE_URL}/api/analyze-symptoms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symptoms }),
      })

      const result = await response.json()

      if (response.ok && result.ok) {
        setAnalysisResult({ ok: true, data: result.data })
      } else {
        setAnalysisResult({ 
          ok: false, 
          message: result.message || "An error occurred during analysis." 
        })
      }

    } catch (error) {
      console.error("Analysis Error:", error)
      setAnalysisResult({ 
        ok: false, 
        message: "Failed to connect to server. Please try again." 
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  if (!patient) {
    navigate("/")
    return null
  }

  const getProbabilityStyles = (prob) => {
    const p = prob?.toLowerCase() || "";
    if (p === "high") {
      return { bg: "#fee2e2", border: "#dc2626", text: "#dc2626" };
    } else if (p === "medium") {
      return { bg: "#fef3c7", border: "#f59e0b", text: "#f59e0b" };
    } else {
      return { bg: "#e0f2fe", border: "#3b82f6", text: "#3b82f6" };
    }
  }

  return (
    <div className="App">
      <PatientNav patient={patient} currentPage="symptom-analyser" />

      {/* Main Content */}
      <section className="features" style={{ paddingTop: "4rem", minHeight: "60vh" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "2rem" }}>
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
          <h2 className="section-title">Smart Symptom Analyser</h2>
          <p style={{ color: "var(--text-light)", marginBottom: "2rem", textAlign: "center" }}>
            Enter your symptoms (separated by commas) to get preliminary analysis
          </p>

          {/* Symptom Input */}
          <div className="feature-card" style={{ padding: "2rem", marginBottom: "2rem" }}>
            <h3 style={{ marginBottom: "1rem" }}>Describe Your Symptoms</h3>
            <textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="Example: itching, skin_rash, fever..."
              style={{
                width: "100%",
                minHeight: "150px",
                padding: "1rem",
                border: "2px solid var(--border-color)",
                borderRadius: "8px",
                fontSize: "1rem",
                fontFamily: "inherit",
                resize: "vertical"
              }}
            />
            <button
              className="btn-primary"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              style={{ marginTop: "1.5rem", width: "100%" }}
            >
              {isAnalyzing ? "Analyzing Symptoms..." : "Analyze Symptoms"}
            </button>
          </div>

          {/* Analysis Results */}
          {analysisResult && (
            <div className="feature-card" style={{ padding: "2rem" }}>
              {analysisResult.ok && analysisResult.data && analysisResult.data.length > 0 ? (
                <>
                  <h3 style={{ marginBottom: "1.5rem", color: "var(--primary-color)" }}>
                    Predicted Diseases
                  </h3>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {analysisResult.data.map((item, index) => {
                      const styles = getProbabilityStyles(item.probability);
                      
                      return (
                        <div
                          key={index}
                          style={{
                            padding: "1.5rem",
                            backgroundColor: styles.bg,
                            borderRadius: "8px",
                            borderLeft: `5px solid ${styles.border}`,
                            boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
                          }}
                        >
                          {/* Header: Disease Name and Probability Badge */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                            <span style={{ fontWeight: "700", fontSize: "1.2rem", color: "#1f2937" }}>
                              {item.disease}
                            </span>
                            <span style={{
                              padding: "0.25rem 0.75rem",
                              borderRadius: "12px",
                              backgroundColor: styles.border, 
                              color: "white",
                              fontSize: "0.875rem",
                              fontWeight: "600",
                              textTransform: "capitalize"
                            }}>
                              {item.probability} Probability
                            </span>
                          </div>

                          {/* Body: Matched Symptoms & Doctor */}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                            
                            {/* Database Symptoms Field */}
                            <div>
                              <div style={{ fontSize: "0.85rem", color: "#6b7280", fontWeight: "600", marginBottom: "0.25rem" }}>
                                Related Symptoms Pattern:
                              </div>
                              <div style={{ color: "#374151", fontSize: "0.95rem" }}>
                                {item.matchedSymptoms}
                              </div>
                            </div>

                            {/* Recommended Specialization */}
                            <div>
                              <div style={{ fontSize: "0.85rem", color: "#6b7280", fontWeight: "600", marginBottom: "0.25rem" }}>
                                Recommended Specialist:
                              </div>
                              <div style={{ color: "var(--primary-color)", fontWeight: "600", fontSize: "1rem" }}>
                                {item.specialization}
                              </div>
                            </div>

                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: "center", padding: "1rem" }}>
                  {analysisResult.ok && analysisResult.data && analysisResult.data.length === 0 ? (
                     <p style={{color: "var(--text-light)"}}>No matching diseases found for the provided symptoms.</p>
                  ) : (
                     <div style={{ color: "#991b1b" }}>{analysisResult.message}</div>
                  )}
                </div>
              )}
            </div>
          )}
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
                  onClick={() => navigate("/patient", { state: { patient } })}
                >
                  User Info
                </button>
              </li>
              <li>
                <button 
                  className="footer-link-btn"
                  onClick={() => navigate("/symptom-analyser", { state: { patient } })}
                >
                  Symptom Analyser
                </button>
              </li>
              <li>
                <button 
                  className="footer-link-btn"
                  onClick={() => navigate("/health-timeline", { state: { patient } })}
                >
                  Health Timeline
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