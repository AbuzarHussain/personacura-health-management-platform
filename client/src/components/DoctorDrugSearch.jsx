import React, { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import axios from "axios"
import DoctorNav from "./DoctorNav"
import "./App.css"
import { API_BASE_URL } from "../config"

export default function DoctorDrugSearch() {
  const location = useLocation()
  const navigate = useNavigate()
  const doctor = location?.state?.doctor

  const [searchText, setSearchText] = useState("")
  const [suggestions, setSuggestions] = useState([]) 
  const [drugResults, setDrugResults] = useState([]) 

  if (!doctor) {
    navigate("/")
    return null
  }

  const handleSearchChange = async (e) => {
    const text = e.target.value
    setSearchText(text)

    if (text.trim() !== "") {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/drugs/suggestions`, {
          params: { text: text }
        })
        setSuggestions(res.data)
      } catch (err) {
        console.error("Error fetching suggestions:", err)
      }
    } else {
      setSuggestions([]);
    }
  }

  const handleSuggestionClick = async (selectedString) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/drugs/details`, {
        params: { selection: selectedString }
      })
      setDrugResults(res.data)
      
      setSearchText("")
      setSuggestions([])
    } catch (err) {
      console.error("Error fetching details:", err)
    }
  }

  return (
    <div className="App">
      <DoctorNav doctor={doctor} currentPage="drug-search" />

      <section className="features" style={{ paddingTop: "4rem", minHeight: "60vh" }}>
        <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
          <h2 className="section-title">Drug Search</h2>
          <p style={{ color: "var(--text-light)", marginBottom: "2rem" }}>
             Search for drugs by name and view detailed information.
          </p>
          
          <div style={{ maxWidth: "600px", margin: "0 auto", position: "relative" }}>
            
            {/* Search Input */}
            <input
              type="text"
              value={searchText}
              onChange={handleSearchChange}
              placeholder="Enter drug name..."
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
          {drugResults.length > 0 && (
            <div style={{ marginTop: "3rem", overflowX: "auto" }}>
              <h3 style={{marginBottom: "1rem", color: "#333"}}>Search Results</h3>
              <table style={{ 
                width: "100%", 
                borderCollapse: "collapse", 
                backgroundColor: "white",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                textAlign: "left",
                fontSize: "0.9rem"
              }}>
                <thead>
                  <tr style={{ backgroundColor: "#f4f4f4" }}>
                    <th style={tableHeaderStyle}>Drug Name</th>
                    <th style={tableHeaderStyle}>Generic</th>
                    <th style={tableHeaderStyle}>Condition</th>
                    <th style={tableHeaderStyle}>Class</th>
                    <th style={tableHeaderStyle}>Rx/OTC</th>
                    <th style={tableHeaderStyle}>Pregnancy</th>
                    <th style={tableHeaderStyle}>Side Effects</th>
                  </tr>
                </thead>
                <tbody>
                  {drugResults.map((drug) => (
                    <tr key={drug.DrugID} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={tableCellStyle}><strong>{drug.DrugName}</strong></td>
                      <td style={tableCellStyle}>{drug.GenericName || "-"}</td>
                      <td style={tableCellStyle}>{drug.MedicalCondition || "-"}</td>
                      <td style={tableCellStyle}>{drug.DrugClasses || "-"}</td>
                      <td style={tableCellStyle}>{drug.RxOTC || "-"}</td>
                      <td style={tableCellStyle}>{drug.PregnancyCategory || "-"}</td>
                      <td style={{...tableCellStyle, minWidth: "400px"}}>{drug.SideEffects || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {drugResults.length === 0 && searchText === "" && (
             <p style={{ color: "var(--text-light)", marginTop: "2rem" }}>
               Start typing to find a drug.
             </p>
          )}

        </div>
      </section>
    </div>
  )
}

const tableHeaderStyle = {
  padding: "12px 15px",
  fontWeight: "600",
  color: "#555",
  whiteSpace: "nowrap"
};

const tableCellStyle = {
  padding: "12px 15px",
  color: "#333",
  verticalAlign: "top"
};