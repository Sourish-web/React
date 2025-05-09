import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "universal-cookie";
import { useNavigate } from "react-router-dom";

function Login() {
  const [password, setPasswordValue] = useState("");
  const [userId, setUserIdValue] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const cookies = new Cookies();
  const navigate = useNavigate();

  const setPassword = (e) => {
    setPasswordValue(e.target.value);
  };

  const setUserId = (e) => {
    setUserIdValue(e.target.value);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    console.log("This is our data:", userId, password);

    const data = {
      email: userId,
      password: password,
    };

    try {
      const response = await axios.post("http://localhost:8090/auth/login", data);

      console.log("This is the response:", response.data);

      if (!response.data || !response.data.token) {
        alert("Invalid User ID or password");
      } else {
        const token = response.data.token;
        cookies.set("token", token, { path: "/" });
        alert("Login Successful");
        navigate("/users");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Something went wrong during login");
    } finally {
      setIsLoading(false);
    }
  };

  const redirectToRegister = () => {
    navigate("/register");
  };

  // Add hover and animation effects
  useEffect(() => {
    const buttons = document.querySelectorAll("button");
    buttons.forEach((button) => {
      button.addEventListener("mouseenter", () => {
        if (button.style.background.includes("linear-gradient")) {
          button.style.transform = "scale(1.05)";
          button.style.boxShadow = "0 8px 16px rgba(79, 70, 229, 0.5)";
        } else {
          button.style.background = "linear-gradient(145deg, #f3f4f6, #e5e7eb)";
          button.style.transform = "scale(1.05)";
          button.style.boxShadow = "0 6px 12px rgba(0,0,0,0.2)";
        }
      });
      button.addEventListener("mouseleave", () => {
        if (button.style.background.includes("linear-gradient")) {
          button.style.transform = "scale(1)";
          button.style.boxShadow = "0 4px 8px rgba(79, 70, 229, 0.3)";
        } else {
          button.style.background = "#ffffff";
          button.style.transform = "scale(1)";
          button.style.boxShadow = "0 2px 5px rgba(0,0,0,0.1)";
        }
      });
    });

    const links = document.querySelectorAll("a");
    links.forEach((link) => {
      link.addEventListener("mouseenter", () => {
        link.style.color = "#4f46e5";
        link.style.textDecoration = "underline";
      });
      link.addEventListener("mouseleave", () => {
        link.style.color = "#6b7280";
        link.style.textDecoration = "none";
      });
    });
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <span style={styles.logoText}>ExpenseMate</span>
        </div>
        <h1 style={styles.title}>Welcome Back</h1>
        <p style={styles.subtitle}>Sign in to manage your finances</p>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email</label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}></span>
              <input
                type="email"
                placeholder="Enter your email"
                value={userId}
                onChange={setUserId}
                style={styles.input}
                required
              />
            </div>
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}></span>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={setPassword}
                style={styles.input}
                required
              />
              <span
                style={styles.toggleIcon}
                onClick={togglePasswordVisibility}
              >
                {showPassword ? "🙈" : "👁"}
              </span>
            </div>
          </div>
          <div style={styles.forgotPassword}>
            <a href="#" style={styles.forgotLink}>
              Forgot Password?
            </a>
          </div>
          <button
            type="submit"
            style={styles.loginButton}
            disabled={isLoading}
          >
            {isLoading ? "Logging In..." : "Login"}
          </button>
          <button
            type="button"
            onClick={redirectToRegister}
            style={styles.registerButton}
          >
            Create an Account
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #e0e7ff, #c7d2fe, #e0e7ff)",
    animation: "gradientShift 15s ease infinite",
    backgroundSize: "200% 200%",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    padding: "2rem",
  },
  card: {
    background: "rgba(255, 255, 255, 0.9)",
    backdropFilter: "blur(10px)",
    borderRadius: "20px",
    boxShadow: "0 15px 30px rgba(79, 70, 229, 0.2)",
    padding: "3rem",
    width: "100%",
    maxWidth: "450px",
    textAlign: "center",
    animation: "fadeIn 0.8s ease-out",
    border: "1px solid rgba(255, 255, 255, 0.2)",
  },
  logo: {
    marginBottom: "1.5rem",
  },
  logoText: {
    fontSize: "2rem",
    fontWeight: 800,
    background: "linear-gradient(90deg, #4f46e5, #10b981)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  title: {
    fontSize: "2rem",
    fontWeight: 800,
    color: "#111827",
    marginBottom: "0.5rem",
  },
  subtitle: {
    fontSize: "1rem",
    color: "#6b7280",
    marginBottom: "2rem",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    textAlign: "left",
    position: "relative",
  },
  label: {
    fontSize: "0.875rem",
    fontWeight: 600,
    color: "#111827",
    marginBottom: "0.5rem",
  },
  inputWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  input: {
    padding: "0.75rem 1rem 0.75rem 2.5rem",
    border: "none",
    borderBottom: "2px solid #d1d5db",
    background: "transparent",
    fontSize: "1rem",
    color: "#111827",
    outline: "none",
    width: "100%",
    transition: "border-color 0.3s, transform 0.3s",
  },
  inputIcon: {
    position: "absolute",
    left: "0.75rem",
    fontSize: "1rem",
    color: "#6b7280",
  },
  toggleIcon: {
    position: "absolute",
    right: "0.75rem",
    cursor: "pointer",
    fontSize: "1rem",
    color: "#6b7280",
  },
  forgotPassword: {
    textAlign: "right",
  },
  forgotLink: {
    fontSize: "0.875rem",
    color: "#6b7280",
    textDecoration: "none",
    transition: "color 0.3s",
  },
  loginButton: {
    background: "linear-gradient(145deg, #4f46e5, #6366f1)",
    color: "#ffffff",
    border: "none",
    padding: "1rem",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: 600,
    boxShadow: "0 4px 8px rgba(79, 70, 229, 0.3)",
    transition: "transform 0.3s, box-shadow 0.3s",
    animation: "slideIn 0.8s ease-out 0.2s both",
  },
  registerButton: {
    background: "#ffffff",
    color: "#4f46e5",
    border: "2px solid #4f46e5",
    padding: "0.75rem",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: 600,
    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
    transition: "transform 0.3s, box-shadow 0.3s",
    animation: "slideIn 0.8s ease-out 0.4s both",
  },
};

export default Login;