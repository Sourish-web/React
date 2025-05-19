import React, { useEffect, useState, useRef, useMemo } from "react";
import axios from "axios";
import Cookies from "universal-cookie";
import { useNavigate } from "react-router-dom";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { parse } from "papaparse";
import PropTypes from "prop-types";
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  LineChart,
  Line,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
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
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  Alert,
  Tabs,
  Tab,
  Box,
  LinearProgress,
} from "@mui/material";
import {
  Delete,
  Edit,
  Search,
  AttachMoney,
  FileDownload,
  DarkMode,
  LightMode,
  Savings,
  Receipt,
  ShowChart,
} from "@mui/icons-material";
import { FiLogOut } from "react-icons/fi";

// Simple debounce function
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const CombinedTracker = () => {
  const cookies = new Cookies();
  const navigate = useNavigate();
  const API_URL = "http://localhost:8090";
  const searchInputRef = useRef(null);

  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editType, setEditType] = useState(null);
  const [deletedItem, setDeletedItem] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [savingsHistory, setSavingsHistory] = useState(() => {
    return JSON.parse(localStorage.getItem("savingsHistory")) || [];
  });
  const [updateKey, setUpdateKey] = useState(0);
  const [isLoadingBudgets, setIsLoadingBudgets] = useState(false);

  // Form states
  const [budgetForm, setBudgetForm] = useState({
    id: null,
    amount: "",
    period: "MONTHLY",
    spent: "0",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split("T")[0],
    category: "OTHER",
  });

  const [transactionForm, setTransactionForm] = useState({
    id: null,
    description: "",
    amount: "",
    transactionDate: new Date().toISOString().split("T")[0],
    category: "OTHER",
  });

  // Filter state
  const [filters, setFilters] = useState({
    search: "",
    fromDate: "",
    toDate: "",
    minAmount: "",
    maxAmount: "",
    category: "all",
    sortBy: "date",
    sortOrder: "desc",
    budgetPeriod: "all",
  });

  // Categories and Periods
  const categories = [
    "FOOD",
    "TRANSPORT",
    "HOUSING",
    "ENTERTAINMENT",
    "UTILITIES",
    "HEALTHCARE",
    "EDUCATION",
    "SAVINGS",
    "OTHER",
  ];

  const periods = ["WEEKLY", "MONTHLY", "YEARLY"];

  // Chart colors
  const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#f87171", "#34d399", "#60a5fa", "#fbbf24", "#a78bfa", "#f472b6"];

  // Enhanced color palette
  const themeColors = {
    primary: darkMode ? "#00c4b4" : "#4f46e5",
    success: "#10b981",
    warning: "#f59e0b",
    error: "#ef4444",
    background: darkMode ? "#1a1b1e" : "#ffffff",
    text: darkMode ? "#e2e8f0" : "#333333",
    cardBackground: darkMode ? "#2d2d2d" : "#ffffff",
  };

  // Custom styled components
  const StyledCard = ({ children, ...props }) => (
    <Card
      {...props}
      sx={{
        backgroundColor: themeColors.cardBackground,
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        border: "1px solid #e5e7eb",
        transition: "transform 0.3s, box-shadow 0.3s",
        "&:hover": {
          transform: "scale(1.02)",
          boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
        },
      }}
    >
      {children}
    </Card>
  );

  const GradientHeader = () => (
    <div style={styles.header}>
      <div style={styles.logo}>
        <span style={styles.logoText}>Financial Dashboard</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <IconButton onClick={() => setDarkMode(!darkMode)} style={{ color: "#ffffff" }}>
          {darkMode ? <LightMode /> : <DarkMode />}
        </IconButton>
        <button
          style={styles.logoutButton}
          onClick={() => {
            cookies.remove("token", { path: "/" });
            navigate("/login");
          }}
          aria-label="Log out"
        >
          <FiLogOut size={18} /> Logout
        </button>
      </div>
    </div>
  );

  const SummaryCard = ({ title, value, color, icon }) => (
    <StyledCard className="summary-card">
      <CardContent style={{ padding: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <Typography style={styles.statTitle}>{title}</Typography>
            <Typography style={{ ...styles.statValue, color }}>{`₹${typeof value === "number" ? value.toFixed(2) : value}`}</Typography>
          </div>
          <div style={styles.iconContainer}>
            {React.cloneElement(icon, { style: { fontSize: "1.75rem", color } })}
          </div>
        </div>
      </CardContent>
    </StyledCard>
  );

  const BudgetCard = ({ budget }) => {
    const progress = (Number(budget.spent) / Number(budget.amount)) * 100;
    const daysLeft = Math.ceil((new Date(budget.endDate) - new Date()) / (1000 * 60 * 60 * 24));

    return (
      <StyledCard className="budget-card">
        <CardContent style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
            <div>
              <Typography style={styles.planName}>{budget.category}</Typography>
              <Typography style={styles.sectionSubtitle}>
                {budget.period.charAt(0).toUpperCase() + budget.period.slice(1).toLowerCase()}
              </Typography>
            </div>
            <Chip
              label={`${daysLeft >= 0 ? daysLeft : 0}d left`}
              size="small"
              style={{
                backgroundColor: daysLeft < 7 ? themeColors.error + "15" : themeColors.primary + "15",
                color: daysLeft < 7 ? themeColors.error : themeColors.primary,
                fontSize: "0.75rem",
                fontWeight: 500,
              }}
            />
          </div>
          <LinearProgress
            variant="determinate"
            value={progress > 100 ? 100 : progress}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: darkMode ? "#374151" : "#e5e7eb",
              "& .MuiLinearProgress-bar": {
                borderRadius: 4,
                backgroundColor:
                  progress > 100 ? themeColors.error : progress > 75 ? themeColors.warning : themeColors.success,
              },
            }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1rem" }}>
            <Typography style={styles.sectionSubtitle}>Spent: ₹{Number(budget.spent).toFixed(2)}</Typography>
            <Typography style={styles.sectionSubtitle}>Budget: ₹{Number(budget.amount).toFixed(2)}</Typography>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", justifyContent: "flex-end" }}>
            <IconButton
              size="small"
              onClick={() => handleEditBudget(budget)}
              style={{ color: themeColors.primary }}
              className="action-button"
            >
              <Edit fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => confirmDelete(budget, "budget")}
              style={{ color: themeColors.error }}
              className="action-button"
            >
              <Delete fontSize="small" />
            </IconButton>
          </div>
        </CardContent>
      </StyledCard>
  );
};

  const TransactionRow = ({ txn }) => (
    <TableRow
      hover
      sx={{
        "&:last-child td, &:last-child th": { border: 0 },
        transition: "background-color 0.3s",
      }}
      style={styles.tableRow}
    >
      <TableCell style={styles.tableCell}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div
            style={{
              backgroundColor: COLORS[categories.indexOf(txn.category) % COLORS.length] + "20",
              borderRadius: "8px",
              padding: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Receipt
              style={{
                color: COLORS[categories.indexOf(txn.category) % COLORS.length],
                fontSize: "1.25rem",
              }}
            />
          </div>
          <div>
            <Typography style={{ fontWeight: 500, color: themeColors.text }}>{txn.description}</Typography>
            <Typography style={styles.sectionSubtitle}>
              {new Date(txn.transactionDate).toLocaleDateString()}
            </Typography>
          </div>
        </div>
      </TableCell>
      <TableCell align="right" style={styles.tableCell}>
        <Typography
          style={{
            fontWeight: 600,
            color: Number(txn.amount) >= 0 ? themeColors.success : themeColors.error,
          }}
        >
          ₹{Number(txn.amount).toFixed(2)}
        </Typography>
      </TableCell>
      <TableCell style={styles.tableCell}>
        <Chip
          label={txn.category}
          size="small"
          style={{
            backgroundColor: COLORS[categories.indexOf(txn.category) % COLORS.length] + "20",
            color: COLORS[categories.indexOf(txn.category) % COLORS.length],
            fontWeight: 500,
            fontSize: "0.75rem",
          }}
        />
      </TableCell>
      <TableCell style={styles.tableCell}>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <IconButton
            size="small"
            onClick={() => handleEditTransaction(txn)}
            style={{ color: themeColors.primary }}
            className="action-button"
          >
            <Edit fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => confirmDelete(txn, "transaction")}
            style={{ color: themeColors.error }}
            className="action-button"
          >
            <Delete fontSize="small" />
          </IconButton>
        </div>
      </TableCell>
    </TableRow>
  );

  // Fetch all data
  const fetchAllData = debounce(async (retryCount = 0) => {
    const token = cookies.get("token");
    if (!token) {
      navigate("/login");
      return;
    }

    setIsLoadingBudgets(true);
    try {
      const [budgetsRes, transactionsRes] = await Promise.all([
        axios.get(`${API_URL}/getBudget`, {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(async (err) => {
          if (retryCount < 2 && err.response?.status >= 500) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            return axios.get(`${API_URL}/getBudget`, {
              headers: { Authorization: `Bearer ${token}` },
            });
          }
          throw err;
        }),
        axios.get(`${API_URL}/transaction/all`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const fetchedBudgets = (budgetsRes.data || []).map(budget => ({
        ...budget,
        id: budget.id || `temp-${Date.now()}`,
        amount: isNaN(Number(budget.amount)) || budget.amount == null ? 0 : Number(budget.amount),
        spent: isNaN(Number(budget.spent)) || budget.spent == null ? 0 : Number(budget.spent),
        period: periods.includes(budget.period) ? budget.period : "MONTHLY",
        startDate: budget.startDate || new Date().toISOString().split("T")[0],
        endDate: budget.endDate || new Date().toISOString().split("T")[0],
        category: categories.includes(budget.category) ? budget.category : "OTHER",
      }));

      const fetchedTransactions = (transactionsRes.data || []).map(txn => ({
        ...txn,
        id: txn.id || `temp-${Date.now()}`,
        amount: isNaN(Number(txn.amount)) || txn.amount == null ? 0 : Number(txn.amount),
        description: txn.description || "",
        transactionDate: txn.transactionDate || new Date().toISOString().split("T")[0],
        category: categories.includes(txn.category) ? txn.category : "OTHER",
      }));

      setBudgets(fetchedBudgets);
      setTransactions(fetchedTransactions);
      setUpdateKey(prev => prev + 1);
      calculateSavings(fetchedBudgets);
    } catch (err) {
      showSnackbar(`Failed to fetch data: ${err.response?.data?.message || err.message}`, "error");
    } finally {
      setIsLoadingBudgets(false);
    }
  }, 300);

  // Calculate savings
  const calculateSavings = (budgets) => {
    const now = new Date();
    const expiredBudgets = budgets.filter((budget) => new Date(budget.endDate) < now);

    const newSavings = expiredBudgets.map((budget) => {
      const savings = Number(budget.amount) - Number(budget.spent);
      return {
        id: budget.id,
        category: budget.category,
        period: budget.period,
        savings: savings >= 0 ? savings : 0,
        endDate: budget.endDate,
        timestamp: new Date().toISOString(),
      };
    });

    setSavingsHistory((prev) => {
      const existingIds = new Set(prev.map((item) => item.id));
      const updatedSavings = [
        ...prev,
        ...newSavings.filter((item) => !existingIds.has(item.id)),
      ];
      localStorage.setItem("savingsHistory", JSON.stringify(updatedSavings));
      return updatedSavings;
    });
  };

  // Apply filters
  const filteredTransactions = useMemo(() => {
    let result = [...transactions];

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      result = result.filter(
        (txn) =>
          (txn.description?.toLowerCase() || "").includes(searchTerm) ||
          (txn.category?.toLowerCase() || "").includes(searchTerm)
      );
    }

    if (filters.fromDate) {
      result = result.filter((txn) => txn.transactionDate >= filters.fromDate);
    }
    if (filters.toDate) {
      result = result.filter((txn) => txn.transactionDate <= filters.toDate);
    }

    if (filters.minAmount) {
      result = result.filter((txn) => Number(txn.amount) >= Number(filters.minAmount));
    }
    if (filters.maxAmount) {
      result = result.filter((txn) => Number(txn.amount) <= Number(filters.maxAmount));
    }

    if (filters.category !== "all") {
      result = result.filter((txn) => txn.category === filters.category);
    }

    result.sort((a, b) => {
      if (filters.sortBy === "amount") {
        return filters.sortOrder === "asc" ? Number(a.amount) - Number(b.amount) : Number(b.amount) - Number(a.amount);
      }
      return filters.sortOrder === "asc"
        ? new Date(a.transactionDate) - new Date(b.transactionDate)
        : new Date(b.transactionDate) - new Date(a.transactionDate);
    });

    return result;
  }, [transactions, filters]);

  const filteredBudgets = useMemo(
    () =>
      budgets.filter((b) => filters.budgetPeriod === "all" || b.period === filters.budgetPeriod),
    [budgets, filters.budgetPeriod]
  );

  // Form handlers
  const handleBudgetChange = (e) => {
    const { name, value } = e.target;
    setBudgetForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleTransactionChange = (e) => {
    const { name, value } = e.target;
    setTransactionForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({
      search: "",
      fromDate: "",
      toDate: "",
      minAmount: "",
      maxAmount: "",
      category: "all",
      sortBy: "date",
      sortOrder: "desc",
      budgetPeriod: "all",
    });
  };

  // Submit handlers
  const handleBudgetSubmit = async (e) => {
    e.preventDefault();
    const token = cookies.get("token");
    if (!token) return showSnackbar("Not authenticated", "error");

    if (!categories.includes(budgetForm.category)) {
      return showSnackbar("Please select a valid category", "error");
    }
    if (!budgetForm.amount || isNaN(Number(budgetForm.amount)) || Number(budgetForm.amount) <= 0) {
      return showSnackbar("Please enter a valid budget amount", "error");
    }

    const budgetPayload = {
      ...budgetForm,
      amount: Number(budgetForm.amount),
      spent: Number(budgetForm.spent) || 0,
      category: budgetForm.category || "OTHER",
    };

    let optimisticBudget = null;
    try {
      optimisticBudget = {
        ...budgetPayload,
        id: `temp-${Date.now()}`,
      };
      setBudgets((prevBudgets) => [...prevBudgets, optimisticBudget]);
      setUpdateKey((prev) => prev + 1);

      const headers = { Authorization: `Bearer ${token}` };
      const endpoint = isEditing && editType === "budget" ? "/updateBudget" : "/addBudget";
      await axios.post(`${API_URL}${endpoint}`, budgetPayload, { headers });
      showSnackbar(`Budget ${isEditing ? "updated" : "added"} successfully`, "success");
      resetForms();
      setTimeout(fetchAllData, 500);
    } catch (err) {
      if (optimisticBudget) {
        setBudgets((prevBudgets) => prevBudgets.filter((b) => b.id !== optimisticBudget.id));
        setUpdateKey((prev) => prev + 1);
      }
      showSnackbar(
        `Error saving budget: ${err.response?.data?.message || err.message}`,
        "error"
      );
    }
  };

  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    const token = cookies.get("token");
    if (!token) return showSnackbar("Not authenticated", "error");

    if (!categories.includes(transactionForm.category)) {
      return showSnackbar("Invalid category selected", "error");
    }

    let optimisticTransaction = null;
    try {
      optimisticTransaction = {
        ...transactionForm,
        id: `temp-${Date.now()}`,
        amount: Number(transactionForm.amount),
      };
      setTransactions((prevTransactions) => [...prevTransactions, optimisticTransaction]);
      setUpdateKey((prev) => prev + 1);

      const headers = { Authorization: `Bearer ${token}` };
      const endpoint = isEditing && editType === "transaction" ? "/transaction/update" : "/transaction/add";
      await axios.post(`${API_URL}${endpoint}`, transactionForm, { headers });
      showSnackbar(`Transaction ${isEditing ? "updated" : "added"} successfully`, "success");
      resetForms();
      await fetchAllData();
    } catch (err) {
      if (optimisticTransaction) {
        setTransactions((prevTransactions) =>
          prevTransactions.filter((t) => t.id !== optimisticTransaction.id)
        );
        setUpdateKey((prev) => prev + 1);
      }
      showSnackbar(
        `Error saving transaction: ${err.response?.data?.message || err.message}`,
        "error"
      );
    }
  };

  const resetForms = () => {
    setBudgetForm({
      id: null,
      amount: "",
      period: "MONTHLY",
      spent: "0",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split("T")[0],
      category: "OTHER",
    });
    setTransactionForm({
      id: null,
      description: "",
      amount: "",
      transactionDate: new Date().toISOString().split("T")[0],
      category: "OTHER",
    });
    setIsEditing(false);
    setEditType(null);
  };

  // Edit handlers
  const handleEditBudget = (budget) => {
    setBudgetForm({
      ...budget,
      category: budget.category || "OTHER",
    });
    setIsEditing(true);
    setEditType("budget");
    setActiveTab(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEditTransaction = (txn) => {
    setTransactionForm({
      ...txn,
      category: txn.category || "OTHER",
    });
    setIsEditing(true);
    setEditType("transaction");
    setActiveTab(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Delete handlers
  const confirmDelete = (item, type) => {
    setItemToDelete({ ...item, type });
    setOpenDeleteDialog(true);
  };

  const handleDelete = async () => {
    const token = cookies.get("token");
    if (!token || !itemToDelete) {
      showSnackbar("Not authenticated. Please log in again.", "error");
      navigate("/login");
      return;
    }

    try {
      setDeletedItem({ ...itemToDelete });

      const endpoint =
        itemToDelete.type === "budget"
          ? `${API_URL}/Budget/delete/${itemToDelete.id}`
          : `${API_URL}/transaction/delete/${itemToDelete.id}`;

      await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (itemToDelete.type === "budget") {
        setBudgets(budgets.filter((b) => b.id !== itemToDelete.id));
      } else {
        setTransactions(transactions.filter((t) => t.id !== itemToDelete.id));
      }
      await fetchAllData();
      showSnackbar(`${itemToDelete.type === "budget" ? "Budget" : "Transaction"} deleted successfully`, "success");
    } catch (err) {
      showSnackbar(
        `Error deleting ${itemToDelete.type}: ${err.response?.data?.message || err.message}`,
        "error"
      );
    } finally {
      setOpenDeleteDialog(false);
      setItemToDelete(null);
    }
  };

  const undoDelete = async () => {
    if (!deletedItem) return;

    const token = cookies.get("token");
    if (!token) {
      showSnackbar("Not authenticated. Please log in again.", "error");
      navigate("/login");
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const endpoint =
        deletedItem.type === "budget" ? "/addBudget" : "/transaction/add";

      const { id, type, ...itemData } = deletedItem;
      await axios.post(`${API_URL}${endpoint}`, itemData, { headers });

      await fetchAllData();
      showSnackbar(`${deletedItem.type === "budget" ? "Budget" : "Transaction"} restored`, "success");
    } catch (err) {
      showSnackbar(
        `Error restoring ${deletedItem.type}: ${err.response?.data?.message || err.message}`,
        "error"
      );
    } finally {
      setDeletedItem(null);
    }
  };

  // Export functions
  const exportToCSV = (type) => {
    const data = type === "budget" ? budgets : filteredTransactions;
    const headers =
      type === "budget"
        ? ["Period", "Amount", "Spent", "Start Date", "End Date", "Category"]
        : ["Description", "Amount", "Category", "Date"];
    const csvData = parse(
      [
        headers,
        ...data.map((item) =>
          type === "budget"
            ? [
                item.period,
                item.amount,
                item.spent,
                item.startDate,
                item.endDate,
                item.category,
              ]
            : [item.description, item.amount, item.category, item.transactionDate]
        ),
      ],
      { header: false }
    ).data;
    const blob = new Blob([csvData.join("\n")], { type: "text/csv;charset=utf-8" });
    saveAs(blob, `${type}s.csv`);
  };

  const exportToExcel = (type) => {
    const data = type === "budget" ? budgets : filteredTransactions;
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `${type}s`);
    XLSX.writeFile(workbook, `${type}s.xlsx`);
  };

  // Snackbar handler
  const showSnackbar = (message, severity = "success") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setOpenSnackbar(true);
  };

  // Calculate summary
  const summary = useMemo(() => {
    const categorySpending = transactions.reduce((acc, txn) => {
      acc[txn.category] = (acc[txn.category] || 0) + Number(txn.amount);
      return acc;
    }, {});

    const categoryBudgetDetails = categories.reduce((acc, cat) => {
      const categoryBudgets = budgets.filter((b) => b.category === cat);
      const totalCategoryBudget = categoryBudgets.reduce(
        (sum, b) => sum + Number(b.amount),
        0
      );
      const totalCategorySpent = categorySpending[cat] || 0;
      const remainingCategoryBudget = totalCategoryBudget - totalCategorySpent;
      const percentCategorySpent = totalCategoryBudget > 0
        ? (totalCategorySpent / totalCategoryBudget) * 100
        : 0;

      const categoryTransactions = transactions.filter((t) => t.category === cat);
      const avgSpendingPerTransaction =
        categoryTransactions.length > 0
          ? totalCategorySpent / categoryTransactions.length
          : 0;

      acc[cat] = {
        totalBudget: totalCategoryBudget,
        totalSpent: totalCategorySpent,
        remainingBudget: remainingCategoryBudget,
        percentSpent: percentCategorySpent,
        avgSpendingPerTransaction,
        transactionCount: categoryTransactions.length,
      };
      return acc;
    }, {});

    const totalBudget = Object.values(categoryBudgetDetails).reduce(
      (sum, cat) => sum + cat.totalBudget,
      0
    );
    const totalSpent = Object.values(categorySpending).reduce(
      (sum, amount) => sum + amount,
      0
    );
    const remainingBudget = totalBudget - totalSpent;
    const percentSpent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    const totalSavings = savingsHistory.reduce((sum, item) => sum + item.savings, 0);

    return {
      totalBudget,
      totalSpent,
      remainingBudget,
      percentSpent,
      categorySpending,
      categoryBudgetDetails,
      totalSavings,
      largestTransaction: transactions.length > 0
        ? Math.max(...transactions.map((t) => Math.abs(Number(t.amount))))
        : 0,
      frequentCategory: transactions.length > 0
        ? Object.entries(categorySpending).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A"
        : "N/A",
    };
  }, [budgets, transactions, savingsHistory]);

  // Chart data
  const categoryChartData = Object.entries(summary.categorySpending).map(([name, value]) => ({
    name,
    value: Math.abs(value),
  }));

  const monthlyData = transactions.reduce((acc, txn) => {
    const month = new Date(txn.transactionDate).toLocaleString("default", { month: "short" });
    acc[month] = (acc[month] || 0) + Number(txn.amount);
    return acc;
  }, {});

  const monthlyChartData = Object.entries(monthlyData).map(([name, value]) => ({
    name,
    income: value > 0 ? value : 0,
    expense: value < 0 ? Math.abs(value) : 0,
  }));

  const budgetVsActualData = budgets.map((budget) => ({
    name: budget.period,
    budget: Number(budget.amount),
    actual: Number(budget.spent),
  }));

  const savingsTrendData = useMemo(() => {
    const grouped = savingsHistory.reduce((acc, item) => {
      const month = new Date(item.endDate).toLocaleString("default", { month: "short", year: "numeric" });
      acc[month] = (acc[month] || 0) + item.savings;
      return acc;
    }, {});
    return Object.entries(grouped)
      .map(([month, savings]) => ({ month, savings }))
      .sort((a, b) => new Date(a.month) - new Date(b.month));
  }, [savingsHistory]);

  // Initialize data
  useEffect(() => {
    fetchAllData();
  }, [navigate]);

  // Add hover effects
  useEffect(() => {
    const cards = document.querySelectorAll(".summary-card, .budget-card, .table-container");
    cards.forEach((card) => {
      card.addEventListener("mouseenter", () => {
        card.style.transform = "scale(1.02)";
        card.style.boxShadow = "0 4px 8px rgba(0,0,0,0.15)";
      });
      card.addEventListener("mouseleave", () => {
        card.style.transform = "scale(1)";
        card.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
      });
    });

    const buttons = document.querySelectorAll(".action-button, .submit-button, .filter-button");
    buttons.forEach((button) => {
      button.addEventListener("mouseenter", () => {
        button.style.background = "linear-gradient(145deg, #00c4b4, #00a69a)";
        button.style.transform = "scale(1.05)";
      });
      button.addEventListener("mouseleave", () => {
        button.style.background = button.classList.contains("delete-button") ? "#ef4444" : "#00c4b4";
        button.style.transform = "scale(1)";
      });
    });

    return () => {
      cards.forEach((card) => {
        card.removeEventListener("mouseenter", () => {});
        card.removeEventListener("mouseleave", () => {});
      });
      buttons.forEach((button) => {
        button.removeEventListener("mouseenter", () => {});
        button.removeEventListener("mouseleave", () => {});
      });
    };
  }, []);

  return (
    <div style={styles.container}>
      <GradientHeader />

      <main style={styles.main}>
        <section style={darkMode ? styles.sectionGray : styles.section}>
          {/* Tabs */}
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant="fullWidth"
            sx={{
              mb: 4,
              background: darkMode ? "#2d2d2d" : "#f5f6f5",
              borderRadius: "8px",
              "& .MuiTabs-indicator": {
                backgroundColor: themeColors.primary,
                height: 3,
              },
            }}
          >
            <Tab
              label="Budgets"
              icon={<Savings />}
              sx={{
                color: activeTab === 0 ? themeColors.primary : (darkMode ? "#94a3b8" : "#666666"),
                textTransform: "none",
                fontSize: "1rem",
                fontWeight: 500,
              }}
            />
            <Tab
              label="Transactions"
              icon={<Receipt />}
              sx={{
                color: activeTab === 1 ? themeColors.primary : (darkMode ? "#94a3b8" : "#666666"),
                textTransform: "none",
                fontSize: "1rem",
                fontWeight: 500,
              }}
            />
            <Tab
              label="Analytics"
              icon={<ShowChart />}
              sx={{
                color: activeTab === 2 ? themeColors.primary : (darkMode ? "#94a3b8" : "#666666"),
                textTransform: "none",
                fontSize: "1rem",
                fontWeight: 500,
              }}
            />
          </Tabs>

          {/* Summary Cards */}
          <div style={styles.statsContainer}>
            <SummaryCard
              title="Total Budget"
              value={summary.totalBudget}
              color={themeColors.primary}
              icon={<Savings />}
            />
            <SummaryCard
              title="Total Spent"
              value={summary.totalSpent}
              color={themeColors.error}
              icon={<AttachMoney />}
            />
            <SummaryCard
              title="Remaining"
              value={summary.remainingBudget}
              color={summary.remainingBudget >= 0 ? themeColors.success : themeColors.error}
              icon={<Savings />}
            />
          </div>

          {/* Budgets Tab */}
          <Box hidden={activeTab !== 0}>
            <StyledCard className="summary-card">
              <CardContent>
                <Typography style={styles.sectionTitle}>
                  {isEditing && editType === "budget" ? "Edit Budget" : "Create Budget"}
                </Typography>
                <form onSubmit={handleBudgetSubmit}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Amount"
                        name="amount"
                        type="number"
                        value={budgetForm.amount}
                        onChange={handleBudgetChange}
                        required
                        inputProps={{ min: 0, step: "0.01" }}
                        InputLabelProps={{ style: styles.sectionSubtitle }}
                        sx={{ "& .MuiInputBase-root": { borderRadius: "6px" } }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel style={styles.sectionSubtitle}>Period</InputLabel>
                        <Select
                          name="period"
                          value={budgetForm.period}
                          onChange={handleBudgetChange}
                          label="Period"
                          required
                          sx={{ borderRadius: "6px" }}
                        >
                          {periods.map((period) => (
                            <MenuItem key={period} value={period}>
                              {period.charAt(0) + period.slice(1).toLowerCase()}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Start Date"
                        name="startDate"
                        type="date"
                        value={budgetForm.startDate}
                        onChange={handleBudgetChange}
                        required
                        InputLabelProps={{ shrink: true, style: styles.sectionSubtitle }}
                        sx={{ "& .MuiInputBase-root": { borderRadius: "6px" } }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="End Date"
                        name="endDate"
                        type="date"
                        value={budgetForm.endDate}
                        onChange={handleBudgetChange}
                        required
                        InputLabelProps={{ shrink: true, style: styles.sectionSubtitle }}
                        sx={{ "& .MuiInputBase-root": { borderRadius: "6px" } }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel style={styles.sectionSubtitle}>Category</InputLabel>
                        <Select
                          name="category"
                          value={budgetForm.category}
                          onChange={handleBudgetChange}
                          label="Category"
                          required
                          sx={{ borderRadius: "6px" }}
                        >
                          {categories.map((cat) => (
                            <MenuItem key={cat} value={cat}>
                              {cat.charAt(0) + cat.slice(1).toLowerCase()}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <Button
                          type="submit"
                          variant="contained"
                          style={styles.planButton}
                          className="submit-button"
                        >
                          {isEditing ? "Update" : "Add"} Budget
                        </Button>
                        {isEditing && (
                          <Button
                            variant="outlined"
                            style={styles.filterButton}
                            onClick={resetForms}
                            className="filter-button"
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </Grid>
                  </Grid>
                </form>
              </CardContent>
            </StyledCard>

            {/* Budget Filters */}
            <StyledCard className="summary-card" style={{ marginTop: "2rem" }}>
              <CardContent>
                <Typography style={styles.sectionTitle}>Budget Filters</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={4}>
                    <FormControl fullWidth>
                      <InputLabel style={styles.sectionSubtitle}>Period</InputLabel>
                      <Select
                        name="budgetPeriod"
                        value={filters.budgetPeriod}
                        onChange={handleFilterChange}
                        label="Period"
                        sx={{ borderRadius: "6px" }}
                      >
                        <MenuItem value="all">All Periods</MenuItem>
                        {periods.map((period) => (
                          <MenuItem key={period} value={period}>
                            {period.charAt(0) + period.slice(1).toLowerCase()}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<FileDownload />}
                      style={styles.filterButton}
                      onClick={() => exportToCSV("budget")}
                      className="filter-button"
                    >
                      Export CSV
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<FileDownload />}
                      style={styles.filterButton}
                      onClick={() => exportToExcel("budget")}
                      className="filter-button"
                    >
                      Export Excel
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </StyledCard>

            {/* Budget List */}
            <StyledCard className="summary-card" style={{ marginTop: "2rem" }}>
              <CardContent>
                <Typography style={styles.sectionTitle}>
                  Your Budgets ({filteredBudgets.length})
                </Typography>
                {isLoadingBudgets ? (
                  <LinearProgress />
                ) : filteredBudgets.length === 0 ? (
                  <Typography style={styles.noData}>
                    No budgets found. Add a budget to start tracking.
                  </Typography>
                ) : (
                  <Grid container spacing={3}>
                    {filteredBudgets.map((budget) => (
                      <Grid item xs={12} sm={6} md={4} key={budget.id}>
                        <BudgetCard budget={budget} />
                      </Grid>
                    ))}
                  </Grid>
                )}
              </CardContent>
            </StyledCard>
          </Box>

          {/* Transactions Tab */}
          <Box hidden={activeTab !== 1}>
            <StyledCard className="summary-card">
              <CardContent>
                <Typography style={styles.sectionTitle}>
                  {isEditing && editType === "transaction" ? "Edit Transaction" : "Add Transaction"}
                </Typography>
                <form onSubmit={handleTransactionSubmit}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Description"
                        name="description"
                        value={transactionForm.description}
                        onChange={handleTransactionChange}
                        required
                        InputLabelProps={{ style: styles.sectionSubtitle }}
                        sx={{ "& .MuiInputBase-root": { borderRadius: "6px" } }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Amount"
                        name="amount"
                        type="number"
                        value={transactionForm.amount}
                        onChange={handleTransactionChange}
                        required
                        inputProps={{ step: "0.01" }}
                        InputLabelProps={{ style: styles.sectionSubtitle }}
                        sx={{ "& .MuiInputBase-root": { borderRadius: "6px" } }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Date"
                        name="transactionDate"
                        type="date"
                        value={transactionForm.transactionDate}
                        onChange={handleTransactionChange}
                        required
                        InputLabelProps={{ shrink: true, style: styles.sectionSubtitle }}
                        sx={{ "& .MuiInputBase-root": { borderRadius: "6px" } }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel style={styles.sectionSubtitle}>Category</InputLabel>
                        <Select
                          name="category"
                          value={transactionForm.category}
                          onChange={handleTransactionChange}
                          label="Category"
                          required
                          sx={{ borderRadius: "6px" }}
                        >
                          {categories.map((cat) => (
                            <MenuItem key={cat} value={cat}>
                              {cat.charAt(0) + cat.slice(1).toLowerCase()}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <Button
                          type="submit"
                          variant="contained"
                          style={styles.planButton}
                          className="submit-button"
                        >
                          {isEditing ? "Update" : "Add"} Transaction
                        </Button>
                        {isEditing && (
                          <Button
                            variant="outlined"
                            style={styles.filterButton}
                            onClick={resetForms}
                            className="filter-button"
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </Grid>
                  </Grid>
                </form>
              </CardContent>
            </StyledCard>

            {/* Transaction Filters */}
            <StyledCard className="summary-card" style={{ marginTop: "2rem" }}>
              <CardContent>
                <Typography style={styles.sectionTitle}>Transaction Filters</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      label="Search"
                      name="search"
                      value={filters.search}
                      onChange={handleFilterChange}
                      inputRef={searchInputRef}
                      InputProps={{ startAdornment: <Search style={{ marginRight: "0.5rem" }} /> }}
                      InputLabelProps={{ style: styles.sectionSubtitle }}
                      sx={{ "& .MuiInputBase-root": { borderRadius: "6px" } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth>
                      <InputLabel style={styles.sectionSubtitle}>Category</InputLabel>
                      <Select
                        name="category"
                        value={filters.category}
                        onChange={handleFilterChange}
                        label="Category"
                        sx={{ borderRadius: "6px" }}
                      >
                        <MenuItem value="all">All Categories</MenuItem>
                        {categories.map((cat) => (
                          <MenuItem key={cat} value={cat}>
                            {cat.charAt(0) + cat.slice(1).toLowerCase()}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      label="From Date"
                      name="fromDate"
                      type="date"
                      value={filters.fromDate}
                      onChange={handleFilterChange}
                      InputLabelProps={{ shrink: true, style: styles.sectionSubtitle }}
                      sx={{ "& .MuiInputBase-root": { borderRadius: "6px" } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      label="To Date"
                      name="toDate"
                      type="date"
                      value={filters.toDate}
                      onChange={handleFilterChange}
                      InputLabelProps={{ shrink: true, style: styles.sectionSubtitle }}
                      sx={{ "& .MuiInputBase-root": { borderRadius: "6px" } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<FileDownload />}
                      style={styles.filterButton}
                      onClick={() => exportToCSV("transaction")}
                      className="filter-button"
                    >
                      Export CSV
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<FileDownload />}
                      style={styles.filterButton}
                      onClick={() => exportToExcel("transaction")}
                      className="filter-button"
                    >
                      Export Excel
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      fullWidth
                      variant="outlined"
                      style={styles.filterButton}
                      onClick={resetFilters}
                      className="filter-button"
                    >
                      Reset Filters
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </StyledCard>

            {/* Transactions List */}
            <StyledCard className="table-container" style={{ marginTop: "2rem" }}>
              <CardContent>
                <Typography style={styles.sectionTitle}>
                  Transactions ({filteredTransactions.length})
                </Typography>
                <TableContainer component={Paper} style={styles.tableContainer}>
                  <Table aria-label="Transactions table" style={styles.table}>
                    <TableHead style={styles.tableHeader}>
                      <TableRow>
                        <TableCell style={styles.tableCell}>Description</TableCell>
                        <TableCell align="right" style={styles.tableCell}>Amount</TableCell>
                        <TableCell style={styles.tableCell}>Category</TableCell>
                        <TableCell style={styles.tableCell}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredTransactions.length > 0 ? (
                        filteredTransactions.map((txn) => (
                          <TransactionRow key={txn.id} txn={txn} />
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} align="center" style={styles.noData}>
                            No transactions found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </StyledCard>
          </Box>

          {/* Analytics Tab */}
          <Box hidden={activeTab !== 2}>
            <Grid container spacing={3} className="summary-card" key={updateKey}>
              {/* Budget Utilization Summary */}
              <Grid item xs={12}>
                <StyledCard>
                  <CardContent>
                    <Typography style={styles.sectionTitle}>Budget Utilization Overview</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <Typography style={styles.sectionSubtitle}>Percentage Spent</Typography>
                        <Typography
                          style={{
                            ...styles.statValue,
                            color: summary.percentSpent > 90 ? themeColors.error : themeColors.primary,
                          }}
                        >
                          {summary.percentSpent.toFixed(1)}%
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography style={styles.sectionSubtitle}>Remaining Budget</Typography>
                        <Typography
                          style={{
                            ...styles.statValue,
                            color: summary.remainingBudget >= 0 ? themeColors.success : themeColors.error,
                          }}
                        >
                          ₹{Math.abs(summary.remainingBudget).toFixed(2)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography style={styles.sectionSubtitle}>Total Savings (Historical)</Typography>
                        <Typography style={{ ...styles.statValue, color: themeColors.success }}>
                          ₹{summary.totalSavings.toFixed(2)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </StyledCard>
              </Grid>

              {/* Category-Wise Budget Insights */}
              <Grid item xs={12}>
                <StyledCard className="table-container">
                  <CardContent>
                    <Typography style={styles.sectionTitle}>Category-Wise Budget Insights</Typography>
                    {isLoadingBudgets && <LinearProgress />}
                    {budgets.length === 0 && !isLoadingBudgets && (
                      <Typography style={styles.noData}>
                        No budgets added. Add budgets in the Budgets tab to see insights.
                      </Typography>
                    )}
                    <TableContainer component={Paper} style={styles.tableContainer}>
                      <Table aria-label="Category budget insights table" style={styles.table}>
                        <TableHead style={styles.tableHeader}>
                          <TableRow>
                            <TableCell style={styles.tableCell}>Category</TableCell>
                            <TableCell align="right" style={styles.tableCell}>Budget</TableCell>
                            <TableCell align="right" style={styles.tableCell}>Spent</TableCell>
                            <TableCell align="right" style={styles.tableCell}>Remaining</TableCell>
                            <TableCell align="right" style={styles.tableCell}>% Spent</TableCell>
                            <TableCell align="right" style={styles.tableCell}>Avg. Transaction</TableCell>
                            <TableCell style={styles.tableCell}>Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {categories.map((cat) => {
                            const details = summary.categoryBudgetDetails[cat] || {};
                            const hasBudget = details.totalBudget > 0;
                            return (
                              <TableRow key={cat} style={styles.tableRow}>
                                <TableCell style={styles.tableCell}>
                                  {cat.charAt(0) + cat.slice(1).toLowerCase()}
                                </TableCell>
                                <TableCell align="right" style={styles.tableCell}>
                                  {hasBudget ? `₹${details.totalBudget.toFixed(2)}` : "N/A"}
                                </TableCell>
                                <TableCell align="right" style={styles.tableCell}>
                                  ₹{details.totalSpent?.toFixed(2) || "0.00"}
                                </TableCell>
                                <TableCell align="right" style={styles.tableCell}>
                                  <span
                                    style={{
                                      color: details.remainingBudget >= 0 ? themeColors.success : themeColors.error,
                                    }}
                                  >
                                    {hasBudget
                                      ? `₹${Math.abs(details.remainingBudget).toFixed(2)}`
                                      : "N/A"}
                                  </span>
                                </TableCell>
                                <TableCell align="right" style={styles.tableCell}>
                                  {hasBudget ? `${details.percentSpent.toFixed(1)}%` : "N/A"}
                                </TableCell>
                                <TableCell align="right" style={styles.tableCell}>
                                  {details.transactionCount > 0
                                    ? `₹${details.avgSpendingPerTransaction.toFixed(2)}`
                                    : "N/A"}
                                </TableCell>
                                <TableCell style={styles.tableCell}>
                                  <Chip
                                    label={
                                      !hasBudget && details.totalSpent > 0
                                        ? "No Budget"
                                        : details.percentSpent > 100
                                        ? "Overspent"
                                        : details.percentSpent > 80
                                        ? "Warning"
                                        : "On Track"
                                    }
                                    color={
                                      !hasBudget && details.totalSpent > 0
                                        ? "error"
                                        : details.percentSpent > 100
                                        ? "error"
                                        : details.percentSpent > 80
                                        ? "warning"
                                        : "success"
                                    }
                                    size="small"
                                    style={{ fontSize: "0.75rem" }}
                                  />
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </StyledCard>
              </Grid>

              {/* Spending by Category */}
              <Grid item xs={12} md={6}>
                <StyledCard>
                  <CardContent>
                    <Typography style={styles.sectionTitle}>Spending by Category</Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={categoryChartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {categoryChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`₹${value}`, "Amount"]} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </StyledCard>
              </Grid>

              {/* Monthly Spending */}
              <Grid item xs={12} md={6}>
                <StyledCard>
                  <CardContent>
                    <Typography style={styles.sectionTitle}>Monthly Spending</Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={monthlyChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`₹${value}`, "Amount"]} />
                        <Legend />
                        <Bar dataKey="income" fill="#4CAF50" name="Income" />
                        <Bar dataKey="expense" fill="#F44336" name="Expense" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </StyledCard>
              </Grid>

              {/* Budget vs Actual Spending */}
              {budgets.length > 0 && (
                <Grid item xs={12}>
                  <StyledCard>
                    <CardContent>
                      <Typography style={styles.sectionTitle}>Budget vs Actual Spending</Typography>
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={budgetVsActualData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="budget" fill="#8884d8" name="Budget" />
                          <Bar dataKey="actual" fill="#82ca9d" name="Actual" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </StyledCard>
                </Grid>
              )}

              {/* Savings Trend */}
              {savingsTrendData.length > 0 && (
                <Grid item xs={12}>
                  <StyledCard>
                    <CardContent>
                      <Typography style={styles.sectionTitle}>Savings Trend Over Time</Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={savingsTrendData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip formatter={(value) => [`₹${value}`, "Savings"]} />
                          <Legend />
                          <Line type="monotone" dataKey="savings" stroke="#34d399" name="Savings" />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </StyledCard>
                </Grid>
              )}

              {/* Historical Savings */}
              {savingsHistory.length > 0 && (
                <Grid item xs={12}>
                  <StyledCard className="table-container">
                    <CardContent>
                      <Typography style={styles.sectionTitle}>Historical Savings</Typography>
                      <TableContainer component={Paper} style={styles.tableContainer}>
                        <Table aria-label="Historical savings table" style={styles.table}>
                          <TableHead style={styles.tableHeader}>
                            <TableRow>
                              <TableCell style={styles.tableCell}>Category</TableCell>
                              <TableCell style={styles.tableCell}>Period</TableCell>
                              <TableCell align="right" style={styles.tableCell}>Savings</TableCell>
                              <TableCell style={styles.tableCell}>End Date</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {savingsHistory.map((item) => (
                              <TableRow key={item.id} style={styles.tableRow}>
                                <TableCell style={styles.tableCell}>
                                  {item.category.charAt(0) + item.category.slice(1).toLowerCase()}
                                </TableCell>
                                <TableCell style={styles.tableCell}>
                                  {item.period.charAt(0) + item.period.slice(1).toLowerCase()}
                                </TableCell>
                                <TableCell align="right" style={styles.tableCell}>
                                  ₹{item.savings.toFixed(2)}
                                </TableCell>
                                <TableCell style={styles.tableCell}>{item.endDate}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </StyledCard>
                </Grid>
              )}
            </Grid>
          </Box>

          {/* Delete Confirmation Dialog */}
          <Dialog
            open={openDeleteDialog}
            onClose={() => setOpenDeleteDialog(false)}
            aria-labelledby="delete-dialog-title"
            aria-describedby="delete-dialog-description"
            sx={{ zIndex: 1300 }}
          >
            <DialogTitle id="delete-dialog-title" style={styles.sectionTitle}>
              Confirm Delete
            </DialogTitle>
            <DialogContent>
              <Typography style={styles.sectionSubtitle}>
                Are you sure you want to delete this {itemToDelete?.type}?
              </Typography>
              {itemToDelete && (
                <Typography style={{ marginTop: "0.5rem", color: themeColors.text }}>
                  {itemToDelete.type === "budget" ? (
                    <>
                      <strong>{itemToDelete.period.charAt(0) + itemToDelete.period.slice(1).toLowerCase()} Budget</strong> - ₹
                      {itemToDelete.amount} (Spent: ₹{itemToDelete.spent})
                    </>
                  ) : (
                    <>
                      <strong>{itemToDelete.description}</strong> - ₹{itemToDelete.amount} (
                      {itemToDelete.category.charAt(0) + itemToDelete.category.slice(1).toLowerCase()})
                    </>
                  )}
                </Typography>
              )}
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => setOpenDeleteDialog(false)}
                style={styles.filterButton}
                className="filter-button"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                style={{ ...styles.deleteButton, background: themeColors.error }}
                className="delete-button"
              >
                Delete
              </Button>
            </DialogActions>
          </Dialog>

          {/* Snackbar Notifications */}
          <Snackbar
            open={openSnackbar}
            autoHideDuration={3000}
            onClose={() => setOpenSnackbar(false)}
            anchorOrigin={{ vertical: "top", horizontal: "right" }}
          >
            <Alert
              onClose={() => setOpenSnackbar(false)}
              severity={snackbarSeverity}
              variant="filled"
              style={{ background: snackbarSeverity === "success" ? "#10b981" : "#ef4444" }}
            >
              {snackbarMessage}
            </Alert>
          </Snackbar>

          {/* Undo Delete Snackbar */}
          {deletedItem && (
            <Snackbar
              open={!!deletedItem}
              autoHideDuration={6000}
              onClose={() => setDeletedItem(null)}
              anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            >
              <Alert
                onClose={() => setDeletedItem(null)}
                severity="info"
                style={{ background: "#00c4b4" }}
                action={
                  <Button
                    color="inherit"
                    size="small"
                    onClick={undoDelete}
                    style={{ color: "#ffffff" }}
                    className="action-button"
                  >
                    UNDO
                  </Button>
                }
              >
                {deletedItem.type === "budget" ? "Budget" : "Transaction"} deleted
              </Alert>
            </Snackbar>
          )}
        </section>
      </main>

      <footer style={styles.footer}>
        <p style={styles.footerText}>© 2025 ExpenseMate. All rights reserved.</p>
        <div style={styles.footerLinks}>
          <a href="/privacy" style={styles.footerLink}>Privacy Policy</a>
          <a href="/terms" style={styles.footerLink}>Terms of Service</a>
          <a href="/contact" style={styles.footerLink}>Contact Us</a>
        </div>
      </footer>
    </div>
  );
};

// Styles object inspired by Subscription.js
const styles = {
  container: {
    fontFamily: "'Open Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    background: "#ffffff",
    minHeight: "100vh",
    boxSizing: "border-box",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "#0f2b5b",
    padding: "1rem 1.5rem",
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    boxSizing: "border-box",
    maxWidth: "100vw",
    overflow: "hidden",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    flexShrink: 0,
  },
  logoText: {
    fontSize: "1.5rem",
    fontWeight: 700,
    background: "linear-gradient(90deg, #4f46e5, #00c4b4)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    whiteSpace: "nowrap",
  },
  logoutButton: {
    background: "#00c4b4",
    color: "#ffffff",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    transition: "background 0.3s, transform 0.3s",
    flexShrink: 0,
    whiteSpace: "nowrap",
  },
  main: {
    padding: "5rem 1rem 2rem",
    maxWidth: "1200px",
    margin: "0 auto",
    boxSizing: "border-box",
  },
  section: {
    padding: "3rem 0",
    textAlign: "center",
  },
  sectionGray: {
    padding: "3rem 0",
    background: "#1a1b1e",
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: "2rem",
    fontWeight: 700,
    color: "#333333",
    marginBottom: "1.5rem",
  },
  sectionSubtitle: {
    fontSize: "1rem",
    fontWeight: 400,
    color: "#666666",
    marginBottom: "1rem",
  },
  statsContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "1.5rem",
    marginBottom: "2rem",
  },
  statTitle: {
    fontSize: "1.2rem",
    fontWeight: 600,
    color: "#666666",
    marginBottom: "0.5rem",
  },
  statValue: {
    fontSize: "1.8rem",
    fontWeight: 700,
  },
  planName: {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#333333",
    marginBottom: "0.5rem",
  },
  planButton: {
    background: "#00c4b4",
    color: "#ffffff",
    border: "none",
    padding: "0.75rem 1.5rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: 500,
    width: "auto",
    transition: "background 0.3s, transform 0.3s",
  },
  filterButton: {
    background: "transparent",
    color: "#00c4b4",
    border: "1px solid #00c4b4",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: 500,
    transition: "background 0.3s, transform 0.3s",
  },
  deleteButton: {
    background: "#ef4444",
    color: "#ffffff",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.875rem",
    transition: "background 0.3s, transform 0.3s",
  },
  iconContainer: {
    backgroundColor: "#e5e7eb",
    borderRadius: "8px",
    padding: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  tableContainer: {
    background: "#ffffff",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    overflowX: "auto",
    animation: "fadeIn 0.8s ease-out",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  tableHeader: {
    background: "#f5f6f5",
  },
  tableCell: {
    padding: "0.75rem",
    fontSize: "0.875rem",
    color: "#333333",
    textAlign: "left",
    borderBottom: "1px solid #e5e7eb",
  },
  tableRow: {
    transition: "background-color 0.3s",
  },
  noData: {
    fontSize: "1rem",
    color: "#666666",
    textAlign: "center",
    padding: "2rem",
  },
  footer: {
    background: "#0f2b5b",
    padding: "2rem",
    textAlign: "center",
    color: "#ffffff",
  },
  footerText: {
    fontSize: "0.875rem",
    fontWeight: 400,
    marginBottom: "1rem",
  },
  footerLinks: {
    display: "flex",
    justifyContent: "center",
    gap: "1.5rem",
  },
  footerLink: {
    fontSize: "0.875rem",
    color: "#ffffff",
    textDecoration: "none",
    fontWeight: 400,
  },
};

CombinedTracker.propTypes = {};

export default CombinedTracker;


