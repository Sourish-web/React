// src/Welcome.js

import React from "react";
import { useNavigate } from "react-router-dom";

function WelcomePage() {
  const navigate = useNavigate();

  const handleLoginRedirect = () => {
    navigate("/login");
  };

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h1>Welcome to the App 🚀</h1>
      <p>Please login to continue.</p>
      <button onClick={handleLoginRedirect}>Login</button>
    </div>
  );
}

export default WelcomePage;
