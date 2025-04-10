import React, { useEffect, useState } from "react";
import axios from "axios";

const Transaction = () => {
  const [transactions, setTransactions] = useState([]);
  const [form, setForm] = useState({
    id: null,
    description: "",
    amount: "",
    transactionDate: "",
    category: "",
  });
  const [isEditing, setIsEditing] = useState(false);

  const API_URL = "http://localhost:8090";

  // Fetch all transactions
  const fetchTransactions = async () => {
    try {
      const res = await axios.get(`${API_URL}/getTransaction`);
      setTransactions(res.data);
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handle add/update transaction
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isEditing) {
        await axios.post(`${API_URL}/updateTransaction`, form);
        setIsEditing(false);
      } else {
        await axios.post(`${API_URL}/addTransaction`, form);
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
    }
  };

  // Edit transaction
  const handleEdit = (transaction) => {
    setForm(transaction);
    setIsEditing(true);
  };

  // Delete transaction
  const handleDelete = async (id) => {
    try {
      await axios.get(`${API_URL}/deleteTransaction/${id}`);
      fetchTransactions();
    } catch (err) {
      console.error("Error deleting transaction:", err);
    }
  };

  return (
    <div className="container p-4">
      <h2 className="text-2xl font-bold mb-4">{isEditing ? "Edit" : "Add"} Transaction</h2>

      <form onSubmit={handleSubmit} className="grid gap-4 mb-6">
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
          placeholder="Amount"
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

      <h2 className="text-xl font-semibold mb-2">Transactions List</h2>
      <table className="w-full border-collapse border border-gray-300">
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
          {transactions.map((txn) => (
            <tr key={txn.id} className="text-center">
              <td className="border p-2">{txn.description}</td>
              <td className="border p-2">{txn.amount}</td>
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
          {transactions.length === 0 && (
            <tr>
              <td colSpan="5" className="text-center p-4">
                No transactions found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Transaction;
