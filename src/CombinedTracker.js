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
  Switch,
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
  DateRange,
  AttachMoney,
  Sort,
  FileDownload,
  Undo,
  DarkMode,
  LightMode,
  Savings,
  Receipt,
  ShowChart,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
} from "@mui/icons-material";

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
  const [updateKey, setUpdateKey] = useState(0); // For forcing table re-render
  const [isLoadingBudgets, setIsLoadingBudgets] = useState(false);

  // Form states
  const [budgetForm, setBudgetForm] = useState({
    id: null,
    amount: "",
    period: "monthly",
    spent: "0",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split("T")[0],
    category: "",
  });

  const [transactionForm, setTransactionForm] = useState({
    id: null,
    description: "",
    amount: "",
    transactionDate: new Date().toISOString().split("T")[0],
    category: "",
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

  // Categories
  const categories = [
    "Food",
    "Transport",
    "Housing",
    "Entertainment",
    "Healthcare",
    "Education",
    "Shopping",
    "Other",
  ];

  // Chart colors
  const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#f87171", "#34d399", "#60a5fa", "#fbbf24", "#a78bfa"];

  // Fetch all data (debounced)
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
            console.log(`Retrying /getBudget (attempt ${retryCount + 2})...`);
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

      // Log raw responses with status and headers
      console.log("Raw Budgets Response:", JSON.stringify(budgetsRes.data, null, 2));
      console.log("Budgets Response Status:", budgetsRes.status, "Headers:", JSON.stringify(budgetsRes.headers, null, 2));
      console.log("Raw Transactions Response:", JSON.stringify(transactionsRes.data, null, 2));
      console.log("Transactions Response Status:", transactionsRes.status);

      // Normalize budget data
      const fetchedBudgets = (budgetsRes.data || []).map(budget => {
        const normalizedBudget = {
          ...budget,
          id: budget.id || `temp-${Date.now()}`,
          amount: isNaN(Number(budget.amount)) || budget.amount == null ? 0 : Number(budget.amount),
          spent: isNaN(Number(budget.spent)) || budget.spent == null ? 0 : Number(budget.spent),
          period: budget.period || "monthly",
          startDate: budget.startDate || new Date().toISOString().split("T")[0],
          endDate: budget.endDate || new Date().toISOString().split("T")[0],
          category: categories.includes(budget.category) ? budget.category : "Other",
        };
        if (normalizedBudget.amount === 0) {
          console.warn(`Invalid budget amount for ID ${normalizedBudget.id}:`, budget);
        }
        if (normalizedBudget.category === "Other" && budget.category && budget.category !== "Other") {
          console.warn(`Invalid category for budget ID ${normalizedBudget.id}:`, budget.category);
        }
        return normalizedBudget;
      });

      // Warn if no valid budgets
      if (fetchedBudgets.length === 0) {
        console.warn("No valid budgets found after normalization");
        showSnackbar("No budgets found. Please add a budget to see insights.", "warning");
      } else {
        console.log("Normalized Budgets:", JSON.stringify(fetchedBudgets, null, 2));
      }

      // Normalize transaction data
      const fetchedTransactions = (transactionsRes.data || []).map(txn => {
        const normalizedTxn = {
          ...txn,
          id: txn.id || `temp-${Date.now()}`,
          amount: isNaN(Number(txn.amount)) || txn.amount == null ? 0 : Number(txn.amount),
          description: txn.description || "",
          transactionDate: txn.transactionDate || new Date().toISOString().split("T")[0],
          category: categories.includes(txn.category) ? txn.category : "Other",
        };
        if (normalizedTxn.category === "Other" && txn.category && txn.category !== "Other") {
          console.warn(`Invalid category for transaction ID ${normalizedTxn.id}:`, txn.category);
        }
        return normalizedTxn;
      });

      console.log("Fetched Budgets:", JSON.stringify(fetchedBudgets, null, 2), "Status:", budgetsRes.status);
      console.log("Fetched Transactions:", JSON.stringify(fetchedTransactions, null, 2), "Status:", transactionsRes.status);

      // Update state with functional updates
      setBudgets(() => {
        const newBudgets = [...fetchedBudgets];
        console.log("Updated Budgets state:", JSON.stringify(newBudgets, null, 2));
        return newBudgets;
      });
      setTransactions(() => {
        const newTransactions = [...fetchedTransactions];
        console.log("Updated Transactions state:", JSON.stringify(newTransactions, null, 2));
        return newTransactions;
      });

      // Force table re-render
      setUpdateKey(prev => prev + 1);

      // Calculate savings for expired budgets
      calculateSavings(fetchedBudgets);
    } catch (err) {
      console.error("Fetch error:", err.response || err);
      showSnackbar(`Failed to fetch data: ${err.response?.data?.message || err.message}`, "error");
    } finally {
      setIsLoadingBudgets(false);
    }
  }, 300);

  // Validate budgets state
  useEffect(() => {
    console.log("Budgets state changed:", JSON.stringify(budgets, null, 2));
    if (budgets.length === 0) {
      console.warn("Budgets state is empty. Table will show 'N/A' for budget-related fields.");
    } else {
      const foodBudgets = budgets.filter(b => b.category === "Food");
      const transportBudgets = budgets.filter(b => b.category === "Transport");
      console.log("Food Budgets:", JSON.stringify(foodBudgets, null, 2));
      console.log("Transport Budgets:", JSON.stringify(transportBudgets, null, 2));
      if (foodBudgets.length === 0 && transportBudgets.length === 0) {
        console.warn("No budgets for Food or Transport. Table will show 'N/A' for these categories.");
      }
    }
  }, [budgets]);

  // Calculate savings for expired budgets
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

  // Filter budgets
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

    // Validate form
    if (!categories.includes(budgetForm.category)) {
      console.error("Invalid category:", budgetForm.category);
      return showSnackbar("Please select a valid category", "error");
    }
    if (!budgetForm.amount || isNaN(Number(budgetForm.amount)) || Number(budgetForm.amount) <= 0) {
      console.error("Invalid budget amount:", budgetForm.amount);
      return showSnackbar("Please enter a valid budget amount", "error");
    }

    const budgetPayload = {
      ...budgetForm,
      amount: Number(budgetForm.amount),
      spent: Number(budgetForm.spent) || 0,
      category: budgetForm.category || "Other",
    };
    console.log("Budget Form Submitted:", JSON.stringify(budgetForm, null, 2));
    console.log("Budget Payload to Backend:", JSON.stringify(budgetPayload, null, 2));

    let optimisticBudget = null;
    try {
      // Optimistic update
      optimisticBudget = {
        ...budgetPayload,
        id: `temp-${Date.now()}`,
      };
      console.log("Adding Optimistic Budget:", JSON.stringify(optimisticBudget, null, 2));
      setBudgets(prevBudgets => {
        const newBudgets = [...prevBudgets, optimisticBudget];
        console.log("New Budgets state (optimistic):", JSON.stringify(newBudgets, null, 2));
        setUpdateKey(prev => prev + 1); // Force re-render
        return newBudgets;
      });

      const headers = { Authorization: `Bearer ${token}` };
      const endpoint = isEditing && editType === "budget" ? "/updateBudget" : "/addBudget";
      const response = await axios.post(`${API_URL}${endpoint}`, budgetPayload, { headers });
      console.log("Add Budget Response:", JSON.stringify(response.data, null, 2));
      console.log("Add Budget Response Status:", response.status, "Headers:", JSON.stringify(response.headers, null, 2));
      showSnackbar(`Budget ${isEditing ? "updated" : "added"} successfully`, "success");
      resetForms();
      // Delay fetch to allow backend to process
      setTimeout(fetchAllData, 500);
    } catch (err) {
      console.error("Budget Submit Error:", err.response || err);
      if (optimisticBudget) {
        setBudgets(prevBudgets => {
          const rolledBackBudgets = prevBudgets.filter(b => b.id !== optimisticBudget.id);
          console.log("Rolled back Budgets state:", JSON.stringify(rolledBackBudgets, null, 2));
          setUpdateKey(prev => prev + 1); // Force re-render
          return rolledBackBudgets;
        });
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
      // Optimistic update
      optimisticTransaction = {
        ...transactionForm,
        id: `temp-${Date.now()}`,
        amount: Number(transactionForm.amount),
      };
      console.log("Adding Optimistic Transaction:", JSON.stringify(optimisticTransaction, null, 2));
      setTransactions(prevTransactions => {
        const newTransactions = [...prevTransactions, optimisticTransaction];
        console.log("New Transactions state (optimistic):", JSON.stringify(newTransactions, null, 2));
        setUpdateKey(prev => prev + 1); // Force re-render
        return newTransactions;
      });

      const headers = { Authorization: `Bearer ${token}` };
      const endpoint = isEditing && editType === "transaction" ? "/transaction/update" : "/transaction/add";
      const response = await axios.post(`${API_URL}${endpoint}`, transactionForm, { headers });
      console.log("Add Transaction Response:", JSON.stringify(response.data, null, 2));
      showSnackbar(`Transaction ${isEditing ? "updated" : "added"} successfully`, "success");
      resetForms();
      await fetchAllData(); // Sync with server
    } catch (err) {
      console.error("Transaction Submit Error:", err.response || err);
      if (optimisticTransaction) {
        setTransactions(prevTransactions => {
          const rolledBackTransactions = prevTransactions.filter(t => t.id !== optimisticTransaction.id);
          console.log("Rolled back Transactions state:", JSON.stringify(rolledBackTransactions, null, 2));
          setUpdateKey(prev => prev + 1); // Force re-render
          return rolledBackTransactions; // Fixed: Changed from rolledBackBudgets to rolledBackTransactions
        });
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
      period: "monthly",
      spent: "0",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split("T")[0],
      category: "",
    });
    setTransactionForm({
      id: null,
      description: "",
      amount: "",
      transactionDate: new Date().toISOString().split("T")[0],
      category: "",
    });
    setIsEditing(false);
    setEditType(null);
  };

  // Edit handlers
  const handleEditBudget = (budget) => {
    setBudgetForm({
      ...budget,
      category: budget.category || "",
    });
    setIsEditing(true);
    setEditType("budget");
    setActiveTab(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEditTransaction = (txn) => {
    setTransactionForm({
      ...txn,
      category: txn.category || "",
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
      await fetchAllData(); // Refresh data to update insights
      showSnackbar(`${itemToDelete.type === "budget" ? "Budget" : "Transaction"} deleted successfully`, "success");
    } catch (err) {
      console.error("Delete error:", err.response || err);
      if (err.response?.status === 400) {
        showSnackbar(
          `Error: ${err.response.data?.message || "Invalid request, please try again"}`,
          "error"
        );
      } else if (err.response?.status === 401) {
        showSnackbar("You are not authorized to delete this item. Please log in again.", "error");
        navigate("/login");
      } else {
        showSnackbar(
          `Error deleting ${itemToDelete.type}: ${err.response?.data?.message || err.message}`,
          "error"
        );
      }
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
    // Calculate category-wise spending from transactions
    const categorySpending = transactions.reduce((acc, txn) => {
      acc[txn.category] = (acc[txn.category] || 0) + Number(txn.amount);
      return acc;
    }, {});

    // Aggregate budgets by category
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

      // Average spending per transaction
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

    // Calculate total budget and spent across all budgets
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

    // Total savings from history
    const totalSavings = savingsHistory.reduce((sum, item) => sum + item.savings, 0);

    const result = {
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

    console.log("Computed Summary:", JSON.stringify(result, null, 2));
    console.log("Food Budget Details:", JSON.stringify(result.categoryBudgetDetails.Food, null, 2));
    console.log("Transport Budget Details:", JSON.stringify(result.categoryBudgetDetails.Transport, null, 2));
    return result;
  }, [budgets, transactions, savingsHistory]);

  // Log categoryBudgetDetails changes
  useEffect(() => {
    console.log("Category Budget Details updated:", JSON.stringify(summary.categoryBudgetDetails, null, 2));
    if (summary.categoryBudgetDetails.Food?.totalBudget === 0) {
      console.warn("Food budget is 0 or undefined. Table will show 'N/A' for Food.");
    }
    if (summary.categoryBudgetDetails.Transport?.totalBudget === 0) {
      console.warn("Transport budget is 0 or undefined. Table will show 'N/A' for Transport.");
    }
  }, [summary.categoryBudgetDetails]);

  // Polling for Analytics tab
  useEffect(() => {
    if (activeTab === 2) {
      const interval = setInterval(fetchAllData, 10000); // Poll every 10 seconds
      return () => clearInterval(interval);
    }
  }, [activeTab]);

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

  // Savings trend data
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
    <div className={`min-h-screen ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`} role="main">
      <div className="container mx-auto p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <Typography variant="h4" component="h1" className="font-bold">
            Finance Tracker
          </Typography>
          <div className="flex items-center space-x-2">
            <IconButton
              onClick={() => setDarkMode(!darkMode)}
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? <LightMode /> : <DarkMode />}
            </IconButton>
            <Typography variant="body2">{darkMode ? "Light Mode" : "Dark Mode"}</Typography>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} variant="fullWidth" sx={{ mb: 3 }}>
          <Tab label="Budgets" icon={<Savings />} />
          <Tab label="Transactions" icon={<Receipt />} />
          <Tab label="Analytics" icon={<ShowChart />} />
        </Tabs>

        {/* Summary Cards */}
        <Grid container spacing={3} className="mb-6">
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Budget
                </Typography>
                <Typography variant="h5" className="text-blue-600">
                  ₹{summary.totalBudget.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Spent
                </Typography>
                <Typography variant="h5" className="text-red-600">
                  ₹{summary.totalSpent.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Remaining
                </Typography>
                <Typography variant="h5" className={summary.remainingBudget >= 0 ? "text-green-600" : "text-red-600"}>
                  ₹{Math.abs(summary.remainingBudget).toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Budgets Tab */}
        <Box hidden={activeTab !== 0}>
          <Card className="mb-6">
            <CardContent>
              <Typography variant="h6" gutterBottom>
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
                      aria-describedby="budget-amount-help"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Period</InputLabel>
                      <Select
                        name="period"
                        value={budgetForm.period}
                        onChange={handleBudgetChange}
                        label="Period"
                        required
                      >
                        <MenuItem value="weekly">Weekly</MenuItem>
                        <MenuItem value="monthly">Monthly</MenuItem>
                        <MenuItem value="yearly">Yearly</MenuItem>
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
                      InputLabelProps={{ shrink: true }}
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
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Category</InputLabel>
                      <Select
                        name="category"
                        value={budgetForm.category}
                        onChange={handleBudgetChange}
                        label="Category"
                        required
                      >
                        {categories.map((cat) => (
                          <MenuItem key={cat} value={cat}>
                            {cat}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <div className="flex space-x-2">
                      <Button type="submit" variant="contained" color="primary">
                        {isEditing ? "Update" : "Add"} Budget
                      </Button>
                      {isEditing && (
                        <Button variant="outlined" onClick={resetForms}>
                          Cancel
                        </Button>
                      )}
                    </div>
                  </Grid>
                </Grid>
              </form>
            </CardContent>
          </Card>

          {/* Budget Filters */}
          <Card className="mb-6">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Budget Filters
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Period</InputLabel>
                    <Select
                      name="budgetPeriod"
                      value={filters.budgetPeriod}
                      onChange={handleFilterChange}
                      label="Period"
                    >
                      <MenuItem value="all">All Periods</MenuItem>
                      <MenuItem value="weekly">Weekly</MenuItem>
                      <MenuItem value="monthly">Monthly</MenuItem>
                      <MenuItem value="yearly">Yearly</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<FileDownload />}
                    onClick={() => exportToCSV("budget")}
                  >
                    Export CSV
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<FileDownload />}
                    onClick={() => exportToExcel("budget")}
                  >
                    Export Excel
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Budget List */}
          <Card className="mb-6">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Your Budgets ({filteredBudgets.length})
              </Typography>
              {isLoadingBudgets && <LinearProgress />}
              {filteredBudgets.length === 0 && !isLoadingBudgets && (
                <Typography color="textSecondary" align="center">
                  No budgets found. Add a budget to start tracking.
                </Typography>
              )}
              <Grid container spacing={3}>
                {filteredBudgets.map((budget) => {
                  const progress = (Number(budget.spent) / Number(budget.amount)) * 100;
                  const daysLeft = Math.ceil(
                    (new Date(budget.endDate) - new Date()) / (1000 * 60 * 60 * 24)
                  );
                  return (
                    <Grid item xs={12} sm={6} md={4} key={budget.id}>
                      <Card sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                          {budget.category || "General"} Budget ({budget.period})
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={progress > 100 ? 100 : progress}
                          color={progress > 90 ? "error" : progress > 50 ? "warning" : "success"}
                          sx={{ height: 10, mb: 1 }}
                        />
                        <Typography variant="body2" gutterBottom>
                          ₹{Number(budget.spent).toFixed(2)} of ₹{Number(budget.amount).toFixed(2)} ({progress.toFixed(1)}%)
                        </Typography>
                        {progress > 90 && (
                          <Alert severity={progress >= 100 ? "error" : "warning"} sx={{ mb: 1 }}>
                            {progress >= 100 ? "Budget exceeded!" : "Close to limit!"}
                          </Alert>
                        )}
                        <Chip
                          label={`${daysLeft >= 0 ? daysLeft : 0} days left`}
                          color={daysLeft < 7 ? "error" : "default"}
                          size="small"
                          sx={{ mb: 1 }}
                        />
                        <div className="flex space-x-2">
                          <Button
                            size="small"
                            startIcon={<Edit />}
                            onClick={() => handleEditBudget(budget)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="small"
                            startIcon={<Delete />}
                            onClick={() => confirmDelete(budget, "budget")}
                            color="error"
                          >
                            Delete
                          </Button>
                        </div>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </CardContent>
          </Card>
        </Box>

        {/* Transactions Tab */}
        <Box hidden={activeTab !== 1}>
          <Card className="mb-6">
            <CardContent>
              <Typography variant="h6" gutterBottom>
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
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Category</InputLabel>
                      <Select
                        name="category"
                        value={transactionForm.category}
                        onChange={handleTransactionChange}
                        label="Category"
                        required
                      >
                        {categories.map((cat) => (
                          <MenuItem key={cat} value={cat}>
                            {cat}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <div className="flex space-x-2">
                      <Button type="submit" variant="contained" color="primary">
                        {isEditing ? "Update" : "Add"} Transaction
                      </Button>
                      {isEditing && (
                        <Button variant="outlined" onClick={resetForms}>
                          Cancel
                        </Button>
                      )}
                    </div>
                  </Grid>
                </Grid>
              </form>
            </CardContent>
          </Card>

          {/* Transaction Filters */}
          <Card className="mb-6">
            <CardContent>
              <Typography variant="h6" gutterBottom>
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
                    InputProps={{ startAdornment: <Search className="mr-2" /> }}
                    aria-label="Search transactions"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                      name="category"
                      value={filters.category}
                      onChange={handleFilterChange}
                      label="Category"
                    >
                      <MenuItem value="all">All Categories</MenuItem>
                      {categories.map((cat) => (
                        <MenuItem key={cat} value={cat}>
                          {cat}
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
                    InputLabelProps={{ shrink: true }}
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
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<FileDownload />}
                    onClick={() => exportToCSV("transaction")}
                  >
                    Export CSV
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<FileDownload />}
                    onClick={() => exportToExcel("transaction")}
                  >
                    Export Excel
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button fullWidth variant="outlined" onClick={resetFilters}>
                    Reset Filters
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Transactions List */}
          <Card className="mb-6">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Transactions ({filteredTransactions.length})
              </Typography>
              <TableContainer component={Paper}>
                <Table aria-label="Transactions table">
                  <TableHead>
                    <TableRow>
                      <TableCell>Description</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredTransactions.length > 0 ? (
                      filteredTransactions.map((txn) => (
                        <TableRow key={txn.id} hover>
                          <TableCell>{txn.description}</TableCell>
                          <TableCell
                            align="right"
                            className={Number(txn.amount) >= 0 ? "text-green-600" : "text-red-600"}
                          >
                            ₹{Number(txn.amount).toFixed(2)}
                          </TableCell>
                          <TableCell>{txn.transactionDate}</TableCell>
                          <TableCell>
                            <Chip label={txn.category} size="small" />
                          </TableCell>
                          <TableCell>
                            <IconButton
                              onClick={() => handleEditTransaction(txn)}
                              aria-label={`Edit transaction ${txn.description}`}
                            >
                              <Edit color="primary" />
                            </IconButton>
                            <IconButton
                              onClick={() => confirmDelete(txn, "transaction")}
                              aria-label={`Delete transaction ${txn.description}`}
                            >
                              <Delete color="error" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          No transactions found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>

        {/* Analytics Tab */}
        <Box hidden={activeTab !== 2}>
          <Grid container spacing={3} className="mb-6" key={updateKey}>
            {/* Budget Utilization Summary */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Budget Utilization Overview
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <Typography color="textSecondary">
                        Percentage Spent
                      </Typography>
                      <Typography variant="h5" className={summary.percentSpent > 90 ? "text-red-600" : "text-blue-600"}>
                        {summary.percentSpent.toFixed(1)}%
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography color="textSecondary">
                        Remaining Budget
                      </Typography>
                      <Typography variant="h5" className={summary.remainingBudget >= 0 ? "text-green-600" : "text-red-600"}>
                        ₹{Math.abs(summary.remainingBudget).toFixed(2)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography color="textSecondary">
                        Total Savings (Historical)
                      </Typography>
                      <Typography variant="h5" className="text-green-600">
                        ₹{summary.totalSavings.toFixed(2)}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Category-Wise Budget Insights */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Category-Wise Budget Insights
                  </Typography>
                  {isLoadingBudgets && <LinearProgress />}
                  {budgets.length === 0 && !isLoadingBudgets && (
                    <Typography color="textSecondary" align="center" sx={{ mb: 2 }}>
                      No budgets added. Add budgets in the Budgets tab to see insights.
                    </Typography>
                  )}
                  {console.log("Rendering Table with Category Budget Details:", JSON.stringify(summary.categoryBudgetDetails, null, 2))}
                  <TableContainer component={Paper}>
                    <Table aria-label="Category budget insights table">
                      <TableHead>
                        <TableRow>
                          <TableCell>Category</TableCell>
                          <TableCell align="right">Budget</TableCell>
                          <TableCell align="right">Spent</TableCell>
                          <TableCell align="right">Remaining</TableCell>
                          <TableCell align="right">% Spent</TableCell>
                          <TableCell align="right">Avg. Transaction</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {categories.map((cat) => {
                          const details = summary.categoryBudgetDetails[cat] || {};
                          const hasBudget = details.totalBudget > 0;
                          return (
                            <TableRow key={cat}>
                              <TableCell>{cat}</TableCell>
                              <TableCell align="right">
                                {hasBudget ? `₹${details.totalBudget.toFixed(2)}` : "N/A"}
                              </TableCell>
                              <TableCell align="right">
                                ₹{details.totalSpent?.toFixed(2) || "0.00"}
                              </TableCell>
                              <TableCell align="right">
                                <span className={details.remainingBudget >= 0 ? "text-green-600" : "text-red-600"}>
                                  {hasBudget 
                                    ? `₹${Math.abs(details.remainingBudget).toFixed(2)}`
                                    : "N/A"}
                                </span>
                              </TableCell>
                              <TableCell align="right">
                                {hasBudget ? `${details.percentSpent.toFixed(1)}%` : "N/A"}
                              </TableCell>
                              <TableCell align="right">
                                {details.transactionCount > 0 
                                  ? `₹${details.avgSpendingPerTransaction.toFixed(2)}`
                                  : "N/A"}
                              </TableCell>
                              <TableCell>
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
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Spending by Category */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Spending by Category
                  </Typography>
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
              </Card>
            </Grid>

            {/* Monthly Spending */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Monthly Spending
                  </Typography>
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
              </Card>
            </Grid>

            {/* Budget vs Actual Spending */}
            {budgets.length > 0 && (
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Budget vs Actual Spending
                    </Typography>
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
                </Card>
              </Grid>
            )}

            {/* Savings Trend */}
            {savingsTrendData.length > 0 && (
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Savings Trend Over Time
                    </Typography>
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
                </Card>
              </Grid>
            )}

            {/* Historical Savings */}
            {savingsHistory.length > 0 && (
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Historical Savings
                    </Typography>
                    <TableContainer component={Paper}>
                      <Table aria-label="Historical savings table">
                        <TableHead>
                          <TableRow>
                            <TableCell>Category</TableCell>
                            <TableCell>Period</TableCell>
                            <TableCell align="right">Savings</TableCell>
                            <TableCell>End Date</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {savingsHistory.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.category}</TableCell>
                              <TableCell>{item.period}</TableCell>
                              <TableCell align="right">₹{item.savings.toFixed(2)}</TableCell>
                              <TableCell>{item.endDate}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
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
          <DialogTitle id="delete-dialog-title">Confirm Delete</DialogTitle>
          <DialogContent>
            <Typography id="delete-dialog-description">
              Are you sure you want to delete this {itemToDelete?.type}?
            </Typography>
            {itemToDelete && (
              <div className="mt-2">
                {itemToDelete.type === "budget" ? (
                  <>
                    <strong>{itemToDelete.period} Budget</strong> - ₹{itemToDelete.amount} (
                    Spent: ₹{itemToDelete.spent})
                  </>
                ) : (
                  <>
                    <strong>{itemToDelete.description}</strong> - ₹{itemToDelete.amount} (
                    {itemToDelete.category})
                  </>
                )}
              </div>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
            <Button onClick={handleDelete} color="error">
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
              action={
                <Button color="inherit" size="small" onClick={undoDelete}>
                  UNDO
                </Button>
              }
            >
              {deletedItem.type === "budget" ? "Budget" : "Transaction"} deleted
            </Alert>
          </Snackbar>
        )}
      </div>
    </div>
  );
};

CombinedTracker.propTypes = {
  // Add prop types if the component accepts props
};

export default CombinedTracker;