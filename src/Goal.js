import React, { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "universal-cookie";
import { useNavigate } from "react-router-dom";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import { Pie } from "react-chartjs-2";
import { CSVLink } from "react-csv";
import Calendar from "react-calendar";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "react-calendar/dist/Calendar.css";
import "react-circular-progressbar/dist/styles.css";
import { useLocalStorage } from "usehooks-ts";
import Chart from 'chart.js/auto';

const Goal = () => {
  const cookies = new Cookies();
  const navigate = useNavigate();
  const API_URL = "http://localhost:8090";

  const [goals, setGoals] = useState([]);
  const [form, setForm] = useState({ id: null, name: "", targetAmount: "", currentAmount: "", targetDate: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("None");
  const [archivedGoals, setArchivedGoals] = useLocalStorage("archivedGoals", []);
  const [notes, setNotes] = useLocalStorage("goalNotes", {});
  const [darkMode, setDarkMode] = useLocalStorage("darkMode", false);
  const [goalStreak, setGoalStreak] = useLocalStorage("goalStreak", 0);

  const getAuthToken = () => cookies.get("token");

  const filteredGoals = goals
    .filter((g) => !archivedGoals.includes(g.id))
    .filter((g) => filter === "All" || g.status === filter);

  const sortedGoals = [...filteredGoals].sort((a, b) => {
    switch (sort) {
      case "targetAmount": return b.targetAmount - a.targetAmount;
      case "progress": return (b.currentAmount / b.targetAmount) - (a.currentAmount / a.targetAmount);
      case "targetDate": return new Date(a.targetDate) - new Date(b.targetDate);
      case "status": return a.status.localeCompare(b.status);
      default: return 0;
    }
  });

  const fetchGoals = async () => {
    const token = getAuthToken();
    if (!token) {
      alert("You are not authenticated");
      navigate("/login");
      return;
    }

    try {
      const res = await axios.get(`${API_URL}/getGoals`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGoals(res.data);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  useEffect(() => {
    const now = new Date();
    const addedThisMonth = goals.some(goal => {
      const added = new Date(goal.targetDate);
      return added.getMonth() === now.getMonth() && added.getFullYear() === now.getFullYear();
    });
    if (addedThisMonth) {
      setGoalStreak((prev) => prev + 1);
    }
  }, [goals]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = getAuthToken();
    const headers = { Authorization: `Bearer ${token}` };

    try {
      if (isEditing) {
        await axios.post(`${API_URL}/updateGoal`, form, { headers });
        setIsEditing(false);
      } else {
        await axios.post(`${API_URL}/addGoal`, form, { headers });
      }

      setForm({ id: null, name: "", targetAmount: "", currentAmount: "", targetDate: "" });
      fetchGoals();
    } catch (err) {
      console.error("Submit error:", err);
    }
  };

  const handleEdit = (goal) => {
    setForm(goal);
    setIsEditing(true);
  };

  const handleDelete = async (id) => {
    const token = getAuthToken();
    const headers = { Authorization: `Bearer ${token}` };

    try {
      await axios.get(`${API_URL}/deleteGoal/${id}`, { headers });
      fetchGoals();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handleArchive = (id) => {
    setArchivedGoals([...archivedGoals, id]);
  };

  const getForecastMessage = (goal) => {
    const remaining = goal.targetAmount - goal.currentAmount;
    const daysLeft = (new Date(goal.targetDate) - new Date()) / (1000 * 3600 * 24);
    if (daysLeft <= 0) return "Past due!";
    const dailySaveNeeded = remaining / daysLeft;
    if (dailySaveNeeded <= 50) return "On track to complete on time!";
    if (dailySaveNeeded <= 100) return "Add a bit more to stay on track!";
    return "Falling behind, consider increasing savings!";
  };

  const goalData = {
    labels: [...new Set(goals.map((g) => g.name))],
    datasets: [{
      data: goals.map((g) => g.targetAmount),
      backgroundColor: ["#8884d8", "#82ca9d", "#ffc658", "#f87171", "#60a5fa"],
    }],
  };

  // Corrected useEffect and milestone alert logic
  useEffect(() => {
    goals.forEach((goal) => {
      const progress = (goal.currentAmount / goal.targetAmount) * 100;
      if ([25, 50, 75].includes(Math.round(progress))) {
        toast.success(`🎉 Reached ${Math.round(progress)}% milestone!`);
      }
    });
  }, [goals]);

  return (
    <div className={darkMode ? "dark bg-gray-900 text-white" : "bg-white text-black"}>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">{isEditing ? "Edit Goal" : "Add Goal"}</h2>
          <button
            className="px-4 py-2 bg-gray-700 text-white rounded"
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? "🌞 Light Mode" : "🌙 Dark Mode"}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 mb-6 md:grid-cols-2">
          <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="Goal Name" required className="p-2 border rounded" />
          <input type="number" name="targetAmount" value={form.targetAmount} onChange={handleChange} placeholder="Target Amount" required className="p-2 border rounded" />
          <input type="number" name="currentAmount" value={form.currentAmount} onChange={handleChange} placeholder="Current Amount" required className="p-2 border rounded" />
          <input type="date" name="targetDate" value={form.targetDate} onChange={handleChange} required className="p-2 border rounded" />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded col-span-full">{isEditing ? "Update" : "Add"} Goal</button>
        </form>

        <div className="flex justify-between items-center mb-2">
          <div>
            <label className="mr-2">Filter:</label>
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className="border p-1 rounded">
              <option>All</option><option>Completed</option><option>In Progress</option><option>Missed</option>
            </select>
          </div>
          <div>
            <label className="mr-2">Sort:</label>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="border p-1 rounded">
              <option>None</option><option value="targetAmount">Target Amount</option>
              <option value="progress">Progress</option><option value="targetDate">Target Date</option><option value="status">Status</option>
            </select>
          </div>
          <CSVLink data={goals} filename="goals.csv" className="bg-green-600 text-white px-4 py-2 rounded">Export CSV</CSVLink>
        </div>

        <h3 className="mb-2 text-lg font-semibold">Goal Categories</h3>
        
        {/* Smaller Pie Chart */}
        <div className="w-[20px] h-[20px] mb-4 mx-auto">
          <Pie data={goalData} />
        </div>

        <h3 className="mb-2 text-lg font-semibold">Goal Timeline</h3>
        <Calendar tileContent={({ date }) => {
          const matched = goals.find(g => new Date(g.targetDate).toDateString() === date.toDateString());
          return matched ? <span className="text-red-500 font-bold">*</span> : null;
        }} />

        <h4 className="mt-6 font-bold">Streak: 🔥 {goalStreak} months in a row!</h4>

        <table className="w-full border-collapse border border-gray-300 mt-4 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">Name</th>
              <th className="border p-2">Progress</th>
              <th className="border p-2">Time Left</th>
              <th className="border p-2">Forecast</th>
              <th className="border p-2">Status</th>
              <th className="border p-2">Note</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedGoals.map((goal) => {
              const progress = (goal.currentAmount / goal.targetAmount) * 100;
              const daysLeft = Math.max(0, Math.ceil((new Date(goal.targetDate) - new Date()) / (1000 * 3600 * 24)));

              return (
                <tr key={goal.id} className="text-center">
                  <td className="border p-2">{goal.name}</td>
                  <td className="border p-2">
                    <div className="w-[30px] mx-auto">
                      <CircularProgressbar value={progress} text={`${Math.round(progress)}%`} styles={buildStyles({ textSize: "24px" })} />
                    </div>
                  </td>
                  <td className="border p-2">{daysLeft} days</td>
                  <td className="border p-2">{getForecastMessage(goal)}</td>
                  <td className="border p-2">{goal.status}</td>
                  <td className="border p-2">
                    <input
                      type="text"
                      value={notes[goal.id] || ""}
                      onChange={(e) => setNotes({ ...notes, [goal.id]: e.target.value })}
                      placeholder="Note"
                      className="border p-1 w-full rounded"
                    />
                  </td>
                  <td className="border p-2 space-x-1">
                    <button onClick={() => handleEdit(goal)} className="bg-yellow-400 px-2 py-1 rounded">Edit</button>
                    <button onClick={() => handleDelete(goal.id)} className="bg-red-500 text-white px-2 py-1 rounded">Delete</button>
                    <button onClick={() => handleArchive(goal.id)} className="bg-gray-400 px-2 py-1 rounded">Archive</button>
                  </td>
                </tr>
              );
            })}
            {goals.length === 0 && (
              <tr><td colSpan="7" className="p-4 text-center">No goals found.</td></tr>
            )}
          </tbody>
        </table>
        <ToastContainer />
      </div>
    </div>
  );
};

export default Goal;
