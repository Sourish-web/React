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
  const [currency, setCurrency] = useState("USD");
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

  const isEditing = formData.id !== null;
  const cookies = new Cookies();
  const navigate = useNavigate();
  const API_URL = "http://localhost:8090";

  // Color scheme
  const colors = {
    primary: "#6366f1",
    success: "#22c55e",
    danger: "#ef4444",
    warning: "#f59e0b",
    background: "#f8fafc",
    cardBackground: "#ffffff",
    textPrimary: "#1e293b",
    textSecondary: "#64748b",
  };

  // Styled components
  const cardStyle = {
    background: colors.cardBackground,
    padding: "1.5rem",
    borderRadius: "1rem",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)",
    transition: "transform 0.2s, box-shadow 0.2s",
  };

  const buttonStyle = (color) => ({
    padding: "0.5rem 1rem",
    background: colors[color],
    color: "white",
    borderRadius: "0.375rem",
    cursor: "pointer",
    transition: "opacity 0.2s",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  });

  // Enhanced chart configurations
  const commonChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top", labels: { color: colors.textPrimary } },
      tooltip: {
        backgroundColor: colors.cardBackground,
        titleColor: colors.textPrimary,
        bodyColor: colors.textSecondary,
        borderColor: "#e2e8f0",
        borderWidth: 1,
        padding: 12,
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      },
    },
    scales: {
      x: {
        grid: { color: "#e2e8f0" },
        ticks: { color: colors.textSecondary },
      },
      y: {
        grid: { color: "#e2e8f0" },
        ticks: { color: colors.textSecondary },
      },
    },
  };

  const getAuthToken = () => cookies.get("token");

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
            ? colors.success
            : colors.danger
        ),
        borderColor: colors.cardBackground,
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
    gradientFill.addColorStop(0, "rgba(99, 102, 241, 0.2)");
    gradientFill.addColorStop(1, "rgba(99, 102, 241, 0)");

    return {
      labels: portfolioTrend.map((s) => s.snapshotDate || "Unknown"),
      datasets: [
        {
          label: `Portfolio Value (${currency})`,
          data: portfolioTrend.map((s) => s.totalValue || 0),
          borderColor: colors.primary,
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
          label: `Price (${currency})`,
          data: performanceData.map((data) => data.price || 0),
          borderColor: colors.primary,
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.3,
          fill: true,
          backgroundColor: colors.background,
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
      fetchPortfolioData();
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
    doc.text(`Total Value: $${portfolioSummary.totalValue.toFixed(2)}`, 20, 20);
    doc.text(
      `Total Profit/Loss: $${portfolioSummary.totalProfitLoss.toFixed(2)}`,
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
        }): ${asset.quantity || 0} @ $${(asset.purchasePrice || 0).toFixed(
          2
        )} → $${(asset.currentPrice || 0).toFixed(2)}`,
        10,
        yPos
      );
      doc.setTextColor(assetProfit >= 0 ? "0, 128, 0" : "255, 0, 0");
      doc.text(
        `Value: $${assetValue.toFixed(2)} (${
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
    setCurrency(currency === "USD" ? "INR" : "USD");
  };

  const refreshPrices = () => {
    fetchPortfolioData();
  };

  const alertAssets = portfolio.filter(
    (asset) => (asset.currentPrice || 0) < 0.8 * (asset.purchasePrice || 0)
  );

  return (
    <div
      style={{
        padding: "2rem",
        maxWidth: "1440px",
        margin: "0 auto",
        background: colors.background,
        minHeight: "100vh",
      }}
    >
      {/* Header Section */}
      <div style={{ marginBottom: "2rem" }}>
        <h1
          style={{
            fontSize: "1.875rem",
            fontWeight: 700,
            color: colors.textPrimary,
            display: "flex",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          📈 Investment Portfolio
          <span
            style={{
              fontSize: "1rem",
              background: colors.primary,
              color: "white",
              padding: "0.25rem 0.75rem",
              borderRadius: "999px",
            }}
          >
            {portfolio.length} Assets
          </span>
        </h1>
      </div>

      {/* Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "1.5rem",
          marginBottom: "2rem",
        }}
      >
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <div
                style={{ color: colors.textSecondary, marginBottom: "0.5rem" }}
              >
                Total Value
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>
                ${portfolioSummary.totalValue.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>
            <div
              style={{
                width: "3rem",
                height: "3rem",
                background: "#e0e7ff",
                borderRadius: "0.5rem",
                display: "grid",
                placeItems: "center",
              }}
            >
              💰
            </div>
          </div>
          <div
            style={{
              marginTop: "1rem",
              color:
                portfolioSummary.totalProfitLoss >= 0
                  ? colors.success
                  : colors.danger,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            {portfolioSummary.totalProfitLoss >= 0 ? "↑" : "↓"}
            {Math.abs(portfolioSummary.totalProfitLoss).toFixed(2)} (
            {portfolioSummary.totalValue > 0
              ? (
                  (portfolioSummary.totalProfitLoss /
                    portfolioSummary.totalValue) *
                  100
                ).toFixed(2)
              : 0}
            %)
          </div>
        </div>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <div
                style={{ color: colors.textSecondary, marginBottom: "0.5rem" }}
              >
                Total Profit/Loss
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>
                $
                {Math.abs(portfolioSummary.totalProfitLoss).toLocaleString(
                  undefined,
                  { maximumFractionDigits: 2 }
                )}
              </div>
            </div>
            <div
              style={{
                width: "3rem",
                height: "3rem",
                background: "#e0e7ff",
                borderRadius: "0.5rem",
                display: "grid",
                placeItems: "center",
              }}
            >
              📊
            </div>
          </div>
          <div
            style={{
              marginTop: "1rem",
              color:
                portfolioSummary.totalProfitLoss >= 0
                  ? colors.success
                  : colors.danger,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            {portfolioSummary.totalProfitLoss >= 0 ? "↑" : "↓"}
            {portfolioSummary.totalValue > 0
              ? (
                  (portfolioSummary.totalProfitLoss /
                    portfolioSummary.totalValue) *
                  100
                ).toFixed(2)
              : 0}
            %
          </div>
        </div>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <div
                style={{ color: colors.textSecondary, marginBottom: "0.5rem" }}
              >
                Asset Types
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>
                {Object.values(portfolioSummary.assetCountByType).reduce(
                  (sum, count) => sum + count,
                  0
                )}
              </div>
            </div>
            <div
              style={{
                width: "3rem",
                height: "3rem",
                background: "#e0e7ff",
                borderRadius: "0.5rem",
                display: "grid",
                placeItems: "center",
              }}
            >
              🗂
            </div>
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            gap: "1rem",
            minWidth: "300px",
          }}
        >
          <div style={{ flex: 1, position: "relative" }}>
            <input
              type="text"
              placeholder="Search assets..."
              style={{
                width: "100%",
                padding: "0.75rem 2.5rem",
                borderRadius: "0.75rem",
                border: `1px solid #e2e8f0`,
                background: colors.cardBackground,
              }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span
              style={{
                position: "absolute",
                left: "1rem",
                top: "50%",
                transform: "translateY(-50%)",
                opacity: 0.5,
              }}
            >
              🔍
            </span>
          </div>
          <select
            style={{
              padding: "0.75rem",
              borderRadius: "0.75rem",
              border: `1px solid #e2e8f0`,
              background: colors.cardBackground,
            }}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="stock">Stocks</option>
            <option value="crypto">Crypto</option>
          </select>
          <button
            onClick={refreshPrices}
            style={buttonStyle("primary")}
            title="Refresh prices"
          >
            🔄 Refresh
          </button>
        </div>
        <div style={{ display: "flex", gap: "1rem" }}>
          <button onClick={toggleCurrency} style={buttonStyle("success")}>
            💱 {currency}
          </button>
          <input
            type="file"
            accept=".csv"
            onChange={handleCSVUpload}
            style={{ display: "none" }}
            id="csvUpload"
          />
          <label htmlFor="csvUpload" style={buttonStyle("primary")}>
            📤 Import CSV
          </label>
          <button onClick={handleExportPDF} style={buttonStyle("danger")}>
            📥 Export PDF
          </button>
        </div>
      </div>

      {/* Alerts */}
      {alertAssets.length > 0 && (
        <div
          style={{
            ...cardStyle,
            padding: "1rem",
            marginBottom: "2rem",
            border: `1px solid ${colors.warning}`,
            background: "#fefce8",
          }}
        >
          <h3
            style={{
              fontWeight: "bold",
              marginBottom: "0.5rem",
              color: colors.textPrimary,
            }}
          >
            ⚠️ Price Alerts
          </h3>
          {alertAssets.map((asset) => (
            <p key={asset.id} style={{ color: colors.textSecondary }}>
              {asset.assetName || "Unknown"} has dropped{" "}
              {(
                100 -
                ((asset.currentPrice || 0) / (asset.purchasePrice || 1)) * 100
              ).toFixed(2)}
              % from purchase price
            </p>
          ))}
        </div>
      )}

      {/* Add/Edit Form */}
      <div style={{ ...cardStyle, marginBottom: "2rem" }}>
        <h3
          style={{
            fontSize: "1.125rem",
            fontWeight: 600,
            marginBottom: "1rem",
            color: colors.textPrimary,
          }}
        >
          {isEditing ? "Edit Asset" : "Add New Asset"}
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: "medium",
                color: colors.textPrimary,
                marginBottom: "0.25rem",
              }}
            >
              Asset Name
            </label>
            <input
              name="assetName"
              value={formData.assetName}
              onChange={handleInputChange}
              placeholder="e.g., Apple Inc."
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "0.75rem",
                border: `1px solid #e2e8f0`,
                background: colors.cardBackground,
              }}
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: "medium",
                color: colors.textPrimary,
                marginBottom: "0.25rem",
              }}
            >
              Symbol
            </label>
            <input
              name="symbol"
              value={formData.symbol}
              onChange={handleInputChange}
              placeholder="e.g., AAPL"
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "0.75rem",
                border: `1px solid #e2e8f0`,
                background: colors.cardBackground,
              }}
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: "medium",
                color: colors.textPrimary,
                marginBottom: "0.25rem",
              }}
            >
              Asset Type
            </label>
            <select
              name="assetType"
              value={formData.assetType}
              onChange={handleInputChange}
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "0.75rem",
                border: `1px solid #e2e8f0`,
                background: colors.cardBackground,
              }}
            >
              <option value="stock">Stock</option>
              <option value="crypto">Crypto</option>
            </select>
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: "medium",
                color: colors.textPrimary,
                marginBottom: "0.25rem",
              }}
            >
              Quantity
            </label>
            <input
              name="quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              placeholder="e.g., 10"
              type="number"
              step="any"
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "0.75rem",
                border: `1px solid #e2e8f0`,
                background: colors.cardBackground,
              }}
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: "medium",
                color: colors.textPrimary,
                marginBottom: "0.25rem",
              }}
            >
              Purchase Price
            </label>
            <input
              name="purchasePrice"
              value={formData.purchasePrice}
              onChange={handleInputChange}
              placeholder="e.g., 150.50"
              type="number"
              step="any"
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "0.75rem",
                border: `1px solid #e2e8f0`,
                background: colors.cardBackground,
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: "0.5rem",
            }}
          >
            <button onClick={handleAddOrUpdate} style={buttonStyle("primary")}>
              {isEditing ? "Update Asset" : "Add Asset"}
            </button>
            {isEditing && (
              <button
                onClick={() =>
                  setFormData({
                    id: null,
                    assetName: "",
                    assetType: "stock",
                    quantity: "",
                    purchasePrice: "",
                    symbol: "",
                  })
                }
                style={buttonStyle("danger")}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div
          style={{
            ...cardStyle,
            padding: "1rem",
            marginBottom: "2rem",
            border: `1px solid ${colors.danger}`,
            background: "#fee2e2",
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <div
            style={{
              display: "inline-block",
              animation: "spin 1s linear infinite",
              borderRadius: "50%",
              width: "2rem",
              height: "2rem",
              border: `4px solid ${colors.primary}`,
              borderTopColor: "transparent",
            }}
          ></div>
          <p
            style={{ marginTop: "0.5rem", color: colors.textSecondary }}
          >
            Loading portfolio data...
          </p>
        </div>
      ) : (
        <>
          {/* Charts Section */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "1.5rem",
              marginBottom: "2rem",
            }}
          >
            <div style={cardStyle}>
              <h3
                style={{
                  fontSize: "1.125rem",
                  fontWeight: 600,
                  marginBottom: "1rem",
                  color: colors.textPrimary,
                }}
              >
                Asset Allocation
              </h3>
              <div style={{ height: "300px" }}>
                <Pie
                  data={allocationChartData}
                  options={{
                    ...commonChartOptions,
                    plugins: {
                      ...commonChartOptions.plugins,
                      tooltip: {
                        ...commonChartOptions.plugins.tooltip,
                        callbacks: {
                          label: (context) => {
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce(
                              (a, b) => a + b,
                              0
                            );
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${context.label}: $${value.toFixed(
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
            <div style={cardStyle}>
              <h3
                style={{
                  fontSize: "1.125rem",
                  fontWeight: 600,
                  marginBottom: "1rem",
                  color: colors.textPrimary,
                }}
              >
                Portfolio Performance
              </h3>
              <div style={{ height: "300px" }}>
                <Bar
                  data={performanceChartData}
                  options={{
                    ...commonChartOptions,
                    scales: { y: { beginAtZero: true } },
                  }}
                />
              </div>
            </div>
            <div style={cardStyle}>
              <h3
                style={{
                  fontSize: "1.125rem",
                  fontWeight: 600,
                  marginBottom: "1rem",
                  color: colors.textPrimary,
                }}
              >
                Portfolio Trend
              </h3>
              <div style={{ height: "300px" }}>
                <Line
                  data={getTrendChartData()}
                  options={{
                    ...commonChartOptions,
                    scales: { y: { beginAtZero: false } },
                  }}
                />
              </div>
            </div>
          </div>

          {/* Asset Performance Selector */}
          <div style={{ ...cardStyle, marginBottom: "2rem" }}>
            <h3
              style={{
                fontSize: "1.125rem",
                fontWeight: 600,
                marginBottom: "1rem",
                color: colors.textPrimary,
              }}
            >
              Asset Price History
            </h3>
            <div
              style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}
            >
              <select
                value={selectedSymbol}
                onChange={(e) => {
                  setSelectedSymbol(e.target.value);
                  if (e.target.value)
                    fetchAssetPerformance(e.target.value, selectedType);
                }}
                style={{
                  padding: "0.75rem",
                  borderRadius: "0.75rem",
                  border: `1px solid #e2e8f0`,
                  background: colors.cardBackground,
                  flex: 1,
                }}
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
                style={{
                  padding: "0.75rem",
                  borderRadius: "0.75rem",
                  border: `1px solid #e2e8f0`,
                  background: colors.cardBackground,
                }}
              >
                <option value="stock">Stock</option>
                <option value="crypto">Crypto</option>
              </select>
            </div>
            {selectedSymbol &&
              assetPerformance[`${selectedSymbol}:${selectedType}`] && (
                <div style={cardStyle}>
                  <h3
                    style={{
                      fontSize: "1.125rem",
                      fontWeight: 600,
                      marginBottom: "1rem",
                      color: colors.textPrimary,
                    }}
                  >
                    Price History: {selectedSymbol}
                  </h3>
                  <div style={{ height: "300px" }}>
                    <Line
                      data={assetPerformanceChartData(
                        selectedSymbol,
                        selectedType
                      )}
                      options={{
                        ...commonChartOptions,
                        scales: { y: { beginAtZero: false } },
                      }}
                    />
                  </div>
                </div>
              )}
          </div>

          {/* Recent Actions */}
          <div style={{ ...cardStyle, marginBottom: "2rem" }}>
            <h3
              style={{
                fontSize: "1.125rem",
                fontWeight: 600,
                marginBottom: "1rem",
                color: colors.textPrimary,
              }}
            >
              Recent Actions
            </h3>
            {recentActions.length > 0 ? (
              <ul style={{ listStyle: "none", padding: 0 }}>
                {recentActions.map((action, index) => (
                  <li
                    key={index}
                    style={{
                      padding: "0.5rem 0",
                      borderBottom: "1px solid #e2e8f0",
                      color: colors.textSecondary,
                    }}
                  >
                    {action.action} {action.assetName} at{" "}
                    {new Date(action.timestamp).toLocaleString()}
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ color: colors.textSecondary }}>
                No recent actions.
              </p>
            )}
          </div>

          {/* Assets Table */}
          <div style={cardStyle}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
              }}
            >
              <h3
                style={{
                  fontSize: "1.125rem",
                  fontWeight: 600,
                  color: colors.textPrimary,
                }}
              >
                Asset Details
              </h3>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  onClick={handleExportPDF}
                  style={buttonStyle("primary")}
                >
                  📥 Export PDF
                </button>
                <button
                  onClick={() => setShowModal(true)}
                  style={buttonStyle("success")}
                >
                  ➕ Add Asset
                </button>
              </div>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ background: "#f1f5f9" }}>
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
                      style={{
                        padding: "1rem",
                        textAlign: "left",
                        fontWeight: 500,
                        color: colors.textSecondary,
                        fontSize: "0.875rem",
                        cursor: header.key ? "pointer" : "default",
                      }}
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
                        style={{
                          borderTop: "1px solid #f1f5f9",
                          transition: "background 0.2s",
                        }}
                        onClick={() => {
                          setSelectedAsset(asset);
                          setShowModal(true);
                        }}
                      >
                        <td style={{ padding: "1rem" }}>
                          <div style={{ fontWeight: 500 }}>
                            {asset.assetName || "Unknown"}
                          </div>
                          <div
                            style={{
                              fontSize: "0.875rem",
                              color: colors.textSecondary,
                            }}
                          >
                            {asset.symbol || "N/A"}
                          </div>
                        </td>
                        <td
                          style={{
                            padding: "1rem",
                            textTransform: "capitalize",
                          }}
                        >
                          {asset.assetType || "Unknown"}
                        </td>
                        <td style={{ padding: "1rem" }}>
                          {asset.quantity || 0}
                        </td>
                        <td style={{ padding: "1rem" }}>
                          ${(asset.purchasePrice || 0).toFixed(2)}
                        </td>
                        <td
                          style={{
                            padding: "1rem",
                            fontWeight: "medium",
                          }}
                        >
                          ${(asset.currentPrice || 0).toFixed(2)}
                        </td>
                        <td
                          style={{
                            padding: "1rem",
                            fontWeight: "600",
                          }}
                        >
                          ${current.toFixed(2)}
                        </td>
                        <td
                          style={{
                            padding: "1rem",
                            color: profit >= 0 ? colors.success : colors.danger,
                          }}
                        >
                          {profit >= 0 ? "+" : ""}${profit.toFixed(2)} (
                          {profitPercent.toFixed(2)}%)
                        </td>
                        <td style={{ padding: "1rem" }}>
                          <div
                            style={{
                              display: "flex",
                              gap: "0.5rem",
                              justifyContent: "flex-end",
                            }}
                          >
                            <button
                              style={{
                                padding: "0.5rem",
                                borderRadius: "0.375rem",
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(asset);
                              }}
                            >
                              ✏️
                            </button>
                            <button
                              style={{
                                padding: "0.5rem",
                                borderRadius: "0.375rem",
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(
                                  asset.id,
                                  asset.assetName || "Unknown"
                                );
                              }}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan="8"
                      style={{
                        padding: "1rem",
                        textAlign: "center",
                        color: colors.textSecondary,
                      }}
                    >
                      No assets found. Add some investments to get started!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Modal */}
          {showModal && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.4)",
                display: "grid",
                placeItems: "center",
                backdropFilter: "blur(4px)",
                zIndex: 50,
              }}
            >
              <div
                style={{
                  background: colors.cardBackground,
                  borderRadius: "1.5rem",
                  width: "90%",
                  maxWidth: "600px",
                  padding: "2rem",
                  position: "relative",
                  animation: "slideIn 0.3s ease-out",
                }}
              >
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
                      <h3
                        style={{
                          fontSize: "1.5rem",
                          fontWeight: "bold",
                          color: colors.textPrimary,
                        }}
                      >
                        {selectedAsset.assetName || "Unknown"} (
                        {selectedAsset.symbol || "N/A"})
                      </h3>
                      <button
                        onClick={() => setShowModal(false)}
                        style={{ color: colors.textSecondary }}
                      >
                        ✕
                      </button>
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "1.5rem",
                        marginBottom: "1.5rem",
                      }}
                    >
                      <div>
                        <h4
                          style={{
                            fontWeight: "600",
                            marginBottom: "0.5rem",
                            color: colors.textPrimary,
                          }}
                        >
                          Investment Details
                        </h4>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.5rem",
                          }}
                        >
                          <p>
                            <span style={{ color: colors.textSecondary }}>
                              Type:
                            </span>{" "}
                            {selectedAsset.assetType || "Unknown"}
                          </p>
                          <p>
                            <span style={{ color: colors.textSecondary }}>
                              Quantity:
                            </span>{" "}
                            {selectedAsset.quantity || 0}
                          </p>
                          <p>
                            <span style={{ color: colors.textSecondary }}>
                              Avg Purchase Price:
                            </span>{" "}
                            ${(selectedAsset.purchasePrice || 0).toFixed(2)}
                          </p>
                          <p>
                            <span style={{ color: colors.textSecondary }}>
                              Current Price:
                            </span>{" "}
                            ${(selectedAsset.currentPrice || 0).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div>
                        <h4
                          style={{
                            fontWeight: "600",
                            marginBottom: "0.5rem",
                            color: colors.textPrimary,
                          }}
                        >
                          Performance
                        </h4>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.5rem",
                          }}
                        >
                          <p>
                            <span style={{ color: colors.textSecondary }}>
                              Invested:
                            </span>{" "}
                            $
                            {(
                              (selectedAsset.purchasePrice || 0) *
                              (selectedAsset.quantity || 0)
                            ).toFixed(2)}
                          </p>
                          <p>
                            <span style={{ color: colors.textSecondary }}>
                              Current Value:
                            </span>{" "}
                            $
                            {(
                              (selectedAsset.currentPrice || 0) *
                              (selectedAsset.quantity || 0)
                            ).toFixed(2)}
                          </p>
                          <p>
                            <span style={{ color: colors.textSecondary }}>
                              Profit/Loss:
                            </span>
                            <span
                              style={{
                                color:
                                  (selectedAsset.currentPrice || 0) *
                                    (selectedAsset.quantity || 0) -
                                    (selectedAsset.purchasePrice || 0) *
                                    (selectedAsset.quantity || 0) >=
                                  0
                                    ? colors.success
                                    : colors.danger,
                              }}
                            >
                              $
                              {Math.abs(
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
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: "0.5rem",
                      }}
                    >
                      <button
                        onClick={() => {
                          handleEdit(selectedAsset);
                          setShowModal(false);
                        }}
                        style={buttonStyle("primary")}
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
                        style={buttonStyle("danger")}
                      >
                        Delete Asset
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <h3
                      style={{
                        fontSize: "1.5rem",
                        fontWeight: "bold",
                        marginBottom: "1rem",
                        color: colors.textPrimary,
                      }}
                    >
                      {isEditing ? "Edit Asset" : "Add New Asset"}
                    </h3>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "1rem",
                        marginBottom: "1rem",
                      }}
                    >
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "0.875rem",
                            fontWeight: "medium",
                            color: colors.textPrimary,
                            marginBottom: "0.25rem",
                          }}
                        >
                          Asset Name
                        </label>
                        <input
                          name="assetName"
                          value={formData.assetName}
                          onChange={handleInputChange}
                          placeholder="e.g., Apple Inc."
                          style={{
                            width: "100%",
                            padding: "0.75rem",
                            borderRadius: "0.75rem",
                            border: `1px solid #e2e8f0`,
                            background: colors.cardBackground,
                          }}
                        />
                      </div>
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "0.875rem",
                            fontWeight: "medium",
                            color: colors.textPrimary,
                            marginBottom: "0.25rem",
                          }}
                        >
                          Symbol
                        </label>
                        <input
                          name="symbol"
                          value={formData.symbol}
                          onChange={handleInputChange}
                          placeholder="e.g., AAPL"
                          style={{
                            width: "100%",
                            padding: "0.75rem",
                            borderRadius: "0.75rem",
                            border: `1px solid #e2e8f0`,
                            background: colors.cardBackground,
                          }}
                        />
                      </div>
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "0.875rem",
                            fontWeight: "medium",
                            color: colors.textPrimary,
                            marginBottom: "0.25rem",
                          }}
                        >
                          Asset Type
                        </label>
                        <select
                          name="assetType"
                          value={formData.assetType}
                          onChange={handleInputChange}
                          style={{
                            width: "100%",
                            padding: "0.75rem",
                            borderRadius: "0.75rem",
                            border: `1px solid #e2e8f0`,
                            background: colors.cardBackground,
                          }}
                        >
                          <option value="stock">Stock</option>
                          <option value="crypto">Crypto</option>
                        </select>
                      </div>
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "0.875rem",
                            fontWeight: "medium",
                            color: colors.textPrimary,
                            marginBottom: "0.25rem",
                          }}
                        >
                          Quantity
                        </label>
                        <input
                          name="quantity"
                          value={formData.quantity}
                          onChange={handleInputChange}
                          placeholder="e.g., 10"
                          type="number"
                          step="any"
                          style={{
                            width: "100%",
                            padding: "0.75rem",
                            borderRadius: "0.75rem",
                            border: `1px solid #e2e8f0`,
                            background: colors.cardBackground,
                          }}
                        />
                      </div>
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "0.875rem",
                            fontWeight: "medium",
                            color: colors.textPrimary,
                            marginBottom: "0.25rem",
                          }}
                        >
                          Purchase Price
                        </label>
                        <input
                          name="purchasePrice"
                          value={formData.purchasePrice}
                          onChange={handleInputChange}
                          placeholder="e.g., 150.50"
                          type="number"
                          step="any"
                          style={{
                            width: "100%",
                            padding: "0.75rem",
                            borderRadius: "0.75rem",
                            border: `1px solid #e2e8f0`,
                            background: colors.cardBackground,
                          }}
                        />
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: "0.5rem",
                      }}
                    >
                      <button
                        onClick={handleAddOrUpdate}
                        style={buttonStyle("primary")}
                      >
                        {isEditing ? "Update Asset" : "Add Asset"}
                      </button>
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
                        style={buttonStyle("danger")}
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* CSS Animations */}
          <style>
            {`
              @keyframes slideIn {
                from { transform: translateY(20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
              }
              div:hover[style*="transition: transform"] {
                transform: translateY(-2px);
                box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
              }
              button:hover[style*="transition: opacity"] {
                opacity: 0.9;
              }
              input:focus, select:focus {
                outline: none;
                border-color: ${colors.primary};
                box-shadow: 0 0 0 3px ${colors.primary}20;
              }
              tr:hover {
                background: #f8fafc;
              }
              button[style*="padding: 0.5rem;"]:hover:nth-child(1) {
                background: #e0e7ff;
              }
              button[style*="padding: 0.5rem;"]:hover:nth-child(2) {
                background: #fee2e2;
              }
            `}
          </style>
        </>
      )}
    </div>
  );
};

export default Portfolio;