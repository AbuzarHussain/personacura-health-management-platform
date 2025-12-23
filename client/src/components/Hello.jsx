import React, { useState } from "react"
import axios from "axios"
import { API_BASE_URL } from "../config"

export default function Hello() {
  const [msg, setMsg] = useState("")

  const handleClick = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/status`)
      setMsg(JSON.stringify(res.data.message))
    } catch {
      setMsg("Error fetching message")
    }
  }

  return (
    <div style={{ textAlign: "center", marginTop: 40 }}>
      <h2>Personacura</h2>
      <button onClick={handleClick}>Check Server Status</button>
      {msg && <p style={{ marginTop: 20 }}>{msg}</p>}
    </div>
  )
}
