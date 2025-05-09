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
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const isEditing = formData.id !== null;
  const cookies = new Cookies();
  const navigate = useNavigate();
  const API_URL = "http://localhost:8090";

  const getAuthToken = () => cookies.get("token");

  const fetchPortfolio = async () => {
    const token = getAuthToken();
    if (!token) {
      alert("You are not authenticated");
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/getAssets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPortfolio(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching portfolio", err);
      setError("Failed to fetch portfolio. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  // Filter and sort logic
  const filteredAssets = portfolio.filter(asset => {
    const matchesSearch = asset.assetName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         asset.symbol.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || asset.assetType === filterType;
    return matchesSearch && matchesType;
  });

  const sortedAssets = [...filteredAssets].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Portfolio summary calculations
  const totalValue = portfolio.reduce(
    (sum, asset) => sum + (asset.currentPrice || 0) * (asset.quantity || 0),
    0
  );

  const totalCost = portfolio.reduce(
    (sum, asset) => sum + (asset.purchasePrice || 0) * (asset.quantity || 0),
    0
  );

  const totalProfit = totalValue - totalCost;
  const profitPercentage = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

  // Chart data
  const lineChartData = {
    labels: portfolio.map((asset) => asset.assetName),
    datasets: [
      {
        label: `Value (${currency})`,
        data: portfolio.map(
          (asset) => (asset.currentPrice || 0) * (asset.quantity || 0)
        ),
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderColor: "#4BC0C0",
        borderWidth: 2,
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const pieChartData = {
    labels: portfolio.map(asset => asset.assetName),
    datasets: [{
      data: portfolio.map(asset => (asset.currentPrice || 0) * (asset.quantity || 0)),
      backgroundColor: portfolio.map(() => `#${Math.floor(Math.random()*16777215).toString(16)}`),
    }]
  };

  const performanceChartData = {
    labels: portfolio.map(asset => asset.assetName),
    datasets: [{
      label: 'Performance (%)',
      data: portfolio.map(asset => {
        const invested = asset.purchasePrice * asset.quantity;
        const current = asset.currentPrice * asset.quantity;
        return invested > 0 ? ((current - invested) / invested) * 100 : 0;
      }),
      backgroundColor: portfolio.map(asset => {
        const invested = asset.purchasePrice * asset.quantity;
        const current = asset.currentPrice * asset.quantity;
        return current >= invested ? 'rgba(75, 192, 192, 0.6)' : 'rgba(255, 99, 132, 0.6)';
      }),
    }]
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

      setFormData({
        id: null,
        assetName: "",
        assetType: "stock",
        quantity: "",
        purchasePrice: "",
        symbol: "",
      });
      fetchPortfolio();
    } catch (err) {
      console.error("Error saving asset", err);
      setError("Failed to save asset. Please check inputs.");
    }
  };

  const handleEdit = (asset) => {
    setFormData({ 
      id: asset.id,
      assetName: asset.assetName,
      assetType: asset.assetType,
      quantity: asset.quantity,
      purchasePrice: asset.purchasePrice,
      symbol: asset.symbol
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
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
      fetchPortfolio();
    } catch (err) {
      console.error("Error deleting asset", err);
      setError("Failed to delete asset.");
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("My Portfolio Report", 20, 10);
    doc.text(`Total Value: $${totalValue.toFixed(2)}`, 20, 20);
    doc.text(`Total Investment: $${totalCost.toFixed(2)}`, 20, 30);
    doc.text(`Profit/Loss: $${totalProfit.toFixed(2)} (${profitPercentage.toFixed(2)}%)`, 
             20, 40, { color: totalProfit >= 0 ? 'green' : 'red' });
    
    portfolio.forEach((asset, i) => {
      const yPos = 50 + i * 10;
      const assetValue = (asset.currentPrice || 0) * (asset.quantity || 0);
      const assetCost = (asset.purchasePrice || 0) * (asset.quantity || 0);
      const assetProfit = assetValue - assetCost;
      
      doc.text(
        `${asset.assetName} (${asset.symbol}): ${asset.quantity} @ $${asset.purchasePrice?.toFixed(2)} → $${asset.currentPrice?.toFixed(2)}`,
        10,
        yPos
      );
      doc.text(
        `Value: $${assetValue.toFixed(2)} (${assetProfit >= 0 ? '+' : ''}${((assetProfit/assetCost)*100 || 0).toFixed(2)}%)`,
        10,
        yPos + 5,
        { color: assetProfit >= 0 ? 'green' : 'red' }
      );
    });
    doc.save("portfolio_report.pdf");
  };

  const handleCSVUpload = (event) => {
    const file = event.target.files[0];
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        results.data.forEach((row) => {
          const payload = {
            ...row,
            quantity: parseFloat(row.quantity),
            purchasePrice: parseFloat(row.purchasePrice),
          };
          axios
            .post(`${API_URL}/addAsset`, payload, {
              headers: { Authorization: `Bearer ${getAuthToken()}` },
            })
            .then(fetchPortfolio);
        });
      },
    });
  };

  const toggleCurrency = () => {
    setCurrency(currency === "USD" ? "INR" : "USD");
  };

  const refreshPrices = () => {
    fetchPortfolio();
  };

  const alertAssets = portfolio.filter(
    (asset) => asset.currentPrice < 0.8 * asset.purchasePrice
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-blue-800">My Investment Portfolio</h2>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border border-blue-100">
          <h3 className="text-gray-500 text-sm font-medium">Total Value</h3>
          <p className="text-2xl font-bold">${totalValue.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-blue-100">
          <h3 className="text-gray-500 text-sm font-medium">Total Invested</h3>
          <p className="text-2xl font-bold">${totalCost.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-blue-100">
          <h3 className="text-gray-500 text-sm font-medium">Profit/Loss</h3>
          <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${Math.abs(totalProfit).toFixed(2)} ({profitPercentage.toFixed(2)}%)
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-blue-100">
          <h3 className="text-gray-500 text-sm font-medium">Assets</h3>
          <p className="text-2xl font-bold">{portfolio.length}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap justify-between gap-4 mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search assets..."
            className="p-2 border rounded"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="p-2 border rounded"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="stock">Stocks</option>
            <option value="crypto">Crypto</option>
          </select>
          <button
            onClick={refreshPrices}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            title="Refresh prices"
          >
            🔄
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={toggleCurrency}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Toggle Currency ({currency})
          </button>
          <input
            type="file"
            accept=".csv"
            onChange={handleCSVUpload}
            className="hidden"
            id="csvUpload"
          />
          <label
            htmlFor="csvUpload"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer"
          >
            Import CSV
          </label>
          <button
            onClick={handleExportPDF}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Export PDF
          </button>
        </div>
      </div>

      {/* Alerts */}
      {alertAssets.length > 0 && (
        <div className="p-3 mb-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
          <h3 className="font-bold mb-2">⚠️ Price Alerts</h3>
          {alertAssets.map(asset => (
            <p key={asset.id}>
              {asset.assetName} has dropped {(100 - (asset.currentPrice / asset.purchasePrice * 100)).toFixed(2)}% from purchase price
            </p>
          ))}
        </div>
      )}

      {/* Add/Edit Form */}
      <div className="mb-6 p-4 border rounded bg-gray-50 shadow">
        <h3 className="text-xl font-semibold mb-2">
          {isEditing ? "Edit Asset" : "Add New Asset"}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Asset Name</label>
            <input
              name="assetName"
              value={formData.assetName}
              onChange={handleInputChange}
              placeholder="e.g., Apple Inc."
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Symbol</label>
            <input
              name="symbol"
              value={formData.symbol}
              onChange={handleInputChange}
              placeholder="e.g., AAPL"
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Asset Type</label>
            <select
              name="assetType"
              value={formData.assetType}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            >
              <option value="stock">Stock</option>
              <option value="crypto">Crypto</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
            <input
              name="quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              placeholder="e.g., 10"
              type="number"
              step="any"
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price</label>
            <input
              name="purchasePrice"
              value={formData.purchasePrice}
              onChange={handleInputChange}
              placeholder="e.g., 150.50"
              type="number"
              step="any"
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleAddOrUpdate}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {isEditing ? "Update Asset" : "Add Asset"}
            </button>
            {isEditing && (
              <button
                onClick={() => setFormData({
                  id: null,
                  assetName: "",
                  assetType: "stock",
                  quantity: "",
                  purchasePrice: "",
                  symbol: "",
                })}
                className="ml-2 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 mb-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-2">Loading portfolio data...</p>
        </div>
      ) : (
        <>
          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">Portfolio Allocation</h3>
              <div className="h-64">
                <Pie
                  data={pieChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'right',
                      },
                    },
                  }}
                />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">Asset Performance</h3>
              <div className="h-64">
                <Bar
                  data={performanceChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>

          {/* Assets Table */}
          <div className="mb-6 overflow-x-auto bg-white rounded-lg shadow">
            <table className="w-full">
              <thead className="bg-blue-50">
                <tr>
                  <th 
                    className="p-3 text-left cursor-pointer hover:bg-blue-100"
                    onClick={() => requestSort('assetName')}
                  >
                    Asset Name {sortConfig.key === 'assetName' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="p-3 text-left cursor-pointer hover:bg-blue-100"
                    onClick={() => requestSort('assetType')}
                  >
                    Type {sortConfig.key === 'assetType' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="p-3 text-left cursor-pointer hover:bg-blue-100"
                    onClick={() => requestSort('quantity')}
                  >
                    Qty {sortConfig.key === 'quantity' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="p-3 text-left">Avg Cost</th>
                  <th className="p-3 text-left">Current Price</th>
                  <th className="p-3 text-left">Value</th>
                  <th className="p-3 text-left">P/L</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedAssets.length > 0 ? (
                  sortedAssets.map((asset) => {
                    const invested = asset.purchasePrice * asset.quantity;
                    const current = asset.currentPrice * asset.quantity;
                    const profit = current - invested;
                    const profitPercent = invested > 0 ? (profit / invested) * 100 : 0;

                    return (
                      <tr
                        key={asset.id}
                        className="border-t hover:bg-blue-50 cursor-pointer"
                        onClick={() => {
                          setSelectedAsset(asset);
                          setShowModal(true);
                        }}
                      >
                        <td className="p-3">
                          <div className="font-medium">{asset.assetName}</div>
                          <div className="text-sm text-gray-500">{asset.symbol}</div>
                        </td>
                        <td className="p-3 capitalize">{asset.assetType}</td>
                        <td className="p-3">{asset.quantity}</td>
                        <td className="p-3">${asset.purchasePrice?.toFixed(2)}</td>
                        <td className="p-3 font-medium">
                          ${asset.currentPrice?.toFixed(2)}
                        </td>
                        <td className="p-3 font-semibold">
                          ${current.toFixed(2)}
                        </td>
                        <td className={`p-3 ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {profit >= 0 ? '+' : ''}{profit.toFixed(2)} ({profitPercent.toFixed(2)}%)
                        </td>
                        <td className="p-3 space-x-2">
                          <button
                            className="text-blue-600 hover:underline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(asset);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="text-red-600 hover:underline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(asset.id);
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" className="p-4 text-center text-gray-500">
                      No assets found. Add some investments to get started!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Asset Detail Modal */}
          {showModal && selectedAsset && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-2xl font-bold">
                      {selectedAsset.assetName} ({selectedAsset.symbol})
                    </h3>
                    <button
                      onClick={() => setShowModal(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h4 className="font-semibold mb-2">Investment Details</h4>
                      <div className="space-y-2">
                        <p><span className="text-gray-600">Type:</span> {selectedAsset.assetType}</p>
                        <p><span className="text-gray-600">Quantity:</span> {selectedAsset.quantity}</p>
                        <p><span className="text-gray-600">Avg Purchase Price:</span> ${selectedAsset.purchasePrice?.toFixed(2)}</p>
                        <p><span className="text-gray-600">Current Price:</span> ${selectedAsset.currentPrice?.toFixed(2)}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Performance</h4>
                      <div className="space-y-2">
                        <p>
                          <span className="text-gray-600">Invested:</span> $
                          {(selectedAsset.purchasePrice * selectedAsset.quantity).toFixed(2)}
                        </p>
                        <p>
                          <span className="text-gray-600">Current Value:</span> $
                          {(selectedAsset.currentPrice * selectedAsset.quantity).toFixed(2)}
                        </p>
                        <p>
                          <span className="text-gray-600">Profit/Loss:</span>
                          <span className={(selectedAsset.currentPrice * selectedAsset.quantity - selectedAsset.purchasePrice * selectedAsset.quantity) >= 0 ? 'text-green-600' : 'text-red-600'}>
                            ${Math.abs((selectedAsset.currentPrice * selectedAsset.quantity - selectedAsset.purchasePrice * selectedAsset.quantity)).toFixed(2)} (
                            {selectedAsset.purchasePrice > 0 ? 
                              (((selectedAsset.currentPrice - selectedAsset.purchasePrice) / selectedAsset.purchasePrice) * 100).toFixed(2) : 
                              '0.00'}%)
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => {
                        handleEdit(selectedAsset);
                        setShowModal(false);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Edit Asset
                    </button>
                    <button
                      onClick={() => {
                        handleDelete(selectedAsset.id);
                        setShowModal(false);
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Delete Asset
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Portfolio;