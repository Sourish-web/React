import React, { useState } from "react";
import axios from "axios";
import Cookies from "universal-cookie";
import { useNavigate } from "react-router-dom";

function Login() {
  const [password, setPasswordValue] = useState("");
  const [userId, setUserIdValue] = useState("");

  const cookies = new Cookies();
  const navigate = useNavigate();

  const setPassword = (e) => {
    setPasswordValue(e.target.value);
  };

  const setUserId = (e) => {
    setUserIdValue(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("This is our data:", userId, password);

    const data = {
      "email": userId,
     "password": password,
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
    }
  };

  const redirectToRegister = () => {
    window.location.href = "/register";
  };

  return (
    <div>
      <h1>This is the login page</h1>
      <div className="container">
        <form onSubmit={handleSubmit}>
          <label>User ID:</label>
          <input
            type="email"
            placeholder="Enter your user ID"
            value={userId}
            onChange={setUserId}
          />
          <br />
          <br />

          <label>Password:</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={setPassword}
          />
          <br />
          <br />

          <button type="button" onClick={redirectToRegister}>
            Don't have an account?
          </button>{" "}
          &nbsp;
          <button type="submit">Login</button>
        </form>
      </div>
    </div>
  );
}

export default Login;
