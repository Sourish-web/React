import React, { useEffect, useState } from "react";
import axios from "axios";

function Budget() {
  const [budgets, setBudgets] = useState([]);
  const [formData, setFormData] = useState({
    amount: "",
    period: "monthly",
    spent: 0,
    startDate: "",
    endDate: "",
  });
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);

  const API_BASE = "http://localhost:8090";

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    const response = await axios.get(`${API_BASE}/getBudget`);
    setBudgets(response.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (editMode) {
      await axios.post(`${API_BASE}/updateBudget`, {
        ...formData,
        id: editId,
      });
    } else {
      await axios.post(`${API_BASE}/addBudget`, formData);
    }

    setFormData({
      amount: "",
      period: "monthly",
      spent: 0,
      startDate: "",
      endDate: "",
    });
    setEditMode(false);
    setEditId(null);
    fetchBudgets();
  };

  const handleDelete = async (id) => {
    await axios.get(`${API_BASE}/Budget/delete/${id}`);
    fetchBudgets();
  };

  const handleEdit = (budget) => {
    setFormData({
      amount: budget.amount,
      period: budget.period,
      spent: budget.spent,
      startDate: budget.startDate,
      endDate: budget.endDate,
    });
    setEditMode(true);
    setEditId(budget.id);
  };

  const usagePercentage = (budget) => {
    if (!budget.amount || budget.amount === 0) return 0;
    return ((budget.spent / budget.amount) * 100).toFixed(2);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>{editMode ? "Edit Budget" : "Add Budget"}</h2>
      <form onSubmit={handleSubmit} style={{ marginBottom: "30px" }}>
        <input
          type="number"
          placeholder="Amount"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          required
        />
        <select
          value={formData.period}
          onChange={(e) => setFormData({ ...formData, period: e.target.value })}
        >
          <option value="monthly">Monthly</option>
          <option value="weekly">Weekly</option>
        </select>
        <input
          type="number"
          placeholder="Spent"
          value={formData.spent}
          onChange={(e) => setFormData({ ...formData, spent: e.target.value })}
        />
        <input
          type="date"
          value={formData.startDate}
          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          required
        />
        <input
          type="date"
          value={formData.endDate}
          onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
          required
        />
        <button type="submit">{editMode ? "Update" : "Add"}</button>
      </form>

      <h3>All Budgets</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {budgets.map((budget) => (
          <div
            key={budget.id}
            style={{
              border: "1px solid #ccc",
              padding: "15px",
              borderRadius: "10px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
            }}
          >
            <p><strong>Amount:</strong> ₹{budget.amount}</p>
            <p><strong>Spent:</strong> ₹{budget.spent}</p>
            <p><strong>Period:</strong> {budget.period}</p>
            <p><strong>Start Date:</strong> {budget.startDate}</p>
            <p><strong>End Date:</strong> {budget.endDate}</p>
            <div style={{ height: "20px", background: "#eee", borderRadius: "10px", overflow: "hidden", marginTop: "10px" }}>
              <div
                style={{
                  width: `${usagePercentage(budget)}%`,
                  background: usagePercentage(budget) > 100 ? "red" : "#4caf50",
                  color: "white",
                  textAlign: "center",
                }}
              >
                {usagePercentage(budget)}%
              </div>
            </div>
            {usagePercentage(budget) > 100 && (
              <p style={{ color: "red", fontWeight: "bold" }}>⚠ Over Budget!</p>
            )}
            <button onClick={() => handleEdit(budget)} style={{ marginRight: "10px" }}>Edit</button>
            <button onClick={() => handleDelete(budget.id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Budget;
