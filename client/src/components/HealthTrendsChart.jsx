import React, { useEffect, useRef, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import * as d3 from "d3"
import axios from "axios"
import PatientNav from "./PatientNav"
import "./App.css"
import { API_BASE_URL } from "../config"

export default function HealthTrendsChart() {
  const location = useLocation()
  const navigate = useNavigate()
  const patient = location?.state?.patient

  const svgRef = useRef()
  const containerRef = useRef()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('monthly')
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!patient) {
      navigate("/")
      return
    }
    window.scrollTo({ top: 0, behavior: "smooth" })
    fetchTrends()
  }, [patient, period])

  const fetchTrends = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await axios.get(
        `${API_BASE_URL}/api/patients/${patient.PatientID}/prescription-trends?period=${period}`
      )
      setData(res.data)
    } catch (err) {
      console.error("Error fetching trends:", err)
      setError(err.response?.data?.message || "Failed to load trends data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!data || !data.trends || data.trends.length === 0) {
      // Clear chart if no data
      if (svgRef.current) {
        d3.select(svgRef.current).selectAll("*").remove()
      }
      return
    }

    // Clear previous chart
    d3.select(svgRef.current).selectAll("*").remove()

    const margin = { top: 40, right: 80, bottom: 60, left: 80 }
    const container = containerRef.current
    if (!container) return
    
    const width = Math.max(800, container.clientWidth - margin.left - margin.right)
    const height = 500 - margin.top - margin.bottom

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`)

    // Parse dates based on period
    const parseDate = period === 'weekly'
      ? d3.timeParse("%Y-%W")
      : d3.timeParse("%Y-%m")

    const formatDate = period === 'weekly'
      ? d3.timeFormat("Week %W, %Y")
      : d3.timeFormat("%b %Y")

    // Process data with sophisticated date parsing
    const processedData = data.trends
      .map(d => {
        let parsedDate = null
        if (period === 'weekly') {
          // Handle week format: "2024-01" means year 2024, week 1
          const [year, week] = d.period.split('-')
          if (year && week) {
            const date = new Date(parseInt(year), 0, 1)
            const daysToAdd = (parseInt(week) - 1) * 7
            date.setDate(date.getDate() + daysToAdd)
            parsedDate = date
          }
        } else {
          parsedDate = parseDate(d.period)
        }
        
        return {
          date: parsedDate,
          value: d.totalPrescriptions,
          uniqueDrugs: d.uniqueDrugs,
          uniqueDoctors: d.uniqueDoctors,
          prescriptionDrugs: d.prescriptionDrugs || 0,
          overTheCounterDrugs: d.overTheCounterDrugs || 0,
          trend: d.trend,
          drugNames: d.drugNames,
          period: d.period
        }
      })
      .filter(d => d.date !== null && !isNaN(d.date.getTime()))
      .sort((a, b) => a.date - b.date)

    if (processedData.length === 0) return

    // Scales with padding - handle single data point case
    const dateExtent = d3.extent(processedData, d => d.date)
    let xDomain
    if (processedData.length === 1) {
      // For single point, add padding on both sides
      const singleDate = dateExtent[0]
      const padding = period === 'weekly' ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000 // 7 days for weekly, 30 days for monthly
      xDomain = [new Date(singleDate.getTime() - padding), new Date(singleDate.getTime() + padding)]
    } else {
      xDomain = dateExtent
    }
    
    const xScale = d3.scaleTime()
      .domain(xDomain)
      .range([0, width])

    const maxValue = d3.max(processedData, d => d.value)
    const yScale = d3.scaleLinear()
      .domain([0, Math.max(maxValue * 1.15, 1)]) // Ensure at least 1 for visibility
      .nice()
      .range([height, 0])

    // Create gradient for area fill
    const gradient = svg.append("defs")
      .append("linearGradient")
      .attr("id", "areaGradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%")

    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#3b82f6")
      .attr("stop-opacity", 0.4)

    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#3b82f6")
      .attr("stop-opacity", 0.05)

    // Line generator with smooth curve
    const line = d3.line()
      .x(d => xScale(d.date))
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX)

    // Area generator for gradient fill
    const area = d3.area()
      .x(d => xScale(d.date))
      .y0(yScale(0))
      .y1(d => yScale(d.value))
      .curve(d3.curveMonotoneX)

    // Draw area (gradient fill) - only if more than one point
    if (processedData.length > 1) {
      const areaPath = g.append("path")
        .datum(processedData)
        .attr("fill", "url(#areaGradient)")
        .attr("d", area)
        .style("opacity", 0)
        .transition()
        .duration(1000)
        .ease(d3.easeCubicOut)
        .style("opacity", 1)
    }

    // Draw main line - only if more than one point
    if (processedData.length > 1) {
      const linePath = g.append("path")
        .datum(processedData)
        .attr("fill", "none")
        .attr("stroke", "#3b82f6")
        .attr("stroke-width", 3)
        .attr("d", line)
        .style("opacity", 0)
        .transition()
        .duration(1000)
        .ease(d3.easeCubicOut)
        .style("opacity", 1)
    } else {
      // For single point, draw a horizontal reference line
      g.append("line")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", yScale(processedData[0].value))
        .attr("y2", yScale(processedData[0].value))
        .attr("stroke", "#3b82f6")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "5,5")
        .style("opacity", 0.3)
    }

    // Calculate moving average with sophisticated algorithm - only if more than one point
    if (processedData.length > 1) {
      const windowSize = Math.min(3, Math.floor(processedData.length / 2))
      const movingAverage = processedData.map((d, i) => {
        const start = Math.max(0, i - windowSize + 1)
        const end = i + 1
        const slice = processedData.slice(start, end)
        const avg = slice.reduce((sum, item) => sum + item.value, 0) / slice.length
        return { date: d.date, value: avg }
      })

      // Moving average line
      const maLine = d3.line()
        .x(d => xScale(d.date))
        .y(d => yScale(d.value))
        .curve(d3.curveMonotoneX)

      g.append("path")
        .datum(movingAverage)
        .attr("fill", "none")
        .attr("stroke", "#8b5cf6")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "5,5")
        .attr("d", maLine)
        .style("opacity", 0)
        .transition()
        .duration(1500)
        .delay(500)
        .style("opacity", 0.7)
    }

    // Add interactive dots with hover effects
    const dots = g.selectAll(".dot")
      .data(processedData)
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("cx", d => xScale(d.date))
      .attr("cy", d => yScale(d.value))
      .attr("r", processedData.length === 1 ? 8 : 0) // Larger dot for single point
      .attr("fill", d => {
        if (d.trend === 'increasing') return "#10b981"
        if (d.trend === 'decreasing') return "#ef4444"
        if (d.trend === 'slightly_increasing') return "#84cc16"
        if (d.trend === 'slightly_decreasing') return "#f97316"
        return "#f59e0b"
      })
      .attr("stroke", "white")
      .attr("stroke-width", processedData.length === 1 ? 3 : 2) // Thicker stroke for single point
      .style("cursor", "pointer")
      .on("mouseover", function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", 8)

        // Create sophisticated tooltip
        const tooltip = d3.select("body").append("div")
          .attr("class", "chart-tooltip")
          .style("opacity", 0)
          .style("position", "absolute")
          .style("background", "rgba(0, 0, 0, 0.9)")
          .style("color", "white")
          .style("padding", "14px")
          .style("border-radius", "10px")
          .style("pointer-events", "none")
          .style("font-size", "13px")
          .style("box-shadow", "0 6px 20px rgba(0,0,0,0.4)")
          .style("z-index", "10000")
          .style("max-width", "300px")

        const trendEmoji = {
          'increasing': '📈',
          'decreasing': '📉',
          'stable': '➡️',
          'slightly_increasing': '↗️',
          'slightly_decreasing': '↘️'
        }

        tooltip.html(`
          <div style="font-weight: 600; margin-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.3); padding-bottom: 6px; font-size: 15px;">
            ${formatDate(d.date)}
          </div>
          <div style="margin: 6px 0;"><strong>Prescriptions:</strong> ${d.value}</div>
          <div style="margin: 6px 0;"><strong>Unique Drugs:</strong> ${d.uniqueDrugs}</div>
          <div style="margin: 6px 0;"><strong>Doctors:</strong> ${d.uniqueDoctors}</div>
          <div style="margin: 6px 0;"><strong>Rx Drugs:</strong> ${d.prescriptionDrugs}</div>
          <div style="margin: 6px 0;"><strong>OTC Drugs:</strong> ${d.overTheCounterDrugs}</div>
          <div style="margin-top: 10px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.3);">
            <strong>Trend:</strong> ${trendEmoji[d.trend] || '➡️'} <span style="text-transform: capitalize;">${d.trend.replace('_', ' ')}</span>
          </div>
        `)

        tooltip.transition()
          .duration(200)
          .style("opacity", 1)

        const [x, y] = d3.pointer(event)
        tooltip.style("left", (event.pageX + 15) + "px")
               .style("top", (event.pageY - 15) + "px")
      })
      .on("mousemove", function(event) {
        const tooltip = d3.select(".chart-tooltip")
        if (!tooltip.empty()) {
          tooltip.style("left", (event.pageX + 15) + "px")
                 .style("top", (event.pageY - 15) + "px")
        }
      })
      .on("mouseout", function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", 5)

        d3.selectAll(".chart-tooltip").remove()
      })
      .transition()
      .duration(1000)
      .delay((d, i) => i * 50)
      .ease(d3.easeElasticOut)
      .attr("r", processedData.length === 1 ? 8 : 5) // Keep larger size for single point

    // Axes
    const xAxis = d3.axisBottom(xScale)
      .ticks(period === 'weekly' ? 8 : 6)
      .tickFormat(formatDate)

    const yAxis = d3.axisLeft(yScale)
      .ticks(6)
      .tickFormat(d => d)

    const xAxisGroup = g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(xAxis)
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-45)")
      .style("font-size", "11px")
      .style("fill", "#6b7280")

    const yAxisGroup = g.append("g")
      .call(yAxis)
      .selectAll("text")
      .style("font-size", "11px")
      .style("fill", "#6b7280")

    // Grid lines
    g.selectAll(".grid-line")
      .data(yScale.ticks(6))
      .enter()
      .append("line")
      .attr("class", "grid-line")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", d => yScale(d))
      .attr("y2", d => yScale(d))
      .attr("stroke", "#e5e7eb")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "3,3")
      .style("opacity", 0.5)

    // Axis labels
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - (height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .style("font-size", "14px")
      .style("fill", "#374151")
      .style("font-weight", "600")
      .text("Number of Prescriptions")

    g.append("text")
      .attr("transform", `translate(${width / 2}, ${height + margin.bottom - 10})`)
      .style("text-anchor", "middle")
      .style("font-size", "14px")
      .style("fill", "#374151")
      .style("font-weight", "600")
      .text("Time Period")

    // Legend with sophisticated styling
    const legend = g.append("g")
      .attr("transform", `translate(${width - 220}, 20)`)

    const legendData = [
      { label: "Prescriptions", color: "#3b82f6", type: "line" },
      { label: "Moving Average", color: "#8b5cf6", type: "dashed" },
      { label: "Increasing", color: "#10b981", type: "circle" },
      { label: "Stable", color: "#f59e0b", type: "circle" },
      { label: "Decreasing", color: "#ef4444", type: "circle" }
    ]

    legendData.forEach((item, i) => {
      const legendItem = legend.append("g")
        .attr("transform", `translate(0, ${i * 25})`)

      if (item.type === "line") {
        legendItem.append("line")
          .attr("x1", 0)
          .attr("x2", 20)
          .attr("y1", 0)
          .attr("y2", 0)
          .attr("stroke", item.color)
          .attr("stroke-width", 3)
      } else if (item.type === "dashed") {
        legendItem.append("line")
          .attr("x1", 0)
          .attr("x2", 20)
          .attr("y1", 0)
          .attr("y2", 0)
          .attr("stroke", item.color)
          .attr("stroke-width", 2)
          .attr("stroke-dasharray", "5,5")
      } else {
        legendItem.append("circle")
          .attr("r", 5)
          .attr("fill", item.color)
          .attr("stroke", "white")
          .attr("stroke-width", 2)
      }

      legendItem.append("text")
        .attr("x", 25)
        .attr("y", 5)
        .style("font-size", "12px")
        .style("fill", "#374151")
        .text(item.label)
    })

    // Cleanup function
    return () => {
      d3.selectAll(".chart-tooltip").remove()
    }

  }, [data, period])

  if (!patient) {
    return null
  }

  return (
    <div className="App">
      <PatientNav patient={patient} currentPage="health-trends" />
      
      <section className="features" style={{ paddingTop: "4rem", minHeight: "80vh" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "2rem" }}>
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
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "2rem" }}>
          <h2 className="section-title">Prescription Trends Analysis</h2>
          <p style={{ color: "var(--text-light)", marginBottom: "2rem", textAlign: "center" }}>
            Interactive visualization of your prescription history over time with advanced analytics
          </p>

          {/* Period Selector */}
          <div style={{ 
            display: "flex", 
            gap: "1rem", 
            marginBottom: "2rem",
            justifyContent: "center",
            flexWrap: "wrap"
          }}>
            {['weekly', 'monthly'].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                style={{
                  padding: "0.75rem 1.5rem",
                  borderRadius: "8px",
                  border: period === p ? "2px solid #3b82f6" : "2px solid #e5e7eb",
                  background: period === p ? "#eff6ff" : "white",
                  color: period === p ? "#3b82f6" : "#6b7280",
                  fontWeight: period === p ? "600" : "500",
                  cursor: "pointer",
                  textTransform: "capitalize",
                  transition: "all 0.2s",
                  fontSize: "14px"
                }}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Chart Container */}
          <div 
            ref={containerRef}
            style={{
              background: "white",
              borderRadius: "12px",
              padding: "2rem",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              marginBottom: "2rem",
              overflow: "hidden"
            }}
          >
            {loading ? (
              <div style={{ textAlign: "center", padding: "4rem", color: "#6b7280" }}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⏳</div>
                <p>Loading trends data...</p>
              </div>
            ) : error ? (
              <div style={{ textAlign: "center", padding: "4rem", color: "#ef4444" }}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠️</div>
                <p>{error}</p>
              </div>
            ) : !data || !data.trends || data.trends.length === 0 ? (
              <div style={{ textAlign: "center", padding: "4rem", color: "#6b7280" }}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📊</div>
                <p>No prescription data available for trends analysis.</p>
                <p style={{ fontSize: "0.9rem", marginTop: "0.5rem" }}>
                  Your trends will appear here once you have prescription records.
                </p>
              </div>
            ) : (
              <>
                {/* Summary Stats */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "1rem",
                  marginBottom: "2rem",
                  padding: "1.5rem",
                  background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
                  borderRadius: "8px"
                }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "2.5rem", fontWeight: "700", color: "#3b82f6" }}>
                      {data.summary.totalPrescriptions}
                    </div>
                    <div style={{ fontSize: "0.9rem", color: "#6b7280", marginTop: "0.25rem" }}>Total Prescriptions</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "2.5rem", fontWeight: "700", color: "#10b981" }}>
                      {data.summary.totalPeriods}
                    </div>
                    <div style={{ fontSize: "0.9rem", color: "#6b7280", marginTop: "0.25rem" }}>Time Periods</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "2.5rem", fontWeight: "700", color: "#8b5cf6" }}>
                      {data.summary.averagePerPeriod.toFixed(1)}
                    </div>
                    <div style={{ fontSize: "0.9rem", color: "#6b7280", marginTop: "0.25rem" }}>Avg per Period</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "2.5rem", fontWeight: "700", color: "#f59e0b" }}>
                      {data.summary.maxPrescriptions}
                    </div>
                    <div style={{ fontSize: "0.9rem", color: "#6b7280", marginTop: "0.25rem" }}>Peak Period</div>
                  </div>
                </div>

                {/* SVG Chart */}
                <div style={{ overflowX: "auto" }}>
                  <svg ref={svgRef} style={{ width: "100%", minWidth: "800px", height: "500px", display: "block" }}></svg>
                </div>

                {/* Data Notice */}
                {data && data.trends && data.trends.length <= 1 && (
                  <div style={{
                    marginTop: "1rem",
                    padding: "1rem",
                    background: "#fef3c7",
                    borderRadius: "8px",
                    fontSize: "0.9rem",
                    color: "#92400e",
                    border: "1px solid #fcd34d"
                  }}>
                    <strong>📊 Limited Data:</strong> You currently have data for only {data.trends.length} time period{data.trends.length !== 1 ? 's' : ''}. 
                    As more prescriptions are added over time, the trend visualization will become more detailed and meaningful.
                  </div>
                )}

                {/* Instructions */}
                <div style={{
                  marginTop: "1.5rem",
                  padding: "1rem",
                  background: "#f0f9ff",
                  borderRadius: "8px",
                  fontSize: "0.9rem",
                  color: "#0369a1",
                  border: "1px solid #bae6fd"
                }}>
                  <strong>💡 Interactive Features:</strong> Hover over data points for detailed information. 
                  Color-coded dots indicate trend direction (green = increasing, red = decreasing, orange = stable).
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

