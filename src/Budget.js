import React, { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "universal-cookie";
import { useNavigate } from "react-router-dom";
import { Pie, Line } from "react-chartjs-2";
import * as XLSX from "xlsx";
import { Chart, registerables } from "chart.js";
Chart.register(...registerables);

const Budget = () => {
  const [budgets, setBudgets] = useState([]);
  const [form, setForm] = useState({
    id: null,
    amount: "",
    period: "",
    spent: "",
    startDate: "",
    endDate: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [deleted, setDeleted] = useState(null);
  const [filter, setFilter] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  const cookies = new Cookies();
  const navigate = useNavigate();
  const API_URL = "http://localhost:8090";
  const getAuthToken = () => cookies.get("token");

  const fetchBudgets = async () => {
    const token = getAuthToken();
    if (!token) return navigate("/login");
    try {
      const res = await axios.get(`${API_URL}/getBudget`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBudgets(res.data);
    } catch (err) {
      console.error("Failed to fetch budgets:", err);
      alert("Failed to fetch budgets.");
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = getAuthToken();
    const headers = { Authorization: `Bearer ${token}` };
    const endpoint = isEditing ? "/updateBudget" : "/addBudget";
    try {
      await axios.post(`${API_URL}${endpoint}`, form, { headers });
      setForm({ id: null, amount: "", period: "", spent: "", startDate: "", endDate: "" });
      setIsEditing(false);
      fetchBudgets();
    } catch (err) {
      console.error("Error submitting budget:", err);
      alert("Error submitting budget.");
    }
  };

  const handleEdit = (budget) => {
    setForm(budget);
    setIsEditing(true);
  };

  const handleDelete = async (id) => {
    const token = getAuthToken();
    try {
      const budgetToDelete = budgets.find((b) => b.id === id);
      setDeleted(budgetToDelete);
      setBudgets(budgets.filter((b) => b.id !== id));
      setTimeout(() => setDeleted(null), 5000);
      await axios.get(`${API_URL}/Budget/delete/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const undoDelete = () => {
    if (deleted) {
      setForm(deleted);
      setIsEditing(true);
      setDeleted(null);
    }
  };

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(budgets);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Budgets");
    XLSX.writeFile(workbook, "Budgets.xlsx");
  };

  const filteredBudgets = budgets.filter((b) =>
    b.period.toLowerCase().includes(filter.toLowerCase())
  );

  const pieData = {
    labels: filteredBudgets.map((b) => b.period),
    datasets: [
      {
        data: filteredBudgets.map((b) => b.amount),
        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#8e44ad", "#2ecc71"],
      },
    ],
  };

  const lineData = {
    labels: filteredBudgets.map((b) => b.startDate),
    datasets: [
      {
        label: "Spent",
        data: filteredBudgets.map((b) => b.spent),
        borderColor: "rgba(75,192,192,1)",
        fill: false,
      },
    ],
  };

  return (
    <div className={`${darkMode ? "dark" : ""}`}>
      <div className="min-h-screen bg-white text-black dark:bg-gray-900 dark:text-white p-4">
        <div className="flex justify-between mb-4">
          <h2 className="text-2xl font-bold">{isEditing ? "Edit" : "Add"} Budget</h2>
          <button
            className="bg-gray-600 text-white px-3 py-1 rounded"
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-3 mb-6">
          {["amount", "spent"].map((field) => (
            <input
              key={field}
              type="number"
              name={field}
              value={form[field]}
              onChange={handleChange}
              placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
              required
              className="p-2 border rounded"
            />
          ))}
          <input
            type="text"
            name="period"
            value={form.period}
            onChange={handleChange}
            placeholder="Period (e.g., monthly)"
            required
            className="p-2 border rounded"
          />
          <input type="date" name="startDate" value={form.startDate} onChange={handleChange} className="p-2 border rounded" />
          <input type="date" name="endDate" value={form.endDate} onChange={handleChange} className="p-2 border rounded" />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
            {isEditing ? "Update" : "Add"} Budget
          </button>
        </form>

        <input
          type="text"
          placeholder="Filter by period..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="mb-4 p-2 border rounded w-full"
        />

        <button className="bg-green-600 text-white px-4 py-2 mb-4 rounded" onClick={exportExcel}>
          Export to Excel
        </button>

        {deleted && (
          <div className="bg-yellow-300 text-black p-2 mb-4">
            Deleted budget. <button className="text-blue-700 underline" onClick={undoDelete}>Undo</button>
          </div>
        )}

        <table className="w-full border border-gray-300 mb-6">
          <thead className="bg-gray-200 dark:bg-gray-700">
            <tr>
              <th>Amount</th>
              <th>Spent</th>
              <th>Period</th>
              <th>Utilization</th>
              <th>Days Left</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBudgets.map((b) => {
              const daysLeft = Math.ceil((new Date(b.endDate) - new Date()) / (1000 * 60 * 60 * 24));
              const utilization = ((b.spent / b.amount) * 100).toFixed(1);
              const overspent = b.spent > b.amount;
              return (
                <tr key={b.id} className={`${overspent ? "bg-red-100 dark:bg-red-400" : ""}`}>
                  <td>{b.amount}</td>
                  <td>{b.spent}</td>
                  <td>{b.period}</td>
                  <td>{utilization}%</td>
                  <td>{daysLeft >= 0 ? daysLeft : "Ended"}</td>
                  <td>
                    <button onClick={() => handleEdit(b)} className="bg-yellow-400 px-2 py-1 rounded mr-2">Edit</button>
                    <button onClick={() => handleDelete(b.id)} className="bg-red-500 text-white px-2 py-1 rounded">Delete</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <h3 className="text-lg font-bold mb-2">Pie Chart - Budget Distribution</h3>
        <div className="mb-8 mx-auto" style={{ width: "300px", height: "300px" }}>
          <Pie data={pieData} />
        </div>

        <h3 className="text-lg font-bold mb-2">Line Chart - Spent Over Time</h3>
        <div className="mb-10">
          <Line data={lineData} />
        </div>
      </div>
    </div>
  );
};

export default Budget;
