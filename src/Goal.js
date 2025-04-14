import React, { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "universal-cookie";
import { useNavigate } from "react-router-dom";

const Goal = () => {
  const [goals, setGoals] = useState([]);
  const [form, setForm] = useState({
    id: null,
    name: "",
    targetAmount: "",
    currentAmount: "",
    targetDate: "",
  });
  const [isEditing, setIsEditing] = useState(false);

  const cookies = new Cookies();
  const navigate = useNavigate();
  const API_URL = "http://localhost:8090";

  const getAuthToken = () => {
    return cookies.get("token");
  };

  const fetchGoals = async () => {
    const token = getAuthToken();
    if (!token) {
      alert("You are not authenticated");
      navigate("/login");
      return;
    }

    try {
      const res = await axios.get(`${API_URL}/getGoals`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setGoals(res.data);
    } catch (err) {
      console.error("Failed to fetch goals:", err);
      alert("Failed to fetch goals.");
    }
  };

  useEffect(() => {
    fetchGoals();
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
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      if (isEditing) {
        await axios.post(`${API_URL}/updateGoal`, form, { headers });
        setIsEditing(false);
      } else {
        await axios.post(`${API_URL}/addGoal`, form, { headers });
      }

      setForm({
        id: null,
        name: "",
        targetAmount: "",
        currentAmount: "",
        targetDate: "",
      });
      fetchGoals();
    } catch (err) {
      console.error("Error submitting goal:", err);
      alert("Error submitting goal.");
    }
  };

  const handleEdit = (goal) => {
    setForm(goal);
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
      const headers = {
        Authorization: `Bearer ${token}`,
      };
      await axios.get(`${API_URL}/deleteGoal/${id}`, { headers });
      fetchGoals();
    } catch (err) {
      console.error("Error deleting goal:", err);
      alert("Error deleting goal.");
    }
  };

  return (
    <div className="container p-4">
      <h2 className="text-2xl font-bold mb-4">{isEditing ? "Edit" : "Add"} Goal</h2>

      <form onSubmit={handleSubmit} className="grid gap-4 mb-6">
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Goal Name"
          required
          className="p-2 border rounded"
        />
        <input
          type="number"
          name="targetAmount"
          value={form.targetAmount}
          onChange={handleChange}
          placeholder="Target Amount"
          required
          className="p-2 border rounded"
        />
        <input
          type="number"
          name="currentAmount"
          value={form.currentAmount}
          onChange={handleChange}
          placeholder="Current Amount"
          required
          className="p-2 border rounded"
        />
        <input
          type="date"
          name="targetDate"
          value={form.targetDate}
          onChange={handleChange}
          required
          className="p-2 border rounded"
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          {isEditing ? "Update" : "Add"} Goal
        </button>
      </form>

      <h2 className="text-xl font-semibold mb-2">Goals List</h2>
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Name</th>
            <th className="border p-2">Target</th>
            <th className="border p-2">Current</th>
            <th className="border p-2">Target Date</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {goals.map((goal) => (
            <tr key={goal.id} className="text-center">
              <td className="border p-2">{goal.name}</td>
              <td className="border p-2">{goal.targetAmount}</td>
              <td className="border p-2">{goal.currentAmount}</td>
              <td className="border p-2">{goal.targetDate}</td>
              <td className="border p-2">{goal.status}</td>
              <td className="border p-2 space-x-2">
                <button
                  onClick={() => handleEdit(goal)}
                  className="bg-yellow-400 px-3 py-1 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(goal.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {goals.length === 0 && (
            <tr>
              <td colSpan="6" className="text-center p-4">
                No goals found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Goal;
