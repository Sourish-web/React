import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Cookies from "universal-cookie";
import { useNavigate } from "react-router-dom";
import Papa from "papaparse";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { FiHome, FiFlag, FiPlus, FiEdit, FiTrash2, FiUsers, FiDollarSign } from "react-icons/fi";

// Register Chart.js components
ChartJS.register(ArcElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

const Goal = () => {
  const cookies = new Cookies();
  const navigate = useNavigate();
  const API_URL = "http://localhost:8090";
  const getAuthToken = () => cookies.get("token");

  // State management
  const [goals, setGoals] = useState([]);
  const [insights, setInsights] = useState(null);
  const [invitations, setInvitations] = useState([]);
  const [budgetCategories, setBudgetCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [goalForm, setGoalForm] = useState({
    id: null,
    name: "",
    targetAmount: "",
    currentAmount: "0",
    targetDate: new Date().toISOString().split("T")[0],
    category: "",
  });
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [expandedGoals, setExpandedGoals] = useState({});
  const [searchQuery, setSearchQuery] = useState("");

  const statusOptions = ["all", "In Progress", "Completed", "Missed"];
  const categoryOptions = ["all", ...new Set([...budgetCategories, ...goals.map(g => g.category).filter(c => c)])];

  // Fetch all data
  const fetchAllData = async () => {
    const token = getAuthToken();
    if (!token) {
      setError("Please log in to access goals");
      navigate("/login");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [goalsRes, insightsRes, invitationsRes, categoriesRes] = await Promise.all([
        axios.get(`${API_URL}/getGoals`, { headers }).catch(err => ({ data: [] })),
        axios.get(`${API_URL}/goalInsights`, { headers }).catch(err => ({ data: null })),
        axios.get(`${API_URL}/my-invitations`, { headers }).catch(err => ({ data: [] })),
        axios.get(`${API_URL}/budgetCategories`, { headers }).catch(err => ({ data: ["Uncategorized"] })),
      ]);

      // Validate goals
      const seenGoalIds = new Set();
      const validGoals = Array.isArray(goalsRes.data)
        ? goalsRes.data
            .filter(goal => {
              if (!goal || goal.id == null || goal.id <= 0 || isNaN(goal.id)) return false;
              if (seenGoalIds.has(goal.id)) return false;
              seenGoalIds.add(goal.id);
              return true;
            })
            .map(goal => ({
              ...goal,
              targetAmount: Number(goal.targetAmount) || 0,
              currentAmount: Number(goal.currentAmount) || 0,
              name: goal.name || "Unnamed Goal",
              category: goal.category || "Uncategorized",
              status: goal.status || "In Progress",
              targetDate: goal.targetDate || new Date().toISOString().split("T")[0],
              collaborators: Array.isArray(goal.collaborators) ? goal.collaborators : [],
            }))
        : [];

      // Validate insights
      const validInsights = insightsRes.data && typeof insightsRes.data === "object"
        ? insightsRes.data
        : { totalGoals: 0, completionRate: 0, avgProgress: 0 };

      // Validate invitations
      const validInvitations = Array.isArray(invitationsRes.data)
        ? invitationsRes.data.filter(inv => inv && inv.invitationId)
        : [];

      // Validate budget categories
      const validCategories = Array.isArray(categoriesRes.data)
        ? categoriesRes.data.filter(cat => cat && typeof cat === "string")
        : ["Uncategorized"];

      setGoals(validGoals);
      setInsights(validInsights);
      setInvitations(validInvitations);
      setBudgetCategories(validCategories);

      if (validGoals.length === 0 && !validInsights && validInvitations.length === 0) {
        setError("No data received from backend. Please check the server or database.");
      }
    } catch (err) {
      setError(`Failed to fetch data: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [navigate]);

  // Handle goal form changes
  const handleGoalChange = (e) => {
    const { name, value } = e.target;
    setGoalForm(prev => ({ ...prev, [name]: value }));
  };

  // Submit goal
  const handleGoalSubmit = async (e) => {
    e.preventDefault();
    const token = getAuthToken();
    if (!token) {
      navigate("/login");
      return;
    }

    if (!goalForm.name || !goalForm.targetAmount || Number(goalForm.targetAmount) <= 0) {
      setError("Please enter a valid name and target amount");
      return;
    }

    const payload = {
      id: isEditing ? goalForm.id : undefined,
      name: goalForm.name,
      targetAmount: Number(goalForm.targetAmount),
      currentAmount: Number(goalForm.currentAmount) || 0,
      targetDate: goalForm.targetDate,
      category: goalForm.category || "Uncategorized",
    };

    try {
      const endpoint = isEditing ? "/updateGoal" : "/addGoal";
      await axios.post(`${API_URL}${endpoint}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      resetForm();
      fetchAllData();
    } catch (err) {
      setError(`Error ${isEditing ? "updating" : "adding"} goal: ${err.response?.data || "Unknown error"}`);
    }
  };

  // Allocate funds to goal
  const handleAllocateFunds = async (goalId, amount) => {
    const token = getAuthToken();
    if (!token) {
      navigate("/login");
      return;
    }

    if (!amount || Number(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    try {
      await axios.post(
        `${API_URL}/allocateToGoal/${goalId}`,
        { amount: Number(amount) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchAllData();
    } catch (err) {
      setError(`Error allocating funds: ${err.response?.data?.message || err.message}`);
    }
  };

  // Delete goal
  const handleDeleteGoal = async (id) => {
    const token = getAuthToken();
    if (!token) {
      navigate("/login");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this goal?")) return;

    try {
      await axios.delete(`${API_URL}/deleteGoal/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAllData();
    } catch (err) {
      setError(`Error deleting goal: ${err.response?.data?.message || err.message}`);
    }
  };

  // Invite user to goal
  const handleInviteUser = async (goalId) => {
    const token = getAuthToken();
    if (!token) {
      navigate("/login");
      return;
    }

    const invitedUserId = prompt("Enter the ID of the user to invite:");
    if (!invitedUserId || isNaN(invitedUserId)) {
      setError("Please enter a valid user ID");
      return;
    }

    try {
      await axios.post(
        `${API_URL}/invite`,
        { goalId, invitedUserId: Number(invitedUserId) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchAllData();
    } catch (err) {
      setError(`Error sending invitation: ${err.response?.data?.message || err.message}`);
    }
  };

  // Accept/Reject invitation
  const handleInvitationResponse = async (invitationId, accept) => {
    const token = getAuthToken();
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const endpoint = accept ? `/accept-invitation/${invitationId}` : `/reject-invitation/${invitationId}`;
      await axios.post(`${API_URL}${endpoint}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      fetchAllData();
    } catch (err) {
      setError(`Error processing invitation: ${err.response?.data?.message || err.message}`);
    }
  };

  // Reset form
  const resetForm = () => {
    setGoalForm({
      id: null,
      name: "",
      targetAmount: "",
      currentAmount: "0",
      targetDate: new Date().toISOString().split("T")[0],
      category: "",
    });
    setIsEditing(false);
    setOpenDialog(false);
    setError(null);
  };

  // Goal insights
  const goalInsights = useMemo(() => {
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

    const statusCounts = {
      "On Track": goals.filter(g => g.status === "In Progress" && g.percentProgress >= 50).length,
      "Off Track": goals.filter(g => g.status === "In Progress" && g.percentProgress < 50).length,
      "At Risk": goals.filter(g => g.status === "In Progress" && new Date(g.targetDate) < new Date(new Date().setDate(new Date().getDate() + 7))).length,
      "Closed": goals.filter(g => g.status === "Completed" || g.status === "Missed").length,
    };

    return { goalData, statusCounts };
  }, [goals]);

  // Summary calculations
  const totalGoals = goals.length;
  const totalTarget = goals.reduce((sum, g) => sum + (g.targetAmount || 0), 0);
  const totalCurrent = goals.reduce((sum, g) => sum + (g.currentAmount || 0), 0);

  // Pie chart data
  const chartData = {
    labels: ["On Track", "Off Track", "At Risk", "Closed"],
    datasets: [{
      data: [
        goalInsights.statusCounts["On Track"],
        goalInsights.statusCounts["Off Track"],
        goalInsights.statusCounts["At Risk"],
        goalInsights.statusCounts["Closed"],
      ],
      backgroundColor: ["#4caf50", "#ffca28", "#f44336", "#666"],
      borderWidth: 0,
    }],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "bottom" },
      title: { display: true, text: "Goal Status Distribution", font: { size: 18 } },
      tooltip: { enabled: true },
    },
    maintainAspectRatio: false,
  };

  // Export goals report
  const handleExportGoals = () => {
    const csvData = goalInsights.goalData.map(goal => ({
      Name: goal.name,
      Category: goal.category,
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
  };

  // Toggle goal expansion
  const toggleGoalExpansion = (goalId) => {
    setExpandedGoals(prev => ({ ...prev, [goalId]: !prev[goalId] }));
  };

  // Hover effects
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
              { text: "Goals", icon: <FiFlag size={18} />, path: "/goals", active: true },
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
            <h2 style={styles.sectionTitle}>Goals</h2>
            {/* Add Goal Button */}
            <div style={styles.buttonContainer}>
              <button
                style={styles.addButton}
                className="action-button"
                onClick={() => setOpenDialog(true)}
              >
                Add Goal
              </button>
            </div>

            {/* Error Display */}
            {error && <div style={styles.error}>{error}</div>}

            {/* Loading State */}
            {isLoading && <div style={{ textAlign: "center", fontSize: "1rem", color: "#666" }}>Loading...</div>}

            {/* Top Section */}
            {!isLoading && !error && (
              <div style={styles.overviewContainer}>
                <div style={styles.overviewCard} className="overview-card">
                  <p style={styles.cardLabel}>Total Goals</p>
                  <p style={styles.cardValue}>{totalGoals}</p>
                </div>
                <div style={styles.overviewCard} className="overview-card">
                  <p style={styles.cardLabel}>Total Target</p>
                  <p style={styles.cardValue}>Rs. {totalTarget.toLocaleString()}</p>
                </div>
                <div style={styles.overviewCard} className="overview-card">
                  <p style={styles.cardLabel}>Total Current</p>
                  <p
                    style={{
                      ...styles.cardValue,
                      color: totalTarget > 0 && totalCurrent / totalTarget >= 0.5 ? "#4caf50" : "#f44336",
                    }}
                  >
                    Rs. {totalCurrent.toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            {/* Alignments Section */}
            {!isLoading && (
              <div style={styles.tableContainer}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
                  <h3 style={{ fontSize: "1.25rem", margin: 0 }}>Alignments</h3>
                  <div style={{ display: "flex", gap: "1rem" }}>
                    <input
                      type="text"
                      placeholder="Search goals"
                      style={styles.formInput}
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                    <select
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value)}
                      style={{ ...styles.formSelect, width: "150px" }}
                    >
                      {statusOptions.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                    <select
                      value={categoryFilter}
                      onChange={e => setCategoryFilter(e.target.value)}
                      style={{ ...styles.formSelect, width: "150px" }}
                    >
                      {categoryOptions.map(cat => (
                        <option key={cat} value={cat}>{cat === "all" ? "All" : cat}</option>
                      ))}
                    </select>
                    <button style={styles.submitButton} className="action-button" onClick={handleExportGoals}>
                      Export Goals
                    </button>
                  </div>
                </div>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.tableHeader}>
                      <th style={styles.tableCell}>Name</th>
                      <th style={styles.tableCell}>Collaborators</th>
                      <th style={styles.tableCell}>Progress</th>
                      <th style={styles.tableCell}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {goalInsights.goalData.length > 0 ? (
                      goalInsights.goalData
                        .filter(goal => statusFilter === "all" || goal.status === statusFilter)
                        .filter(goal => categoryFilter === "all" || goal.category === categoryFilter)
                        .filter(goal => goal.name.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map(goal => (
                          <React.Fragment key={goal.id}>
                            <tr style={styles.tableRow}>
                              <td style={styles.tableCell}>
                                <span
                                  style={{ cursor: "pointer", color: "#00c4b4" }}
                                  onClick={() => toggleGoalExpansion(goal.id)}
                                >
                                  {expandedGoals[goal.id] ? "▼" : "▶"} {goal.name}
                                </span>
                              </td>
                              <td style={styles.tableCell}>
                                {goal.collaborators?.length > 0 ? (
                                  goal.collaborators.map(c => (
                                    <span key={c.id} style={{ marginRight: "0.5rem" }}>
                                      {c.name || "U"}
                                    </span>
                                  ))
                                ) : (
                                  <span style={{ color: "#666" }}>None</span>
                                )}
                              </td>
                              <td style={styles.tableCell}>
                                <p style={{ marginBottom: "0.5rem" }}>
                                  Rs. {goal.currentAmount.toLocaleString()} / Rs. {goal.targetAmount.toLocaleString()}
                                </p>
                                <div style={styles.progressBar}>
                                  <div
                                    style={{
                                      ...styles.progressFill,
                                      width: `${goal.percentProgress > 100 ? 100 : goal.percentProgress}%`,
                                      background:
                                        goal.status === "Completed" ? "#4caf50" :
                                        goal.status === "Missed" ? "#f44336" :
                                        goal.percentProgress > 90 ? "#f44336" :
                                        goal.percentProgress > 50 ? "#ff9800" : "#4caf50",
                                    }}
                                  ></div>
                                </div>
                                <p style={{ fontSize: "0.75rem", color: "#666" }}>
                                  {goal.percentProgress.toFixed(1)}%
                                </p>
                              </td>
                              <td style={styles.tableCell}>
                                <button
                                  style={styles.editButton}
                                  className="action-button"
                                  onClick={() => {
                                    setGoalForm({
                                      id: goal.id,
                                      name: goal.name,
                                      targetAmount: goal.targetAmount.toString(),
                                      currentAmount: goal.currentAmount.toString(),
                                      targetDate: goal.targetDate,
                                      category: goal.category,
                                    });
                                    setIsEditing(true);
                                    setOpenDialog(true);
                                  }}
                                >
                                  <FiEdit size={16} />
                                </button>
                                <button
                                  style={styles.deleteButton}
                                  className="action-button delete-button"
                                  onClick={() => handleDeleteGoal(goal.id)}
                                >
                                  <FiTrash2 size={16} />
                                </button>
                                <button
                                  style={styles.editButton}
                                  className="action-button"
                                  onClick={() => {
                                    const amount = prompt("Enter amount to allocate:");
                                    if (amount && Number(amount) > 0) {
                                      handleAllocateFunds(goal.id, Number(amount));
                                    } else {
                                      setError("Please enter a valid amount");
                                    }
                                  }}
                                >
                                  <FiDollarSign size={16} />
                                </button>
                                <button
                                  style={styles.editButton}
                                  className="action-button"
                                  onClick={() => handleInviteUser(goal.id)}
                                >
                                  <FiUsers size={16} />
                                </button>
                              </td>
                            </tr>
                            {expandedGoals[goal.id] && (
                              <tr>
                                <td colSpan="4" style={{ ...styles.tableCell, padding: "1rem" }}>
                                  <p style={{ margin: 0, color: "#666" }}>
                                    Category: {goal.category} | Target Date: {goal.targetDate} | Status: {goal.status}
                                  </p>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))
                    ) : (
                      <tr>
                        <td colSpan="4" style={{ ...styles.tableCell, textAlign: "center" }}>
                          No goals available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Invitations Section */}
            {!isLoading && (
              <div style={{ ...styles.tableContainer, marginTop: "2rem" }}>
                <h3 style={{ fontSize: "1.25rem", margin: "0 0 1rem" }}>Goal Invitations</h3>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.tableHeader}>
                      <th style={styles.tableCell}>Goal</th>
                      <th style={styles.tableCell}>Invited User</th>
                      <th style={styles.tableCell}>Status</th>
                      <th style={styles.tableCell}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(invitations) && invitations.length > 0 ? (
                      invitations.map(inv => (
                        <tr key={inv.invitationId} style={styles.tableRow}>
                          <td style={styles.tableCell}>{inv.goalName || "Unknown Goal"} (ID: {inv.goalId})</td>
                          <td style={styles.tableCell}>{inv.invitedUserName || "Unknown"} ({inv.invitedUserEmail || "N/A"})</td>
                          <td style={styles.tableCell}>{inv.accepted ? "Accepted" : "Pending"}</td>
                          <td style={styles.tableCell}>
                            {!inv.accepted && (
                              <>
                                <button
                                  style={styles.editButton}
                                  className="action-button"
                                  onClick={() => handleInvitationResponse(inv.invitationId, true)}
                                >
                                  Accept
                                </button>
                                <button
                                  style={styles.deleteButton}
                                  className="action-button delete-button"
                                  onClick={() => handleInvitationResponse(inv.invitationId, false)}
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" style={{ ...styles.tableCell, textAlign: "center" }}>
                          No invitations available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      </div>

      {/* Add/Edit Goal Dialog */}
      {openDialog && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>{isEditing ? "Edit Goal" : "Add Goal"}</h3>
            <div style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Goal Name</label>
                <input
                  type="text"
                  name="name"
                  value={goalForm.name}
                  onChange={handleGoalChange}
                  required
                  style={styles.formInput}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Target Amount</label>
                <input
                  type="number"
                  name="targetAmount"
                  value={goalForm.targetAmount}
                  onChange={handleGoalChange}
                  required
                  min="0"
                  step="0.01"
                  style={styles.formInput}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Current Amount</label>
                <input
                  type="number"
                  name="currentAmount"
                  value={goalForm.currentAmount}
                  onChange={handleGoalChange}
                  min="0"
                  step="0.01"
                  style={styles.formInput}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Target Date</label>
                <input
                  type="date"
                  name="targetDate"
                  value={goalForm.targetDate}
                  onChange={handleGoalChange}
                  required
                  style={styles.formInput}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Category</label>
                <select
                  name="category"
                  value={goalForm.category}
                  onChange={handleGoalChange}
                  style={styles.formSelect}
                >
                  <option value="">Select Category (Optional)</option>
                  {budgetCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
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
                onClick={handleGoalSubmit}
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
    marginRight: "0.5rem",
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
  error: {
    color: "#f44336",
    fontSize: "0.875rem",
    margin: "1rem 0",
    textAlign: "center",
  },
};

export default Goal;