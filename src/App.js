import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Welcome from "./Welcome";
import Login from "./Login";
import Register from "./Register";
import ViewUsers from "./ViewUsers";
import Transactions from "./Transactions";
import Budget from "./Budget";
import Portfolio from "./Portfolio";
import Reports from "./Reports";
import Goal from "./Goal";
import Subscription from "./Subscription";
import Settings from "./Settings";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/users" element={<ViewUsers />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/budget" element={<Budget />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/goals" element={<Goal />} />
        <Route path="/subscriptions" element={<Subscription />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Router>
  );
}

export default App;
