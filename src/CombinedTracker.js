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
  Savings,
  Receipt,
  ShowChart,
  Wallet,
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
  const [isEditing, setIsEditing] = useState(false);
  const [editType, setEditType] = useState(null);
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
  const COLORS = ["#4f46e5", "#2dd4bf", "#f59e0b", "#ef4444", "#10b981", "#7dd3fc", "#f472b6", "#a78bfa", "#34d399"];

  // Custom styled components
  const StyledSection = ({ children, ...props }) => (
    <div
      {...props}
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        padding: "1.5rem",
        marginBottom: "1.5rem",
        transition: "box-shadow 0.3s ease",
        width: "100%",
        boxSizing: "border-box",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)")}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
    >
      {children}
    </div>
  );

  const GradientHeader = () => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "linear-gradient(90deg, #4f46e5, #2dd4bf)",
        padding: "1rem 2rem",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        boxSizing: "border-box",
        width: "100%",
      }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        <Wallet style={{ fontSize: "1.75rem", color: "#ffffff", marginRight: "0.5rem" }} />
        <span
          style={{
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "#ffffff",
            whiteSpace: "nowrap",
          }}
        >
          ExpenseMate
        </span>
      </div>
      <button
        style={{
          background: "#ffffff",
          color: "#4f46e5",
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
        }}
        onClick={() => {
          cookies.remove("token", { path: "/" });
          navigate("/login");
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f6f5")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
        aria-label="Log out"
      >
        <FiLogOut size={18} /> Logout
      </button>
    </div>
  );

  const SummaryCard = ({ title, value, color, icon }) => (
    <div
      style={{
        backgroundColor: "#f8fafc",
        borderRadius: "8px",
        padding: "1.5rem",
        flex: "1 1 250px",
        transition: "transform 0.3s ease",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <Typography
            style={{
              fontSize: "1.2rem",
              fontWeight: 600,
              color: "#4b5563",
              marginBottom: "0.5rem",
            }}
          >
            {title}
          </Typography>
          <Typography
            style={{
              fontSize: "1.8rem",
              fontWeight: 700,
              color: color,
            }}
          >
            ₹{typeof value === "number" ? value.toFixed(2) : value}
          </Typography>
        </div>
        <div
          style={{
            backgroundColor: "#e2e8f0",
            borderRadius: "8px",
            padding: "0.75rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {React.cloneElement(icon, { style: { fontSize: "1.75rem", color } })}
        </div>
      </div>
    </div>
  );

  SummaryCard.propTypes = {
    title: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    color: PropTypes.string.isRequired,
    icon: PropTypes.element.isRequired,
  };

  const BudgetCard = ({ budget }) => {
    const progress = (Number(budget.spent) / Number(budget.amount)) * 100;
    const daysLeft = Math.ceil((new Date(budget.endDate) - new Date()) / (1000 * 60 * 60 * 24));

    return (
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          padding: "1.5rem",
          transition: "box-shadow 0.3s ease",
          width: "100%",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)")}
        onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
          <div>
            <Typography
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "#1f2937",
              }}
            >
              {budget.category.charAt(0) + budget.category.slice(1).toLowerCase()}
            </Typography>
            <Typography
              style={{
                fontSize: "1rem",
                color: "#6b7280",
              }}
            >
              {budget.period.charAt(0) + budget.period.slice(1).toLowerCase()}
            </Typography>
          </div>
          <Chip
            label={`${daysLeft >= 0 ? daysLeft : 0} days left`}
            size="small"
            style={{
              backgroundColor: daysLeft < 7 ? "#ef444415" : "#4f46e515",
              color: daysLeft < 7 ? "#ef4444" : "#4f46e5",
              fontSize: "0.75rem",
              fontWeight: 500,
            }}
            aria-label={`${daysLeft} days remaining`}
          />
        </div>
        <LinearProgress
          variant="determinate"
          value={progress > 100 ? 100 : progress}
          sx={{
            height: 8,
            borderRadius: 4,
            backgroundColor: "#e2e8f0",
            "& .MuiLinearProgress-bar": {
              borderRadius: 4,
              backgroundColor:
                progress > 100 ? "#ef4444" : progress > 75 ? "#f59e0b" : "#10b981",
            },
          }}
          aria-label={`Budget progress: ${progress.toFixed(0)}%`}
        />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1rem" }}>
          <Typography
            style={{
              fontSize: "1rem",
              color: "#6b7280",
            }}
          >
            Spent: ₹{Number(budget.spent).toFixed(2)}
          </Typography>
          <Typography
            style={{
              fontSize: "1rem",
              color: "#6b7280",
            }}
          >
            Budget: ₹{Number(budget.amount).toFixed(2)}
          </Typography>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", justifyContent: "flex-end" }}>
          <IconButton
            size="small"
            onClick={() => handleEditBudget(budget)}
            style={{ color: "#4f46e5" }}
            aria-label={`Edit ${budget.category} budget`}
          >
            <Edit fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => confirmDelete(budget, "budget")}
            style={{ color: "#ef4444" }}
            aria-label={`Delete ${budget.category} budget`}
          >
            <Delete fontSize="small" />
          </IconButton>
        </div>
      </div>
    );
  };

  BudgetCard.propTypes = {
    budget: PropTypes.shape({
      id: PropTypes.string.isRequired,
      category: PropTypes.string.isRequired,
      period: PropTypes.string.isRequired,
      amount: PropTypes.number.isRequired,
      spent: PropTypes.number.isRequired,
      startDate: PropTypes.string.isRequired,
      endDate: PropTypes.string.isRequired,
    }).isRequired,
  };

  const TransactionRow = ({ txn }) => (
    <TableRow
      hover
      sx={{
        "&:last-child td, &:last-child th": { border: 0 },
        transition: "background-color 0.3s",
      }}
    >
      <TableCell
        style={{
          padding: "0.75rem",
          fontSize: "0.875rem",
          color: "#1f2937",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div
            style={{
              backgroundColor: `${COLORS[categories.indexOf(txn.category) % COLORS.length]}20`,
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
            <Typography
              style={{
                fontWeight: 500,
                color: "#1f2937",
              }}
            >
              {txn.description}
            </Typography>
            <Typography
              style={{
                fontSize: "0.875rem",
                color: "#6b7280",
              }}
            >
              {new Date(txn.transactionDate).toLocaleDateString()}
            </Typography>
          </div>
        </div>
      </TableCell>
      <TableCell
        align="right"
        style={{
          padding: "0.75rem",
          fontSize: "0.875rem",
          color: "#1f2937",
        }}
      >
        <Typography
          style={{
            fontWeight: 600,
            color: Number(txn.amount) >= 0 ? "#10b981" : "#ef4444",
          }}
        >
          ₹{Number(txn.amount).toFixed(2)}
        </Typography>
      </TableCell>
      <TableCell
        style={{
          padding: "0.75rem",
          fontSize: "0.875rem",
          color: "#1f2937",
        }}
      >
        <Chip
          label={txn.category.charAt(0) + txn.category.slice(1).toLowerCase()}
          size="small"
          style={{
            backgroundColor: `${COLORS[categories.indexOf(txn.category) % COLORS.length]}20`,
            color: COLORS[categories.indexOf(txn.category) % COLORS.length],
            fontWeight: 500,
            fontSize: "0.75rem",
          }}
          aria-label={`Category: ${txn.category}`}
        />
      </TableCell>
      <TableCell
        style={{
          padding: "0.75rem",
          fontSize: "0.875rem",
          color: "#1f2937",
        }}
      >
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <IconButton
            size="small"
            onClick={() => handleEditTransaction(txn)}
            style={{ color: "#4f46e5" }}
            aria-label={`Edit transaction ${txn.description}`}
          >
            <Edit fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => confirmDelete(txn, "transaction")}
            style={{ color: "#ef4444" }}
            aria-label={`Delete transaction ${txn.description}`}
          >
            <Delete fontSize="small" />
          </IconButton>
        </div>
      </TableCell>
    </TableRow>
  );

  TransactionRow.propTypes = {
    txn: PropTypes.shape({
      id: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      amount: PropTypes.number.isRequired,
      transactionDate: PropTypes.string.isRequired,
      category: PropTypes.string.isRequired,
    }).isRequired,
  };

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
            await new Promise((resolve) => setTimeout(resolve, 1000));
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

      const fetchedBudgets = (budgetsRes.data || []).map((budget) => ({
        ...budget,
        id: budget.id || `temp-${Date.now()}`,
        amount: isNaN(Number(budget.amount)) || budget.amount == null ? 0 : Number(budget.amount),
        spent: isNaN(Number(budget.spent)) || budget.spent == null ? 0 : Number(budget.spent),
        period: periods.includes(budget.period) ? budget.period : "MONTHLY",
        startDate: budget.startDate || new Date().toISOString().split("T")[0],
        endDate: budget.endDate || new Date().toISOString().split("T")[0],
        category: categories.includes(budget.category) ? budget.category : "OTHER",
      }));

      const fetchedTransactions = (transactionsRes.data || []).map((txn) => ({
        ...txn,
        id: txn.id || `temp-${Date.now()}`,
        amount: isNaN(Number(txn.amount)) || txn.amount == null ? 0 : Number(txn.amount),
        description: txn.description || "",
        transactionDate: txn.transactionDate || new Date().toISOString().split("T")[0],
        category: categories.includes(txn.category) ? txn.category : "OTHER",
      }));

      setBudgets(fetchedBudgets);
      setTransactions(fetchedTransactions);
      setUpdateKey((prev) => prev + 1);
      calculateSavings(fetchedBudgets);
    } catch (err) {
      console.error(`Failed to fetch data: ${err.response?.data?.message || err.message}`);
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
    const token = cookies.get("ticket");
    if (!token) {
      console.error("Not authenticated");
      return;
    }

    if (!categories.includes(budgetForm.category)) {
      console.error("Please select a valid category");
      return;
    }
    if (!budgetForm.amount || isNaN(Number(budgetForm.amount)) || Number(budgetForm.amount) <= 0) {
      console.error("Please enter a valid budget amount");
      return;
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
      resetForms();
      setTimeout(fetchAllData, 500);
    } catch (err) {
      if (optimisticBudget) {
        setBudgets((prevBudgets) => prevBudgets.filter((b) => b.id !== optimisticBudget.id));
        setUpdateKey((prev) => prev + 1);
      }
      console.error(`Error saving budget: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    const token = cookies.get("token");
    if (!token) {
      console.error("Not authenticated");
      return;
    }

    if (!categories.includes(transactionForm.category)) {
      console.error("Invalid category selected");
      return;
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
      resetForms();
      await fetchAllData();
    } catch (err) {
      if (optimisticTransaction) {
        setTransactions((prevTransactions) =>
          prevTransactions.filter((t) => t.id !== optimisticTransaction.id)
        );
        setUpdateKey((prev) => prev + 1);
      }
      console.error(`Error saving transaction: ${err.response?.data?.message || err.message}`);
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
      console.error("Not authenticated. Please log in again.");
      navigate("/login");
      return;
    }

    try {
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
    } catch (err) {
      console.error(
        `Error deleting ${itemToDelete.type}: ${err.response?.data?.message || err.message}`
      );
    } finally {
      setOpenDeleteDialog(false);
      setItemToDelete(null);
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

  return (
    <div
      style={{
        fontFamily: "'Open Sans', -apple-system, BlinkMacSystemFont, sans-serif",
        background: "#f9fafb",
        minHeight: "100vh",
        boxSizing: "border-box",
        width: "100%",
      }}
    >
      <GradientHeader />

      <main
        style={{
          padding: "5rem 1rem 2rem",
          maxWidth: "1200px",
          margin: "0 auto",
          boxSizing: "border-box",
          width: "100%",
        }}
      >
        <section
          style={{
            padding: "2rem 0",
            textAlign: "center",
            width: "100%",
          }}
        >
          {/* Tabs */}
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant="fullWidth"
            sx={{
              mb: 4,
              background: "#f5f6f5",
              borderRadius: "8px",
              "& .MuiTabs-indicator": {
                backgroundColor: "#4f46e5",
                height: 3,
              },
            }}
          >
            <Tab
              label="Budgets"
              icon={<Savings />}
              sx={{
                color: activeTab === 0 ? "#4f46e5" : "#6b7280",
                textTransform: "none",
                fontSize: "1rem",
                fontWeight: 500,
              }}
            />
            <Tab
              label="Transactions"
              icon={<Receipt />}
              sx={{
                color: activeTab === 1 ? "#4f46e5" : "#6b7280",
                textTransform: "none",
                fontSize: "1rem",
                fontWeight: 500,
              }}
            />
            <Tab
              label="Analytics"
              icon={<ShowChart />}
              sx={{
                color: activeTab === 2 ? "#4f46e5" : "#6b7280",
                textTransform: "none",
                fontSize: "1rem",
                fontWeight: 500,
              }}
            />
          </Tabs>

          {/* Summary Cards */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "1.5rem",
              marginBottom: "2rem",
              justifyContent: "center",
            }}
          >
            <SummaryCard
              title="Total Budget"
              value={summary.totalBudget}
              color="#4f46e5"
              icon={<Savings />}
            />
            <SummaryCard
              title="Total Spent"
              value={summary.totalSpent}
              color="#ef4444"
              icon={<AttachMoney />}
            />
            <SummaryCard
              title="Remaining"
              value={summary.remainingBudget}
              color={summary.remainingBudget >= 0 ? "#10b981" : "#ef4444"}
              icon={<Savings />}
            />
          </div>

          {/* Budgets Tab */}
          <Box hidden={activeTab !== 0}>
            <StyledSection>
              <Typography
                style={{
                  fontSize: "2rem",
                  fontWeight: 700,
                  color: "#1f2937",
                  marginBottom: "1.5rem",
                }}
              >
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
                      InputLabelProps={{ style: { fontSize: "1rem", color: "#6b7280" } }}
                      sx={{ "& .MuiInputBase-root": { borderRadius: "6px" } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel style={{ fontSize: "1rem", color: "#6b7280" }}>Period</InputLabel>
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
                      InputLabelProps={{ shrink: true, style: { fontSize: "1rem", color: "#6b7280" } }}
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
                      InputLabelProps={{ shrink: true, style: { fontSize: "1rem", color: "#6b7280" } }}
                      sx={{ "& .MuiInputBase-root": { borderRadius: "6px" } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel style={{ fontSize: "1rem", color: "#6b7280" }}>Category</InputLabel>
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
                        style={{
                          background: "#4f46e5",
                          color: "#ffffff",
                          padding: "0.75rem 1.5rem",
                          borderRadius: "6px",
                          fontSize: "1rem",
                          fontWeight: 500,
                          transition: "background 0.3s, transform 0.3s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#4338ca")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "#4f46e5")}
                      >
                        {isEditing ? "Update" : "Add"} Budget
                      </Button>
                      {isEditing && (
                        <Button
                          variant="outlined"
                          style={{
                            border: "1px solid #4f46e5",
                            color: "#4f46e5",
                            padding: "0.5rem 1rem",
                            borderRadius: "6px",
                            fontSize: "0.9rem",
                            fontWeight: 500,
                            transition: "background 0.3s, transform 0.3s",
                          }}
                          onClick={resetForms}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f6f5")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </Grid>
                </Grid>
              </form>
            </StyledSection>

            {/* Budget Filters */}
            <StyledSection>
              <Typography
                style={{
                  fontSize: "2rem",
                  fontWeight: 700,
                  color: "#1f2937",
                  marginBottom: "1.5rem",
                }}
              >
                Budget Filters
              </Typography>
              <Grid container spacing={2}>
               <Grid item xs={12} sm={6} md={4}>
  <FormControl fullWidth>
    <InputLabel style={{ fontSize: "1rem", color: "#6b7280" }}>Period</InputLabel>
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
                    style={{
                      border: "1px solid #4f46e5",
                      color: "#4f46e5",
                      padding: "0.5rem 1rem",
                      borderRadius: "6px",
                      fontSize: "0.9rem",
                      fontWeight: 500,
                      transition: "background 0.3s, transform 0.3s",
                    }}
                    onClick={() => exportToCSV("budget")}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f6f5")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    Export CSV
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<FileDownload />}
                    style={{
                      border: "1px solid #4f46e5",
                      color: "#4f46e5",
                      padding: "0.5rem 1rem",
                      borderRadius: "6px",
                      fontSize: "0.9rem",
                      fontWeight: 500,
                      transition: "background 0.3s, transform 0.3s",
                    }}
                    onClick={() => exportToExcel("budget")}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f6f5")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    Export Excel
                  </Button>
                </Grid>
              </Grid>
            </StyledSection>

            {/* Budget List */}
            <StyledSection>
              <Typography
                style={{
                  fontSize: "2rem",
                  fontWeight: 700,
                  color: "#1f2937",
                  marginBottom: "1.5rem",
                }}
              >
                Your Budgets ({filteredBudgets.length})
              </Typography>
              {isLoadingBudgets ? (
                <LinearProgress />
              ) : filteredBudgets.length === 0 ? (
                <Typography
                  style={{
                    fontSize: "1rem",
                    color: "#6b7280",
                    textAlign: "center",
                    padding: "2rem",
                  }}
                >
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
            </StyledSection>
          </Box>

          {/* Transactions Tab */}
          <Box hidden={activeTab !== 1}>
            <StyledSection>
              <Typography
                style={{
                  fontSize: "2rem",
                  fontWeight: 700,
                  color: "#1f2937",
                  marginBottom: "1.5rem",
                }}
              >
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
                      InputLabelProps={{ style: { fontSize: "1rem", color: "#6b7280" } }}
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
                      InputLabelProps={{ style: { fontSize: "1rem", color: "#6b7280" } }}
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
                      InputLabelProps={{ shrink: true, style: { fontSize: "1rem", color: "#6b7280" } }}
                      sx={{ "& .MuiInputBase-root": { borderRadius: "6px" } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel style={{ fontSize: "1rem", color: "#6b7280" }}>Category</InputLabel>
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
                        style={{
                          background: "#4f46e5",
                          color: "#ffffff",
                          padding: "0.75rem 1.5rem",
                          borderRadius: "6px",
                          fontSize: "1rem",
                          fontWeight: 500,
                          transition: "background 0.3s, transform 0.3s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#4338ca")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "#4f46e5")}
                      >
                        {isEditing ? "Update" : "Add"} Transaction
                      </Button>
                      {isEditing && (
                        <Button
                          variant="outlined"
                          style={{
                            border: "1px solid #4f46e5",
                            color: "#4f46e5",
                            padding: "0.5rem 1rem",
                            borderRadius: "6px",
                            fontSize: "0.9rem",
                            fontWeight: 500,
                            transition: "background 0.3s, transform 0.3s",
                          }}
                          onClick={resetForms}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f6f5")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </Grid>
                </Grid>
              </form>
            </StyledSection>

            {/* Transaction Filters */}
            <StyledSection>
              <Typography
                style={{
                  fontSize: "2rem",
                  fontWeight: 700,
                  color: "#1f2937",
                  marginBottom: "1.5rem",
                }}
              >
                Transaction Filters
              </Typography>
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
                    InputLabelProps={{ style: { fontSize: "1rem", color: "#6b7280" } }}
                    sx={{ "& .MuiInputBase-root": { borderRadius: "6px" } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel style={{ fontSize: "1rem", color: "#6b7280" }}>Category</InputLabel>
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
                    InputLabelProps={{ shrink: true, style: { fontSize: "1rem", color: "#6b7280" } }}
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
                    InputLabelProps={{ shrink: true, style: { fontSize: "1rem", color: "#6b7280" } }}
                    sx={{ "& .MuiInputBase-root": { borderRadius: "6px" } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Min Amount"
                    name="minAmount"
                    type="number"
                    value={filters.minAmount}
                    onChange={handleFilterChange}
                    inputProps={{ step: "0.01" }}
                    InputLabelProps={{ style: { fontSize: "1rem", color: "#6b7280" } }}
                    sx={{ "& .MuiInputBase-root": { borderRadius: "6px" } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Max Amount"
                    name="maxAmount"
                    type="number"
                    value={filters.maxAmount}
                    onChange={handleFilterChange}
                    inputProps={{ step: "0.01" }}
                    InputLabelProps={{ style: { fontSize: "1rem", color: "#6b7280" } }}
                    sx={{ "& .MuiInputBase-root": { borderRadius: "6px" } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel style={{ fontSize: "1rem", color: "#6b7280" }}>Sort By</InputLabel>
                    <Select
                      name="sortBy"
                      value={filters.sortBy}
                      onChange={handleFilterChange}
                      label="Sort By"
                      sx={{ borderRadius: "6px" }}
                    >
                      <MenuItem value="date">Date</MenuItem>
                      <MenuItem value="amount">Amount</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel style={{ fontSize: "1rem", color: "#6b7280" }}>Order</InputLabel>
                    <Select
                      name="sortOrder"
                      value={filters.sortOrder}
                      onChange={handleFilterChange}
                      label="Order"
                      sx={{ borderRadius: "6px" }}
                    >
                      <MenuItem value="desc">Descending</MenuItem>
                      <MenuItem value="asc">Ascending</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                    <Button
                      variant="outlined"
                      style={{
                        border: "1px solid #4f46e5",
                        color: "#4f46e5",
                        padding: "0.5rem 1rem",
                        borderRadius: "6px",
                        fontSize: "0.9rem",
                        fontWeight: 500,
                        transition: "background 0.3s, transform 0.3s",
                      }}
                      onClick={resetFilters}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f6f5")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      Reset Filters
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<FileDownload />}
                      style={{
                        border: "1px solid #4f46e5",
                        color: "#4f46e5",
                        padding: "0.5rem 1rem",
                        borderRadius: "6px",
                        fontSize: "0.9rem",
                        fontWeight: 500,
                        transition: "background 0.3s, transform 0.3s",
                      }}
                      onClick={() => exportToCSV("transaction")}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f6f5")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      Export CSV
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<FileDownload />}
                      style={{
                        border: "1px solid #4f46e5",
                        color: "#4f46e5",
                        padding: "0.5rem 1rem",
                        borderRadius: "6px",
                        fontSize: "0.9rem",
                        fontWeight: 500,
                        transition: "background 0.3s, transform 0.3s",
                      }}
                      onClick={() => exportToExcel("transaction")}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f6f5")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      Export Excel
                    </Button>
                  </div>
                </Grid>
              </Grid>
            </StyledSection>

            {/* Transaction List */}
            <StyledSection>
              <Typography
                style={{
                  fontSize: "2rem",
                  fontWeight: 700,
                  color: "#1f2937",
                  marginBottom: "1.5rem",
                }}
              >
                Your Transactions ({filteredTransactions.length})
              </Typography>
              {filteredTransactions.length === 0 ? (
                <Typography
                  style={{
                    fontSize: "1rem",
                    color: "#6b7280",
                    textAlign: "center",
                    padding: "2rem",
                  }}
                >
                  No transactions found. Add a transaction to start tracking.
                </Typography>
              ) : (
                <TableContainer component={Paper} style={{ borderRadius: "8px", overflowX: "auto" }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell style={{ fontWeight: 600, color: "#1f2937" }}>Description</TableCell>
                        <TableCell align="right" style={{ fontWeight: 600, color: "#1f2937" }}>Amount</TableCell>
                        <TableCell style={{ fontWeight: 600, color: "#1f2937" }}>Category</TableCell>
                        <TableCell style={{ fontWeight: 600, color: "#1f2937" }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredTransactions.map((txn) => (
                        <TransactionRow key={txn.id} txn={txn} />
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </StyledSection>
          </Box>

          {/* Analytics Tab */}
          <Box hidden={activeTab !== 2}>
            <StyledSection>
              <Typography
                style={{
                  fontSize: "2rem",
                  fontWeight: 700,
                  color: "#1f2937",
                  marginBottom: "1.5rem",
                }}
              >
                Spending by Category
              </Typography>
              <div style={{ height: "400px", width: "100%", marginBottom: "2rem" }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius="80%"
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `₹${value.toFixed(2)}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </StyledSection>

            <StyledSection>
              <Typography
                style={{
                  fontSize: "2rem",
                  fontWeight: 700,
                  color: "#1f2937",
                  marginBottom: "1.5rem",
                }}
              >
                Monthly Spending
              </Typography>
              <div style={{ height: "400px", width: "100%", marginBottom: "2rem" }}>
                <ResponsiveContainer>
                  <BarChart data={monthlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `₹${value.toFixed(2)}`} />
                    <Legend />
                    <Bar dataKey="income" fill="#4f46e5" />
                    <Bar dataKey="expense" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </StyledSection>

            <StyledSection>
              <Typography
                style={{
                  fontSize: "2rem",
                  fontWeight: 700,
                  color: "#1f2937",
                  marginBottom: "1.5rem",
                }}
              >
                Budget vs Actual
              </Typography>
              <div style={{ height: "400px", width: "100%", marginBottom: "2rem" }}>
                <ResponsiveContainer>
                  <BarChart data={budgetVsActualData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `₹${value.toFixed(2)}`} />
                    <Legend />
                    <Bar dataKey="budget" fill="#4f46e5" />
                    <Bar dataKey="actual" fill="#2dd4bf" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </StyledSection>

            <StyledSection>
              <Typography
                style={{
                  fontSize: "2rem",
                  fontWeight: 700,
                  color: "#1f2937",
                  marginBottom: "1.5rem",
                }}
              >
                Savings Trend
              </Typography>
              <div style={{ height: "400px", width: "100%", marginBottom: "2rem" }}>
                <ResponsiveContainer>
                  <LineChart data={savingsTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => `₹${value.toFixed(2)}`} />
                    <Legend />
                    <Line type="monotone" dataKey="savings" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </StyledSection>

            <StyledSection>
              <Typography
                style={{
                  fontSize: "2rem",
                  fontWeight: 700,
                  color: "#1f2937",
                  marginBottom: "1.5rem",
                }}
              >
                Summary Statistics
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography
                    style={{
                      fontSize: "1.2rem",
                      fontWeight: 600,
                      color: "#4b5563",
                    }}
                  >
                    Total Savings
                  </Typography>
                  <Typography
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      color: "#10b981",
                    }}
                  >
                    ₹{summary.totalSavings.toFixed(2)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography
                    style={{
                      fontSize: "1.2rem",
                      fontWeight: 600,
                      color: "#4b5563",
                    }}
                  >
                    Largest Transaction
                  </Typography>
                  <Typography
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      color: "#4f46e5",
                    }}
                  >
                    ₹{summary.largestTransaction.toFixed(2)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography
                    style={{
                      fontSize: "1.2rem",
                      fontWeight: 600,
                      color: "#4b5563",
                    }}
                  >
                    Most Frequent Category
                  </Typography>
                  <Typography
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      color: "#2dd4bf",
                    }}
                  >
                    {summary.frequentCategory}
                  </Typography>
                </Grid>
              </Grid>
            </StyledSection>
          </Box>
        </section>
      </main>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        aria-labelledby="delete-dialog-title"
      >
        <DialogTitle id="delete-dialog-title">
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this {itemToDelete?.type}?
          </Typography>
          {itemToDelete?.type === "budget" && (
            <Typography style={{ marginTop: "0.5rem", color: "#6b7280" }}>
              Category: {itemToDelete.category}
            </Typography>
          )}
          {itemToDelete?.type === "transaction" && (
            <Typography style={{ marginTop: "0.5rem", color: "#6b7280" }}>
              Description: {itemToDelete.description}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenDeleteDialog(false)}
            style={{
              color: "#6b7280",
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              fontSize: "0.9rem",
              fontWeight: 500,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            style={{
              background: "#ef4444",
              color: "#ffffff",
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              fontSize: "0.9rem",
              fontWeight: 500,
              transition: "background 0.3s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#dc2626")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#ef4444")}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default CombinedTracker;