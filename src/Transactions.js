import React, { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "universal-cookie";
import { useNavigate } from "react-router-dom";
import {
  PieChart,
  Pie,
  Tooltip,
  Cell,
  ResponsiveContainer,
  Legend,
} from "recharts";

const Transaction = () => {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [form, setForm] = useState({
    id: null,
    description: "",
    amount: "",
    transactionDate: "",
    category: "",
  });
  const [filters, setFilters] = useState({
    search: "",
    fromDate: "",
    toDate: "",
    minAmount: "",
    maxAmount: "",
    sortBy: "date",
  });
  const [isEditing, setIsEditing] = useState(false);

  const cookies = new Cookies();
  const navigate = useNavigate();
  const API_URL = "http://localhost:8090";

  const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#f87171", "#34d399"];

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
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setTransactions(res.data);
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
      alert("Failed to fetch transactions.");
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [transactions, filters]);

  const applyFilters = () => {
    let data = [...transactions];

    // Search by description or category
    if (filters.search) {
      const keyword = filters.search.toLowerCase();
      data = data.filter(
        (txn) =>
          txn.description.toLowerCase().includes(keyword) ||
          txn.category.toLowerCase().includes(keyword)
      );
    }

    // Date range filter
    if (filters.fromDate) {
      data = data.filter((txn) => txn.transactionDate >= filters.fromDate);
    }
    if (filters.toDate) {
      data = data.filter((txn) => txn.transactionDate <= filters.toDate);
    }

    // Amount range filter
    if (filters.minAmount) {
      data = data.filter((txn) => txn.amount >= parseFloat(filters.minAmount));
    }
    if (filters.maxAmount) {
      data = data.filter((txn) => txn.amount <= parseFloat(filters.maxAmount));
    }

    // Sorting
    if (filters.sortBy === "amount") {
      data.sort((a, b) => b.amount - a.amount);
    } else {
      data.sort(
        (a, b) =>
          new Date(b.transactionDate).getTime() -
          new Date(a.transactionDate).getTime()
      );
    }

    setFilteredTransactions(data);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = getAuthToken();
    if (!token) return alert("Not authenticated");

    try {
      const headers = { Authorization: `Bearer ${token}` };
      if (isEditing) {
        await axios.post(`${API_URL}/transaction/update`, form, { headers });
        setIsEditing(false);
      } else {
        await axios.post(`${API_URL}/transaction/add`, form, { headers });
      }
      setForm({
        id: null,
        description: "",
        amount: "",
        transactionDate: "",
        category: "",
      });
      fetchTransactions();
    } catch (err) {
      console.error("Error submitting transaction:", err);
      alert("Error submitting transaction.");
    }
  };

  const handleEdit = (txn) => {
    setForm(txn);
    setIsEditing(true);
  };

  const handleDelete = async (id) => {
    const token = getAuthToken();
    if (!token) return alert("Not authenticated");

    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.get(`${API_URL}/transaction/delete/${id}`, { headers });
      fetchTransactions();
    } catch (err) {
      console.error("Error deleting transaction:", err);
      alert("Error deleting transaction.");
    }
  };

  // Totals
  const totalIncome = filteredTransactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = filteredTransactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome + totalExpense;

  // Category breakdown
  const categorySummary = filteredTransactions.reduce((acc, txn) => {
    acc[txn.category] = (acc[txn.category] || 0) + txn.amount;
    return acc;
  }, {});

  const chartData = Object.entries(categorySummary).map(([category, total]) => ({
    name: category,
    value: Math.abs(total),
  }));

  return (
    <div className="container p-4">
      <h2 className="text-2xl font-bold mb-4">
        {isEditing ? "Edit" : "Add"} Transaction
      </h2>

      {/* Form */}
      <form onSubmit={handleSubmit} className="grid gap-4 mb-6 md:grid-cols-2">
        <input
          type="text"
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Description"
          required
          className="p-2 border rounded"
        />
        <input
          type="number"
          name="amount"
          value={form.amount}
          onChange={handleChange}
          placeholder="Amount (use - for expense)"
          required
          className="p-2 border rounded"
        />
        <input
          type="date"
          name="transactionDate"
          value={form.transactionDate}
          onChange={handleChange}
          required
          className="p-2 border rounded"
        />
        <input
          type="text"
          name="category"
          value={form.category}
          onChange={handleChange}
          placeholder="Category"
          required
          className="p-2 border rounded"
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          {isEditing ? "Update" : "Add"} Transaction
        </button>
      </form>

      {/* Filters */}
      <div className="grid md:grid-cols-6 gap-2 mb-6">
        <input
          name="search"
          value={filters.search}
          onChange={handleFilterChange}
          placeholder="Search..."
          className="p-2 border rounded col-span-2"
        />
        <input
          type="date"
          name="fromDate"
          value={filters.fromDate}
          onChange={handleFilterChange}
          className="p-2 border rounded"
        />
        <input
          type="date"
          name="toDate"
          value={filters.toDate}
          onChange={handleFilterChange}
          className="p-2 border rounded"
        />
        <input
          name="minAmount"
          value={filters.minAmount}
          onChange={handleFilterChange}
          placeholder="Min Amount"
          className="p-2 border rounded"
        />
        <input
          name="maxAmount"
          value={filters.maxAmount}
          onChange={handleFilterChange}
          placeholder="Max Amount"
          className="p-2 border rounded"
        />
        <select
          name="sortBy"
          value={filters.sortBy}
          onChange={handleFilterChange}
          className="p-2 border rounded"
        >
          <option value="date">Sort by Date</option>
          <option value="amount">Sort by Amount</option>
        </select>
      </div>

      {/* Totals */}
      <div className="flex justify-around mb-6 text-lg font-semibold">
        <span className="text-green-600">Income: ₹{totalIncome.toFixed(2)}</span>
        <span className="text-red-600">Expense: ₹{Math.abs(totalExpense).toFixed(2)}</span>
        <span className="text-blue-600">Balance: ₹{balance.toFixed(2)}</span>
      </div>

      {/* Table */}
      <h2 className="text-xl font-semibold mb-2">Transactions</h2>
      <table className="w-full border-collapse border border-gray-300 mb-6">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Description</th>
            <th className="border p-2">Amount</th>
            <th className="border p-2">Date</th>
            <th className="border p-2">Category</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredTransactions.map((txn) => (
            <tr key={txn.id} className="text-center">
              <td className="border p-2">{txn.description}</td>
              <td
                className={`border p-2 ${
                  txn.amount >= 0 ? "text-green-700" : "text-red-700"
                }`}
              >
                ₹{txn.amount}
              </td>
              <td className="border p-2">{txn.transactionDate}</td>
              <td className="border p-2">{txn.category}</td>
              <td className="border p-2 space-x-2">
                <button
                  onClick={() => handleEdit(txn)}
                  className="bg-yellow-400 px-3 py-1 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(txn.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {filteredTransactions.length === 0 && (
            <tr>
              <td colSpan="5" className="text-center p-4">
                No transactions found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Category Pie Chart */}
      <div className="w-full md:w-1/2">
  <h3 className="text-lg font-semibold mb-2">Category Breakdown</h3>
  <ResponsiveContainer width="100%" height={300}>
    <PieChart>
      <Pie
        data={chartData}
        dataKey="value"
        nameKey="name"
        cx="50%"
        cy="50%"
        outerRadius={80}
        fill="#8884d8"
        label
      >
        {chartData.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
      <Tooltip />
    </PieChart>
  </ResponsiveContainer>
</div>

    </div>
  );
};

export default Transaction;
