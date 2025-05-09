import React, { useEffect, useState, useMemo, useRef } from "react";
import axios from "axios";
import Cookies from "universal-cookie";
import { useNavigate } from "react-router-dom";
import { CSVLink } from "react-csv";
import { 
  Card, CardContent, Typography, Grid, TextField, Button, 
  Select, MenuItem, FormControl, InputLabel, Switch, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, Paper, IconButton, Snackbar, Alert, Divider,
  List, ListItem, ListItemText, ListItemIcon, Collapse
} from "@mui/material";
import { 
  PictureAsPdf, TableChart, Print, CloudDownload,
  DateRange, ArrowDropDown, ArrowDropUp, DarkMode, LightMode,
  Share, Timeline, PieChart as PieChartIcon, BarChart as BarChartIcon,
  Search  // Added this import
} from "@mui/icons-material";
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { 
  PieChart, Pie, BarChart, Bar, LineChart, Line, 
  Tooltip, Legend, ResponsiveContainer, Cell, XAxis, YAxis, CartesianGrid 
} from "recharts";

const Reports = () => {
  const cookies = new Cookies();
  const navigate = useNavigate();
  const API_URL = "http://localhost:8090";
  const searchInputRef = useRef(null);

  // State management
  const [transactions, setTransactions] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [downloadHistory, setDownloadHistory] = useState([]);
  const [timeRange, setTimeRange] = useState('last-30-days');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [expandedSection, setExpandedSection] = useState({
    categoryChart: true,
    monthlyChart: true,
    transactions: true
  });

  // Time range options
  const timeOptions = [
    { value: 'last-7-days', label: 'Last 7 Days' },
    { value: 'last-30-days', label: 'Last 30 Days' },
    { value: 'this-month', label: 'This Month' },
    { value: 'last-month', label: 'Last Month' },
    { value: 'this-year', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

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
    } catch (err) {
      showSnackbar("Failed to fetch transactions");
      console.error("Fetch error:", err);
    }
  };

  // Apply filters
  const filteredTransactions = useMemo(() => {
    let result = [...transactions];
    const now = new Date();

    // Time range filter
    switch(timeRange) {
      case 'last-7-days':
        const weekAgo = new Date(now.setDate(now.getDate() - 7));
        result = result.filter(t => new Date(t.transactionDate) >= weekAgo);
        break;
      case 'last-30-days':
        const monthAgo = new Date(now.setDate(now.getDate() - 30));
        result = result.filter(t => new Date(t.transactionDate) >= monthAgo);
        break;
      // Add other time range cases
    }

    // Category filter
    if (categoryFilter !== 'all') {
      result = result.filter(t => t.category === categoryFilter);
    }

    return result;
  }, [transactions, timeRange, categoryFilter]);

  // Calculate summary data
  const summary = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = filteredTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + t.amount, 0);
    const tax = income * 0.1;

    return { income, expenses, tax, net: income + expenses };
  }, [filteredTransactions]);

  // Prepare chart data
  const categoryData = useMemo(() => {
    const categories = filteredTransactions.reduce((acc, txn) => {
      acc[txn.category] = (acc[txn.category] || 0) + txn.amount;
      return acc;
    }, {});

    return Object.entries(categories).map(([name, value]) => ({
      name,
      value: Math.abs(value),
      type: value >= 0 ? 'Income' : 'Expense'
    }));
  }, [filteredTransactions]);

  const monthlyData = useMemo(() => {
    const months = Array(12).fill(0);
    filteredTransactions.forEach(txn => {
      const month = new Date(txn.transactionDate).getMonth();
      months[month] += txn.amount;
    });

    return months.map((amount, index) => ({
      name: new Date(2023, index).toLocaleString('default', { month: 'short' }),
      income: amount > 0 ? amount : 0,
      expense: amount < 0 ? Math.abs(amount) : 0
    }));
  }, [filteredTransactions]);

  // Export functions
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Transaction Report", 20, 10);
    doc.autoTable({
      head: [["Date", "Description", "Amount", "Category"]],
      body: filteredTransactions.map(t => [
        new Date(t.transactionDate).toLocaleDateString(),
        t.description,
        t.amount,
        t.category
      ])
    });
    const filename = `transactions_${new Date().toISOString().slice(0,10)}.pdf`;
    doc.save(filename);
    addToDownloadHistory('PDF', filename);
    showSnackbar("PDF report generated");
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredTransactions);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
    const filename = `transactions_${new Date().toISOString().slice(0,10)}.xlsx`;
    XLSX.writeFile(workbook, filename);
    addToDownloadHistory('Excel', filename);
    showSnackbar("Excel report generated");
  };

  const exportChartAsImage = async (chartId, name) => {
    const canvas = await html2canvas(document.getElementById(chartId));
    canvas.toBlob(blob => {
      saveAs(blob, `${name}.png`);
      addToDownloadHistory('Image', `${name}.png`);
      showSnackbar("Chart image saved");
    });
  };

  const addToDownloadHistory = (type, filename) => {
    setDownloadHistory(prev => [...prev, {
      type,
      filename,
      timestamp: new Date().toISOString()
    }]);
  };

  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setOpenSnackbar(true);
  };

  const toggleSection = (section) => {
    setExpandedSection(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Initialize data
  useEffect(() => {
    fetchTransactions();
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
  }, []);

  return (
    <div className={`min-h-screen p-4 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <Typography variant="h4" component="h1" className="font-bold">
          Financial Reports
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
                ₹{summary.income.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Expenses
              </Typography>
              <Typography variant="h5" className="text-red-600">
                ₹{Math.abs(summary.expenses).toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Net Balance
              </Typography>
              <Typography variant="h5" className={summary.net >= 0 ? "text-green-600" : "text-red-600"}>
                ₹{summary.net.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Estimated Tax (10%)
              </Typography>
              <Typography variant="h5">
                ₹{summary.tax.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Filters
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Time Range</InputLabel>
                <Select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  label="Time Range"
                >
                  {timeOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  label="Category"
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  {[...new Set(transactions.map(t => t.category))].map(cat => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Search"
                inputRef={searchInputRef}
                InputProps={{
                  startAdornment: <Search className="mr-2" />
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <div className="flex space-x-2">
                <Button 
                  variant="contained" 
                  startIcon={<PictureAsPdf />}
                  onClick={exportToPDF}
                >
                  PDF
                </Button>
                <Button 
                  variant="contained" 
                  startIcon={<TableChart />}
                  onClick={exportToExcel}
                >
                  Excel
                </Button>
                <CSVLink
                  data={filteredTransactions}
                  filename={`transactions_${new Date().toISOString().slice(0,10)}.csv`}
                  onClick={() => addToDownloadHistory('CSV', 'transactions.csv')}
                >
                  <Button variant="contained" startIcon={<TableChart />}>
                    CSV
                  </Button>
                </CSVLink>
                <Button 
                  variant="contained" 
                  startIcon={<Print />}
                  onClick={() => window.print()}
                >
                  Print
                </Button>
              </div>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <Grid container spacing={3} className="mb-6">
        {/* Category Breakdown */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <div 
                className="flex justify-between items-center cursor-pointer"
                onClick={() => toggleSection('categoryChart')}
              >
                <Typography variant="h6" gutterBottom>
                  <PieChartIcon className="mr-2" />
                  Category Breakdown
                </Typography>
                {expandedSection.categoryChart ? <ArrowDropUp /> : <ArrowDropDown />}
              </div>
              <Collapse in={expandedSection.categoryChart}>
                <div id="category-chart" style={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.type === 'Income' ? '#4CAF50' : '#F44336'} 
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`₹${value}`, "Amount"]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-end">
                  <Button
                    startIcon={<CloudDownload />}
                    onClick={() => exportChartAsImage('category-chart', 'category-breakdown')}
                  >
                    Download Chart
                  </Button>
                </div>
              </Collapse>
            </CardContent>
          </Card>
        </Grid>

        {/* Monthly Breakdown */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <div 
                className="flex justify-between items-center cursor-pointer"
                onClick={() => toggleSection('monthlyChart')}
              >
                <Typography variant="h6" gutterBottom>
                  <BarChartIcon className="mr-2" />
                  Monthly Breakdown
                </Typography>
                {expandedSection.monthlyChart ? <ArrowDropUp /> : <ArrowDropDown />}
              </div>
              <Collapse in={expandedSection.monthlyChart}>
                <div id="monthly-chart" style={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`₹${value}`, "Amount"]} />
                      <Legend />
                      <Bar dataKey="income" fill="#4CAF50" name="Income" />
                      <Bar dataKey="expense" fill="#F44336" name="Expense" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-end">
                  <Button
                    startIcon={<CloudDownload />}
                    onClick={() => exportChartAsImage('monthly-chart', 'monthly-breakdown')}
                  >
                    Download Chart
                  </Button>
                </div>
              </Collapse>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Transactions Table */}
      <Card>
        <CardContent>
          <div 
            className="flex justify-between items-center cursor-pointer"
            onClick={() => toggleSection('transactions')}
          >
            <Typography variant="h6" gutterBottom>
              Transaction Details ({filteredTransactions.length})
            </Typography>
            {expandedSection.transactions ? <ArrowDropUp /> : <ArrowDropDown />}
          </div>
          <Collapse in={expandedSection.transactions}>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Category</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((txn) => (
                      <TableRow key={txn.id}>
                        <TableCell>
                          {new Date(txn.transactionDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{txn.description}</TableCell>
                        <TableCell 
                          align="right"
                          className={txn.amount >= 0 ? "text-green-600" : "text-red-600"}
                        >
                          ₹{txn.amount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Chip label={txn.category} size="small" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No transactions found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Collapse>
        </CardContent>
      </Card>

      {/* Download History */}
      <Card className="mt-6">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Download History
          </Typography>
          <List>
            {downloadHistory.slice().reverse().map((item, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  {item.type === 'PDF' && <PictureAsPdf />}
                  {item.type === 'Excel' && <TableChart />}
                  {item.type === 'CSV' && <TableChart />}
                  {item.type === 'Image' && <Share />}
                </ListItemIcon>
                <ListItemText
                  primary={item.filename}
                  secondary={new Date(item.timestamp).toLocaleString()}
                />
              </ListItem>
            ))}
            {downloadHistory.length === 0 && (
              <ListItem>
                <ListItemText primary="No download history yet" />
              </ListItem>
            )}
          </List>
        </CardContent>
      </Card>

      {/* Snackbar */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setOpenSnackbar(false)} severity="success">
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Reports;