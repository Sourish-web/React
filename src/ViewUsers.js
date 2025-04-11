import axios from "axios";
import React, { useEffect } from "react";
import Cookies from "universal-cookie";
import { useNavigate } from "react-router-dom";

function ViewUsers() {
  const cookies = new Cookies();
  const navigate = useNavigate();

  const fetchAllUsers = async () => {
    const token = cookies.get("token");
    const baseURL = "http://localhost:8090/getUsers";

    try {
      await axios.get(baseURL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.log("Error fetching users:", error);
    }
  };

  useEffect(() => {
    fetchAllUsers();
  }, []);

  const cardStyle = {
    border: "1px solid #ccc",
    padding: "20px",
    margin: "10px",
    width: "200px",
    textAlign: "center",
    borderRadius: "8px",
    boxShadow: "2px 2px 10px rgba(0,0,0,0.1)",
    cursor: "pointer",
    background: "#f9f9f9",
    transition: "transform 0.2s",
  };

  const containerStyle = {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: "50px",
  };

  const handleRedirect = (path) => {
    navigate(path);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ marginBottom: "20px", textAlign: "center" }}>Explore Features</h2>
      <div style={containerStyle}>
        <div style={cardStyle} onClick={() => handleRedirect("/transactions")}>
          📒 Transactions
        </div>
        <div style={cardStyle} onClick={() => handleRedirect("/budget")}>
          💰 Budget
        </div>
        <div style={cardStyle} onClick={() => handleRedirect("/portfolio")}>
          📈 Portfolio
        </div>
        <div style={cardStyle} onClick={() => handleRedirect("/reports")}>
          📊 Reports
        </div>
        <div style={cardStyle} onClick={() => handleRedirect("/goals")}>
          🎯 Goals
        </div>
        <div style={cardStyle} onClick={() => handleRedirect("/subscriptions")}>
          🎯 subscriptions
        </div>
        <div style={cardStyle} onClick={() => handleRedirect("/settings")}>
          🎯 settings
        </div>
      </div>
    </div>
  );
}

export default ViewUsers;
