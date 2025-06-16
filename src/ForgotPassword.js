import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]); // Array for 6 digits
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [error, setError] = useState("");
  const [otpTimer, setOtpTimer] = useState(600); // 10 minutes in seconds
  const [resendCooldown, setResendCooldown] = useState(0); // 30s cooldown
  const navigate = useNavigate();
  const inputRefs = useRef([]); // Refs for OTP inputs

  // OTP timer and resend cooldown
  useEffect(() => {
    if (step === 2) {
      const interval = setInterval(() => {
        setOtpTimer((prev) => (prev > 0 ? prev - 1 : 0));
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [step]);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await axios.post(`http://localhost:8090/forgotPassword/verifyMail/${email}`);
      if (response.data.message.includes("OTP sent successfully")) {
        setStep(2);
        setOtpTimer(600); // Reset timer
        setResendCooldown(30); // Start cooldown
      } else {
        setError(response.data.message || "Failed to send OTP");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Error sending OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    const otpValue = otp.join("");

    try {
      const response = await axios.post(`http://localhost:8090/forgotPassword/verifyOtp/${otpValue}/${email}`);
      if (response.data.message === "OTP verified successfully") {
        setStep(3);
      } else {
        setError(response.data.message || "Invalid OTP");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Error verifying OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (newPassword !== repeatPassword) {
      setError("Passwords do not match!");
      setIsLoading(false);
      return;
    }

    try {
      const data = {
        password: newPassword,
        repeatPassword: repeatPassword,
      };
      const response = await axios.post(`http://localhost:8090/forgotPassword/changePassword/${email}`, data);
      if (response.data.message === "Password changed successfully.") {
        alert("Password reset successful!");
        navigate("/login");
      } else {
        setError(response.data.message || "Failed to reset password");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Error resetting password");
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Handle OTP input changes
  const handleOtpChange = (index, value) => {
    if (/^[0-9]?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Auto-focus next input
      if (value && index < 5) {
        inputRefs.current[index + 1].focus();
      }
    }
  };

  // Handle backspace
  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  // Handle paste
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pastedData.length === 6) {
      const newOtp = pastedData.split("");
      setOtp(newOtp);
      inputRefs.current[5].focus();
    }
  };

  // Handle resend OTP
  const handleResendOtp = async (e) => {
    e.preventDefault();
    if (resendCooldown > 0) return;
    setIsLoading(true);
    setError("");
    setOtp(["", "", "", "", "", ""]);

    try {
      const response = await axios.post(`http://localhost:8090/forgotPassword/verifyMail/${email}`);
      if (response.data.message.includes("OTP sent successfully")) {
        setOtpTimer(600);
        setResendCooldown(30);
        setError("");
      } else {
        setError(response.data.message || "Failed to resend OTP");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Error resending OTP");
    } finally {
      setIsLoading(false);
    }
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
        <h1 style={styles.title}>
          {step === 1 ? "Reset Password" : step === 2 ? "Verify OTP" : "Set New Password"}
        </h1>
        <p style={styles.subtitle}>
          {step === 1 ? "Enter your email to receive an OTP" : step === 2 ? "Enter the OTP sent to your email" : "Enter your new password"}
        </p>
        {error && <p style={{ color: "#ef4444", marginBottom: "1rem", fontSize: "0.875rem" }}>{error}</p>}
        
        {step === 1 && (
          <form onSubmit={handleEmailSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Email</label>
              <div style={styles.inputWrapper}>
                <span style={{ ...styles.inputIcon, content: "✉️" }}>✉️</span>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              style={styles.loginButton}
              disabled={isLoading}
            >
              {isLoading ? "Sending OTP..." : "Verify Email"}
            </button>
            <div style={styles.forgotPassword}>
              <a href="/login" style={styles.forgotLink}>
                Back to Login
              </a>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleOtpSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Enter OTP</label>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", marginBottom: "1rem" }}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    type="text"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={index === 0 ? handleOtpPaste : null}
                    ref={(el) => (inputRefs.current[index] = el)}
                    style={{
                      width: "40px",
                      height: "40px",
                      textAlign: "center",
                      fontSize: "1.25rem",
                      color: "#111827",
                      border: "2px solid #d1d5db",
                      borderRadius: "8px",
                      background: "transparent",
                      outline: "none",
                      transition: "border-color 0.3s, box-shadow 0.3s",
                      boxShadow: digit ? "0 0 0 2px rgba(79, 70, 229, 0.2)" : "none",
                    }}
                    aria-label={`OTP digit ${index + 1}`}
                    required
                  />
                ))}
              </div>
              <p style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "1rem" }}>
                OTP expires in {Math.floor(otpTimer / 60)}:{(otpTimer % 60).toString().padStart(2, "0")}
              </p>
            </div>
            <button
              type="submit"
              style={styles.loginButton}
              disabled={isLoading}
            >
              {isLoading ? "Verifying OTP..." : "Verify OTP"}
            </button>
            <div style={styles.forgotPassword}>
              <button
                type="button"
                onClick={handleResendOtp}
                style={{
                  ...styles.forgotLink,
                  background: "none",
                  border: "none",
                  cursor: resendCooldown > 0 ? "not-allowed" : "pointer",
                  color: resendCooldown > 0 ? "#d1d5db" : "#6b7280",
                }}
                disabled={resendCooldown > 0}
              >
                {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : "Resend OTP"}
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handlePasswordSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>New Password</label>
              <div style={styles.inputWrapper}>
                <span style={{ ...styles.inputIcon, content: "🔒" }}>🔒</span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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
            <div style={styles.inputGroup}>
              <label style={styles.label}>Repeat Password</label>
              <div style={styles.inputWrapper}>
                <span style={{ ...styles.inputIcon, content: "🔒" }}>🔒</span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Repeat new password"
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              style={styles.loginButton}
              disabled={isLoading}
            >
              {isLoading ? "Resetting Password..." : "Done"}
            </button>
          </form>
        )}
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
};

export default ForgotPassword;