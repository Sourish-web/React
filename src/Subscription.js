import React, { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "universal-cookie";
import { useNavigate } from "react-router-dom";
import { FiLogOut } from "react-icons/fi";

const Subscription = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [stats, setStats] = useState(null);
  const [razorpayOrderId, setRazorpayOrderId] = useState(null);

  const cookies = new Cookies();
  const navigate = useNavigate();
  const API_URL = "http://localhost:8090";

  const getAuthToken = () => cookies.get("token");

  const handleLogout = () => {
    cookies.remove("token", { path: "/" });
    navigate("/login");
  };

  // Fetch user profile to determine role
  const fetchUserProfile = async () => {
    const token = getAuthToken();
    if (!token) {
      console.error("No token found in cookies");
      alert("You are not authenticated. Please log in.");
      navigate("/login");
      return;
    }

    console.log("Fetching profile with token:", token.substring(0, 20) + "...");
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_URL}/get/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("Profile response:", res.data);

      let roles = [];
      if (res.data.roles) {
        roles = res.data.roles.split(",").map((role) => role.trim());
      } else if (res.data.authorities) {
        roles = res.data.authorities.map((auth) => auth.authority);
      } else if (res.data.role) {
        roles = [res.data.role];
      } else {
        console.warn("No roles found in response, defaulting to USER");
        setUserRole("USER");
        return;
      }

      if (roles.includes("ROLE_ADMIN")) {
        setUserRole("ADMIN");
      } else if (roles.includes("ROLE_USER")) {
        setUserRole("USER");
      } else {
        console.warn("Unknown role, defaulting to USER");
        setUserRole("USER");
      }
    } catch (err) {
      console.error("Failed to fetch user profile:", err.message, err.response?.data);
      let errorMessage = "Failed to fetch user profile.";
      if (err.response) {
        if (err.response.status === 401) {
          errorMessage = "Invalid or expired token. Please log in again.";
          navigate("/login");
        } else if (err.response.status === 403) {
          errorMessage = "Unauthorized access. Please log in again.";
          navigate("/login");
        } else if (err.response.status === 404) {
          errorMessage = "Profile endpoint not found. Contact support.";
        }
      } else if (err.code === "ERR_NETWORK") {
        errorMessage = "Cannot connect to server. Please check if the backend is running.";
      }
      alert(errorMessage);
      setUserRole("USER");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch subscriptions (user or admin)
  const fetchSubscriptions = async () => {
    const token = getAuthToken();
    if (!token) {
      alert("You are not authenticated");
      navigate("/login");
      return;
    }

    setIsLoading(true);
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
      };
      let res;
      if (userRole === "ADMIN") {
        res = await axios.get(`${API_URL}/admin/subscriptions`, { headers });
      } else {
        res = await axios.get(`${API_URL}/getSubscriptions`, { headers });
      }
      setSubscriptions(res.data || []);
    } catch (err) {
      console.error("Failed to fetch subscriptions:", err);
      alert("Failed to fetch subscriptions.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch admin stats
  const fetchAdminStats = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const res = await axios.get(`${API_URL}/admin/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setStats(res.data);
    } catch (err) {
      console.error("Failed to fetch admin stats:", err);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (userRole) {
      fetchSubscriptions();
      if (userRole === "ADMIN") {
        fetchAdminStats();
      }
    }
  }, [userRole]);

  const handleDelete = async (id) => {
    const token = getAuthToken();
    if (!token) {
      alert("You are not authenticated");
      navigate("/login");
      return;
    }

    setIsLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      if (userRole === "ADMIN") {
        await axios.delete(`${API_URL}/admin/subscriptions/${id}`, { headers });
      } else {
        await axios.get(`${API_URL}/deleteSubscription/${id}`, { headers });
      }
      fetchSubscriptions();
    } catch (err) {
      console.error("Error deleting subscription:", err);
      alert("Error deleting subscription.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlanSelect = async (plan) => {
    const token = getAuthToken();
    if (!token) {
      alert("You are not authenticated");
      navigate("/login");
      return;
    }

    setIsLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const planData = {
        name: `${plan} Plan`,
        cost: plan === "Pro" ? 999 : plan === "Family" ? 1499 : 0, // Updated to INR
        renewalDate: new Date().toISOString().split("T")[0],
        frequency: "Monthly",
        paymentMethod: plan === "Free" ? "None" : "Razorpay",
        category: "Subscription",
      };

      const res = await axios.post(`${API_URL}/addSubscription`, planData, { headers });
      setRazorpayOrderId(res.data.razorpayOrderId);
      if (plan !== "Free" && res.data.razorpayOrderId) {
        triggerRazorpayPayment(res.data.razorpayOrderId, planData.cost);
      } else {
        alert("Free plan activated!");
        fetchSubscriptions();
      }
    } catch (err) {
      console.error("Error selecting plan:", err);
      alert("Error selecting plan: " + (err.response?.data?.message || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
  };

  const triggerRazorpayPayment = async (orderId, amount) => {
    try {
      await loadRazorpayScript();
      const options = {
        key: "rzp_test_uvMwjsQv3hPcCl", // Replace with your Razorpay API key
        amount: Math.round(parseFloat(amount) * 100), // Convert INR to paise
        currency: "INR",
        order_id: orderId,
        handler: async function (response) {
          const { razorpay_order_id } = response;
          const token = getAuthToken();
          if (!token) {
            alert("You are not authenticated");
            navigate("/login");
            return;
          }

          try {
            await axios.post(
              `${API_URL}/updatePaymentStatus`,
              { razorpayOrderId: razorpay_order_id, status: "PAID" },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            alert("Payment successful!");
            fetchSubscriptions();
          } catch (err) {
            console.error("Failed to update payment status:", err);
            alert("Payment failed.");
          }
        },
        theme: { color: "#00c4b4" },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (error) {
      console.error("Error loading Razorpay script", error);
      alert("Failed to load Razorpay.");
    }
  };

  // Hover effects
  useEffect(() => {
    const cards = document.querySelectorAll(".pricing-card, .stat-card");
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

    const buttons = document.querySelectorAll(".plan-button, .action-button");
    buttons.forEach((button) => {
      button.addEventListener("mouseenter", () => {
        button.style.background = "linear-gradient(145deg, #00c4b4, #00a69a)";
        button.style.transform = "scale(1.05)";
      });
      button.addEventListener("mouseleave", () => {
        button.style.background = "#00c4b4";
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
      <header style={styles.header}>
        <div style={styles.logo}>
          <span style={styles.logoText}>ExpenseMate</span>
        </div>
        <button style={styles.logoutButton} onClick={handleLogout} aria-label="Log out">
          <FiLogOut size={18} /> Logout
        </button>
      </header>

      <main style={styles.main}>
        {userRole === null ? (
          <div style={styles.loading}>
            <span style={styles.spinner}></span>
            Loading...
          </div>
        ) : userRole === "USER" ? (
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Choose Your Plan</h2>
            <p style={styles.sectionSubtitle}>
              Select the perfect subscription for your financial needs
            </p>
            <div style={styles.pricingContainer}>
              {/* Free Plan */}
              <div style={styles.pricingCard} className="pricing-card">
                <h3 style={styles.planName}>Free</h3>
                <p style={styles.planPrice}>₹0/month</p>
                <ul style={styles.planFeatures}>
                  <li>Track expenses & income</li>
                  <li>Basic budgeting</li>
                  <li>3 account connections</li>
                  <li>Email support</li>
                </ul>
                <button
                  style={styles.planButton}
                  className="plan-button"
                  onClick={() => handlePlanSelect("Free")}
                  disabled={isLoading}
                >
                  Get Started
                </button>
              </div>

              {/* Pro Plan */}
              <div style={{ ...styles.pricingCard, position: "relative" }} className="pricing-card">
                <span style={styles.popularBadge}>Most Popular</span>
                <h3 style={styles.planName}>Pro</h3>
                <p style={styles.planPrice}>₹999/month</p>
                <ul style={styles.planFeatures}>
                  <li>Everything in Free, plus:</li>
                  <li>Unlimited accounts</li>
                  <li>Advanced budgeting</li>
                  <li>Bill reminders</li>
                  <li>Investment tracking</li>
                  <li>Priority support</li>
                </ul>
                <button
                  style={styles.planButton}
                  className="plan-button"
                  onClick={() => handlePlanSelect("Pro")}
                  disabled={isLoading}
                >
                  Try 7 Days Free
                </button>
              </div>

              {/* Family Plan */}
              <div style={styles.pricingCard} className="pricing-card">
                <h3 style={styles.planName}>Family</h3>
                <p style={styles.planPrice}>₹1499/month</p>
                <ul style={styles.planFeatures}>
                  <li>Everything in Pro, plus:</li>
                  <li>Up to 5 family members</li>
                  <li>Shared budgets</li>
                  <li>Child accounts</li>
                  <li>Family financial reports</li>
                </ul>
                <button
                  style={styles.planButton}
                  className="plan-button"
                  onClick={() => handlePlanSelect("Family")}
                  disabled={isLoading}
                >
                  Choose Family
                </button>
              </div>
            </div>
          </section>
        ) : (
          <section style={styles.sectionGray}>
            {/* Admin Stats */}
            {stats && (
              <div style={styles.statsContainer}>
                <div style={styles.statCard} className="stat-card">
                  <h3 style={styles.statTitle}>Total Subscriptions</h3>
                  <p style={styles.statValue}>{stats.totalSubscriptions}</p>
                </div>
                <div style={styles.statCard} className="stat-card">
                  <h3 style={styles.statTitle}>Active Subscriptions</h3>
                  <p style={styles.statValue}>{stats.activeSubscriptions}</p>
                </div>
                <div style={styles.statCard} className="stat-card">
                  <h3 style={styles.statTitle}>Total Monthly Cost</h3>
                  <p style={styles.statValue}>₹{stats.totalMonthlyCost.toFixed(2)}</p>
                </div>
                <div style={styles.statCard} className="stat-card">
                  <h3 style={styles.statTitle}>Total Yearly Cost</h3>
                  <p style={styles.statValue}>₹{stats.totalYearlyCost.toFixed(2)}</p>
                </div>
              </div>
            )}

            <h2 style={styles.sectionTitle}>Subscriptions List</h2>
            {isLoading ? (
              <div style={styles.loading}>
                <span style={styles.spinner}></span>
                Loading...
              </div>
            ) : subscriptions.length === 0 ? (
              <p style={styles.noData}>No subscriptions found.</p>
            ) : (
              <div style={styles.tableContainer}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.tableHeader}>
                      <th style={styles.tableCell}>Name</th>
                      <th style={styles.tableCell}>Cost</th>
                      <th style={styles.tableCell}>Renewal Date</th>
                      <th style={styles.tableCell}>Frequency</th>
                      <th style={styles.tableCell}>Payment</th>
                      <th style={styles.tableCell}>Category</th>
                      <th style={styles.tableCell}>Status</th>
                      <th style={styles.tableCell}>User</th>
                      <th style={styles.tableCell}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptions.map((sub) => (
                      <tr key={sub.id} style={styles.tableRow}>
                        <td style={styles.tableCell}>{sub.name}</td>
                        <td style={styles.tableCell}>₹{sub.cost}</td>
                        <td style={styles.tableCell}>{sub.renewalDate}</td>
                        <td style={styles.tableCell}>{sub.frequency}</td>
                        <td style={styles.tableCell}>{sub.paymentMethod}</td>
                        <td style={styles.tableCell}>{sub.category}</td>
                        <td style={styles.tableCell}>{sub.paymentStatus}</td>
                        <td style={styles.tableCell}>{sub.user?.username || "N/A"}</td>
                        <td style={styles.tableCell}>
                          <button
                            onClick={() => handleDelete(sub.id)}
                            style={styles.deleteButton}
                            className="action-button"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </main>

      <footer style={styles.footer}>
        <p style={styles.footerText}>
          © 2025 ExpenseMate. All rights reserved.
        </p>
        <div style={styles.footerLinks}>
          <a href="/privacy" style={styles.footerLink}>Privacy Policy</a>
          <a href="/terms" style={styles.footerLink}>Terms of Service</a>
          <a href="/contact" style={styles.footerLink}>Contact Us</a>
        </div>
      </footer>
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
    background: "#f5f6f5",
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: "2rem",
    fontWeight: 700,
    color: "#333333",
    marginBottom: "1.5rem",
  },
  sectionSubtitle: {
    fontSize: "1.2rem",
    fontWeight: 400,
    color: "#666666",
    marginBottom: "2rem",
  },
  pricingContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "2rem",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  pricingCard: {
    background: "#ffffff",
    borderRadius: "8px",
    padding: "2rem",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    transition: "transform 0.3s, box-shadow 0.3s",
    animation: "fadeIn 0.8s ease-out",
    border: "1px solid #e5e7eb",
  },
  popularBadge: {
    position: "absolute",
    top: "-1rem",
    left: "50%",
    transform: "translateX(-50%)",
    background: "#4f46e5",
    color: "#ffffff",
    padding: "0.25rem 1rem",
    borderRadius: "12px",
    fontSize: "0.75rem",
    fontWeight: 600,
  },
  planName: {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#333333",
    marginBottom: "0.5rem",
  },
  planPrice: {
    fontSize: "2rem",
    fontWeight: 700,
    color: "#333333",
    marginBottom: "1.5rem",
  },
  planFeatures: {
    listStyle: "none",
    padding: "0",
    marginBottom: "1.5rem",
    fontSize: "0.875rem",
    color: "#666666",
    textAlign: "left",
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
    width: "100%",
    transition: "background 0.3s, transform 0.3s",
  },
  statsContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "1.5rem",
    marginBottom: "2rem",
  },
  statCard: {
    background: "#ffffff",
    borderRadius: "8px",
    padding: "1.5rem",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    textAlign: "center",
    animation: "fadeIn 0.8s ease-out",
  },
  statTitle: {
    fontSize: "1.2rem",
    fontWeight: 600,
    color: "#333333",
    marginBottom: "0.5rem",
  },
  statValue: {
    fontSize: "1.8rem",
    fontWeight: 700,
    color: "#00c4b4",
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
  loading: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    fontSize: "1rem",
    color: "#666666",
  },
  spinner: {
    width: "20px",
    height: "20px",
    border: "2px solid #00c4b4",
    borderTop: "2px solid transparent",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
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

export default Subscription;