// Full updated Portfolio.js with new frontend-only features

import React, { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "universal-cookie";
import { useNavigate } from "react-router-dom";
import { Line } from "react-chartjs-2";
import { jsPDF } from "jspdf";
import Papa from "papaparse";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  LineElement,
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
    assetType: "",
    quantity: "",
    purchasePrice: "",
    currentPrice: "",
  });

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
        currentPrice: parseFloat(formData.currentPrice),
      };

      await axios.post(`${API_URL}${endpoint}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setFormData({
        id: null,
        assetName: "",
        assetType: "",
        quantity: "",
        purchasePrice: "",
        currentPrice: "",
      });
      fetchPortfolio();
    } catch (err) {
      console.error("Error saving asset", err);
      setError("Failed to save asset. Please check inputs.");
    }
  };

  const handleEdit = (asset) => {
    setFormData({ ...asset });
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

  const totalValue = portfolio.reduce(
    (sum, asset) => sum + (asset.currentPrice || 0) * (asset.quantity || 0),
    0
  );

  const totalCost = portfolio.reduce(
    (sum, asset) => sum + (asset.purchasePrice || 0) * (asset.quantity || 0),
    0
  );

  const totalProfit = totalValue - totalCost;

  const chartData = {
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

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("My Portfolio Report", 20, 10);
    portfolio.forEach((asset, i) => {
      doc.text(
        `${asset.assetName} (${asset.assetType}) - Qty: ${asset.quantity}, Current: $${asset.currentPrice}`,
        10,
        20 + i * 10
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
            currentPrice: parseFloat(row.currentPrice),
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

  const alertAsset = portfolio.find(
    (asset) => asset.currentPrice < 0.8 * asset.purchasePrice
  );

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">My Investment Portfolio</h2>

      <div className="flex justify-between mb-4">
        <button onClick={handleExportPDF} className="bg-red-500 text-white px-4 py-2 rounded">
          Export PDF
        </button>
        <input type="file" accept=".csv" onChange={handleCSVUpload} className="border p-1" />
        <button onClick={toggleCurrency} className="bg-green-600 text-white px-4 py-2 rounded">
          Toggle Currency ({currency})
        </button>
      </div>

      {alertAsset && (
        <div className="p-3 mb-4 bg-yellow-100 border border-yellow-400 text-yellow-700">
          ⚠️ Alert: {alertAsset.assetName} has dropped significantly!
        </div>
      )}

      {/* Form */}
      <div className="mb-6 p-4 border rounded bg-gray-50 shadow">
        <h3 className="text-xl font-semibold mb-2">{isEditing ? "Edit Asset" : "Add New Asset"}</h3>
        <div className="grid grid-cols-2 gap-4">
          <input name="assetName" value={formData.assetName} onChange={handleInputChange} placeholder="Asset Name" className="p-2 border rounded" />
          <input name="assetType" value={formData.assetType} onChange={handleInputChange} placeholder="Asset Type" className="p-2 border rounded" />
          <input name="quantity" value={formData.quantity} onChange={handleInputChange} placeholder="Quantity" type="number" className="p-2 border rounded" />
          <input name="purchasePrice" value={formData.purchasePrice} onChange={handleInputChange} placeholder="Purchase Price" type="number" className="p-2 border rounded" />
          <input name="currentPrice" value={formData.currentPrice} onChange={handleInputChange} placeholder="Current Price" type="number" className="p-2 border rounded" />
        </div>
        <button onClick={handleAddOrUpdate} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          {isEditing ? "Update Asset" : "Add Asset"}
        </button>
      </div>

      {error && <p className="text-red-600 font-medium mb-4">{error}</p>}

      {loading ? (
        <p>Loading portfolio...</p>
      ) : (
        <>
          {/* Table */}
          <div className="mb-6 overflow-x-auto">
            <table className="w-full table-auto border shadow-md rounded">
              <thead className="bg-blue-100 text-left">
                <tr>
                  <th className="p-2">Asset Name</th>
                  <th className="p-2">Type</th>
                  <th className="p-2">Quantity</th>
                  <th className="p-2">Purchase Price</th>
                  <th className="p-2">Current Price</th>
                  <th className="p-2">Total Value</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.map((asset) => (
                  <tr key={asset.id} className="border-b hover:bg-blue-50">
                    <td className="p-2">{asset.assetName}</td>
                    <td className="p-2 capitalize">{asset.assetType}</td>
                    <td className="p-2">{asset.quantity}</td>
                    <td className="p-2">${asset.purchasePrice?.toFixed(2)}</td>
                    <td className="p-2 text-green-700">${asset.currentPrice?.toFixed(2)}</td>
                    <td className="p-2 font-semibold">
                      ${((asset.currentPrice || 0) * (asset.quantity || 0)).toFixed(2)}
                    </td>
                    <td className="p-2 space-x-2">
                      <button className="text-blue-600 hover:underline" onClick={() => handleEdit(asset)}>Edit</button>
                      <button className="text-red-600 hover:underline" onClick={() => handleDelete(asset.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Stats */}
          <div className="mb-4">
            <p><strong>Total Cost:</strong> ${totalCost.toFixed(2)}</p>
            <p><strong>Current Value:</strong> ${totalValue.toFixed(2)}</p>
            <p className={totalProfit >= 0 ? "text-green-600" : "text-red-600"}>
              <strong>{totalProfit >= 0 ? "Profit" : "Loss"}:</strong> ${Math.abs(totalProfit).toFixed(2)}
            </p>
          </div>

          {/* Chart */}
          <div>
            <Line data={chartData} options={{ responsive: true, plugins: { legend: { position: "top" }, title: { display: true, text: "Portfolio Value by Asset" } } }} />
          </div>
        </>
      )}
    </div>
  );
};

export default Portfolio;
