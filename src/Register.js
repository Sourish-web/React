import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    birthDate: "",
    panCard: "",
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Full name is required";
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (!formData.phone) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[0-9]{10}$/.test(formData.phone)) {
      newErrors.phone = "Please enter a valid 10-digit phone number";
    }

    if (!formData.birthDate) {
      newErrors.birthDate = "Birth date is required";
    } else {
      const birthDate = new Date(formData.birthDate);
      const currentDate = new Date();
      if (birthDate >= currentDate) {
        newErrors.birthDate = "Birth date must be in the past";
      }
    }

    if (!formData.panCard) {
      newErrors.panCard = "PAN Card is required";
    } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panCard)) {
      newErrors.panCard = "Please enter a valid PAN Card (e.g., ABCDE1234F)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "panCard" ? value.toUpperCase() : value,
    });

    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
        api: "",
      });
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setSuccessMessage("");
    setErrors({});

    try {
      const response = await axios.post("http://localhost:8090/auth/signup", formData);
      console.log("Registration successful:", response.data);

      setSuccessMessage("Registration successful! Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      console.error("Registration error:", error);
      let errorMessage = "Failed to register user. Please try again.";

      if (error.response) {
        if (error.response.status === 409) {
          errorMessage = "Email is already registered. Please use a different email.";
        } else if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      }

      setErrors({ ...errors, api: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const redirectToLogin = () => {
    navigate("/login");
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
        <h1 style={styles.title}>Join ExpenseMate</h1>
        <p style={styles.subtitle}>Create your account to start managing finances</p>

        {errors.api && (
          <div style={styles.errorMessage}>
            {errors.api}
          </div>
        )}

        {successMessage && (
          <div style={styles.successMessage}>
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Full Name</label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>👤</span>
              <input
                type="text"
                name="name"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
                style={errors.name ? styles.inputError : styles.input}
                required
                aria-label="Full Name"
              />
            </div>
            {errors.name && <p style={styles.errorText}>{errors.name}</p>}
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Email</label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>📧</span>
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                style={errors.email ? styles.inputError : styles.input}
                required
                aria-label="Email Address"
              />
            </div>
            {errors.email && <p style={styles.errorText}>{errors.email}</p>}
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>🔒</span>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                style={errors.password ? styles.inputError : styles.input}
                required
                aria-label="Password"
              />
              <span
                style={styles.toggleIcon}
                onClick={togglePasswordVisibility}
                role="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "🙈" : "👁️"}
              </span>
            </div>
            {errors.password && <p style={styles.errorText}>{errors.password}</p>}
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Phone Number</label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>📱</span>
              <input
                type="tel"
                name="phone"
                placeholder="Enter your phone number"
                value={formData.phone}
                onChange={handleChange}
                style={errors.phone ? styles.inputError : styles.input}
                required
                aria-label="Phone Number"
              />
            </div>
            {errors.phone && <p style={styles.errorText}>{errors.phone}</p>}
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Birth Date</label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>📅</span>
              <input
                type="date"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleChange}
                style={errors.birthDate ? styles.inputError : styles.input}
                required
                aria-label="Birth Date"
              />
            </div>
            {errors.birthDate && <p style={styles.errorText}>{errors.birthDate}</p>}
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>PAN Card</label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>🪪</span>
              <input
                type="text"
                name="panCard"
                placeholder="Enter your PAN Card (e.g., ABCDE1234F)"
                value={formData.panCard}
                onChange={handleChange}
                style={errors.panCard ? styles.inputError : styles.input}
                maxLength="10"
                required
                aria-label="PAN Card Number"
              />
            </div>
            {errors.panCard && <p style={styles.errorText}>{errors.panCard}</p>}
          </div>

          <button
            type="submit"
            style={styles.registerButton}
            disabled={isLoading}
            aria-label="Create Account"
          >
            {isLoading ? (
              <span style={styles.loadingWrapper}>
                <span style={styles.spinner}></span>
                Processing...
              </span>
            ) : (
              "Create Account"
            )}
          </button>

          <div style={styles.loginLink}>
            <span style={styles.loginText}>Already have an account? </span>
            <button
              type="button"
              onClick={redirectToLogin}
              style={styles.loginButton}
              aria-label="Sign in"
            >
              Sign in
            </button>
          </div>
        </form>

        <p style={styles.termsText}>
          By registering, you agree to our Terms of Service and Privacy Policy
        </p>
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
    maxWidth: "500px",
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
  errorMessage: {
    backgroundColor: "rgba(220, 38, 38, 0.1)",
    color: "#dc2626",
    padding: "0.75rem",
    borderRadius: "8px",
    marginBottom: "1rem",
    fontSize: "0.875rem",
    animation: "slideIn 0.3s ease-out",
  },
  successMessage: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    color: "#10b981",
    padding: "0.75rem",
    borderRadius: "8px",
    marginBottom: "1rem",
    fontSize: "0.875rem",
    animation: "slideIn 0.3s ease-out",
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
    animation: "slideIn 0.8s ease-out",
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
  inputError: {
    padding: "0.75rem 1rem 0.75rem 2.5rem",
    border: "none",
    borderBottom: "2px solid #dc2626",
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
  errorText: {
    color: "#dc2626",
    fontSize: "0.75rem",
    marginTop: "0.25rem",
  },
  registerButton: {
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
  loginLink: {
    textAlign: "center",
    marginTop: "1rem",
  },
  loginText: {
    fontSize: "0.875rem",
    color: "#6b7280",
  },
  loginButton: {
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
  termsText: {
    fontSize: "0.75rem",
    color: "#6b7280",
    marginTop: "2rem",
    textAlign: "center",
  },
  loadingWrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
  },
  spinner: {
    width: "20px",
    height: "20px",
    border: "2px solid #ffffff",
    borderTop: "2px solid transparent",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
};

export default Register;