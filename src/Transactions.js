import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Cookies from "universal-cookie";
import { useNavigate } from "react-router-dom";
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { 
  PieChart, Pie, BarChart, Bar, LineChart, Line, 
  Tooltip, Legend, ResponsiveContainer, Cell, XAxis, YAxis, CartesianGrid 
} from "recharts";
import { 
  Card, CardContent, Typography, Grid, TextField, Button, 
  Select, MenuItem, FormControl, InputLabel, Switch, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, Paper, IconButton, Dialog, DialogActions, 
  DialogContent, DialogTitle, Snackbar, Alert
} from "@mui/material";
import { 
  Delete, Edit, Search, DateRange, AttachMoney, 
  Sort, FileDownload, Undo, DarkMode, LightMode 
} from "@mui/icons-material";

const Transaction = () => {
  const cookies = new Cookies();
  const navigate = useNavigate();
  const API_URL = "http://localhost:8090";
  const searchInputRef = useRef(null);

  // State management
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [form, setForm] = useState({
    id: null,
    description: "",
    amount: "",
    transactionDate: new Date().toISOString().split('T')[0],
    category: "",
  });
  const [filters, setFilters] = useState({
    search: "",
    fromDate: "",
    toDate: "",
    minAmount: "",
    maxAmount: "",
    category: "all",
    sortBy: "date",
    sortOrder: "desc"
  });
  const [isEditing, setIsEditing] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState([]);
  const [deletedTransaction, setDeletedTransaction] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);

  // Categories for dropdown
  const categories = [
    "Food", "Transport", "Housing", "Entertainment", 
    "Healthcare", "Education", "Shopping", "Other"
  ];

  // Color scheme for charts
  const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#f87171", "#34d399", "#60a5fa", "#fbbf24", "#a78bfa"];

  // Fetch transactions
  const fetchTransactions = async () => {
    const token = cookies.get("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const res = await axios.get(`${API_URL}/transaction/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions(res.data);
      setFilteredTransactions(res.data); // Initialize filtered transactions
    } catch (err) {
      showSnackbar("Failed to fetch transactions");
      console.error("Fetch error:", err);
    }
  };

  // Apply all filters
  const applyFilters = () => {
    let result = [...transactions];

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      result = result.filter(txn => 
        txn.description.toLowerCase().includes(searchTerm) || 
        txn.category.toLowerCase().includes(searchTerm)
      );
    }

    // Date range filter
    if (filters.fromDate) {
      result = result.filter(txn => txn.transactionDate >= filters.fromDate);
    }
    if (filters.toDate) {
      result = result.filter(txn => txn.transactionDate <= filters.toDate);
    }

    // Amount range filter
    if (filters.minAmount) {
      result = result.filter(txn => txn.amount >= parseFloat(filters.minAmount));
    }
    if (filters.maxAmount) {
      result = result.filter(txn => txn.amount <= parseFloat(filters.maxAmount));
    }

    // Category filter
    if (filters.category !== "all") {
      result = result.filter(txn => txn.category === filters.category);
    }

    // Sorting
    result.sort((a, b) => {
      if (filters.sortBy === "amount") {
        return filters.sortOrder === "asc" 
          ? a.amount - b.amount 
          : b.amount - a.amount;
      } else {
        return filters.sortOrder === "asc"
          ? new Date(a.transactionDate) - new Date(b.transactionDate)
          : new Date(b.transactionDate) - new Date(a.transactionDate);
      }
    });

    setFilteredTransactions(result);
  };

  // Form handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = cookies.get("token");
    if (!token) return showSnackbar("Not authenticated");

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const endpoint = isEditing ? "/transaction/update" : "/transaction/add";
      await axios.post(`${API_URL}${endpoint}`, form, { headers });
      
      showSnackbar(`Transaction ${isEditing ? "updated" : "added"} successfully`);
      resetForm();
      fetchTransactions();
    } catch (err) {
      showSnackbar("Error saving transaction");
      console.error("Save error:", err);
    }
  };

  const resetForm = () => {
    setForm({
      id: null,
      description: "",
      amount: "",
      transactionDate: new Date().toISOString().split('T')[0],
      category: ""
    });
    setIsEditing(false);
  };

  // Transaction actions
  const handleEdit = (txn) => {
    setForm(txn);
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const confirmDelete = (txn) => {
    setTransactionToDelete(txn);
    setOpenDeleteDialog(true);
  };

  const handleDelete = async () => {
    const token = cookies.get("token");
    if (!token || !transactionToDelete) return;

    try {
      setDeletedTransaction(transactionToDelete);
      await axios.get(`${API_URL}/transaction/delete/${transactionToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showSnackbar("Transaction deleted");
      fetchTransactions();
    } catch (err) {
      showSnackbar("Error deleting transaction");
      console.error("Delete error:", err);
    } finally {
      setOpenDeleteDialog(false);
    }
  };

  const undoDelete = () => {
    if (!deletedTransaction) return;
    
    setTransactions(prev => [...prev, deletedTransaction]);
    setDeletedTransaction(null);
    showSnackbar("Transaction restored");
  };

  // Bulk actions
  const handleBulkDelete = async () => {
    const token = cookies.get("token");
    if (!token || selectedTransactions.length === 0) return;

    try {
      await Promise.all(
        selectedTransactions.map(id => 
          axios.get(`${API_URL}/transaction/delete/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        )
      );
      showSnackbar(`${selectedTransactions.length} transactions deleted`);
      fetchTransactions();
      setSelectedTransactions([]);
    } catch (err) {
      showSnackbar("Error deleting transactions");
      console.error("Bulk delete error:", err);
    }
  };

  // Export functions
  const exportToCSV = () => {
    const headers = ["Description", "Amount", "Category", "Date"];
    const csvData = [
      headers,
      ...filteredTransactions.map(txn => [
        txn.description,
        txn.amount,
        txn.category,
        txn.transactionDate
      ])
    ].join("\n");
    
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8" });
    saveAs(blob, "transactions.csv");
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredTransactions);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
    XLSX.writeFile(workbook, "transactions.xlsx");
  };

  // Snackbar (notification) handler
  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setOpenSnackbar(true);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === "f") {
        e.preventDefault();
        searchInputRef.current.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Initialize data
  useEffect(() => {
    fetchTransactions();
  }, []);

  // Apply filters when transactions or filters change
  useEffect(() => {
    applyFilters();
  }, [transactions, filters]);

  // Calculate summary data
  const summary = {
    totalIncome: filteredTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0),
    totalExpense: filteredTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + t.amount, 0),
    largestTransaction: filteredTransactions.length > 0
      ? Math.max(...filteredTransactions.map(t => Math.abs(t.amount)))
      : 0,
    frequentCategory: filteredTransactions.length > 0
      ? [...new Set(filteredTransactions.map(t => t.category))]
          .sort((a, b) => 
            filteredTransactions.filter(t => t.category === b).length - 
            filteredTransactions.filter(t => t.category === a).length
          )[0]
      : "N/A"
  };

  // Prepare chart data
  const categoryData = Object.entries(
    filteredTransactions.reduce((acc, txn) => {
      acc[txn.category] = (acc[txn.category] || 0) + txn.amount;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value: Math.abs(value) }));

  const monthlyData = filteredTransactions.reduce((acc, txn) => {
    const month = new Date(txn.transactionDate).toLocaleString('default', { month: 'short' });
    acc[month] = (acc[month] || 0) + txn.amount;
    return acc;
  }, {});

  const monthlyChartData = Object.entries(monthlyData).map(([name, value]) => ({
    name,
    income: value > 0 ? value : 0,
    expense: value < 0 ? Math.abs(value) : 0
  }));

  return (
    <div className={`min-h-screen ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
      <div className="container mx-auto p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <Typography variant="h4" component="h1" className="font-bold">
            Transaction Manager
          </Typography>
          <div className="flex items-center space-x-2">
            <IconButton onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? <LightMode /> : <DarkMode />}
            </IconButton>
            <Typography variant="body2">
              {darkMode ? "Light Mode" : "Dark Mode"}
            </Typography>
          </div>
        </div>

        {/* Summary Cards */}
        <Grid container spacing={3} className="mb-6">
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Income
                </Typography>
                <Typography variant="h5" className="text-green-600">
                  ₹{summary.totalIncome.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Expense
                </Typography>
                <Typography variant="h5" className="text-red-600">
                  ₹{Math.abs(summary.totalExpense).toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Largest Transaction
                </Typography>
                <Typography variant="h5">
                  ₹{summary.largestTransaction.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Frequent Category
                </Typography>
                <Typography variant="h5">
                  {summary.frequentCategory}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Transaction Form */}
        <Card className="mb-6">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {isEditing ? "Edit Transaction" : "Add New Transaction"}
            </Typography>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Description"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Amount"
                    name="amount"
                    type="number"
                    value={form.amount}
                    onChange={handleChange}
                    required
                    helperText="Use negative for expenses"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Date"
                    name="transactionDate"
                    type="date"
                    value={form.transactionDate}
                    onChange={handleChange}
                    required
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                      label="Category"
                      required
                    >
                      {categories.map(cat => (
                        <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <div className="flex space-x-2">
                    <Button 
                      type="submit" 
                      variant="contained" 
                      color="primary"
                    >
                      {isEditing ? "Update" : "Add"} Transaction
                    </Button>
                    {isEditing && (
                      <Button 
                        variant="outlined" 
                        onClick={resetForm}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Filters
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
                  InputProps={{
                    startAdornment: <Search className="mr-2" />
                  }}
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
                    {categories.map(cat => (
                      <MenuItem key={cat} value={cat}>{cat}</MenuItem>
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
                  InputProps={{
                    startAdornment: <DateRange className="mr-2" />
                  }}
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
                <TextField
                  fullWidth
                  label="Min Amount"
                  name="minAmount"
                  type="number"
                  value={filters.minAmount}
                  onChange={handleFilterChange}
                  InputProps={{
                    startAdornment: <AttachMoney className="mr-2" />
                  }}
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
                  InputProps={{
                    startAdornment: <AttachMoney className="mr-2" />
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    name="sortBy"
                    value={filters.sortBy}
                    onChange={handleFilterChange}
                    label="Sort By"
                  >
                    <MenuItem value="date">Date</MenuItem>
                    <MenuItem value="amount">Amount</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Order</InputLabel>
                  <Select
                    name="sortOrder"
                    value={filters.sortOrder}
                    onChange={handleFilterChange}
                    label="Order"
                  >
                    <MenuItem value="desc">Descending</MenuItem>
                    <MenuItem value="asc">Ascending</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <div className="flex space-x-2">
                  <Button 
                    variant="outlined" 
                    startIcon={<FileDownload />}
                    onClick={exportToCSV}
                  >
                    Export CSV
                  </Button>
                  <Button 
                    variant="outlined" 
                    startIcon={<FileDownload />}
                    onClick={exportToExcel}
                  >
                    Export Excel
                  </Button>
                  {selectedTransactions.length > 0 && (
                    <Button 
                      variant="contained" 
                      color="error"
                      startIcon={<Delete />}
                      onClick={handleBulkDelete}
                    >
                      Delete Selected ({selectedTransactions.length})
                    </Button>
                  )}
                </div>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card className="mb-6">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Transactions ({filteredTransactions.length})
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <input 
                        type="checkbox" 
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedTransactions(filteredTransactions.map(t => t.id));
                          } else {
                            setSelectedTransactions([]);
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map(txn => (
                      <TableRow key={txn.id} hover>
                        <TableCell padding="checkbox">
                          <input 
                            type="checkbox" 
                            checked={selectedTransactions.includes(txn.id)}
                            onChange={e => {
                              if (e.target.checked) {
                                setSelectedTransactions([...selectedTransactions, txn.id]);
                              } else {
                                setSelectedTransactions(selectedTransactions.filter(id => id !== txn.id));
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>{txn.description}</TableCell>
                        <TableCell align="right" className={txn.amount >= 0 ? "text-green-600" : "text-red-600"}>
                          ₹{txn.amount.toFixed(2)}
                        </TableCell>
                        <TableCell>{txn.transactionDate}</TableCell>
                        <TableCell>
                          <Chip label={txn.category} size="small" />
                        </TableCell>
                        <TableCell>
                          <IconButton onClick={() => handleEdit(txn)}>
                            <Edit color="primary" />
                          </IconButton>
                          <IconButton onClick={() => confirmDelete(txn)}>
                            <Delete color="error" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No transactions found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Charts Section */}
        <Grid container spacing={3} className="mb-6">
          {/* Category Breakdown Pie Chart */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Category Breakdown
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryData.map((entry, index) => (
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

          {/* Monthly Income/Expense Bar Chart */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Monthly Summary
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
        </Grid>

        {/* Delete Confirmation Dialog */}
        <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            Are you sure you want to delete this transaction?
            {transactionToDelete && (
              <div className="mt-2">
                <strong>{transactionToDelete.description}</strong> - 
                ₹{transactionToDelete.amount} ({transactionToDelete.category})
              </div>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
            <Button onClick={handleDelete} color="error">Delete</Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar Notifications */}
        <Snackbar
          open={openSnackbar}
          autoHideDuration={3000}
          onClose={() => setOpenSnackbar(false)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert 
            onClose={() => setOpenSnackbar(false)} 
            severity="success"
            variant="filled"
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </div>
    </div>
  );
};

export default Transaction;