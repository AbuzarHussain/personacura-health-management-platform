import React, { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import PatientNav from "./PatientNav"
import "./App.css"
import { API_BASE_URL } from "../config"

export default function SearchDoctors() {
  const location = useLocation()
  const navigate = useNavigate()
  const patient = location?.state?.patient

  const [searchText, setSearchText] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [doctorResults, setDoctorResults] = useState([]);

  if (!patient) {
    navigate("/")
    return null
  }

  const handleSearchChange = async (e) => {
    const text = e.target.value;
    setSearchText(text);

    if (text.trim() !== "") {
      try {
        const response = await fetch(`${API_BASE_URL}/api/search/suggestions?text=${text}`);
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data);
        }
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      }
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = async (selectedString) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/search/doctors?selection=${encodeURIComponent(selectedString)}`);
      
      if (response.ok) {
        const results = await response.json();
        setDoctorResults(results);
      }
      
      setSearchText("");
      setSuggestions([]);
    } catch (error) {
      console.error("Error fetching doctors:", error);
    }
  };

  const handleKeyDown = async (e) => {
    if (e.key === "Enter" && searchText.trim() !== "") {
      e.preventDefault();
      // Search with the entered text
      try {
        const response = await fetch(`${API_BASE_URL}/api/search/doctors?selection=${encodeURIComponent(searchText.trim())}`);
        
        if (response.ok) {
          const results = await response.json();
          setDoctorResults(results);
        } else {
          // If no results, try to show a message
          setDoctorResults([]);
        }
        
        setSearchText("");
        setSuggestions([]);
      } catch (error) {
        console.error("Error fetching doctors:", error);
      }
    }
  };

  // ----------------

  return (
    <div className="App">
      <PatientNav patient={patient} currentPage="search-doctors" />

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
        </div>
        <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
          <h2 className="section-title">Search Doctors</h2>
          
          {/* --- SEARCH COMPONENT --- */}
          <div style={{ maxWidth: "600px", margin: "0 auto", position: "relative" }}>
            
            {/* Search Input */}
            <input
              type="text"
              value={searchText}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              placeholder="Search by speciality name"
              style={{
                width: "100%",
                padding: "12px 20px",
                fontSize: "16px",
                border: "1px solid #ccc",
                borderRadius: "25px",
                outline: "none",
                boxShadow: "0 2px 5px rgba(0,0,0,0.1)"
              }}
            />

            {/* Dropdown List */}
            {suggestions.length > 0 && (
              <ul style={{
                listStyle: "none",
                padding: "0",
                margin: "5px 0 0 0",
                position: "absolute",
                width: "100%",
                backgroundColor: "white",
                border: "1px solid #eee",
                borderRadius: "8px",
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                zIndex: 10,
                textAlign: "left",
                maxHeight: "200px",
                overflowY: "auto"
              }}>
                {suggestions.map((item, index) => (
                  <li 
                    key={index}
                    onClick={() => handleSuggestionClick(item)}
                    style={{
                      padding: "10px 20px",
                      cursor: "pointer",
                      borderBottom: index !== suggestions.length - 1 ? "1px solid #f0f0f0" : "none",
                      color: "#333"
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = "#f9f9f9"}
                    onMouseLeave={(e) => e.target.style.backgroundColor = "white"}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* --- RESULTS TABLE --- */}
          {doctorResults.length > 0 && (
            <div style={{ marginTop: "3rem", overflowX: "auto" }}>
              <h3 style={{marginBottom: "1rem", color: "#333"}}>Search Results</h3>
              <table style={{ 
                width: "100%", 
                borderCollapse: "collapse", 
                backgroundColor: "white",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
              }}>
                <thead>
                  <tr style={{ backgroundColor: "#f4f4f4", textAlign: "center" }}>
                    {/* UPDATED HEADERS */}
                    <th style={tableHeaderStyle}>Name</th>
                    <th style={tableHeaderStyle}>Email</th>
                    <th style={tableHeaderStyle}>Phone</th>
                    <th style={tableHeaderStyle}>Specialization</th>
                    <th style={tableHeaderStyle}>Rating</th>
                    <th style={tableHeaderStyle}>Availability</th>
                  </tr>
                </thead>
                <tbody>
                  {doctorResults.map((doc) => (
                    <tr key={doc.id} style={{ borderBottom: "1px solid #eee" }}>
                      {/* UPDATED ROWS */}
                      <td style={tableCellStyle}>{doc.name}</td>
                      <td style={tableCellStyle}>{doc.email}</td>
                      <td style={tableCellStyle}>{doc.phone}</td>
                      <td style={tableCellStyle}>{doc.specialization}</td>
                      <td style={tableCellStyle}>{doc.rating}</td>
                      <td style={tableCellStyle}>{doc.availability}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {doctorResults.length === 0 && searchText === "" && (
             <p style={{ color: "var(--text-light)", marginTop: "2rem" }}>
               Start typing to find a specialist.
             </p>
          )}

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
                  onClick={() => {
                    navigate("/patient", { state: { patient } })
                  }}
                >
                  User Info
                </button>
              </li>
              <li>
                <button 
                  className="footer-link-btn"
                  onClick={() => {
                    navigate("/appointments", { state: { patient } })
                  }}
                >
                  Appointments
                </button>
              </li>
              <li>
                <button 
                  className="footer-link-btn"
                  onClick={() => {
                    navigate("/search-doctors", { state: { patient } })
                  }}
                >
                  Search Doctors
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

const tableHeaderStyle = {
  padding: "12px 15px",
  fontWeight: "600",
  color: "#555"
};

const tableCellStyle = {
  padding: "12px 15px",
  color: "#333"
};