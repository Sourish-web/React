import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Cookies from "universal-cookie";
import { useNavigate } from "react-router-dom";
import Papa from "papaparse";
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Snackbar,
  Alert,
  Chip,
  Box,
} from "@mui/material";

const Goal = () => {
  const cookies = new Cookies();
  const navigate = useNavigate();
  const API_URL = "http://localhost:8090";

  const [goals, setGoals] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [goalForm, setGoalForm] = useState({
    id: null,
    name: "",
    targetAmount: "",
    currentAmount: "0",
    targetDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split("T")[0],
    category: "",
  });
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const statusOptions = ["all", "In Progress", "Completed", "Missed"];
  const categoryOptions = ["all", ...new Set(budgets.map(b => b.category).filter(c => c))];

  // Snackbar handler
  const showSnackbar = (message, severity = "success") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setOpenSnackbar(true);
  };

  // Fetch all data
  const fetchAllData = async () => {
    const token = cookies.get("token");
    if (!token) {
      navigate("/login");
      return;
    }

    setIsLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const goalsRes = await axios.get(`${API_URL}/getGoals`, { headers });
      const budgetsRes = await axios.get(`${API_URL}/getBudget`, { headers });
      const transactionsRes = await axios.get(`${API_URL}/transaction/all`, { headers });

      console.log("Raw Goals Response:", JSON.stringify(goalsRes.data, null, 2));
      console.log("Raw Budgets Response:", JSON.stringify(budgetsRes.data, null, 2));
      console.log("Raw Transactions Response:", JSON.stringify(transactionsRes.data, null, 2));

      // Validate and filter goals
      const seenGoalIds = new Set();
      const validGoals = goalsRes.data
        .filter(goal => {
          if (!goal) {
            console.warn("Null or undefined goal detected:", goal);
            return false;
          }
          if (goal.id == null || typeof goal.id !== "number" || goal.id <= 0 || isNaN(goal.id)) {
            console.warn("Invalid goal ID detected:", goal);
            return false;
          }
          if (seenGoalIds.has(goal.id)) {
            console.warn(`Duplicate goal ID detected: ${goal.id}`, goal);
            return false;
          }
          seenGoalIds.add(goal.id);
          return true;
        })
        .map(goal => ({
          ...goal,
          targetAmount: Number(goal.targetAmount) || 0,
          currentAmount: Number(goal.currentAmount) || 0,
          name: goal.name || "Unnamed Goal",
        }));

      if (goalsRes.data.length !== validGoals.length) {
        console.warn(`Filtered out ${goalsRes.data.length - validGoals.length} invalid or duplicate goals`);
        showSnackbar(
          "Some goals could not be loaded due to invalid or duplicate IDs. Please contact support or check the backend data.",
          "error"
        );
      }

      // Validate and filter budgets
      const validBudgets = budgetsRes.data
        .filter(budget => {
          if (!budget) {
            console.warn("Null or undefined budget detected:", budget);
            return false;
          }
          if (budget.id == null || budget.id <= 0) {
            console.warn("Invalid budget ID detected:", budget);
            return false;
          }
          if (budget.category == null || budget.category === "") {
            console.warn("Budget with null or empty category detected:", budget);
            return false;
          }
          return true;
        })
        .map(budget => ({
          ...budget,
          amount: Number(budget.amount) || 0,
          spent: Number(budget.spent || 0),
          category: budget.category || "Uncategorized",
        }));

      if (budgetsRes.data.length !== validBudgets.length) {
        console.warn(`Filtered out ${budgetsRes.data.length - validBudgets.length} invalid budgets`);
        showSnackbar(
          "Some budgets could not be loaded due to invalid IDs or categories. Please add a valid budget.",
          "warning"
        );
      }

      // Validate and filter transactions
      const seenTransactionIds = new Set();
      const validTransactions = transactionsRes.data
        .filter(transaction => {
          if (!transaction) {
            console.warn("Null or undefined transaction detected:", transaction);
            return false;
          }
          if (transaction.id == null || typeof transaction.id !== "number" || transaction.id <= 0 || isNaN(transaction.id)) {
            console.warn("Invalid transaction ID detected:", transaction);
            return false;
          }
          if (seenTransactionIds.has(transaction.id)) {
            console.warn(`Duplicate transaction ID detected: ${transaction.id}`, transaction);
            return false;
          }
          seenTransactionIds.add(transaction.id);
          // Validate goalId
          if (transaction.goalId && !validGoals.some(g => g.id === transaction.goalId)) {
            console.warn(`Invalid goalId ${transaction.goalId} in transaction:`, transaction);
            transaction.goalId = null; // Reset invalid goalId
          }
          return true;
        })
        .map(transaction => ({
          ...transaction,
          amount: Number(transaction.amount) || 0,
          goalId: transaction.goalId || null,
        }));

      if (transactionsRes.data.length !== validTransactions.length) {
        console.warn(`Filtered out ${transactionsRes.data.length - validTransactions.length} invalid or duplicate transactions`);
        showSnackbar(
          "Some transactions could not be loaded due to invalid or duplicate IDs. Please check your transaction data.",
          "warning"
        );
      }

      setGoals(validGoals);
      setBudgets(validBudgets);
      setTransactions(validTransactions);
    } catch (err) {
      console.error("Fetch error:", err.response || err);
      showSnackbar(`Failed to fetch data: ${err.response?.status || ''} ${err.message}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [navigate]);

  // Goal progress notifications
  useEffect(() => {
    goals.forEach(goal => {
      const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
      const daysUntilTarget = Math.ceil(
        (new Date(goal.targetDate) - new Date()) / (1000 * 60 * 60 * 24)
      );
      if (progress >= 80 && progress < 100 && goal.status === "In Progress") {
        showSnackbar(
          `Goal "${goal.name}" is ${progress.toFixed(1)}% complete! Consider adding more funds.`,
          "info"
        );
      }
      if (daysUntilTarget <= 30 && daysUntilTarget > 0 && goal.status === "In Progress") {
        showSnackbar(
          `Goal "${goal.name}" is due in ${daysUntilTarget} days!`,
          "warning"
        );
      }
    });
  }, [goals]);

  // Handle goal form changes
  const handleGoalChange = (e) => {
    const { name, value } = e.target;
    const safeValue = value === null || value === undefined ? "" : value;
    setGoalForm(prev => ({ ...prev, [name]: safeValue }));
  };

  // Submit goal
  const handleGoalSubmit = async (e) => {
    e.preventDefault();
    const token = cookies.get("token");
    if (!token) {
      showSnackbar("Not authenticated", "error");
      return;
    }

    if (!goalForm.name || !goalForm.targetAmount || Number(goalForm.targetAmount) <= 0 || !goalForm.category) {
      showSnackbar("Please enter a valid name, target amount, and category", "error");
      return;
    }

    const goalPayload = {
      ...goalForm,
      targetAmount: Number(goalForm.targetAmount) || 0,
      currentAmount: Number(goalForm.currentAmount) || 0,
    };
    console.log("Goal Payload:", JSON.stringify(goalPayload, null, 2));

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const endpoint = isEditing ? "/updateGoal" : "/addGoal";
      const response = await axios.post(`${API_URL}${endpoint}`, goalPayload, { headers });
      console.log("Goal Response:", JSON.stringify(response.data, null, 2));

      showSnackbar(`Goal ${isEditing ? "updated" : "added"} successfully`, "success");
      resetForm();
      fetchAllData();
    } catch (err) {
      console.error("Goal Submit Error:", err.response || err);
      showSnackbar(`Error saving goal: ${err.response?.data || err.message}`, "error");
    }
  };

  // Allocate funds to goal
  const handleAllocateFunds = async (goalId, amount) => {
    const token = cookies.get("token");
    if (!token) {
      showSnackbar("Not authenticated", "error");
      return;
    }

    if (!amount || Number(amount) <= 0) {
      showSnackbar("Please enter a valid amount", "error");
      return;
    }

    try {
      await axios.post(
        `${API_URL}/allocateToGoal/${goalId}`,
        { amount: Number(amount) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showSnackbar("Funds allocated successfully", "success");
      fetchAllData();
    } catch (err) {
      console.error("Allocate Funds Error:", err.response || err);
      showSnackbar(`Error allocating funds: ${err.response?.data || err.message}`, "error");
    }
  };

  // Delete goal
  const handleDeleteGoal = async (id) => {
    const token = cookies.get("token");
    if (!token) {
      showSnackbar("Not authenticated", "error");
      return;
    }

    try {
      await axios.get(`${API_URL}/deleteGoal/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      showSnackbar("Goal deleted successfully", "success");
      fetchAllData();
    } catch (err) {
      console.error("Delete Goal Error:", err.response || err);
      showSnackbar(`Error deleting goal: ${err.response?.data || err.message}`, "error");
    }
  };

  // Reset form
  const resetForm = () => {
    setGoalForm({
      id: null,
      name: "",
      targetAmount: "",
      currentAmount: "0",
      targetDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split("T")[0],
      category: "",
    });
    setIsEditing(false);
  };

  // Calculate goal insights and category summary
  const goalInsights = useMemo(() => {
    const budgetSummary = budgets.reduce(
      (acc, budget) => ({
        totalAvailable: acc.totalAvailable + (budget.amount - budget.spent),
      }),
      { totalAvailable: 0 }
    );

    const goalData = goals.map(goal => {
      const remainingAmount = goal.targetAmount - goal.currentAmount;
      const daysUntilTarget = Math.ceil(
        (new Date(goal.targetDate) - new Date()) / (1000 * 60 * 60 * 24)
      );
      const monthlyContribution = daysUntilTarget > 30 ? remainingAmount / (daysUntilTarget / 30) : remainingAmount;
      return {
        ...goal,
        percentProgress: goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0,
        remainingAmount,
        daysUntilTarget,
        monthlyContribution,
      };
    });

    const categorySummary = {};
    goals.forEach(goal => {
      const cat = goal.category || "Uncategorized";
      if (!categorySummary[cat]) {
        categorySummary[cat] = { count: 0, totalTarget: 0, totalFunded: 0 };
      }
      categorySummary[cat].count += 1;
      categorySummary[cat].totalTarget += goal.targetAmount;
      categorySummary[cat].totalFunded += goal.currentAmount;
    });
    const categoryData = Object.entries(categorySummary).map(([category, data]) => ({
      category,
      ...data,
      avgProgress: data.totalTarget > 0 ? (data.totalFunded / data.totalTarget) * 100 : 0,
    }));

    return { goalData, budgetSummary, categoryData };
  }, [goals, budgets]);

  // Export goals report
  const handleExportGoals = () => {
    const csvData = goalInsights.goalData.map(goal => ({
      Name: goal.name,
      Category: goal.category || "N/A",
      "Target Amount": goal.targetAmount.toFixed(2),
      "Current Amount": goal.currentAmount.toFixed(2),
      Progress: goal.percentProgress.toFixed(1) + "%",
      "Target Date": goal.targetDate,
      Status: goal.status,
    }));
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "goals_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showSnackbar("Goals report exported successfully", "success");
  };

  return (
    <Grid container spacing={3}>
      {/* Goal Form */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {isEditing ? "Edit Goal" : "Create Goal"}
            </Typography>
            <form onSubmit={handleGoalSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Goal Name"
                    name="name"
                    value={goalForm.name}
                    onChange={handleGoalChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Target Amount"
                    name="targetAmount"
                    type="number"
                    value={goalForm.targetAmount}
                    onChange={handleGoalChange}
                    required
                    inputProps={{ min: 0, step: "0.01" }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Current Amount"
                    name="currentAmount"
                    type="number"
                    value={goalForm.currentAmount}
                    onChange={handleGoalChange}
                    inputProps={{ min: 0, step: "0.01" }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Target Date"
                    name="targetDate"
                    type="date"
                    value={goalForm.targetDate}
                    onChange={handleGoalChange}
                    required
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                      name="category"
                      value={goalForm.category}
                      onChange={handleGoalChange}
                      label="Category"
                      required
                      disablePortal
                      disabled={budgets.length === 0}
                    >
                      {budgets.length === 0 ? (
                        <MenuItem disabled value="">
                          No budgets available
                        </MenuItem>
                      ) : (
                        budgets.map(budget => (
                          <MenuItem
                            key={`budget-${budget.id}`}
                            value={budget.category}
                          >
                            {budget.category}
                          </MenuItem>
                        ))
                      )}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <div className="flex space-x-2">
                    <Button type="submit" variant="contained" color="primary" disabled={budgets.length === 0}>
                      {isEditing ? "Update" : "Add"} Goal
                    </Button>
                    {isEditing && (
                      <Button variant="outlined" onClick={resetForm}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      </Grid>

      {/* Goal Category Analytics */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Goal Category Analytics</Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Category</TableCell>
                    <TableCell align="right">Goals</TableCell>
                    <TableCell align="right">Total Target (₹)</TableCell>
                    <TableCell align="right">Total Funded (₹)</TableCell>
                    <TableCell align="right">Average Progress (%)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {goalInsights.categoryData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No goals available.
                      </TableCell>
                    </TableRow>
                  )}
                  {goalInsights.categoryData.map(item => (
                    <TableRow key={item.category}>
                      <TableCell>{item.category}</TableCell>
                      <TableCell align="right">{item.count}</TableCell>
                      <TableCell align="right">{item.totalTarget.toFixed(2)}</TableCell>
                      <TableCell align="right">{item.totalFunded.toFixed(2)}</TableCell>
                      <TableCell align="right">{item.avgProgress.toFixed(1)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Goal Funding Planner */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Goal Funding Planner</Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Goal</TableCell>
                    <TableCell align="right">Remaining (₹)</TableCell>
                    <TableCell align="right">Days Left</TableCell>
                    <TableCell align="right">Monthly Contribution (₹)</TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {goalInsights.goalData.filter(g => g.status === "In Progress").length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No active goals to plan.
                      </TableCell>
                    </TableRow>
                  )}
                  {goalInsights.goalData
                    .filter(g => g.status === "In Progress")
                    .map(goal => (
                      <TableRow key={goal.id}>
                        <TableCell>{goal.name}</TableCell>
                        <TableCell align="right">{goal.remainingAmount.toFixed(2)}</TableCell>
                        <TableCell align="right">{goal.daysUntilTarget}</TableCell>
                        <TableCell align="right">{goal.monthlyContribution.toFixed(2)}</TableCell>
                        <TableCell align="right">
                          <Button
                            onClick={() => {
                              const amount = prompt(
                                `Enter amount to allocate (Suggested: ₹${goal.monthlyContribution.toFixed(2)}):`
                              );
                              if (amount && Number(amount) > 0) {
                                if (Number(amount) > goalInsights.budgetSummary.totalAvailable) {
                                  showSnackbar("Insufficient funds in budgets", "error");
                                  return;
                                }
                                handleAllocateFunds(goal.id, Number(amount));
                              } else {
                                showSnackbar("Please enter a valid amount", "error");
                              }
                            }}
                            disabled={!goal.category}
                          >
                            Allocate
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Typography sx={{ mt: 2 }}>
              Total Available from Budgets: ₹{goalInsights.budgetSummary.totalAvailable.toFixed(2)}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Goal Insights Table */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Goal Insights</Typography>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Filter by Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  label="Filter by Status"
                  disablePortal
                >
                  {statusOptions.map(status => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Filter by Category</InputLabel>
                <Select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  label="Filter by Category"
                  disablePortal
                >
                  {categoryOptions.map(cat => (
                    <MenuItem key={cat} value={cat}>
                      {cat === "all" ? "All" : cat}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button variant="outlined" onClick={handleExportGoals}>
                Export Goals
              </Button>
            </Box>
            {isLoading && <LinearProgress />}
            <TableContainer component={Paper}>
              <Table aria-label="Goal insights table">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell align="right">Target Amount</TableCell>
                    <TableCell align="right">Current Amount</TableCell>
                    <TableCell align="right">Progress</TableCell>
                    <TableCell align="right">Target Date</TableCell>
                    <TableCell align="right">Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {goalInsights.goalData.length === 0 && !isLoading && (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        No goals added. Please add a goal above.
                      </TableCell>
                    </TableRow>
                  )}
                  {goalInsights.goalData
                    .filter(goal => statusFilter === "all" || goal.status === statusFilter)
                    .filter(goal => categoryFilter === "all" || goal.category === categoryFilter)
                    .map(goal => (
                      <TableRow key={goal.id}>
                        <TableCell>{goal.name}</TableCell>
                        <TableCell>{goal.category || "N/A"}</TableCell>
                        <TableCell align="right">₹{goal.targetAmount.toFixed(2)}</TableCell>
                        <TableCell align="right">₹{goal.currentAmount.toFixed(2)}</TableCell>
                        <TableCell align="right">
                          <LinearProgress
                            variant="determinate"
                            value={goal.percentProgress > 100 ? 100 : goal.percentProgress}
                            color={goal.percentProgress >= 100 ? "success" : "primary"}
                            sx={{ width: 100 }}
                          />
                          {goal.percentProgress.toFixed(1)}%
                        </TableCell>
                        <TableCell align="right">{goal.targetDate}</TableCell>
                        <TableCell align="right">
                          <Chip
                            label={goal.status}
                            color={
                              goal.status === "Completed"
                                ? "success"
                                : goal.status === "Missed"
                                ? "error"
                                : "warning"
                            }
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            onClick={() => {
                              setGoalForm({
                                id: goal.id,
                                name: goal.name,
                                targetAmount: goal.targetAmount.toString(),
                                currentAmount: goal.currentAmount.toString(),
                                targetDate: goal.targetDate,
                                category: goal.category || "",
                              });
                              setIsEditing(true);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            color="error"
                            onClick={() => handleDeleteGoal(goal.id)}
                          >
                            Delete
                          </Button>
                          <Button
                            onClick={() => {
                              const amount = prompt("Enter amount to allocate:");
                              if (amount && Number(amount) > 0) {
                                if (Number(amount) > goalInsights.budgetSummary.totalAvailable) {
                                  showSnackbar("Insufficient funds in budgets", "error");
                                  return;
                                }
                                handleAllocateFunds(goal.id, Number(amount));
                              } else {
                                showSnackbar("Please enter a valid amount", "error");
                              }
                            }}
                            disabled={!goal.category}
                          >
                            Allocate Funds
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Budget Funding Summary */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Funding Available for Goals</Typography>
            <Typography>
              Total Available from Budgets: ₹{goalInsights.budgetSummary.totalAvailable.toFixed(2)}
            </Typography>
            {goalInsights.goalData.map(goal => (
              <Typography key={goal.id}>
                {goal.name} ({goal.category || "N/A"}): Suggested monthly contribution ₹{goal.monthlyContribution.toFixed(2)}
                (₹{goal.remainingAmount.toFixed(2)} needed by {goal.targetDate})
              </Typography>
            ))}
          </CardContent>
        </Card>
      </Grid>

      {/* Snackbar */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setOpenSnackbar(false)}
          severity={snackbarSeverity}
          variant="filled"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Grid>
  );
};
export default Goal;