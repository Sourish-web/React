import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import WelcomePage from "./Welcome"; // file is still Welcome.js

import Login from "./Login";
import Register from "./Register";
import ViewUsers from "./ViewUsers"; // Or your actual users page

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/users" element={<ViewUsers />} />
      </Routes>
    </Router>
  );
}

export default App;
