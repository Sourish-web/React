import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

const Goals = () => {
  const [goals, setGoals] = useState([]);
  const [newGoal, setNewGoal] = useState({
    name: '',
    targetAmount: '',
    targetDate: ''
  });

  const [contribution, setContribution] = useState({});

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    const res = await axios.get('http://localhost:8090/getGoals');
    setGoals(res.data);
  };

  const handleAddGoal = async () => {
    if (!newGoal.name || !newGoal.targetAmount || !newGoal.targetDate) return alert('Fill all fields');

    await axios.post('http://localhost:8090/addGoal', {
      ...newGoal,
      targetAmount: parseFloat(newGoal.targetAmount),
      targetDate: newGoal.targetDate
    });

    setNewGoal({ name: '', targetAmount: '', targetDate: '' });
    fetchGoals();
  };

  const handleContributionChange = (id, value) => {
    setContribution({ ...contribution, [id]: value });
  };

  const addContribution = async (goal) => {
    const amountToAdd = parseFloat(contribution[goal.id] || 0);
    const updatedGoal = {
      ...goal,
      currentAmount: parseFloat(goal.currentAmount || 0) + amountToAdd
    };

    await axios.post('http://localhost:8090/updateGoal', updatedGoal);
    fetchGoals();
  };

  const deleteGoal = async (id) => {
    await axios.get(`http://localhost:8090/deleteGoal/${id}`);
    fetchGoals();
  };

  return (
    <div className="p-5 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">🎯 Financial Goals</h1>

      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <h2 className="text-lg font-semibold mb-2">Add New Goal</h2>
        <input
          type="text"
          placeholder="Goal name"
          value={newGoal.name}
          onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
          className="border p-2 mr-2 rounded"
        />
        <input
          type="number"
          placeholder="Target amount"
          value={newGoal.targetAmount}
          onChange={(e) => setNewGoal({ ...newGoal, targetAmount: e.target.value })}
          className="border p-2 mr-2 rounded"
        />
        <input
          type="date"
          value={newGoal.targetDate}
          onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
          className="border p-2 mr-2 rounded"
        />
        <button onClick={handleAddGoal} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Add Goal
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {goals.map((goal) => {
          const percentage = Math.min(
            ((parseFloat(goal.currentAmount || 0) / parseFloat(goal.targetAmount)) * 100).toFixed(1),
            100
          );

          return (
            <div key={goal.id} className="bg-white p-4 rounded-xl shadow-md relative">
              <button
                onClick={() => deleteGoal(goal.id)}
                className="absolute top-2 right-2 text-red-500 hover:text-red-700"
              >
                ❌
              </button>

              <h3 className="text-xl font-semibold mb-2">{goal.name}</h3>
              <p>🎯 Target: ₹{goal.targetAmount}</p>
              <p>📅 Deadline: {goal.targetDate}</p>
              <p>Status: <span className="font-semibold">{goal.status}</span></p>

              <div className="my-3 w-24 h-24">
                <CircularProgressbar
                  value={percentage}
                  text={`${percentage}%`}
                  styles={buildStyles({
                    pathColor: '#10b981',
                    textColor: '#111827',
                    trailColor: '#d1d5db',
                    textSize: '16px',
                  })}
                />
              </div>

              <div className="mt-2">
                <input
                  type="number"
                  placeholder="Add ₹ amount"
                  value={contribution[goal.id] || ''}
                  onChange={(e) => handleContributionChange(goal.id, e.target.value)}
                  className="border p-2 rounded w-full mb-2"
                />
                <button
                  onClick={() => addContribution(goal)}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 w-full"
                >
                  Add Contribution
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Goals;
