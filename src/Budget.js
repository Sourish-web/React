import React, { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "universal-cookie";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiHome, FiCalendar, FiDollarSign, FiFlag, FiBarChart, FiPlus, FiEdit, FiTrash2 } from "react-icons/fi";

const Budget = () => {
  const cookies = new Cookies();
  const navigate = useNavigate();
  const API_URL = "http://localhost:8090";
  const getAuthToken = () => cookies.get("token");

  // State management
  const [budgets, setBudgets] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    id: null,
    amount: "",
    period: "MONTHLY",
    spent: "0",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(new Date().setDate(new Date().getDate() + 30))
      .toISOString()
      .split("T")[0],
    category: "OTHER",
  });

  // Categories and periods matching backend enums
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

  // Calculate endDate based on period and startDate
  const calculateEndDate = (startDate, period) => {
    const start = new Date(startDate);
    let endDate = new Date(start);
    if (period === "WEEKLY") {
      endDate.setDate(start.getDate() + 7);
    } else if (period === "MONTHLY") {
      endDate.setMonth(start.getMonth() + 1);
    } else if (period === "YEARLY") {
      endDate.setFullYear(start.getFullYear() + 1);
    }
    return endDate.toISOString().split("T")[0];
  };

  // Validate date range based on period
  const validateDateRange = (startDate, endDate, period) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end - start;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    if (period === "WEEKLY") {
      return Math.abs(diffDays - 7) <= 1; // Allow 1-day tolerance
    } else if (period === "MONTHLY") {
      return diffDays >= 28 && diffDays <= 31; // Typical month range
    } else if (period === "YEARLY") {
      return diffDays >= 365 && diffDays <= 366; // Account for leap years
    }
    return false;
  };

  // Update endDate when period or startDate changes
  useEffect(() => {
    if (!isEditing) {
      // Only auto-update endDate for new budgets, not when editing
      const newEndDate = calculateEndDate(form.startDate, form.period);
      setForm((prev) => ({ ...prev, endDate: newEndDate }));
    }
  }, [form.startDate, form.period, isEditing]);

  // Fetch budgets from backend
  const fetchBudgets = async () => {
    const token = getAuthToken();
    if (!token) {
      toast.error("You are not authenticated. Please log in.");
      navigate("/login");
      return;
    }
    try {
      const res = await axios.get(`${API_URL}/getBudget`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBudgets(
        res.data.map((budget) => ({
          ...budget,
          amount: Number(budget.amount),
          spent: Number(budget.spent || 0),
          startDate: budget.startDate.split("T")[0],
          endDate: budget.endDate.split("T")[0],
        }))
      );
    } catch (err) {
      console.error("Failed to fetch budgets:", err);
      toast.error("Failed to fetch budgets.");
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  // Summary calculations
  const totalBudget = budgets.reduce((sum, b) => sum + (b.amount || 0), 0);
  const totalUsed = budgets.reduce((sum, b) => sum + (b.spent || 0), 0);
  const totalLeft = totalBudget - totalUsed;

  // Form handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = getAuthToken();
    if (!token) {
      toast.error("You are not authenticated. Please log in.");
      navigate("/login");
      return;
    }

    // Validate date range
    if (!validateDateRange(form.startDate, form.endDate, form.period)) {
      toast.error(
        `The date range does not match the selected period (${form.period.toLowerCase()}). ` +
          `For WEEKLY, end date must be 7 days after start date. ` +
          `For MONTHLY, end date must be ~1 month after start date. ` +
          `For YEARLY, end date must be ~1 year after start date.`
      );
      return;
    }

    const payload = {
      id: isEditing ? form.id : undefined,
      amount: Number(form.amount),
      spent: Number(form.spent || 0),
      period: form.period,
      category: form.category,
      startDate: form.startDate,
      endDate: form.endDate,
    };

    try {
      const endpoint = isEditing ? "/updateBudget" : "/addBudget";
      await axios.post(`${API_URL}${endpoint}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(isEditing ? "Budget updated successfully!" : "Budget added successfully!");
      resetForm();
      fetchBudgets();
    } catch (err) {
      console.error(`Error ${isEditing ? "updating" : "adding"} budget:`, err);
      toast.error(
        `Error ${isEditing ? "updating" : "adding"} budget: ${
          err.response?.data || "Unknown error"
        }`
      );
    }
  };

  const resetForm = () => {
    setForm({
      id: null,
      amount: "",
      period: "MONTHLY",
      spent: "0",
      startDate: new Date().toISOString().split("T")[0],
      endDate: calculateEndDate(new Date().toISOString().split("T")[0], "MONTHLY"),
      category: "OTHER",
    });
    setIsEditing(false);
    setOpenDialog(false);
  };

  const handleEdit = (budget) => {
    setForm({
      id: budget.id,
      amount: budget.amount.toString(),
      spent: budget.spent.toString(),
      period: budget.period,
      category: budget.category,
      startDate: budget.startDate,
      endDate: budget.endDate,
    });
    setIsEditing(true);
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    const token = getAuthToken();
    if (!token) {
      toast.error("You are not authenticated. Please log in.");
      navigate("/login");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this budget?")) {
      return;
    }
    try {
      await axios.get(`${API_URL}/Budget/delete/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Budget deleted successfully!");
      fetchBudgets();
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error(`Delete failed: ${err.response?.data || "Unknown error"}`);
    }
  };

  // Hover effects for sidebar items, buttons, and cards
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

    const cards = document.querySelectorAll(".overview-card");
    cards.forEach((card) => {
      card.addEventListener("mouseenter", () => {
        card.style.transform = "scale(1.05)";
        card.style.boxShadow = "0 4px 8px rgba(0,0,0,0.15)";
      });
      card.addEventListener("mouseleave", () => {
        card.style.transform = "scale(1)";
        card.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
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
      cards.forEach((card) => {
        card.removeEventListener("mouseenter", () => {});
        card.removeEventListener("mouseleave", () => {});
      });
    };
  }, []);

  return (
    <div style={styles.container}>
      <ToastContainer position="top-right" autoClose={5000} theme="dark" />
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
              { text: "Dashboard", icon: <FiHome size={18} />, path: "/dashboard" },
              { text: "Budgets", icon: <FiCalendar size={18} />, path: "/budgets", active: true },
              { text: "Transactions", icon: <FiDollarSign size={18} />, path: "/transactions" },
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
            {/* Page Title */}
            <h2 style={styles.sectionTitle}>Budgets</h2>
            {/* Add Budget Button */}
            <div style={styles.buttonContainer}>
              <button
                style={styles.addButton}
                className="action-button"
                onClick={() => setOpenDialog(true)}
              >
                Add Budget
              </button>
            </div>

            {/* Budget Overview Cards */}
            <div style={styles.overviewContainer}>
              <div style={styles.overviewCard} className="overview-card">
                <p style={styles.cardLabel}>Total Budget</p>
                <p style={styles.cardValue}>Rs. {totalBudget.toLocaleString()}</p>
              </div>
              <div style={styles.overviewCard} className="overview-card">
                <p style={styles.cardLabel}>Total Used</p>
                <p style={styles.cardValue}>Rs. {totalUsed.toLocaleString()}</p>
              </div>
              <div style={styles.overviewCard} className="overview-card">
                <p style={styles.cardLabel}>Total Left</p>
                <p
                  style={{
                    ...styles.cardValue,
                    color: totalLeft >= 0 ? "#4caf50" : "#f44336",
                  }}
                >
                  Rs. {totalLeft.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Budget Table */}
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeader}>
                    <th style={styles.tableCell}>Name</th>
                    <th style={styles.tableCell}>Budget</th>
                    <th style={styles.tableCell}>Used Amount</th>
                    <th style={styles.tableCell}>Balance Left</th>
                    <th style={styles.tableCell}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {budgets.map((budget) => {
                    const progress = (budget.spent / budget.amount) * 100;
                    const balance = budget.amount - budget.spent;
                    return (
                      <tr key={budget.id} style={styles.tableRow}>
                        <td style={styles.tableCell}>
                          {budget.category.charAt(0) +
                            budget.category.slice(1).toLowerCase()}
                        </td>
                        <td style={styles.tableCell}>
                          Rs. {budget.amount.toLocaleString()}
                        </td>
                        <td style={styles.tableCell}>
                          <p style={{ marginBottom: "0.5rem" }}>
                            Rs. {budget.spent.toLocaleString()}
                          </p>
                          <div style={styles.progressBar}>
                            <div
                              style={{
                                ...styles.progressFill,
                                width: `${progress > 100 ? 100 : progress}%`,
                                background:
                                  progress > 90
                                    ? "#f44336"
                                    : progress > 50
                                    ? "#ff9800"
                                    : "#4caf50",
                              }}
                            ></div>
                          </div>
                          <p style={{ fontSize: "0.75rem", color: "#666" }}>
                            {(progress || 0).toFixed(1)}%
                          </p>
                        </td>
                        <td
                          style={{
                            ...styles.tableCell,
                            color: balance >= 0 ? "#4caf50" : "#f44336",
                          }}
                        >
                          Rs. {balance.toLocaleString()}
                        </td>
                        <td style={styles.tableCell}>
                          <button
                            onClick={() => handleEdit(budget)}
                            style={styles.editButton}
                            className="action-button"
                          >
                            <FiEdit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(budget.id)}
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

      {/* Add/Edit Budget Dialog */}
      {openDialog && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>
              {isEditing ? "Edit Budget" : "Add Budget"}
            </h3>
            <div style={styles.form}>
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
                <label style={styles.formLabel}>Spent</label>
                <input
                  type="number"
                  name="spent"
                  value={form.spent}
                  onChange={handleChange}
                  style={styles.formInput}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Period</label>
                <select
                  name="period"
                  value={form.period}
                  onChange={handleChange}
                  style={styles.formSelect}
                >
                  {periods.map((period) => (
                    <option key={period} value={period}>
                      {period.charAt(0) + period.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={form.startDate}
                  onChange={handleChange}
                  style={styles.formInput}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={form.endDate}
                  onChange={handleChange}
                  style={styles.formInput}
                />
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
                {isEditing ? "Update" : "Add"}
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
  sectionTitle: {
    fontSize: "2rem",
    fontWeight: 700,
    color: "#333333",
    marginBottom: "1.5rem",
    lineHeight: "1",
  },
  buttonContainer: {
    marginBottom: "2rem",
  },
  overviewContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "0.5rem",
    marginBottom: "2rem",
  },
  overviewCard: {
    background: "#ffffff",
    borderRadius: "8px",
    padding: "0.5rem 2rem",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    transition: "transform 0.3s, box-shadow 0.3s",
    animation: "fadeIn 0.8s ease-out",
    border: "1px solid #e5e7eb",
  },
  cardLabel: {
    fontSize: "0.75rem",
    color: "#666",
    margin: 0,
  },
  cardValue: {
    fontSize: "1rem",
    fontWeight: 700,
    color: "#333333",
    margin: "0.25rem 0 0",
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
  progressBar: {
    height: "8px",
    borderRadius: "4px",
    background: "#e0e0e0",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    transition: "width 0.3s",
  },
  editButton: {
    background: "#00c4b4",
    color: "#ffffff",
    border: "none",
    padding: "0.5rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.875rem",
    transition: "background 0.3s, transform 0.3s",
    marginRight: "0.5rem",
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

export default Budget;