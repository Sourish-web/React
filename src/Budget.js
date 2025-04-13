import React, { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "universal-cookie";
import { useNavigate } from "react-router-dom";

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

  const cookies = new Cookies();
  const navigate = useNavigate();
  const API_URL = "http://localhost:8090";

  const getAuthToken = () => cookies.get("token");

  const fetchBudgets = async () => {
    const token = getAuthToken();
    if (!token) {
      alert("You are not authenticated");
      navigate("/login");
      return;
    }

    try {
      const res = await axios.get(`${API_URL}/getBudget`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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

    if (!token) {
      alert("You are not authenticated");
      navigate("/login");
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const endpoint = isEditing ? "/updateBudget" : "/addBudget";
      await axios.post(`${API_URL}${endpoint}`, form, { headers });

      setForm({
        id: null,
        amount: "",
        period: "",
        spent: "",
        startDate: "",
        endDate: "",
      });
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
    if (!token) {
      alert("You are not authenticated");
      navigate("/login");
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.get(`${API_URL}/Budget/delete/${id}`, { headers });
      fetchBudgets();
    } catch (err) {
      console.error("Error deleting budget:", err);
      alert("Error deleting budget.");
    }
  };

  return (
    <div className="container p-4">
      <h2 className="text-2xl font-bold mb-4">{isEditing ? "Edit" : "Add"} Budget</h2>

      <form onSubmit={handleSubmit} className="grid gap-4 mb-6">
        <input
          type="number"
          name="amount"
          value={form.amount}
          onChange={handleChange}
          placeholder="Amount"
          required
          className="p-2 border rounded"
        />
        <input
          type="text"
          name="period"
          value={form.period}
          onChange={handleChange}
          placeholder="Period (e.g., monthly, weekly)"
          required
          className="p-2 border rounded"
        />
        <input
          type="number"
          name="spent"
          value={form.spent}
          onChange={handleChange}
          placeholder="Spent"
          className="p-2 border rounded"
        />
        <input
          type="date"
          name="startDate"
          value={form.startDate}
          onChange={handleChange}
          required
          className="p-2 border rounded"
        />
        <input
          type="date"
          name="endDate"
          value={form.endDate}
          onChange={handleChange}
          required
          className="p-2 border rounded"
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          {isEditing ? "Update" : "Add"} Budget
        </button>
      </form>

      <h2 className="text-xl font-semibold mb-2">Budgets List</h2>
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Amount</th>
            <th className="border p-2">Period</th>
            <th className="border p-2">Spent</th>
            <th className="border p-2">Start Date</th>
            <th className="border p-2">End Date</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {budgets.map((budget) => (
            <tr key={budget.id} className="text-center">
              <td className="border p-2">{budget.amount}</td>
              <td className="border p-2">{budget.period}</td>
              <td className="border p-2">{budget.spent}</td>
              <td className="border p-2">{budget.startDate}</td>
              <td className="border p-2">{budget.endDate}</td>
              <td className="border p-2 space-x-2">
                <button
                  onClick={() => handleEdit(budget)}
                  className="bg-yellow-400 px-3 py-1 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(budget.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {budgets.length === 0 && (
            <tr>
              <td colSpan="6" className="text-center p-4">
                No budgets found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Budget;
