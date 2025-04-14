import React, { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "universal-cookie";
import { useNavigate } from "react-router-dom";

const Subscription = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [form, setForm] = useState({
    id: null,
    name: "",
    cost: "",
    renewalDate: "",
    frequency: "",
    paymentMethod: "",
    category: "",
  });
  const [isEditing, setIsEditing] = useState(false);

  const cookies = new Cookies();
  const navigate = useNavigate();
  const API_URL = "http://localhost:8090";

  const getAuthToken = () => cookies.get("token");

  const fetchSubscriptions = async () => {
    const token = getAuthToken();
    if (!token) {
      alert("You are not authenticated");
      navigate("/login");
      return;
    }

    try {
      const res = await axios.get(`${API_URL}/getSubscriptions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setSubscriptions(res.data);
    } catch (err) {
      console.error("Failed to fetch subscriptions:", err);
      alert("Failed to fetch subscriptions.");
    }
  };

  useEffect(() => {
    fetchSubscriptions();
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
        await axios.post(`${API_URL}/updateSubscription`, form, { headers });
        setIsEditing(false);
      } else {
        await axios.post(`${API_URL}/addSubscription`, form, { headers });
      }

      setForm({
        id: null,
        name: "",
        cost: "",
        renewalDate: "",
        frequency: "",
        paymentMethod: "",
        category: "",
      });
      fetchSubscriptions();
    } catch (err) {
      console.error("Error submitting subscription:", err);
      alert("Error submitting subscription.");
    }
  };

  const handleEdit = (subscription) => {
    setForm(subscription);
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
      await axios.get(`${API_URL}/deleteSubscription/${id}`, { headers });
      fetchSubscriptions();
    } catch (err) {
      console.error("Error deleting subscription:", err);
      alert("Error deleting subscription.");
    }
  };

  return (
    <div className="container p-4">
      <h2 className="text-2xl font-bold mb-4">{isEditing ? "Edit" : "Add"} Subscription</h2>

      <form onSubmit={handleSubmit} className="grid gap-4 mb-6">
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Subscription Name"
          required
          className="p-2 border rounded"
        />
        <input
          type="number"
          name="cost"
          value={form.cost}
          onChange={handleChange}
          placeholder="Cost"
          required
          className="p-2 border rounded"
        />
        <input
          type="date"
          name="renewalDate"
          value={form.renewalDate}
          onChange={handleChange}
          required
          className="p-2 border rounded"
        />
        <input
          type="text"
          name="frequency"
          value={form.frequency}
          onChange={handleChange}
          placeholder="Frequency (Monthly/Yearly)"
          required
          className="p-2 border rounded"
        />
        <input
          type="text"
          name="paymentMethod"
          value={form.paymentMethod}
          onChange={handleChange}
          placeholder="Payment Method"
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
          {isEditing ? "Update" : "Add"} Subscription
        </button>
      </form>

      <h2 className="text-xl font-semibold mb-2">Subscriptions List</h2>
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Name</th>
            <th className="border p-2">Cost</th>
            <th className="border p-2">Renewal Date</th>
            <th className="border p-2">Frequency</th>
            <th className="border p-2">Payment</th>
            <th className="border p-2">Category</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {subscriptions.map((sub) => (
            <tr key={sub.id} className="text-center">
              <td className="border p-2">{sub.name}</td>
              <td className="border p-2">{sub.cost}</td>
              <td className="border p-2">{sub.renewalDate}</td>
              <td className="border p-2">{sub.frequency}</td>
              <td className="border p-2">{sub.paymentMethod}</td>
              <td className="border p-2">{sub.category}</td>
              <td className="border p-2 space-x-2">
                <button
                  onClick={() => handleEdit(sub)}
                  className="bg-yellow-400 px-3 py-1 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(sub.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {subscriptions.length === 0 && (
            <tr>
              <td colSpan="7" className="text-center p-4">
                No subscriptions found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Subscription;
