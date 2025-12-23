import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import App from "./components/App"
import PatientDashboard from "./components/PatientDashboard"
import DoctorDashboard from "./components/DoctorDashboard"
import Records from "./components/Records"
import EditProfile from "./components/EditProfile"
import Appointments from "./components/Appointments"
import PastAppointments from "./components/PastAppointments"
import VaccinationCheck from "./components/VaccinationCheck"
import SymptomAnalyser from "./components/SymptomAnalyser"
import HealthTimeline from "./components/HealthTimeline"
import HealthTrendsChart from "./components/HealthTrendsChart"
import SearchDoctors from "./components/SearchDoctors"
import DoctorCalendar from "./components/DoctorCalendar"
import PatientCalendar from "./components/PatientCalendar"
import DoctorEditProfile from "./components/DoctorEditProfile"
import DoctorPatients from "./components/DoctorPatients"
import DoctorAppointments from "./components/DoctorAppointments"
import DoctorPatientProfile from "./components/DoctorPatientProfile"
import DoctorDrugSearch from "./components/DoctorDrugSearch"
import DoctorAuditLogs from "./components/DoctorAuditLogs"
const root = ReactDOM.createRoot(document.getElementById("root"))
root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/patient" element={<PatientDashboard />} />
      <Route path="/doctor" element={<DoctorDashboard />} />
      <Route path="/records" element={<Records />} />
      <Route path="/edit-profile" element={<EditProfile />} />
      <Route path="/appointments" element={<Appointments />} />
      <Route path="/past-appointments" element={<PastAppointments />} />
      <Route path="/vaccination-check" element={<VaccinationCheck />} />
      <Route path="/symptom-analyser" element={<SymptomAnalyser />} />
      <Route path="/health-timeline" element={<HealthTimeline />} />
      <Route path="/health-trends" element={<HealthTrendsChart />} />
      <Route path="/search-doctors" element={<SearchDoctors />} />
      <Route path="/doctor/calendar" element={<DoctorCalendar />} />
      <Route path="/doctor/edit-profile" element={<DoctorEditProfile />} />
      <Route path="/doctor/patients" element={<DoctorPatients />} />
      <Route path="/doctor/appointments" element={<DoctorAppointments />} />
      <Route path="/patient/calendar" element={<PatientCalendar />} />
      <Route path="/doctor/patient-profile" element={<DoctorPatientProfile />} />
      <Route path="/doctor/drug-search" element={<DoctorDrugSearch />} />
      <Route path="/doctor/audit-logs" element={<DoctorAuditLogs />} />
    </Routes>
  </BrowserRouter>
)
