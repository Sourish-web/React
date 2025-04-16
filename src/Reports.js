import React, { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "universal-cookie";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { CSVLink } from "react-csv";
import html2canvas from "html2canvas";
import { Pie, Line } from "react-chartjs-2";
import {
  Chart,
  ArcElement,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
} from "chart.js";

Chart.register(ArcElement, LineElement, CategoryScale, LinearScale, PointElement);

const Reports = () => {
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [downloadHistory, setDownloadHistory] = useState([]);
  const cookies = new Cookies();
  const navigate = useNavigate();
  const API_URL = "http://localhost:8090";

  const getAuthToken = () => cookies.get("token");

  const fetchTransactions = async () => {
    const token = getAuthToken();
    if (!token) {
      alert("You are not authenticated");
      navigate("/login");
      return;
    }

    try {
      const res = await axios.get(`${API_URL}/transaction/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTransactions(res.data);
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
    }
  };

  useEffect(() => {
    fetchTransactions();
    const savedDark = localStorage.getItem("darkMode");
    const savedFilter = localStorage.getItem("reportFilter");
    const savedHistory = localStorage.getItem("downloadHistory");

    if (savedDark) setDarkMode(JSON.parse(savedDark));
    if (savedFilter) setFilter(savedFilter);
    if (savedHistory) setDownloadHistory(JSON.parse(savedHistory));
  }, []);

  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
    localStorage.setItem("reportFilter", filter);
    localStorage.setItem("downloadHistory", JSON.stringify(downloadHistory));
  }, [darkMode, filter, downloadHistory]);

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text("Transaction Report", 20, 10);
    autoTable(doc, {
      head: [["Date", "Description", "Amount", "Category"]],
      body: filteredTransactions.map((t) => [
        new Date(t.transactionDate).toLocaleDateString(),
        t.description,
        t.amount,
        t.category,
      ]),
    });
    const filename = "transaction-report.pdf";
    doc.save(filename);
    setDownloadHistory((prev) => [...prev, { type: "PDF", file: filename, time: new Date() }]);
  };

  const downloadChartImage = async (id, name) => {
    const canvas = document.getElementById(id);
    const image = await html2canvas(canvas);
    const link = document.createElement("a");
    link.download = `${name}.png`;
    link.href = image.toDataURL();
    link.click();
  };

  const calculateTax = () => {
    const income = transactions
      .filter((t) => t.category.toLowerCase() === "income")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    return { income, tax: income * 0.1 };
  };

  const { income, tax } = calculateTax();

  const filteredTransactions = transactions.filter((t) =>
    t.description.toLowerCase().includes(filter.toLowerCase()) ||
    t.category.toLowerCase().includes(filter.toLowerCase())
  );

  const categoryData = () => {
    const categories = {};
    filteredTransactions.forEach((t) => {
      categories[t.category] = (categories[t.category] || 0) + parseFloat(t.amount);
    });
    return {
      labels: Object.keys(categories),
      datasets: [
        {
          data: Object.values(categories),
          backgroundColor: ["#f87171", "#60a5fa", "#34d399", "#fbbf24", "#a78bfa"],
        },
      ],
    };
  };

  const monthlyData = () => {
    const months = Array(12).fill(0);
    filteredTransactions.forEach((t) => {
      const month = new Date(t.transactionDate).getMonth();
      months[month] += parseFloat(t.amount);
    });
    return {
      labels: [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
      ],
      datasets: [
        {
          label: "Monthly Spending",
          data: months,
          borderColor: "#3b82f6",
          fill: false,
        },
      ],
    };
  };

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const printReport = () => window.print();

  return (
    <div className={`p-4 ${darkMode ? "bg-gray-900 text-white" : "bg-white text-black"}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Reports</h2>
        <button
          onClick={toggleDarkMode}
          className="bg-gray-800 text-white px-4 py-2 rounded"
        >
          Toggle {darkMode ? "Light" : "Dark"} Mode
        </button>
      </div>

      <div className="flex gap-4 mb-4 flex-wrap">
        <input
          type="text"
          placeholder="Search by description or category"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border p-2 rounded flex-grow"
        />

        <button onClick={generatePDF} className="bg-red-600 text-white px-4 py-2 rounded">
          Download PDF
        </button>

        <CSVLink
          data={filteredTransactions}
          filename={"transaction-report.csv"}
          onClick={() =>
            setDownloadHistory((prev) => [
              ...prev,
              { type: "CSV", file: "transaction-report.csv", time: new Date() },
            ])
          }
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Download CSV
        </CSVLink>

        <button
          onClick={printReport}
          className="bg-indigo-600 text-white px-4 py-2 rounded"
        >
          Print View
        </button>
      </div>

      <div className="mb-4">
        <h3 className="text-xl font-semibold">Tax Forecast</h3>
        <p>Estimated Income: ₹{income.toFixed(2)}</p>
        <p>Estimated Tax (10%): ₹{tax.toFixed(2)}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Category Breakdown</h3>
          <div style={{ width: "300px", height: "300px" }} id="category-chart">
            <Pie data={categoryData()} />
          </div>
          <button
            onClick={() => downloadChartImage("category-chart", "category-breakdown")}
            className="mt-2 text-sm text-blue-500"
          >
            Download Chart
          </button>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Monthly Breakdown</h3>
          <div id="monthly-chart">
            <Line data={monthlyData()} />
          </div>
          <button
            onClick={() => downloadChartImage("monthly-chart", "monthly-breakdown")}
            className="mt-2 text-sm text-blue-500"
          >
            Download Chart
          </button>
        </div>
      </div>

      <h3 className="text-xl font-semibold mb-2">All Transactions</h3>
      <table className="table-auto w-full border text-sm">
        <thead>
          <tr className="bg-gray-100 dark:bg-gray-800">
            <th className="border px-4 py-2">Date</th>
            <th className="border px-4 py-2">Description</th>
            <th className="border px-4 py-2">Amount</th>
            <th className="border px-4 py-2">Category</th>
          </tr>
        </thead>
        <tbody>
          {filteredTransactions.map((t, index) => (
            <tr key={index}>
              <td className="border px-4 py-2">
                {new Date(t.transactionDate).toLocaleDateString()}
              </td>
              <td className="border px-4 py-2">{t.description}</td>
              <td className="border px-4 py-2">₹{t.amount}</td>
              <td className="border px-4 py-2">{t.category}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-6">
        <h3 className="text-lg font-semibold">Download History</h3>
        <ul className="list-disc ml-5 text-sm">
          {downloadHistory.map((entry, idx) => (
            <li key={idx}>
              {entry.type} - {entry.file} - {new Date(entry.time).toLocaleString()}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Reports;
