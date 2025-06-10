import React, { useEffect, useState, useRef } from "react";
import Cookies from "universal-cookie";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FiLogOut,
  FiTrendingUp,
  FiDollarSign,
  FiTarget,
  FiSettings,
  FiPieChart,
  FiCalendar,
  FiCreditCard,
  FiBarChart2,
  FiAward,
  FiRefreshCw,
  FiUsers,
  FiMenu,
} from "react-icons/fi";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function ViewUsers() {
  const cookies = new Cookies();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [stats, setStats] = useState([]);
  const [activities, setActivities] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState("Last 7 Days");
  const chartContainerRef = useRef(null);
  const [useStaticData, setUseStaticData] = useState(false);

  // Format currency in INR
  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(value);

  // Format backend ISO timestamp to relative time
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Unknown time";
      const now = new Date();
      const diffHours = (now - date) / 1000 / 60 / 60;
      if (diffHours < 24) return `${Math.floor(diffHours)} hours ago`;
      if (diffHours < 48) return "Yesterday";
      return `${Math.floor(diffHours / 24)} days ago`;
    } catch {
      return "Unknown time";
    }
  };

  // Map backend activity type to icon
  const getActivityIcon = (type) => {
    switch (type) {
      case "BUDGET":
        return <FiDollarSign size={16} />;
      case "TRANSACTION":
        return <FiCreditCard size={16} />;
      default:
        return <FiAward size={16} />;
    }
  };

  // Fetch data from backend
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      const token = cookies.get("token");
      if (!token) {
        if (isMounted) navigate("/login");
        return;
      }

      try {
        // Fetch dashboard stats
        const statsResponse = await axios.get(
          "http://localhost:8090/api/dashboard/stats",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const statsData = statsResponse.data;
        console.log("Stats response:", statsData);

        if (!statsData || typeof statsData !== "object") {
          throw new Error("Invalid stats response");
        }

        if (isMounted) {
          setStats([
            {
              name: "Total Transactions",
              value: statsData.totalTransactions?.count?.toString() || "0",
              change: statsData.totalTransactions?.change || "0%",
              icon: <FiCreditCard size={20} />,
              color: "#6d28d9",
            },
            {
              name: "Monthly Budget",
              value: statsData.monthlyBudget?.value
                ? formatCurrency(statsData.monthlyBudget.value)
                : "₹0",
              change: statsData.monthlyBudget?.change || "0%",
              icon: <FiDollarSign size={20} />,
              color: "#059669",
            },
            {
              name: "Active Goals",
              value: statsData.activeGoals?.count?.toString() || "0",
              change: statsData.activeGoals?.change || "0%",
              icon: <FiTarget size={20} />,
              color: "#d97706",
            },
            {
              name: "Portfolio Value",
              value: statsData.portfolioValue?.value
                ? formatCurrency(statsData.portfolioValue.value)
                : "₹0",
              change: statsData.portfolioValue?.change || "0%",
              icon: <FiTrendingUp size={20} />,
              color: "#2563eb",
            },
          ]);
        }

        // Fetch recent activities
        const activitiesResponse = await axios.get(
          "http://localhost:8090/api/dashboard/recent-activities",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log("Activities response:", activitiesResponse.data);
        if (isMounted) {
          setActivities(
            Array.isArray(activitiesResponse.data)
              ? activitiesResponse.data.map((activity) => ({
                  action: activity.action || "Unknown action",
                  time: formatDate(activity.time),
                  icon: getActivityIcon(activity.type),
                }))
              : []
          );
        }

        // Fetch spending overview
        try {
          let newChartData = [];
          if (useStaticData) {
            newChartData = [
              { name: "May 17", value: 4000 },
              { name: "May 18", value: 3000 },
              { name: "May 19", value: 5000 },
              { name: "May 20", value: 2780 },
              { name: "May 21", value: 1890 },
              { name: "May 22", value: 2390 },
              { name: "May 23", value: 3490 },
            ];
            console.log("Using static chartData:", newChartData);
          } else {
            const chartResponse = await axios.get(
              `http://localhost:8090/api/dashboard/spending-overview?range=${encodeURIComponent(timeRange)}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            console.log("Chart response:", chartResponse.data);
            newChartData = Array.isArray(chartResponse.data)
              ? chartResponse.data
                  .filter((item) => item.month && Number.isFinite(item.amount))
                  .map((item) => ({
                    name: item.month,
                    value: Math.round(Number(item.amount)),
                  }))
              : [];
            console.log("Processed chartData:", newChartData);
            // Pad with a zero point if only one data point
            if (newChartData.length === 1) {
              const singlePoint = newChartData[0];
              newChartData = [
                { name: "Start of Period", value: 0 },
                singlePoint,
              ];
              console.log("Padded chartData:", newChartData);
            }
          }
          if (isMounted) setChartData(newChartData);
        } catch (chartError) {
          console.error("Spending overview fetch failed:", chartError.message);
          if (isMounted) setChartData([]);
        }

        if (isMounted) setLoading(false);
      } catch (err) {
        console.error("Fetch error:", err);
        if (isMounted) {
          setError(err.message || "Failed to load data");
          if (err.response?.status === 401) {
            cookies.remove("token", { path: "/" });
            navigate("/login");
          }
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [navigate, timeRange]);

  // Debug chart container size and SVG
  useEffect(() => {
    if (chartContainerRef.current) {
      const { offsetWidth, offsetHeight } = chartContainerRef.current;
      console.log(
        "Chart container size:",
        `width: ${offsetWidth}px, height: ${offsetHeight}px`
      );
      const svg = chartContainerRef.current.querySelector("svg.recharts-surface");
      if (svg) {
        console.log(
          "SVG size:",
          `width: ${svg.getAttribute("width")}px, height: ${svg.getAttribute("height")}px`
        );
        const path = svg.querySelector(".recharts-area path");
        if (path) {
          console.log("Area path d attribute:", path.getAttribute("d"));
        } else {
          console.log("No area path found in SVG");
        }
      } else {
        console.log("No SVG found in chart container");
      }
    }
  }, [chartData]);

  const handleLogout = () => {
    cookies.remove("token", { path: "/" });
    navigate("/login");
  };

  const handleRedirect = (path) => {
    navigate(path);
  };

  const navItems = [
    { name: "Transactions", icon: <FiCreditCard size={18} />, path: "/transactions" },
    { name: "Budget", icon: <FiDollarSign size={18} />, path: "/budget" },
    { name: "Portfolio", icon: <FiTrendingUp size={18} />, path: "/portfolio" },
    { name: "Reports", icon: <FiBarChart2 size={18} />, path: "/reports" },
    { name: "Goals", icon: <FiTarget size={18} />, path: "/goals" },
    { name: "Subscriptions", icon: <FiRefreshCw size={18} />, path: "/subscriptions" },
    { name: "Settings", icon: <FiSettings size={18} />, path: "/settings" },
  ];

  // Hover and animation effects
  useEffect(() => {
    const cards = document.querySelectorAll(".feature-card, .stat-card");
    cards.forEach((card) => {
      card.addEventListener("mouseenter", () => {
        card.style.transform = "translateY(-5px)";
        card.style.boxShadow = "0 10px 20px rgba(0,0,0,0.1)";
      });
      card.addEventListener("mouseleave", () => {
        card.style.transform = "translateY(0)";
        card.style.boxShadow = "0 4px 6px rgba(0,0,0,0.05)";
      });
    });

    return () => {
      cards.forEach((card) => {
        card.removeEventListener("mouseenter", () => {});
        card.removeEventListener("mouseleave", () => {});
      });
    };
  }, []);

  if (loading) {
    return <div style={styles.container}>Loading...</div>;
  }

  if (error) {
    return <div style={styles.container}>Error: {error}</div>;
  }

  return (
    <div style={styles.container}>
      {/* Top Navigation Bar */}
      <div style={styles.navbar}>
        <div style={styles.navbarLeft}>
          <button
            style={styles.menuButton}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <FiMenu size={24} />
          </button>
          <div style={styles.logo}>Finance Dashboard</div>
        </div>

        <div style={styles.navbarCenter}>
          {navItems.map((item) => (
            <div
              key={item.name}
              style={
                activeTab === item.name.toLowerCase()
                  ? styles.navItemActive
                  : styles.navItem
              }
              onClick={() => {
                setActiveTab(item.name.toLowerCase());
                handleRedirect(item.path);
              }}
            >
              {item.icon}
              <span>{item.name}</span>
            </div>
          ))}
        </div>

        <div style={styles.navbarRight}>
          <div style={styles.userInfo}>
            <span style={styles.userName}>Admin User</span>
          </div>
          <button style={styles.logoutButton} onClick={handleLogout}>
            <FiLogOut size={18} />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div style={styles.mobileMenu}>
          <nav style={styles.mobileNav}>
            {navItems.map((item) => (
              <div
                key={item.name}
                style={
                  activeTab === item.name.toLowerCase()
                    ? styles.mobileNavItemActive
                    : styles.mobileNavItem
                }
                onClick={() => {
                  setActiveTab(item.name.toLowerCase());
                  handleRedirect(item.path);
                  setIsMenuOpen(false);
                }}
              >
                {item.icon}
                <span>{item.name}</span>
              </div>
            ))}
          </nav>
        </div>
      )}

      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* Content Header */}
        <div style={styles.contentHeader}>
          <h1 style={styles.headerTitle}>Dashboard Overview</h1>
          <div style={styles.headerActions}>
            <button style={styles.actionButton}>
              <FiCalendar size={18} />
              <span>Last 30 Days</span>
            </button>
            <button style={styles.actionButton}>
              <FiRefreshCw size={18} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={styles.statContainer}>
          {stats.length > 0 ? (
            stats.map((stat) => (
              <div
                key={stat.name}
                style={{
                  ...styles.statCard,
                  borderLeft: `4px solid ${stat.color}`,
                }}
                className="stat-card"
              >
                <div style={{ ...styles.statIcon, color: stat.color }}>
                  {stat.icon}
                </div>
                <div style={styles.statContent}>
                  <p style={styles.statName}>{stat.name}</p>
                  <h3 style={styles.statValue}>{stat.value}</h3>
                  <p
                    style={{
                      ...styles.statChange,
                      color: stat.change.startsWith("+") ? "#059669" : "#dc2626",
                    }}
                  >
                    {stat.change}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p style={{ color: "#64748b", fontSize: "0.875rem" }}>
              No stats available.
            </p>
          )}
        </div>

        {/* Chart Section */}
<div style={styles.chartSection}>
  <div style={styles.chartContainer} ref={chartContainerRef}>
    <div style={styles.chartHeader}>
      <h3 style={styles.chartTitle}>Spending Overview</h3>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <select
          style={styles.chartSelect}
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
        >
          <option>Last 7 Days</option>
          <option>Last 30 Days</option>
          <option>Last 90 Days</option>
        </select>
        <button
          style={styles.actionButton}
          onClick={() => setUseStaticData(!useStaticData)}
        >
          {useStaticData ? "Use Backend Data" : "Use Static Data"}
        </button>
      </div>
    </div>
    <div style={styles.chart}>
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#7c3aed"
              fill="#ede9fe"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <p style={{ color: "#64748b", fontSize: "0.875rem", textAlign: "center", padding: "2rem" }}>
          No spending data available.
        </p>
      )}
    </div>
  </div>
</div>
        {/* Features and Activity */}
        <div style={styles.gridContainer}>
          {/* Features */}
          <div style={styles.featuresSection}>
            <h3 style={styles.sectionTitle}>Quick Actions</h3>
            <div style={styles.cardContainer}>
              {navItems.map((item) => (
                <div
                  key={item.name}
                  style={styles.card}
                  className="feature-card"
                  onClick={() => handleRedirect(item.path)}
                  role="button"
                  aria-label={`Navigate to ${item.name}`}
                >
                  <div style={{ ...styles.cardIcon, color: "#7c3aed" }}>
                    {item.icon}
                  </div>
                  <span style={styles.cardText}>{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div style={styles.activitySection}>
            <h3 style={styles.sectionTitle}>Recent Activity</h3>
            <div style={styles.activityContainer}>
              {activities.length > 0 ? (
                activities.map((activity, index) => (
                  <div
                    key={index}
                    style={styles.activityItem}
                    className="activity-item"
                  >
                    <div style={styles.activityIcon}>{activity.icon}</div>
                    <div style={styles.activityContent}>
                      <span style={styles.activityAction}>{activity.action}</span>
                      <span style={styles.activityTime}>{activity.time}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: "#64748b", fontSize: "0.875rem" }}>
                  No recent activities available.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
    backgroundColor: "#f8fafc",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: "1rem 2rem",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
    borderBottom: "1px solid #e2e8f0",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  navbarLeft: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  navbarCenter: {
    display: "flex",
    alignItems: "center",
    gap: "1.5rem",
  },
  navbarRight: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  logo: {
    fontSize: "1.25rem",
    fontWeight: 700,
    color: "#7c3aed",
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.5rem 0.75rem",
    borderRadius: "6px",
    color: "#475569",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: 500,
  },
  navItemActive: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.5rem 0.75rem",
    borderRadius: "6px",
    backgroundColor: "#ede9fe",
    color: "#7c3aed",
    fontWeight: 500,
    fontSize: "0.875rem",
  },
  userInfo: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
  },
  userName: {
    fontSize: "0.875rem",
    fontWeight: 500,
  },
  logoutButton: {
    background: "none",
    border: "none",
    color: "#64748b",
    cursor: "pointer",
    padding: "0.5rem",
    borderRadius: "6px",
  },
  menuButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#7c3aed",
    display: "none",
  },
  mobileMenu: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "#ffffff",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    zIndex: 99,
    display: "none",
  },
  mobileNav: {
    display: "flex",
    flexDirection: "column",
    padding: "0.5rem 0",
  },
  mobileNavItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.75rem 1.5rem",
    color: "#475569",
    cursor: "pointer",
  },
  mobileNavItemActive: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.75rem 1.5rem",
    backgroundColor: "#ede9fe",
    color: "#7c3aed",
    fontWeight: 500,
  },
  mainContent: {
    flex: 1,
    padding: "2rem",
  },
  contentHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "2rem",
  },
  headerTitle: {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#1e293b",
  },
  headerActions: {
    display: "flex",
    gap: "0.75rem",
  },
  actionButton: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.5rem 1rem",
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    color: "#475569",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: 500,
  },
  statContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: "1.5rem",
    marginBottom: "2rem",
  },
  statCard: {
    backgroundColor: "#ffffff",
    borderRadius: "10px",
    padding: "1.5rem",
    boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
    display: "flex",
    gap: "1rem",
  },
  statIcon: {
    fontSize: "1.25rem",
    marginTop: "0.25rem",
  },
  statContent: {
    flex: 1,
  },
  statName: {
    fontSize: "0.875rem",
    color: "#64748b",
    marginBottom: "0.25rem",
  },
  statValue: {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#1e293b",
    marginBottom: "0.25rem",
  },
  statChange: {
    fontSize: "0.75rem",
    fontWeight: 500,
  },
  chartSection: {
    backgroundColor: "#ffffff",
    borderRadius: "10px",
    padding: "1.5rem",
    boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
    marginBottom: "2rem",
  },
  chartContainer: {
    width: "100%",
  },
  chartHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1.5rem",
  },
  chartTitle: {
    fontSize: "1.125rem",
    fontWeight: 600,
    color: "#1e293b",
  },
  chartSelect: {
    padding: "0.5rem 1rem",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    backgroundColor: "#f8fafc",
    fontSize: "0.875rem",
    color: "#475569",
  },
  chart: {
    height: "300px",
  },
  gridContainer: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1.5rem",
  },
  featuresSection: {
    backgroundColor: "#ffffff",
    borderRadius: "10px",
    padding: "1.5rem",
    boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
  },
  activitySection: {
    backgroundColor: "#ffffff",
    borderRadius: "10px",
    padding: "1.5rem",
    boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
  },
  cardContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
    gap: "1rem",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    padding: "1rem",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.75rem",
    cursor: "pointer",
    border: "1px solid #e2e8f0",
  },
  cardIcon: {
    fontSize: "1.5rem",
  },
  cardText: {
    fontSize: "0.875rem",
    fontWeight: 500,
    color: "#475569",
    textAlign: "center",
  },
  activityContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  activityItem: {
    display: "flex",
    gap: "1rem",
    padding: "0.75rem",
    borderRadius: "8px",
  },
  activityIcon: {
    color: "#7c3aed",
    marginTop: "0.25rem",
  },
  activityContent: {
    flex: 1,
  },
  activityAction: {
    fontSize: "0.875rem",
    fontWeight: 500,
    color: "#1e293b",
    display: "block",
    marginBottom: "0.25rem",
  },
  activityTime: {
    fontSize: "0.75rem",
    color: "#64748b",
  },
  sectionTitle: {
    fontSize: "0.875rem",
    fontWeight: 600,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: "1rem",
  },
};

export default ViewUsers;