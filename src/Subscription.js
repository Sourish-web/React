import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

const Subscription = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [newSubscription, setNewSubscription] = useState({
    name: '',
    cost: '',
    startDate: '',
    renewalPeriod: ''
  });
  const [editingSubscription, setEditingSubscription] = useState(null);
  const [costTrends, setCostTrends] = useState({ labels: [], data: [] });

  useEffect(() => {
    fetchSubscriptions();
    fetchCostTrends();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const res = await axios.get('http://localhost:8090/getSubscriptions');
      setSubscriptions(res.data);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    }
  };

  const fetchCostTrends = async () => {
    try {
      const res = await axios.get('http://localhost:8090/getCostTrends');
      setCostTrends(res.data);
    } catch (error) {
      console.error('Error fetching cost trends:', error);
    }
  };

  const handleAddSubscription = async () => {
    if (!newSubscription.name || !newSubscription.cost || !newSubscription.startDate || !newSubscription.renewalPeriod) {
      return alert('Please fill all fields');
    }

    try {
      await axios.post('http://localhost:8090/addSubscription', {
        ...newSubscription,
        cost: parseFloat(newSubscription.cost)
      });
      setNewSubscription({ name: '', cost: '', startDate: '', renewalPeriod: '' });
      fetchSubscriptions();
    } catch (error) {
      console.error('Error adding subscription:', error);
    }
  };

  const handleEditSubscription = (subscription) => {
    setEditingSubscription(subscription);
  };

  const handleUpdateSubscription = async () => {
    if (!editingSubscription.name || !editingSubscription.cost || !editingSubscription.startDate || !editingSubscription.renewalPeriod) {
      return alert('Please fill all fields');
    }

    try {
      await axios.post('http://localhost:8090/updateSubscription', {
        ...editingSubscription,
        cost: parseFloat(editingSubscription.cost)
      });
      setEditingSubscription(null);
      fetchSubscriptions();
    } catch (error) {
      console.error('Error updating subscription:', error);
    }
  };

  const handleDeleteSubscription = async (id) => {
    try {
      await axios.delete(`http://localhost:8090/deleteSubscription/${id}`);
      fetchSubscriptions();
    } catch (error) {
      console.error('Error deleting subscription:', error);
    }
  };

  const handleCancelSubscription = async (id) => {
    try {
      await axios.post(`http://localhost:8090/cancelSubscription/${id}`);
      fetchSubscriptions();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
    }
  };

  const renderCancelSuggestion = (subscription) => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const lastInteractionDate = new Date(subscription.lastInteractionDate);
    if (subscription.cost > 500 && lastInteractionDate < sixMonthsAgo) {
      return (
        <div className="text-red-500 mt-2">
          ⚠️ Consider cancelling this subscription due to high cost and inactivity.
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-5 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">📦 Subscriptions</h1>

      {/* Add New Subscription */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <h2 className="text-lg font-semibold mb-2">Add New Subscription</h2>
        <input
          type="text"
          placeholder="Subscription name"
          value={newSubscription.name}
          onChange={(e) => setNewSubscription({ ...newSubscription, name: e.target.value })}
          className="border p-2 mr-2 rounded"
        />
        <input
          type="number"
          placeholder="Cost"
          value={newSubscription.cost}
          onChange={(e) => setNewSubscription({ ...newSubscription, cost: e.target.value })}
          className="border p-2 mr-2 rounded"
        />
        <input
          type="date"
          value={newSubscription.startDate}
          onChange={(e) => setNewSubscription({ ...newSubscription, startDate: e.target.value })}
          className="border p-2 mr-2 rounded"
        />
        <input
          type="text"
          placeholder="Renewal Period (e.g., Monthly)"
          value={newSubscription.renewalPeriod}
          onChange={(e) => setNewSubscription({ ...newSubscription, renewalPeriod: e.target.value })}
          className="border p-2 mr-2 rounded"
        />
        <button onClick={handleAddSubscription} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Add Subscription
        </button>
      </div>

      {/* Edit Subscription */}
      {editingSubscription && (
        <div className="bg-yellow-100 rounded-xl shadow-md p-4 mb-6">
          <h2 className="text-lg font-semibold mb-2">Edit Subscription</h2>
          <input
            type="text"
            placeholder="Subscription name"
            value={editingSubscription.name}
            onChange={(e) => setEditingSubscription({ ...editingSubscription, name: e.target.value })}
            className="border p-2 mr-2 rounded"
          />
          <input
            type="number"
            placeholder="Cost"
            value={editingSubscription.cost}
            onChange={(e) => setEditingSubscription({ ...editingSubscription, cost: e.target.value })}
            className="border p-2 mr-2 rounded"
          />
          <input
            type="date"
            value={editingSubscription.startDate}
            onChange={(e) => setEditingSubscription({ ...editingSubscription, startDate: e.target.value })}
            className="border p-2 mr-2 rounded"
          />
          <input
            type="text"
            placeholder="Renewal Period (e.g., Monthly)"
            value={editingSubscription.renewalPeriod}
            onChange={(e) => setEditingSubscription({ ...editingSubscription, renewalPeriod: e.target.value })}
            className="border p-2 mr-2 rounded"
          />
          <button onClick={handleUpdateSubscription} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 mr-2">
            Update
          </button>
          <button onClick={() => setEditingSubscription(null)} className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500">
            Cancel
          </button>
        </div>
      )}

      {/* List Subscriptions */}
      <div className="grid gap-4">
        {subscriptions.map((sub) => (
          <div key={sub.id} className="bg-white rounded-xl shadow-md p-4">
            <h3 className="text-lg font-bold">{sub.name}</h3>
            <p>💰 Cost: ₹{sub.cost}</p>
            <p>📅 Start Date: {sub.startDate}</p>
            <p>🔁 Renewal: {sub.renewalPeriod}</p>
            {renderCancelSuggestion(sub)}
            <div className="mt-3 flex gap-3">
              <button onClick={() => handleEditSubscription(sub)} className="bg-yellow-400 text-white px-3 py-1 rounded">
                Edit
              </button>
              <button onClick={() => handleDeleteSubscription(sub.id)} className="bg-red-500 text-white px-3 py-1 rounded">
                Delete
              </button>
              <button onClick={() => handleCancelSubscription(sub.id)} className="bg-blue-500 text-white px-3 py-1 rounded">
                Cancel
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Cost Trend Graph */}
      <div className="mt-10 bg-white p-4 shadow-md rounded-xl">
        <h2 className="text-xl font-semibold mb-4">📈 Subscription Cost Trends</h2>
        <Line
          data={{
            labels: costTrends.labels,
            datasets: [
              {
                label: 'Monthly Cost',
                data: costTrends.data,
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                borderColor: 'rgba(59, 130, 246, 1)',
                fill: true,
              },
            ],
          }}
        />
      </div>
    </div>
  );
};

export default Subscription;
