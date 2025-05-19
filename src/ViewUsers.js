import React, { useEffect, useState } from "react";
import Cookies from "universal-cookie";
import { useNavigate } from "react-router-dom";
import { FiLogOut, FiTrendingUp, FiDollarSign, FiTarget, FiSettings, FiPieChart, FiCalendar, FiCreditCard, FiBarChart2, FiAward, FiRefreshCw, FiUsers, FiMenu } from "react-icons/fi";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Jan', value: 4000 },
  { name: 'Feb', value: 3000 },
  { name: 'Mar', value: 5000 },
  { name: 'Apr', value: 2780 },
  { name: 'May', value: 1890 },
  { name: 'Jun', value: 2390 },
  { name: 'Jul', value: 3490 },
];

function ViewUsers() {
  const cookies = new Cookies();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    cookies.remove("token", { path: "/" });
    navigate("/login");
  };

  const handleRedirect = (path) => {
    navigate(path);
  };

  // Dynamic feature list for navbar
  const navItems = [
    { name: "Transactions", icon: <FiCreditCard size={18} />, path: "/transactions" },
    { name: "Budget", icon: <FiDollarSign size={18} />, path: "/budget" },
    { name: "Portfolio", icon: <FiTrendingUp size={18} />, path: "/portfolio" },
    { name: "Reports", icon: <FiBarChart2 size={18} />, path: "/reports" },
    { name: "Goals", icon: <FiTarget size={18} />, path: "/goals" },
    { name: "Subscriptions", icon: <FiRefreshCw size={18} />, path: "/subscriptions" },
    { name: "Settings", icon: <FiSettings size={18} />, path: "/settings" },
    { name: "CombinedTracker ", icon: <FiUsers size={18} />, path: "/CombinedTracker" },

  ];

  // Mock stats data
  const stats = [
    { name: "Total Transactions", value: "124", change: "+12%", icon: <FiCreditCard size={20} />, color: "#6d28d9" },
    { name: "Monthly Budget", value: "$5,200", change: "-3%", icon: <FiDollarSign size={20} />, color: "#059669" },
    { name: "Active Goals", value: "3", change: "+1", icon: <FiTarget size={20} />, color: "#d97706" },
    { name: "Portfolio Value", value: "$24,500", change: "+5.2%", icon: <FiTrendingUp size={20} />, color: "#2563eb" },
  ];

  // Mock recent activity data
  const activities = [
    { action: "Added $500 to Budget", time: "2 hours ago", icon: <FiDollarSign size={16} /> },
    { action: "Updated Goal: Vacation", time: "Yesterday", icon: <FiTarget size={16} /> },
    { action: "Logged Transaction: $45", time: "2 days ago", icon: <FiCreditCard size={16} /> },
    { action: "Reviewed Portfolio", time: "3 days ago", icon: <FiTrendingUp size={16} /> },
    { action: "Created new report", time: "4 days ago", icon: <FiBarChart2 size={16} /> },
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
              style={activeTab === item.name.toLowerCase() ? styles.navItemActive : styles.navItem} 
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
                style={activeTab === item.name.toLowerCase() ? styles.mobileNavItemActive : styles.mobileNavItem} 
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
          {stats.map((stat) => (
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
                <p style={{ 
                  ...styles.statChange,
                  color: stat.change.startsWith('+') ? '#059669' : '#dc2626'
                }}>
                  {stat.change}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Chart Section */}
        <div style={styles.chartSection}>
          <div style={styles.chartContainer}>
            <div style={styles.chartHeader}>
              <h3 style={styles.chartTitle}>Spending Overview</h3>
              <select style={styles.chartSelect}>
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
                <option>Last 90 Days</option>
              </select>
            </div>
            <div style={styles.chart}>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data}>
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
              {activities.map((activity, index) => (
                <div
                  key={index}
                  style={styles.activityItem}
                  className="activity-item"
                >
                  <div style={styles.activityIcon}>
                    {activity.icon}
                  </div>
                  <div style={styles.activityContent}>
                    <span style={styles.activityAction}>{activity.action}</span>
                    <span style={styles.activityTime}>{activity.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  navbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: '1rem 2rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    borderBottom: '1px solid #e2e8f0',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    '@media (max-width: 1024px)': {
      padding: '1rem',
    },
  },
  navbarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  navbarCenter: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    '@media (max-width: 1024px)': {
      display: 'none',
    },
  },
  navbarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  logo: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#7c3aed',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 0.75rem',
    borderRadius: '6px',
    color: '#475569',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontSize: '0.875rem',
    fontWeight: 500,
    ':hover': {
      backgroundColor: '#f1f5f9',
      color: '#7c3aed',
    },
  },
  navItemActive: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 0.75rem',
    borderRadius: '6px',
    backgroundColor: '#ede9fe',
    color: '#7c3aed',
    fontWeight: 500,
    cursor: 'pointer',
    fontSize: '0.875rem',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  userName: {
    fontSize: '0.875rem',
    fontWeight: 500,
  },
  userEmail: {
    fontSize: '0.75rem',
    color: '#64748b',
  },
  logoutButton: {
    background: 'none',
    border: 'none',
    color: '#64748b',
    cursor: 'pointer',
    padding: '0.5rem',
    borderRadius: '6px',
    ':hover': {
      backgroundColor: '#f1f5f9',
      color: '#dc2626',
    },
  },
  menuButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#7c3aed',
    display: 'none',
    '@media (max-width: 1024px)': {
      display: 'block',
    },
  },
  mobileMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    zIndex: 99,
    display: 'none',
    '@media (max-width: 1024px)': {
      display: 'block',
    },
  },
  mobileNav: {
    display: 'flex',
    flexDirection: 'column',
    padding: '0.5rem 0',
  },
  mobileNavItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1.5rem',
    color: '#475569',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#f1f5f9',
      color: '#7c3aed',
    },
  },
  mobileNavItemActive: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1.5rem',
    backgroundColor: '#ede9fe',
    color: '#7c3aed',
    fontWeight: 500,
    cursor: 'pointer',
  },
  mainContent: {
    flex: 1,
    padding: '2rem',
    '@media (max-width: 768px)': {
      padding: '1rem',
    },
  },
  contentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    '@media (max-width: 768px)': {
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: '1rem',
    },
  },
  headerTitle: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#1e293b',
  },
  headerActions: {
    display: 'flex',
    gap: '0.75rem',
  },
  actionButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    color: '#475569',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: 500,
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#f1f5f9',
    },
  },
  statContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem',
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    padding: '1.5rem',
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
    display: 'flex',
    gap: '1rem',
    transition: 'all 0.3s ease',
  },
  statIcon: {
    fontSize: '1.25rem',
    marginTop: '0.25rem',
  },
  statContent: {
    flex: 1,
  },
  statName: {
    fontSize: '0.875rem',
    color: '#64748b',
    marginBottom: '0.25rem',
  },
  statValue: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#1e293b',
    marginBottom: '0.25rem',
  },
  statChange: {
    fontSize: '0.75rem',
    fontWeight: 500,
  },
  chartSection: {
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    padding: '1.5rem',
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
    marginBottom: '2rem',
  },
  chartContainer: {
    width: '100%',
  },
  chartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
  },
  chartTitle: {
    fontSize: '1.125rem',
    fontWeight: 600,
    color: '#1e293b',
  },
  chartSelect: {
    padding: '0.5rem 1rem',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    backgroundColor: '#f8fafc',
    fontSize: '0.875rem',
    color: '#475569',
  },
  chart: {
    height: '300px',
  },
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1.5rem',
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  },
  featuresSection: {
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    padding: '1.5rem',
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
  },
  activitySection: {
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    padding: '1.5rem',
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
  },
  cardContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
    gap: '1rem',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '1rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    border: '1px solid #e2e8f0',
    ':hover': {
      borderColor: '#7c3aed',
      backgroundColor: '#f5f3ff',
    },
  },
  cardIcon: {
    fontSize: '1.5rem',
  },
  cardText: {
    fontSize: '0.875rem',
    fontWeight: 500,
    color: '#475569',
    textAlign: 'center',
  },
  activityContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  activityItem: {
    display: 'flex',
    gap: '1rem',
    padding: '0.75rem',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#f1f5f9',
    },
  },
  activityIcon: {
    color: '#7c3aed',
    marginTop: '0.25rem',
  },
  activityContent: {
    flex: 1,
  },
  activityAction: {
    fontSize: '0.875rem',
    fontWeight: 500,
    color: '#1e293b',
    display: 'block',
    marginBottom: '0.25rem',
  },
  activityTime: {
    fontSize: '0.75rem',
    color: '#64748b',
  },
  sectionTitle: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '1rem',
  },
};

export default ViewUsers;