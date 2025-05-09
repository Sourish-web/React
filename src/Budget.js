import React, { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "universal-cookie";
import { useNavigate } from "react-router-dom";
import { Pie, Bar, Line } from "react-chartjs-2";
import * as XLSX from "xlsx";
import { Chart, LinearScale, CategoryScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend, Title } from "chart.js";
import { Card, Alert, LinearProgress, Chip, Grid, Switch, Button, TextField, Typography, Paper } from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { SaveAlt, Undo, Edit, Delete, DarkMode, LightMode } from "@mui/icons-material";

// Register Chart.js components
Chart.register(LinearScale, CategoryScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend, Title);

const Budget = () => {
  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]); // Mock/optional data
  const [form, setForm] = useState({
    id: null,
    amount: "",
    period: "monthly",
    spent: "",
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]
  });
  const [isEditing, setIsEditing] = useState(false);
  const [deleted, setDeleted] = useState(null);
  const [filter, setFilter] = useState("all");
  const [darkMode, setDarkMode] = useState(false);
  const [simulatedRollover, setSimulatedRollover] = useState({});

  const cookies = new Cookies();
  const navigate = useNavigate();
  const API_URL = "http://localhost:8090";
  const getAuthToken = () => cookies.get("token");

  // Dark theme setup
  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
    },
  });

  // Fetch budgets
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
    }
  };

  // Mock transaction fetch (optional)
  const fetchTransactions = async () => {
    // In a real app, you'd call your backend API
    setTransactions([
      { id: 1, amount: 150, category: "food", date: "2023-05-01", budgetId: 1 },
      { id: 2, amount: 200, category: "transport", date: "2023-05-02", budgetId: 2 }
    ]);
  };

  useEffect(() => {
    fetchBudgets();
    fetchTransactions();
  }, []);

  // Form handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = getAuthToken();
    const endpoint = isEditing ? "/updateBudget" : "/addBudget";
    try {
      await axios.post(`${API_URL}${endpoint}`, form, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      resetForm();
      fetchBudgets();
    } catch (err) {
      console.error("Error submitting budget:", err);
    }
  };

  const resetForm = () => {
    setForm({
      id: null,
      amount: "",
      period: "monthly",
      spent: "",
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]
    });
    setIsEditing(false);
  };

  // Budget actions
  const handleEdit = (budget) => {
    setForm(budget);
    setIsEditing(true);
  };

  const handleDelete = async (id) => {
    const token = getAuthToken();
    try {
      const budgetToDelete = budgets.find(b => b.id === id);
      setDeleted(budgetToDelete);
      setBudgets(budgets.filter(b => b.id !== id));
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

  // New features implementation
  const exportToCSV = () => {
    const csv = budgets.map(b => `${b.period},${b.amount},${b.spent}`).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "budgets.csv";
    link.click();
  };

  const simulateRollover = (budgetId) => {
    const budget = budgets.find(b => b.id === budgetId);
    const remaining = budget.amount - budget.spent;
    setSimulatedRollover(prev => ({
      ...prev,
      [budgetId]: remaining > 0 ? remaining : 0
    }));
  };

  // Filter and calculations
  const filteredBudgets = budgets.filter(b => 
    filter === "all" || b.period === filter
  );

  const getCategorySpending = () => {
    return transactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});
  };

  // Chart data
  const pieData = {
    labels: filteredBudgets.map(b => b.period),
    datasets: [{
      data: filteredBudgets.map(b => b.amount),
      backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56"]
    }]
  };

  const barData = {
    labels: filteredBudgets.map(b => b.period),
    datasets: [
      {
        label: "Budgeted",
        data: filteredBudgets.map(b => b.amount),
        backgroundColor: "#4CAF50"
      },
      {
        label: "Spent",
        data: filteredBudgets.map(b => b.spent),
        backgroundColor: "#F44336"
      }
    ]
  };

  return (
    <ThemeProvider theme={theme}>
      <Paper sx={{ p: 3, minHeight: '100vh' }}>
        {/* Header */}
        <Grid container justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            Budget Manager
          </Typography>
          <Switch 
            checked={darkMode} 
            onChange={() => setDarkMode(!darkMode)} 
            icon={<LightMode />} 
            checkedIcon={<DarkMode />}
          />
        </Grid>

        {/* Budget Form */}
        <Card sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {isEditing ? "Edit Budget" : "Create New Budget"}
          </Typography>
          <Grid container spacing={2} component="form" onSubmit={handleSubmit}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Amount"
                type="number"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Spent"
                type="number"
                name="spent"
                value={form.spent}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Period"
                name="period"
                value={form.period}
                onChange={handleChange}
                SelectProps={{ native: true }}
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                name="startDate"
                value={form.startDate}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                name="endDate"
                value={form.endDate}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <Button 
                type="submit" 
                variant="contained" 
                color="primary"
                startIcon={isEditing ? <Edit /> : <SaveAlt />}
              >
                {isEditing ? "Update" : "Save"} Budget
              </Button>
              {isEditing && (
                <Button 
                  variant="outlined" 
                  onClick={resetForm}
                  sx={{ ml: 2 }}
                >
                  Cancel
                </Button>
              )}
            </Grid>
          </Grid>
        </Card>

        {/* Filters and Actions */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              select
              label="Filter by Period"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              SelectProps={{ native: true }}
            >
              <option value="all">All Periods</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button 
              fullWidth 
              variant="outlined" 
              onClick={exportToCSV}
              startIcon={<SaveAlt />}
            >
              Export CSV
            </Button>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button 
              fullWidth 
              variant="outlined" 
              onClick={() => XLSX.writeFile(
                XLSX.utils.json_to_sheet(budgets), 
                "budgets.xlsx"
              )}
              startIcon={<SaveAlt />}
            >
              Export Excel
            </Button>
          </Grid>
        </Grid>

        {/* Deleted Notification */}
        {deleted && (
          <Alert 
            severity="warning" 
            action={
              <Button color="inherit" size="small" onClick={undoDelete}>
                <Undo fontSize="small" /> Undo
              </Button>
            }
            sx={{ mb: 3 }}
          >
            Budget deleted successfully
          </Alert>
        )}

        {/* Budget Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {filteredBudgets.map(budget => {
            const progress = (budget.spent / budget.amount) * 100;
            const daysLeft = Math.ceil(
              (new Date(budget.endDate) - new Date()) / (1000 * 60 * 60 * 24)
            );
            const remaining = budget.amount - budget.spent;
            
            return (
              <Grid item xs={12} sm={6} md={4} key={budget.id}>
                <Card sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    {budget.period} Budget
                  </Typography>
                  
                  {/* Progress Bar */}
                  <LinearProgress 
                    variant="determinate" 
                    value={progress > 100 ? 100 : progress} 
                    color={
                      progress > 90 ? "error" : 
                      progress > 50 ? "warning" : "success"
                    }
                    sx={{ height: 10, mb: 1 }}
                  />
                  
                  <Typography variant="body2" gutterBottom>
                    ${budget.spent} of ${budget.amount} ({progress.toFixed(1)}%)
                  </Typography>
                  
                  {/* Alerts */}
                  {progress > 90 && (
                    <Alert severity="error" sx={{ mb: 1 }}>
                      {progress >= 100 ? "Budget exceeded!" : "Close to limit!"}
                    </Alert>
                  )}
                  
                  {/* Days Left */}
                  <Chip 
                    label={`${daysLeft >= 0 ? daysLeft : 0} days left`} 
                    color={daysLeft < 7 ? "error" : "default"}
                    size="small"
                    sx={{ mb: 1 }}
                  />
                  
                  {/* Rollover Simulation */}
                  {remaining > 0 && (
                    <Button 
                      size="small" 
                      onClick={() => simulateRollover(budget.id)}
                      sx={{ display: 'block', mb: 1 }}
                    >
                      Simulate rollover: +${remaining}
                    </Button>
                  )}
                  
                  {simulatedRollover[budget.id] && (
                    <Typography variant="caption" color="text.secondary">
                      Next month would be: ${budget.amount + simulatedRollover[budget.id]}
                    </Typography>
                  )}
                  
                  {/* Actions */}
                  <Grid container spacing={1} sx={{ mt: 1 }}>
                    <Grid item>
                      <Button 
                        size="small" 
                        startIcon={<Edit />}
                        onClick={() => handleEdit(budget)}
                      >
                        Edit
                      </Button>
                    </Grid>
                    <Grid item>
                      <Button 
                        size="small" 
                        startIcon={<Delete />}
                        onClick={() => handleDelete(budget.id)}
                        color="error"
                      >
                        Delete
                      </Button>
                    </Grid>
                  </Grid>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* Charts Section */}
        <Grid container spacing={3}>
          {/* Budget vs Actual */}
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Budget vs Actual Spending
              </Typography>
              <Bar data={barData} />
            </Card>
          </Grid>
          
          {/* Category Breakdown */}
          {transactions.length > 0 && (
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Spending by Category
                </Typography>
                <Pie data={{
                  labels: Object.keys(getCategorySpending()),
                  datasets: [{
                    data: Object.values(getCategorySpending()),
                    backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#8e44ad"]
                  }]
                }} />
              </Card>
            </Grid>
          )}
        </Grid>
      </Paper>
    </ThemeProvider>
  );
};

export default Budget;