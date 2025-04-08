import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './Login';
import Register from './Register';
import './App.css';
import ViewUsers from './ViewUsers';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/users" element={<ViewUsers />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

