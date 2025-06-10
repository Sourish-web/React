import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Cookies from "universal-cookie";
import { useNavigate } from "react-router-dom";
import { FiHome, FiStar, FiCalendar, FiFlag, FiBarChart, FiLogOut } from "react-icons/fi";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Reports = () => {
  const cookies = new Cookies();
  const navigate = useNavigate();
  const API_URL = "http://localhost:8090";
  const getAuthToken = () => cookies.get("token");

  // State management
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState("All");
  const expenseChartRef = useRef(null); // Ref to track chart canvas

  // Fetch report data from backend
  const fetchReportData = async () => {
    const token = getAuthToken();
    if (!token) {
      navigate("/login");
      return;
    }
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/reports/data`, {
        params: { quarter: selectedFilter === "All" ? null : selectedFilter },
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Report Data:", response.data);
      console.log("Category Breakdown:", response.data.categoryBreakdown);
      setReportData(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch report data:", err);
      setError("Failed to fetch report data.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [selectedFilter]);

  // Logout handler
  const handleLogout = () => {
    cookies.remove("token", { path: "/" });
    navigate("/login");
  };

  // Export handlers
  const handleExportPDF = async () => {
    const token = getAuthToken();
    if (!token) {
      navigate("/login");
      return;
    }
    try {
      const response = await axios.get(`${API_URL}/reports/export/pdf`, {
        params: { quarter: selectedFilter === "All" ? null : selectedFilter },
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `transactions_budgets_${Date.now()}_${selectedFilter}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Error exporting PDF:", err);
      alert("Error exporting PDF.");
    }
  };

  const handleExportCSV = async () => {
    const token = getAuthToken();
    if (!token) {
      navigate("/login");
      return;
    }
    try {
      const response = await axios.get(`${API_URL}/reports/export/csv`, {
        params: { quarter: selectedFilter === "All" ? null : selectedFilter },
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `transactions_budgets_${Date.now()}_${selectedFilter}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Error exporting CSV:", err);
      alert("Error exporting CSV.");
    }
  };

  // Budget Breakdown
  const budgetTotal = reportData && reportData.budgetLimits
    ? Object.values(reportData.budgetLimits).reduce((sum, amount) => sum + Number(amount), 0)
    : 0;

  const budgetChartData = reportData && reportData.budgetLimits ? {
    labels: Object.keys(reportData.budgetLimits),
    datasets: [
      {
        data: Object.values(reportData.budgetLimits).map(amount => Number(amount)),
        backgroundColor: ["#4caf50", "#66bb6a", "#81c784", "#a5d6a7", "#c8e6c9"],
        borderColor: ["#ffffff"],
        borderWidth: 1,
      },
    ],
  } : {
    labels: ["No Data"],
    datasets: [
      {
        data: [1],
        backgroundColor: ["#e0e0e0"],
        borderColor: ["#ffffff"],
        borderWidth: 1,
      },
    ],
  };

  const budgetChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom" },
      title: { 
        display: true, 
        text: budgetTotal > 0 
          ? `Budget Breakdown (₹${budgetTotal.toLocaleString("en-IN")}) - ${selectedFilter}` 
          : `Budget Breakdown (No Data) - ${selectedFilter}` 
      },
      tooltip: {
        enabled: budgetTotal > 0,
        callbacks: {
          label: context => `₹${context.raw.toLocaleString("en-IN")}`,
        },
      },
    },
  };

  // Expense Breakdown
  const expenseTotal = reportData && reportData.categoryBreakdown
    ? Object.values(reportData.categoryBreakdown).reduce((sum, entry) => sum + (Number(entry.spent) || 0), 0)
    : 0;

  const expenseChartData = reportData && reportData.categoryBreakdown && Object.keys(reportData.categoryBreakdown).length > 0 ? {
    labels: Object.keys(reportData.categoryBreakdown),
    datasets: [
      {
        data: Object.values(reportData.categoryBreakdown).map(entry => Number(entry.spent) || 0),
        backgroundColor: ["#d32f2f", "#ef5350", "#f44336", "#e57373", "#ef9a9a"],
        borderColor: ["#ffffff"],
        borderWidth: 1,
      },
    ],
  } : {
    labels: ["No Data"],
    datasets: [
      {
        data: [1],
        backgroundColor: ["#e0e0e0"],
        borderColor: ["#ffffff"],
        borderWidth: 1,
      },
    ],
  };

  console.log("Expense Chart Data:", expenseChartData);
  console.log("Expense Total:", expenseTotal);

  const expenseChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom" },
      title: { 
        display: true, 
        text: expenseTotal > 0 
          ? `Expense Breakdown (₹${expenseTotal.toLocaleString("en-IN")}) - ${selectedFilter}` 
          : `Expense Breakdown (No Data) - ${selectedFilter}` 
      },
      tooltip: {
        enabled: expenseTotal > 0,
        callbacks: {
          label: context => `₹${context.raw.toLocaleString("en-IN")}`,
        },
      },
    },
  };

  // Debug chart rendering
  useEffect(() => {
    if (expenseChartRef.current) {
      console.log("Expense Chart Canvas:", expenseChartRef.current.canvas);
    }
    console.log("Reports Component Rendered - Header: ExpenseMate, Logout; Report Header: Reports only");
  }, [reportData]);

  // Hover effects
  useEffect(() => {
    const sidebarItems = document.querySelectorAll(".sidebar-item");
    sidebarItems.forEach((item) => {
      const isActive = item.classList.contains("active");
      item.addEventListener("mouseenter", () => {
        item.style.backgroundColor = isActive ? "rgba(0, 196, 180, 0.3)" : "#e0e0e0";
      });
      item.addEventListener("mouseleave", () => {
        item.style.backgroundColor = isActive ? "rgba(0, 196, 180, 0.2)" : "transparent";
      });
    });

    const buttons = document.querySelectorAll(".action-button");
    buttons.forEach((button) => {
      button.addEventListener("mouseenter", () => {
        button.style.background = "linear-gradient(145deg, #00c4b4, #00a69a)";
        button.style.transform = "scale(1.05)";
      });
      button.addEventListener("mouseleave", () => {
        button.style.background = "#00c4b4";
        button.style.transform = "scale(1)";
      });
    });

    return () => {
      sidebarItems.forEach((item) => {
        item.removeEventListener("mouseenter", () => {});
        item.removeEventListener("mouseleave", () => {});
      });
      buttons.forEach((button) => {
        button.removeEventListener("mouseenter", () => {});
        button.removeEventListener("mouseleave", () => {});
      });
    };
  }, []);

  if (loading) {
    return <div style={styles.container}>Loading...</div>;
  }

  if (error) {
    return <div style={styles.container}>{error}</div>;
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.logo}>
          <span style={styles.logoText}>ExpenseMate</span>
        </div>
        <button style={styles.logoutButton} onClick={handleLogout} aria-label="Log out">
          <FiLogOut size={18} /> Logout
        </button>
      </header>

      {/* Main Layout */}
      <div style={styles.layout}>
        {/* Sidebar Navigation */}
        <nav style={styles.sidebar}>
          <ul style={styles.sidebarList}>
            {[
              { text: "Dashboard", icon: <FiHome size={18} />, path: "/dashboard" },
              { text: "Transactions", icon: <FiStar size={18} />, path: "/transactions" },
              { text: "Budgets", icon: <FiCalendar size={18} />, path: "/budgets" },
              { text: "Goals", icon: <FiFlag size={18} />, path: "/goals" },
              { text: "Reports", icon: <FiBarChart size={18} />, path: "/reports", active: true },
            ].map((item) => (
              <li
                key={item.text}
                className={`sidebar-item ${item.active ? "active" : ""}`}
                style={{
                  ...styles.sidebarItem,
                  backgroundColor: item.active ? "rgba(0, 196, 180, 0.2)" : "transparent",
                  color: item.active ? "#00c4b4" : "#333",
                }}
                onClick={() => navigate(item.path)}
              >
                <span style={{ ...styles.sidebarIcon, color: item.active ? "#00c4b4" : "#666" }}>
                  {item.icon}
                </span>
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </nav>

        {/* Main Content */}
        <main style={styles.main}>
          <section style={styles.section}>
            {/* Report Header */}
            <h2 style={styles.sectionTitle}>Reports</h2>

            {/* Two Graphs in One Row */}
            <div style={{ ...styles.graphsContainer, gridTemplateColumns: "repeat(2, 1fr)" }}>
              {/* Budget Breakdown */}
              <div style={styles.chartCard}>
                <h2 style={styles.chartTitle}>Budget Breakdown</h2>
                <div style={styles.chartWrapper}>
                  <Pie data={budgetChartData} options={budgetChartOptions} />
                </div>
              </div>

              {/* Expense Breakdown */}
              <div style={styles.chartCard}>
                <h2 style={styles.chartTitle}>Expense Breakdown</h2>
                <div style={styles.chartWrapper}>
                  <Pie
                    ref={expenseChartRef}
                    data={expenseChartData}
                    options={expenseChartOptions}
                    onError={() => console.error("Error rendering Expense Breakdown chart")}
                  />
                </div>
              </div>
            </div>

            {/* Filter Bar */}
            <div style={styles.filterContainer}>
              <h3 style={styles.filterTitle}>Filter by Period</h3>
              <div style={styles.filterButtons}>
                {["All", "Q1", "Q2", "Q3", "Q4"].map((filter) => (
                  <button
                    key={filter}
                    style={{
                      ...styles.filterButton,
                      backgroundColor: selectedFilter === filter ? "#00c4b4" : "#e0e0e0",
                      color: selectedFilter === filter ? "#fff" : "#333",
                    }}
                    className="action-button"
                    onClick={() => setSelectedFilter(filter)}
                  >
                    {filter}
                  </button>
                ))}
              </div>
              <div style={styles.exportButtons}>
                <button
                  style={styles.addButton}
                  className="action-button"
                  onClick={handleExportPDF}
                >
                  Export PDF
                </button>
                <button
                  style={styles.addButton}
                  className="action-button"
                  onClick={handleExportCSV}
                >
                  Export CSV
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

const styles = {
  container: {
    fontFamily: "'Open Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    background: "#ffffff",
    minHeight: "100vh",
    boxSizing: "border-box",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "#0f2b5b",
    padding: "1rem 1.5rem",
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    boxSizing: "border-box",
    maxWidth: "100vw",
    overflow: "hidden",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    flexShrink: 0,
  },
  logoText: {
    fontSize: "1.5rem",
    fontWeight: 700,
    background: "linear-gradient(90deg, #4f46e5, #00c4b4)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    whiteSpace: "nowrap",
  },
  logoutButton: {
    background: "#00c4b4",
    color: "#ffffff",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    transition: "background 0.3s, transform 0.3s",
    flexShrink: 0,
    whiteSpace: "nowrap",
  },
  layout: {
    display: "flex",
    paddingTop: "64px",
  },
  sidebar: {
    width: "160px",
    background: "#f5f6f5",
    height: "calc(100vh - 64px)",
    position: "fixed",
    top: "64px",
    left: 0,
    borderRight: "1px solid #e5e7eb",
    boxSizing: "border-box",
  },
  sidebarList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    paddingTop: "1rem",
  },
  sidebarItem: {
    display: "flex",
    alignItems: "center",
    padding: "0 1rem",
    height: "2.5rem",
    cursor: "pointer",
    transition: "background-color 0.3s",
    fontSize: "0.875rem",
    lineHeight: "1",
  },
  sidebarIcon: {
    marginRight: "0.5rem",
  },
  main: {
    marginLeft: "160px",
    padding: "1rem 1rem 2rem",
    flexGrow: 1,
    boxSizing: "border-box",
  },
  section: {
    padding: "0",
    background: "#f5f6f5",
  },
  sectionTitle: {
    fontSize: "2rem",
    fontWeight: 700,
    color: "#333333",
    marginBottom: "1.5rem",
    lineHeight: "1",
  },
  graphsContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "1rem",
    marginBottom: "2rem",
  },
  chartCard: {
    background: "#ffffff",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    padding: "1.5rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    minHeight: "300px",
  },
  chartTitle: {
    fontSize: "1.25rem",
    fontWeight: 600,
    color: "#333333",
    marginBottom: "1rem",
    display: "flex",
    alignItems: "center",
  },
  chartWrapper: {
    maxWidth: "300px",
    width: "100%",
    height: "250px",
    position: "relative",
  },
  filterContainer: {
    marginBottom: "2rem",
  },
  filterTitle: {
    fontSize: "1.25rem",
    fontWeight: 600,
    color: "#333333",
    marginBottom: "1rem",
  },
  filterButtons: {
    display: "flex",
    gap: "0.5rem",
    marginBottom: "1rem",
  },
  filterButton: {
    background: "#e0e0e0",
    color: "#333",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.875rem",
    transition: "background 0.3s, transform 0.3s",
  },
  exportButtons: {
    display: "flex",
    gap: "1rem",
  },
  addButton: {
    background: "#00c4b4",
    color: "#ffffff",
    border: "none",
    padding: "0.75rem 1.5rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    transition: "background 0.3s, transform 0.3s",
  },
};

export default Reports;