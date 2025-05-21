import React, { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "universal-cookie";
import { useNavigate } from "react-router-dom";
import { Line, Pie, Bar } from "react-chartjs-2";
import { jsPDF } from "jspdf";
import Papa from "papaparse";
import {
  Chart as ChartJS,
  LineElement,
  PieController,
  ArcElement,
  BarElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { FiHome, FiCalendar, FiDollarSign, FiFlag, FiBarChart, FiPlus, FiEdit, FiTrash2, FiBriefcase } from "react-icons/fi";

// Register all chart components
ChartJS.register(
  LineElement,
  PieController,
  ArcElement,
  BarElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend
);

const Portfolio = () => {
  const cookies = new Cookies();
  const navigate = useNavigate();
  const API_URL = "http://localhost:8090";
  const getAuthToken = () => cookies.get("token");

  // State management
  const [portfolio, setPortfolio] = useState([]);
  const [portfolioSummary, setPortfolioSummary] = useState({
    totalValue: 0,
    totalProfitLoss: 0,
    assetCountByType: {},
  });
  const [assetAllocation, setAssetAllocation] = useState([]);
  const [portfolioTrend, setPortfolioTrend] = useState([]);
  const [assetPerformance, setAssetPerformance] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currency, setCurrency] = useState("INR");
  const [formData, setFormData] = useState({
    id: null,
    assetName: "",
    assetType: "stock",
    quantity: "",
    purchasePrice: "",
    symbol: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [recentActions, setRecentActions] = useState([]);
  const [selectedSymbol, setSelectedSymbol] = useState("");
  const [selectedType, setSelectedType] = useState("stock");
  const [showAlertPopup, setShowAlertPopup] = useState(false);

  const isEditing = formData.id !== null;

  // Fetch all portfolio data
  const fetchPortfolioData = async () => {
    const token = getAuthToken();
    if (!token) {
      alert("You are not authenticated");
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const assetsResponse = await axios.get(`${API_URL}/getAssets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const validAssets = assetsResponse.data.filter(
        (asset) =>
          asset.assetName &&
          typeof asset.assetName === "string" &&
          asset.symbol &&
          typeof asset.symbol === "string"
      );
      setPortfolio(validAssets);

      const summaryResponse = await axios.get(`${API_URL}/portfolio/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPortfolioSummary(summaryResponse.data);

      const allocationResponse = await axios.get(
        `${API_URL}/portfolio/asset-allocation`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setAssetAllocation(allocationResponse.data);

      const trendResponse = await axios.get(`${API_URL}/trend`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPortfolioTrend(trendResponse.data);
    } catch (err) {
      console.error("Error fetching portfolio data", err);
      setError("Failed to fetch portfolio data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch asset performance
  const fetchAssetPerformance = async (symbol, type) => {
    const token = getAuthToken();
    if (!token) {
      alert("You are not authenticated");
      navigate("/login");
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/performance`, {
        params: { symbol, type },
        headers: { Authorization: `Bearer ${token}` },
      });
      setAssetPerformance((prev) => ({
        ...prev,
        [`${symbol}:${type}`]: response.data,
      }));
    } catch (err) {
      console.error(`Error fetching performance for ${symbol} (${type})`, err);
      setError(`Failed to fetch performance data for ${symbol}.`);
    }
  };

  useEffect(() => {
    fetchPortfolioData();
  }, []);

  // Filter and sort logic
  const filteredAssets = portfolio.filter((asset) => {
    const assetName = asset.assetName || "";
    const symbol = asset.symbol || "";
    const matchesSearch =
      assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      symbol.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || asset.assetType === filterType;
    return matchesSearch && matchesType;
  });

  const sortedAssets = [...filteredAssets].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aValue = a[sortConfig.key] || "";
    const bValue = b[sortConfig.key] || "";
    if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Chart data
  const allocationChartData = {
    labels: assetAllocation.map((alloc) => alloc.assetType),
    datasets: [
      {
        data: assetAllocation.map((alloc) => alloc.totalValue),
        backgroundColor: assetAllocation.map(
          () => `#${Math.floor(Math.random() * 16777215).toString(16)}`
        ),
      },
    ],
  };

  const performanceChartData = {
    labels: portfolio.map((a) => a.assetName || "Unknown"),
    datasets: [
      {
        label: "Performance (%)",
        data: portfolio.map((a) => {
          const invested = (a.purchasePrice || 0) * (a.quantity || 0);
          const current = (a.currentPrice || 0) * (a.quantity || 0);
          return invested > 0 ? ((current - invested) / invested) * 100 : 0;
        }),
        backgroundColor: portfolio.map((a) =>
          (a.currentPrice || 0) * (a.quantity || 0) >=
          (a.purchasePrice || 0) * (a.quantity || 0)
            ? "#4caf50"
            : "#f44336"
        ),
        borderColor: "#ffffff",
        borderWidth: 1,
        borderRadius: 4,
        barPercentage: 0.7,
      },
    ],
  };

  const getTrendChartData = () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const gradientFill = ctx.createLinearGradient(0, 0, 0, 400);
    gradientFill.addColorStop(0, "rgba(0, 196, 180, 0.2)");
    gradientFill.addColorStop(1, "rgba(0, 196, 180, 0)");

    return {
      labels: portfolioTrend.map((s) => s.snapshotDate || "Unknown"),
      datasets: [
        {
          label: `Portfolio Value (Rs.)`,
          data: portfolioTrend.map((s) => s.totalValue || 0),
          borderColor: "#00c4b4",
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.3,
          fill: true,
          backgroundColor: gradientFill,
        },
      ],
    };
  };

  const assetPerformanceChartData = (symbol, type) => {
    const performanceData = assetPerformance[`${symbol}:${type}`] || [];
    return {
      labels: performanceData.map((data) => data.date || "Unknown"),
      datasets: [
        {
          label: `Price (Rs.)`,
          data: performanceData.map((data) => data.price || 0),
          borderColor: "#00c4b4",
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.3,
          fill: true,
          backgroundColor: "#f5f6f5",
        },
      ],
    };
  };

  // Handlers
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddOrUpdate = async () => {
    const token = getAuthToken();
    if (!token) {
      alert("You are not authenticated");
      navigate("/login");
      return;
    }

    if (!formData.assetName || !formData.symbol) {
      setError("Asset Name and Symbol are required.");
      return;
    }
    if (!formData.quantity || formData.quantity <= 0) {
      setError("Quantity must be a positive number.");
      return;
    }
    if (!formData.purchasePrice || formData.purchasePrice <= 0) {
      setError("Purchase Price must be a positive number.");
      return;
    }

    try {
      const endpoint = isEditing ? "/updateAsset" : "/addAsset";
      const payload = {
        ...formData,
        quantity: parseFloat(formData.quantity),
        purchasePrice: parseFloat(formData.purchasePrice),
      };

      await axios.post(`${API_URL}${endpoint}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setRecentActions((prev) => [
        {
          action: isEditing ? "Updated" : "Added",
          assetName: formData.assetName,
          timestamp: new Date().toISOString(),
        },
        ...prev.slice(0, 4),
      ]);

      setFormData({
        id: null,
        assetName: "",
        assetType: "stock",
        quantity: "",
        purchasePrice: "",
        symbol: "",
      });
      setShowModal(false);
      fetchPortfolioData();

      // Check for alerts after adding/updating
      const alertAssets = portfolio.filter(
        (asset) => (asset.currentPrice || 0) < 0.8 * (asset.purchasePrice || 0)
      );
      if (alertAssets.length > 0) {
        setShowAlertPopup(true);
        setTimeout(() => setShowAlertPopup(false), 5000); // Auto-close after 5 seconds
      }
    } catch (err) {
      console.error("Error saving asset", err);
      setError("Failed to save asset. Please check inputs.");
    }
  };

  const handleEdit = (asset) => {
    setFormData({
      id: asset.id,
      assetName: asset.assetName || "",
      assetType: asset.assetType || "stock",
      quantity: asset.quantity || "",
      purchasePrice: asset.purchasePrice || "",
      symbol: asset.symbol || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id, assetName) => {
    const token = getAuthToken();
    if (!token) {
      alert("You are not authenticated");
      navigate("/login");
      return;
    }

    try {
      await axios.get(`${API_URL}/deleteAsset/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecentActions((prev) => [
        { action: "Deleted", assetName, timestamp: new Date().toISOString() },
        ...prev.slice(0, 4),
      ]);
      fetchPortfolioData();
    } catch (err) {
      console.error("Error deleting asset", err);
      setError("Failed to delete asset.");
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Portfolio Report", 20, 10);
    doc.text(`Total Value: Rs. ${portfolioSummary.totalValue.toFixed(2)}`, 20, 20);
    doc.text(
      `Total Profit/Loss: Rs. ${portfolioSummary.totalProfitLoss.toFixed(2)}`,
      20,
      30
    );
    doc.text(
      `Asset Types: ${Object.entries(portfolioSummary.assetCountByType)
        .map(([type, count]) => `${type}: ${count}`)
        .join(", ")}`,
      20,
      40
    );

    portfolio.forEach((asset, i) => {
      const yPos = 50 + i * 15;
      const assetValue = (asset.currentPrice || 0) * (asset.quantity || 0);
      const assetCost = (asset.purchasePrice || 0) * (asset.quantity || 0);
      const assetProfit = assetValue - assetCost;

      doc.text(
        `${asset.assetName || "Unknown"} (${
          asset.symbol || "N/A"
        }): ${asset.quantity || 0} @ Rs. ${(asset.purchasePrice || 0).toFixed(
          2
        )} → Rs. ${(asset.currentPrice || 0).toFixed(2)}`,
        10,
        yPos
      );
      doc.setTextColor(assetProfit >= 0 ? "0, 128, 0" : "255, 0, 0");
      doc.text(
        `Value: Rs. ${assetValue.toFixed(2)} (${
          assetProfit >= 0 ? "+" : ""
        }${((assetProfit / assetCost) * 100 || 0).toFixed(2)}%)`,
        10,
        yPos + 5
      );
      doc.setTextColor(0, 0, 0);
    });
    doc.save("portfolio_report.pdf");
  };

  const handleCSVUpload = (event) => {
    const file = event.target.files[0];
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        results.data.forEach((row) => {
          if (!row.assetName || !row.symbol) return;
          const payload = {
            ...row,
            quantity: parseFloat(row.quantity) || 0,
            purchasePrice: parseFloat(row.purchasePrice) || 0,
            assetType: row.assetType || "stock",
          };
          axios
            .post(`${API_URL}/addAsset`, payload, {
              headers: { Authorization: `Bearer ${getAuthToken()}` },
            })
            .then(() => {
              setRecentActions((prev) => [
                {
                  action: "Added",
                  assetName: row.assetName,
                  timestamp: new Date().toISOString(),
                },
                ...prev.slice(0, 4),
              ]);
              fetchPortfolioData();
            })
            .catch((err) => {
              console.error("Error importing asset", err);
              setError("Failed to import asset from CSV.");
            });
        });
      },
    });
  };

  const toggleCurrency = () => {
    setCurrency(currency === "INR" ? "USD" : "INR");
  };

  const refreshPrices = () => {
    fetchPortfolioData();
  };

  const alertAssets = portfolio.filter(
    (asset) => (asset.currentPrice || 0) < 0.8 * (asset.purchasePrice || 0)
  );

  // Hover effects for sidebar items, buttons, and cards
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
      const isDelete = button.classList.contains("delete-button");
      button.addEventListener("mouseenter", () => {
        button.style.background = isDelete
          ? "#dc2626"
          : "linear-gradient(145deg, #00c4b4, #00a69a)";
        button.style.transform = "scale(1.05)";
      });
      button.addEventListener("mouseleave", () => {
        button.style.background = isDelete ? "#ef4444" : "#00c4b4";
        button.style.transform = "scale(1)";
      });
    });

    const cards = document.querySelectorAll(".overview-card");
    cards.forEach((card) => {
      card.addEventListener("mouseenter", () => {
        card.style.transform = "scale(1.05)";
        card.style.boxShadow = "0 4px 8px rgba(0,0,0,0.15)";
      });
      card.addEventListener("mouseleave", () => {
        card.style.transform = "scale(1)";
        card.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
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
      cards.forEach((card) => {
        card.removeEventListener("mouseenter", () => {});
        card.removeEventListener("mouseleave", () => {});
      });
    };
  }, []);

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.logo}>
          <span style={styles.logoText}>ExpenseMate</span>
        </div>
      </header>

      {/* Main Layout */}
      <div style={styles.layout}>
        {/* Sidebar Navigation */}
        <nav style={styles.sidebar}>
          <ul style={styles.sidebarList}>
            {[
              { text: "Dashboard", icon: <FiHome size={18} />, path: "/dashboard" },
              { text: "Budgets", icon: <FiCalendar size={18} />, path: "/budgets" },
              { text: "Transactions", icon: <FiDollarSign size={18} />, path: "/transactions" },
              { text: "Goals", icon: <FiFlag size={18} />, path: "/goals" },
              { text: "Reports", icon: <FiBarChart size={18} />, path: "/reports" },
              { text: "Portfolio", icon: <FiBriefcase size={18} />, path: "/portfolio", active: true },
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
          <button
            style={styles.addButton}
            className="action-button"
            onClick={() => setShowModal(true)}
          >
            <FiPlus size={18} style={{ marginRight: "0.5rem" }} /> Add
          </button>
        </nav>

        {/* Main Content */}
        <main style={styles.main}>
          <section style={styles.section}>
            {/* Page Title */}
            <h2 style={styles.sectionTitle}>Portfolio</h2>
            {/* Add Asset Button */}
            <div style={styles.buttonContainer}>
              <button
                style={styles.addButton}
                className="action-button"
                onClick={() => setShowModal(true)}
              >
                Add Asset
              </button>
            </div>

            {/* Summary Cards */}
            <div style={styles.overviewContainer}>
              <div style={styles.overviewCard} className="overview-card">
                <p style={styles.cardLabel}>Total Value</p>
                <p style={styles.cardValue}>
                  Rs. {portfolioSummary.totalValue.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div style={styles.overviewCard} className="overview-card">
                <p style={styles.cardLabel}>Total Profit/Loss</p>
                <p
                  style={{
                    ...styles.cardValue,
                    color:
                      portfolioSummary.totalProfitLoss >= 0 ? "#4caf50" : "#f44336",
                  }}
                >
                  Rs. {Math.abs(portfolioSummary.totalProfitLoss).toLocaleString(
                    undefined,
                    { maximumFractionDigits: 2 }
                  )}
                </p>
              </div>
              <div style={styles.overviewCard} className="overview-card">
                <p style={styles.cardLabel}>Asset Types</p>
                <p style={styles.cardValue}>
                  {Object.values(portfolioSummary.assetCountByType).reduce(
                    (sum, count) => sum + count,
                    0
                  )}
                </p>
              </div>
            </div>

            {/* Controls Section */}
            <div style={{ ...styles.tableContainer, marginBottom: "2rem" }}>
              <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
                <input
                  type="text"
                  placeholder="Search assets..."
                  style={styles.formInput}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select
                  style={styles.formSelect}
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="all">All Types</option>
                  <option value="stock">Stocks</option>
                  <option value="crypto">Crypto</option>
                </select>
                <button
                  onClick={refreshPrices}
                  style={styles.submitButton}
                  className="action-button"
                >
                  Refresh
                </button>
                <button
                  onClick={toggleCurrency}
                  style={styles.submitButton}
                  className="action-button"
                >
                  {currency}
                </button>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUpload}
                  style={{ display: "none" }}
                  id="csvUpload"
                />
                <label
                  htmlFor="csvUpload"
                  style={styles.submitButton}
                  className="action-button"
                >
                  Import CSV
                </label>
                <button
                  onClick={handleExportPDF}
                  style={styles.submitButton}
                  className="action-button"
                >
                  Export PDF
                </button>
              </div>
            </div>

            {/* Price Alerts Popup */}
            {showAlertPopup && alertAssets.length > 0 && (
              <div style={styles.alertPopup}>
                <div style={styles.alertPopupContent}>
                  <h3 style={{ fontSize: "1.25rem", margin: "0 0 1rem" }}>
                    Price Alerts
                  </h3>
                  {alertAssets.map((asset) => (
                    <p key={asset.id} style={{ color: "#666", margin: "0.5rem 0" }}>
                      {asset.assetName || "Unknown"} has dropped{" "}
                      {(
                        100 -
                        ((asset.currentPrice || 0) / (asset.purchasePrice || 1)) * 100
                      ).toFixed(2)}
                      % from purchase price
                    </p>
                  ))}
                  <button
                    onClick={() => setShowAlertPopup(false)}
                    style={styles.cancelButton}
                    className="action-button"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div style={{ ...styles.error, marginBottom: "2rem" }}>{error}</div>
            )}

            {loading ? (
              <div style={{ textAlign: "center", padding: "2rem" }}>
                Loading portfolio data...
              </div>
            ) : (
              <>
                {/* Charts Section */}
                <div style={{ ...styles.chartsContainer, marginBottom: "2rem" }}>
                  <div style={styles.chartCard}>
                    <h3 style={{ fontSize: "1.25rem", margin: "0 0 1rem" }}>
                      Asset Allocation
                    </h3>
                    <div style={{ height: "300px" }}>
                      <Pie
                        data={allocationChartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { position: "top", labels: { color: "#333" } },
                            tooltip: {
                              callbacks: {
                                label: (context) => {
                                  const value = context.parsed || 0;
                                  const total = context.dataset.data.reduce(
                                    (a, b) => a + b,
                                    0
                                  );
                                  const percentage = ((value / total) * 100).toFixed(1);
                                  return `${context.label}: Rs. ${value.toFixed(
                                    2
                                  )} (${percentage}%)`;
                                },
                              },
                            },
                          },
                        }}
                      />
                    </div>
                  </div>
                  <div style={styles.chartCard}>
                    <h3 style={{ fontSize: "1.25rem", margin: "0 0 1rem" }}>
                      Portfolio Performance
                    </h3>
                    <div style={{ height: "300px" }}>
                      <Bar
                        data={performanceChartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          scales: { y: { beginAtZero: true } },
                          plugins: {
                            legend: { position: "top", labels: { color: "#333" } },
                          },
                        }}
                      />
                    </div>
                  </div>
                  <div style={styles.chartCard}>
                    <h3 style={{ fontSize: "1.25rem", margin: "0 0 1rem" }}>
                      Portfolio Trend
                    </h3>
                    <div style={{ height: "300px" }}>
                      <Line
                        data={getTrendChartData()}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          scales: { y: { beginAtZero: false } },
                          plugins: {
                            legend: { position: "top", labels: { color: "#333" } },
                          },
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Asset Performance Selector */}
                <div style={{ ...styles.tableContainer, marginBottom: "2rem" }}>
                  <h3 style={{ fontSize: "1.25rem", margin: "0 0 1rem" }}>
                    Asset Price History
                  </h3>
                  <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
                    <select
                      value={selectedSymbol}
                      onChange={(e) => {
                        setSelectedSymbol(e.target.value);
                        if (e.target.value)
                          fetchAssetPerformance(e.target.value, selectedType);
                      }}
                      style={styles.formSelect}
                    >
                      <option value="">Select Asset</option>
                      {portfolio.map((asset) => (
                        <option key={asset.id} value={asset.symbol}>
                          {asset.assetName || "Unknown"} ({asset.symbol || "N/A"})
                        </option>
                      ))}
                    </select>
                    <select
                      value={selectedType}
                      onChange={(e) => {
                        setSelectedType(e.target.value);
                        if (selectedSymbol)
                          fetchAssetPerformance(selectedSymbol, e.target.value);
                      }}
                      style={styles.formSelect}
                    >
                      <option value="stock">Stock</option>
                      <option value="crypto">Crypto</option>
                    </select>
                  </div>
                  {selectedSymbol &&
                    assetPerformance[`${selectedSymbol}:${selectedType}`] && (
                      <div style={{ ...styles.tableContainer }}>
                        <h3 style={{ fontSize: "1.25rem", margin: "0 0 1rem" }}>
                          Price History: {selectedSymbol}
                        </h3>
                        <div style={{ height: "300px" }}>
                          <Line
                            data={assetPerformanceChartData(
                              selectedSymbol,
                              selectedType
                            )}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              scales: { y: { beginAtZero: false } },
                              plugins: {
                                legend: { position: "top", labels: { color: "#333" } },
                              },
                            }}
                          />
                        </div>
                      </div>
                    )}
                </div>

                {/* Recent Actions */}
                <div style={{ ...styles.tableContainer, marginBottom: "2rem" }}>
                  <h3 style={{ fontSize: "1.25rem", margin: "0 0 1rem" }}>
                    Recent Actions
                  </h3>
                  {recentActions.length > 0 ? (
                    <ul style={{ listStyle: "none", padding: 0 }}>
                      {recentActions.map((action, index) => (
                        <li
                          key={index}
                          style={{
                            padding: "0.5rem 0",
                            borderBottom: "1px solid #e5e7eb",
                            color: "#666",
                          }}
                        >
                          {action.action} {action.assetName} at{" "}
                          {new Date(action.timestamp).toLocaleString()}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ color: "#666" }}>No recent actions.</p>
                  )}
                </div>

                {/* Assets Table */}
                <div style={styles.tableContainer}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "1rem",
                    }}
                  >
                    <h3 style={{ fontSize: "1.25rem", margin: 0 }}>
                      Asset Details
                    </h3>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        onClick={handleExportPDF}
                        style={styles.submitButton}
                        className="action-button"
                      >
                        Export PDF
                      </button>
                      <button
                        onClick={() => setShowModal(true)}
                        style={styles.submitButton}
                        className="action-button"
                      >
                        Add Asset
                      </button>
                    </div>
                  </div>
                  <table style={styles.table}>
                    <thead style={styles.tableHeader}>
                      <tr>
                        {[
                          { label: "Asset", key: "assetName" },
                          { label: "Type", key: "assetType" },
                          { label: "Quantity", key: "quantity" },
                          { label: "Cost" },
                          { label: "Current Price" },
                          { label: "Value" },
                          { label: "Profit/Loss" },
                          { label: "" },
                        ].map((header) => (
                          <th
                            key={header.label}
                            style={styles.tableCell}
                            onClick={
                              header.key ? () => requestSort(header.key) : undefined
                            }
                          >
                            {header.label}{" "}
                            {sortConfig.key === header.key &&
                              (sortConfig.direction === "asc" ? "↑" : "↓")}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sortedAssets.length > 0 ? (
                        sortedAssets.map((asset) => {
                          const invested =
                            (asset.purchasePrice || 0) * (asset.quantity || 0);
                          const current =
                            (asset.currentPrice || 0) * (asset.quantity || 0);
                          const profit = current - invested;
                          const profitPercent = invested > 0 ? (profit / invested) * 100 : 0;

                          return (
                            <tr
                              key={asset.id}
                              style={styles.tableRow}
                              onClick={() => {
                                setSelectedAsset(asset);
                                setShowModal(true);
                              }}
                            >
                              <td style={styles.tableCell}>
                                <div style={{ fontWeight: 500 }}>
                                  {asset.assetName || "Unknown"}
                                </div>
                                <div style={{ fontSize: "0.75rem", color: "#666" }}>
                                  {asset.symbol || "N/A"}
                                </div>
                              </td>
                              <td style={{ ...styles.tableCell, textTransform: "capitalize" }}>
                                {asset.assetType || "Unknown"}
                              </td>
                              <td style={styles.tableCell}>{asset.quantity || 0}</td>
                              <td style={styles.tableCell}>
                                Rs. {(asset.purchasePrice || 0).toFixed(2)}
                              </td>
                              <td style={{ ...styles.tableCell, fontWeight: "medium" }}>
                                Rs. {(asset.currentPrice || 0).toFixed(2)}
                              </td>
                              <td style={{ ...styles.tableCell, fontWeight: "600" }}>
                                Rs. {current.toFixed(2)}
                              </td>
                              <td
                                style={{
                                  ...styles.tableCell,
                                  color: profit >= 0 ? "#4caf50" : "#f44336",
                                }}
                              >
                                {profit >= 0 ? "+" : ""}Rs. {profit.toFixed(2)} (
                                {profitPercent.toFixed(2)}%)
                              </td>
                              <td style={styles.tableCell}>
                                <button
                                  style={styles.editButton}
                                  className="action-button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(asset);
                                  }}
                                >
                                  <FiEdit size={16} />
                                </button>
                                <button
                                  style={styles.deleteButton}
                                  className="action-button delete-button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(
                                      asset.id,
                                      asset.assetName || "Unknown"
                                    );
                                  }}
                                >
                                  <FiTrash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="8" style={{ ...styles.tableCell, textAlign: "center" }}>
                            No assets found. Add some investments to get started!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Modal */}
                {showModal && (
                  <div style={styles.modalOverlay}>
                    <div style={styles.modal}>
                      {selectedAsset ? (
                        <>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              marginBottom: "1rem",
                            }}
                          >
                            <h3 style={styles.modalTitle}>
                              {selectedAsset.assetName || "Unknown"} (
                              {selectedAsset.symbol || "N/A"})
                            </h3>
                            <button
                              onClick={() => setShowModal(false)}
                              style={{ color: "#666", background: "none", border: "none" }}
                            >
                              ✕
                            </button>
                          </div>
                          <div style={styles.form}>
                            <div style={styles.formGroup}>
                              <label style={styles.formLabel}>Type</label>
                              <p>{selectedAsset.assetType || "Unknown"}</p>
                            </div>
                            <div style={styles.formGroup}>
                              <label style={styles.formLabel}>Quantity</label>
                              <p>{selectedAsset.quantity || 0}</p>
                            </div>
                            <div style={styles.formGroup}>
                              <label style={styles.formLabel}>Avg Purchase Price</label>
                              <p>Rs. {(selectedAsset.purchasePrice || 0).toFixed(2)}</p>
                            </div>
                            <div style={styles.formGroup}>
                              <label style={styles.formLabel}>Current Price</label>
                              <p>Rs. {(selectedAsset.currentPrice || 0).toFixed(2)}</p>
                            </div>
                            <div style={styles.formGroup}>
                              <label style={styles.formLabel}>Invested</label>
                              <p>
                                Rs. {(
                                  (selectedAsset.purchasePrice || 0) *
                                  (selectedAsset.quantity || 0)
                                ).toFixed(2)}
                              </p>
                            </div>
                            <div style={styles.formGroup}>
                              <label style={styles.formLabel}>Current Value</label>
                              <p>
                                Rs. {(
                                  (selectedAsset.currentPrice || 0) *
                                  (selectedAsset.quantity || 0)
                                ).toFixed(2)}
                              </p>
                            </div>
                            <div style={styles.formGroup}>
                              <label style={styles.formLabel}>Profit/Loss</label>
                              <p
                                style={{
                                  color:
                                    (selectedAsset.currentPrice || 0) *
                                      (selectedAsset.quantity || 0) -
                                      (selectedAsset.purchasePrice || 0) *
                                      (selectedAsset.quantity || 0) >=
                                    0
                                      ? "#4caf50"
                                      : "#f44336",
                                }}
                              >
                                Rs. {Math.abs(
                                  (selectedAsset.currentPrice || 0) *
                                    (selectedAsset.quantity || 0) -
                                    (selectedAsset.purchasePrice || 0) *
                                    (selectedAsset.quantity || 0)
                                ).toFixed(2)}{" "}
                                (
                                {(selectedAsset.purchasePrice || 0) > 0
                                  ? (
                                      ((selectedAsset.currentPrice || 0) -
                                        (selectedAsset.purchasePrice || 0)) /
                                      (selectedAsset.purchasePrice || 1) *
                                      100
                                    ).toFixed(2)
                                  : "0.00"}
                                %)
                              </p>
                            </div>
                          </div>
                          <div style={styles.modalActions}>
                            <button
                              onClick={() => {
                                handleEdit(selectedAsset);
                                setShowModal(false);
                              }}
                              style={styles.submitButton}
                              className="action-button"
                            >
                              Edit Asset
                            </button>
                            <button
                              onClick={() => {
                                handleDelete(
                                  selectedAsset.id,
                                  selectedAsset.assetName || "Unknown"
                                );
                                setShowModal(false);
                              }}
                              style={styles.deleteButton}
                              className="action-button delete-button"
                            >
                              Delete Asset
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <h3 style={styles.modalTitle}>
                            {isEditing ? "Edit Asset" : "Add New Asset"}
                          </h3>
                          <div style={styles.form}>
                            <div style={styles.formGroup}>
                              <label style={styles.formLabel}>Asset Name</label>
                              <input
                                name="assetName"
                                value={formData.assetName}
                                onChange={handleInputChange}
                                placeholder="e.g., Apple Inc."
                                style={styles.formInput}
                              />
                            </div>
                            <div style={styles.formGroup}>
                              <label style={styles.formLabel}>Symbol</label>
                              <input
                                name="symbol"
                                value={formData.symbol}
                                onChange={handleInputChange}
                                placeholder="e.g., AAPL"
                                style={styles.formInput}
                              />
                            </div>
                            <div style={styles.formGroup}>
                              <label style={styles.formLabel}>Asset Type</label>
                              <select
                                name="assetType"
                                value={formData.assetType}
                                onChange={handleInputChange}
                                style={styles.formSelect}
                              >
                                <option value="stock">Stock</option>
                                <option value="crypto">Crypto</option>
                              </select>
                            </div>
                            <div style={styles.formGroup}>
                              <label style={styles.formLabel}>Quantity</label>
                              <input
                                name="quantity"
                                value={formData.quantity}
                                onChange={handleInputChange}
                                placeholder="e.g., 10"
                                type="number"
                                step="any"
                                style={styles.formInput}
                              />
                            </div>
                            <div style={styles.formGroup}>
                              <label style={styles.formLabel}>Purchase Price</label>
                              <input
                                name="purchasePrice"
                                value={formData.purchasePrice}
                                onChange={handleInputChange}
                                placeholder="e.g., 150.50"
                                type="number"
                                step="any"
                                style={styles.formInput}
                              />
                            </div>
                          </div>
                          <div style={styles.modalActions}>
                            <button
                              onClick={() => {
                                setFormData({
                                  id: null,
                                  assetName: "",
                                  assetType: "stock",
                                  quantity: "",
                                  purchasePrice: "",
                                  symbol: "",
                                });
                                setShowModal(false);
                              }}
                              style={styles.cancelButton}
                              className="action-button"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleAddOrUpdate}
                              style={styles.submitButton}
                              className="action-button"
                            >
                              {isEditing ? "Update" : "Add"}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        </main>
      </div>

      {/* CSS Animations */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes slideIn {
            from { transform: translateY(100px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}
      </style>
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
  addButton: {
    background: "#00c4b4",
    color: "#ffffff",
    border: "none",
    padding: "0.75rem 1.5rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: 500,
    margin: "1rem",
    display: "flex",
    alignItems: "center",
    transition: "background 0.3s, transform 0.3s",
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
  buttonContainer: {
    marginBottom: "2rem",
  },
  overviewContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "0.5rem",
    marginBottom: "2rem",
  },
  overviewCard: {
    background: "#ffffff",
    borderRadius: "8px",
    padding: "0.5rem 2rem",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    transition: "transform 0.3s, box-shadow 0.3s",
    animation: "fadeIn 0.8s ease-out",
    border: "1px solid #e5e7eb",
  },
  cardLabel: {
    fontSize: "0.75rem",
    color: "#666",
    margin: 0,
  },
  cardValue: {
    fontSize: "1rem",
    fontWeight: 700,
    color: "#333333",
    margin: "0.25rem 0 0",
  },
  chartsContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "1rem",
    background: "#ffffff",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    padding: "1rem",
    animation: "fadeIn 0.8s ease-out",
  },
  chartCard: {
    background: "#ffffff",
    padding: "1rem",
    borderRadius: "8px",
  },
  tableContainer: {
    background: "#ffffff",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    overflowX: "auto",
    animation: "fadeIn 0.8s ease-out",
    padding: "1rem",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  tableHeader: {
    background: "#f5f6f5",
  },
  tableCell: {
    padding: "0.75rem",
    fontSize: "0.875rem",
    color: "#333333",
    textAlign: "left",
    borderBottom: "1px solid #e5e7eb",
  },
  tableRow: {
    transition: "background-color 0.3s",
  },
  editButton: {
    background: "#00c4b4",
    color: "#ffffff",
    border: "none",
    padding: "0.5rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.875rem",
    transition: "background 0.3s, transform 0.3s",
    marginRight: "0.5rem",
  },
  deleteButton: {
    background: "#ef4444",
    color: "#ffffff",
    border: "none",
    padding: "0.5rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.875rem",
    transition: "background 0.3s, transform 0.3s",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.3)",
    backdropFilter: "blur(5px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    background: "#ffffff",
    borderRadius: "15px",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
    padding: "2rem",
    width: "90%",
    maxWidth: "500px",
    animation: "fadeIn 0.3s ease-in-out",
  },
  alertPopup: {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    zIndex: 1100,
    animation: "slideIn 0.5s ease-out",
  },
  alertPopupContent: {
    background: "#ffffff",
    borderRadius: "8px",
    padding: "1rem",
    boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
    maxWidth: "300px",
  },
  modalTitle: {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#333333",
    marginBottom: "1rem",
  },
  form: {
    display: "grid",
    gap: "1rem",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
  },
  formLabel: {
    fontSize: "0.875rem",
    color: "#666",
    marginBottom: "0.25rem",
  },
  formInput: {
    padding: "0.5rem",
    border: "1px solid #e0e0e0",
    borderRadius: "4px",
    fontSize: "0.875rem",
    outline: "none",
    transition: "border-color 0.3s",
  },
  formSelect: {
    padding: "0.5rem",
    border: "1px solid #e0e0e0",
    borderRadius: "4px",
    fontSize: "0.875rem",
    outline: "none",
    transition: "border-color 0.3s",
  },
  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "1rem",
    marginTop: "1rem",
  },
  cancelButton: {
    background: "#666",
    color: "#ffffff",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.875rem",
    transition: "background 0.3s, transform 0.3s",
  },
  submitButton: {
    background: "#00c4b4",
    color: "#ffffff",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.875rem",
    transition: "background 0.3s, transform 0.3s",
  },
  error: {
    color: "#f44336",
    fontSize: "0.875rem",
    margin: "1rem 0",
    textAlign: "center",
  },
};

export default Portfolio;