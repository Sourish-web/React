import React, { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "universal-cookie";
import { useNavigate } from "react-router-dom";
import { FiHome, FiStar, FiCalendar, FiFlag, FiBarChart, FiPlus, FiTrash2 } from "react-icons/fi";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";

const Transactions = () => {
  const cookies = new Cookies();
  const navigate = useNavigate();
  const API_URL = "http://localhost:8090";
  const getAuthToken = () => cookies.get("token");

  // State management
  const [transactions, setTransactions] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [form, setForm] = useState({
    amount: "",
    description: "",
    transactionDate: new Date().toISOString().split("T")[0],
    category: "OTHER",
    paymentMethod: "UPI",
    account: "State Bank of India",
    isExpense: true,
  });
  const [searchQuery, setSearchQuery] = useState("");

  // Categories matching backend enum
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

  // Fetch transactions from backend
  const fetchTransactions = async () => {
    const token = getAuthToken();
    if (!token) {
      navigate("/login");
      return;
    }
    try {
      const res = await axios.get(`${API_URL}/transaction/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTransactions(res.data);
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
      alert("Failed to fetch transactions.");
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Form handlers
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = getAuthToken();
    if (!token) {
      navigate("/login");
      return;
    }

    const payload = {
      ...form,
      amount: Number(form.amount),
      category: form.category || "OTHER",
      transactionDate: form.transactionDate || new Date().toISOString().split("T")[0],
    };

    try {
      await axios.post(`${API_URL}/transaction/add`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      resetForm();
      fetchTransactions();
    } catch (err) {
      console.error("Error adding transaction:", err);
      alert(`Error adding transaction: ${err.response?.data || "Unknown error"}`);
    }
  };

  const resetForm = () => {
    setForm({
      amount: "",
      description: "",
      transactionDate: new Date().toISOString().split("T")[0],
      category: "OTHER",
      paymentMethod: "UPI",
      account: "State Bank of India",
      isExpense: true,
    });
    setOpenDialog(false);
  };

  const handleDelete = async (id) => {
    const token = getAuthToken();
    if (!token) {
      navigate("/login");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this transaction?")) {
      return;
    }
    try {
      await axios.get(`${API_URL}/transaction/delete/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTransactions();
    } catch (err) {
      console.error("Delete failed:", err);
      alert(`Delete failed: ${err.response?.data || "Unknown error"}`);
    }
  };

  // Filter transactions based on search query
  const filteredTransactions = transactions.filter((transaction) =>
    transaction.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    transaction.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Hover effects for sidebar items, buttons, and table rows
  useEffect(() => {
    const sidebarItems = document.querySelectorAll(".sidebar-item");
    sidebarItems.forEach((item) => {
      const isActive = item.classList.contains("active");
      item.addEventListener("mouseenter", () => {
        item.style.backgroundColor = isActive ? "rgba(0, 196, 180, 0.3)" : "#e0e0e0";
      });
      item.addEventListener("mouseleave", () => {
        item.style.backgroundColor = isActive ? "rgba(0, 196, 180, 0.2)" : "transparent";
      });
    });

    const buttons = document.querySelectorAll(".action-button");
    buttons.forEach((button) => {
      const isDelete = button.classList.contains("delete-button");
      button.addEventListener("mouseenter", () => {
        button.style.background = isDelete
          ? "#dc2626"
          : "linear-gradient(145deg, #00c4b4, #00a69a)";
        button.style.transform = "scale(1.05)";
      });
      button.addEventListener("mouseleave", () => {
        button.style.background = isDelete ? "#ef4444" : "#00c4b4";
        button.style.transform = "scale(1)";
      });
    });

    const rows = document.querySelectorAll(".table-row");
    rows.forEach((row) => {
      row.addEventListener("mouseenter", () => {
        row.style.backgroundColor = "#f9fafb";
      });
      row.addEventListener("mouseleave", () => {
        row.style.backgroundColor = "transparent";
      });
    });

    return () => {
      sidebarItems.forEach((item) => {
        item.removeEventListener("mouseenter", () => {});
        item.removeEventListener("mouseleave", () => {});
      });
      buttons.forEach((button) => {
        button.removeEventListener("mouseenter", () => {});
        button.removeEventListener("mouseleave", () => {});
      });
      rows.forEach((row) => {
        row.removeEventListener("mouseenter", () => {});
        row.removeEventListener("mouseleave", () => {});
      });
    };
  }, [filteredTransactions]);

  // Format date and time
  const formatDateTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: true,
    });
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.logo}>
          <span style={styles.logoText}>ExpenseMate</span>
        </div>
      </header>

      {/* Main Layout */}
      <div style={styles.layout}>
        {/* Sidebar Navigation */}
        <nav style={styles.sidebar}>
          <ul style={styles.sidebarList}>
            {[
              { text: "Dashboard", icon: <FiHome size={18} />, path: "/Users" },
              { text: "Transactions", icon: <FiStar size={18} />, path: "/transactions", active: true },
              { text: "Budgets", icon: <FiCalendar size={18} />, path: "/budget" },
              { text: "Goals", icon: <FiFlag size={18} />, path: "/goals" },
              { text: "Reports", icon: <FiBarChart size={18} />, path: "/reports" },
            ].map((item) => (
              <li
                key={item.text}
                className={`sidebar-item ${item.active ? "active" : ""}`}
                style={{
                  ...styles.sidebarItem,
                  backgroundColor: item.active ? "rgba(0, 196, 180, 0.2)" : "transparent",
                  color: item.active ? "#00c4b4" : "#333",
                }}
                onClick={() => navigate(item.path)}
              >
                <span style={{ ...styles.sidebarIcon, color: item.active ? "#00c4b4" : "#666" }}>
                  {item.icon}
                </span>
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
          <button
            style={styles.addButton}
            className="action-button"
            onClick={() => setOpenDialog(true)}
          >
            <FiPlus size={18} style={{ marginRight: "0.5rem" }} /> Add
          </button>
        </nav>

        {/* Main Content */}
        <main style={styles.main}>
          <section style={styles.section}>
            {/* Page Title and Actions */}
            <div style={styles.headerRow}>
              <h2 style={styles.sectionTitle}>Transactions</h2>
              <div style={styles.actions}>
                <button
                  style={styles.addButton}
                  className="action-button"
                  onClick={() => setOpenDialog(true)}
                >
                  Add Transaction
                </button>
                <div style={styles.searchContainer}>
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={styles.searchInput}
                  />
                  <button style={styles.filterButton} className="action-button">
                    Filter
                  </button>
                </div>
              </div>
            </div>

            {/* Transaction Table */}
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeader}>
                    <th style={styles.tableCell}>Date & Time</th>
                    <th style={styles.tableCell}>Transaction Details</th>
                    <th style={styles.tableCell}>Account Details</th>
                    <th style={styles.tableCell}>Amount</th>
                    <th style={styles.tableCell}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction) => {
                    const isExpense = transaction.amount < 0;
                    return (
                      <tr key={transaction.id} style={styles.tableRow} className="table-row">
                        <td style={styles.tableCell}>
                          {formatDateTime(transaction.transactionDate)}
                        </td>
                        <td style={styles.tableCell}>
                          <div style={styles.transactionDetails}>
                            <span>{transaction.description || "N/A"}</span>
                            <span style={{ display: "flex", alignItems: "center", marginTop: "0.25rem" }}>
                              {isExpense ? (
                                <FaArrowUp size={12} style={{ color: "#f44336", marginRight: "0.25rem" }} />
                              ) : (
                                <FaArrowDown size={12} style={{ color: "#4caf50", marginRight: "0.25rem" }} />
                              )}
                              {transaction.category.charAt(0) +
                                transaction.category.slice(1).toLowerCase()}
                            </span>
                            <span style={{ fontSize: "0.75rem", color: "#666" }}>
                              ID #{transaction.id}
                            </span>
                          </div>
                        </td>
                        <td style={styles.tableCell}>
                          <div>
                            <span>State Bank of India</span>
                            <div style={{ fontSize: "0.75rem", color: "#666" }}>UPI</div>
                          </div>
                        </td>
                        <td style={styles.tableCell}>
                          <span
                            style={{
                              color: isExpense ? "#f44336" : "#4caf50",
                            }}
                          >
                            {isExpense ? "- " : "+ "}Rs. {Math.abs(transaction.amount).toLocaleString()}
                          </span>
                        </td>
                        <td style={styles.tableCell}>
                          <button
                            onClick={() => handleDelete(transaction.id)}
                            style={styles.deleteButton}
                            className="action-button delete-button"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>

      {/* Add Transaction Dialog */}
      {openDialog && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>Add Transaction</h3>
            <div style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Description</label>
                <input
                  type="text"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  style={styles.formInput}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Amount</label>
                <input
                  type="number"
                  name="amount"
                  value={form.amount}
                  onChange={handleChange}
                  required
                  style={styles.formInput}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Category</label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  style={styles.formSelect}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0) + cat.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Transaction Date</label>
                <input
                  type="date"
                  name="transactionDate"
                  value={form.transactionDate}
                  onChange={handleChange}
                  style={styles.formInput}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Type</label>
                <label>
                  <input
                    type="checkbox"
                    name="isExpense"
                    checked={form.isExpense}
                    onChange={handleChange}
                  />
                  Expense (uncheck for Income)
                </label>
              </div>
            </div>
            <div style={styles.modalActions}>
              <button
                onClick={resetForm}
                style={styles.cancelButton}
                className="action-button"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                style={styles.submitButton}
                className="action-button"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

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
  layout: {
    display: "flex",
    paddingTop: "64px",
  },
  sidebar: {
    width: "160px",
    background: "#f5f6f5",
    height: "calc(100vh - 64px)",
    position: "fixed",
    top: "64px",
    left: 0,
    borderRight: "1px solid #e5e7eb",
    boxSizing: "border-box",
  },
  sidebarList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    paddingTop: "1rem",
  },
  sidebarItem: {
    display: "flex",
    alignItems: "center",
    padding: "0 1rem",
    height: "2.5rem",
    cursor: "pointer",
    transition: "background-color 0.3s",
    fontSize: "0.875rem",
    lineHeight: "1",
  },
  sidebarIcon: {
    marginRight: "0.5rem",
  },
  addButton: {
    background: "#00c4b4",
    color: "#ffffff",
    border: "none",
    padding: "0.75rem 1.5rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: 500,
    margin: "1rem",
    display: "flex",
    alignItems: "center",
    transition: "background 0.3s, transform 0.3s",
  },
  main: {
    marginLeft: "160px",
    padding: "1rem 1rem 2rem",
    flexGrow: 1,
    boxSizing: "border-box",
  },
  section: {
    padding: "0",
    background: "#f5f6f5",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1.5rem",
  },
  sectionTitle: {
    fontSize: "2rem",
    fontWeight: 700,
    color: "#333333",
    margin: 0,
    lineHeight: "1",
  },
  actions: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  searchContainer: {
    display: "flex",
    gap: "0.5rem",
  },
  searchInput: {
    padding: "0.5rem",
    border: "1px solid #e0e0e0",
    borderRadius: "4px",
    fontSize: "0.875rem",
    outline: "none",
    transition: "border-color 0.3s",
  },
  filterButton: {
    background: "#00c4b4",
    color: "#ffffff",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.875rem",
    transition: "background 0.3s, transform 0.3s",
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
  transactionDetails: {
    display: "flex",
    flexDirection: "column",
  },
  deleteButton: {
    background: "#ef4444",
    color: "#ffffff",
    border: "none",
    padding: "0.5rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.875rem",
    transition: "background 0.3s, transform 0.3s",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.3)",
    backdropFilter: "blur(5px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    background: "#ffffff",
    borderRadius: "15px",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
    padding: "2rem",
    width: "90%",
    maxWidth: "500px",
    animation: "fadeIn 0.3s ease-in-out",
  },
  modalTitle: {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#333333",
    marginBottom: "1rem",
  },
  form: {
    display: "grid",
    gap: "1rem",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
  },
  formLabel: {
    fontSize: "0.875rem",
    color: "#666",
    marginBottom: "0.25rem",
  },
  formInput: {
    padding: "0.5rem",
    border: "1px solid #e0e0e0",
    borderRadius: "4px",
    fontSize: "0.875rem",
    outline: "none",
    transition: "border-color 0.3s",
  },
  formSelect: {
    padding: "0.5rem",
    border: "1px solid #e0e0e0",
    borderRadius: "4px",
    fontSize: "0.875rem",
    outline: "none",
    transition: "border-color 0.3s",
  },
  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "1rem",
    marginTop: "1rem",
  },
  cancelButton: {
    background: "#666",
    color: "#ffffff",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.875rem",
    transition: "background 0.3s, transform 0.3s",
  },
  submitButton: {
    background: "#00c4b4",
    color: "#ffffff",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.875rem",
    transition: "background 0.3s, transform 0.3s",
  },
};

export default Transactions;