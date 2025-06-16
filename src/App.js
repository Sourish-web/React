import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Welcome from './Welcome';
import Login from './Login';
import Register from './Register';
import ViewUsers from './ViewUsers';
import Transactions from './Transactions';
import Budget from './Budget';
import Portfolio from './Portfolio';
import Reports from './Reports';
import Goal from './Goal';
import Subscription from './Subscription';
import Settings from './Settings';
import CombinedTracker from './CombinedTracker';
import ForgotPassword from './ForgotPassword';
import AuthenticatedLayout from './AuthenticatedLayout';
import ProtectedRoute from './ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Authenticated Routes */}
        <Route element={<AuthenticatedLayout />}>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div className="p-6">Dashboard Page</div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <ViewUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/transactions"
            element={
              <ProtectedRoute>
                <Transactions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/budget"
            element={
              <ProtectedRoute>
                <Budget />
              </ProtectedRoute>
            }
          />
          <Route
            path="/portfolio"
            element={
              <ProtectedRoute>
                <Portfolio />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/goals"
            element={
              <ProtectedRoute>
                <Goal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/subscriptions"
            element={
              <ProtectedRoute>
                <Subscription />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/combinedTracker"
            element={
              <ProtectedRoute>
                <CombinedTracker />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* 404 Route */}
        <Route path="*" element={<div className="p-6 text-center text-2xl text-gray-900">404 - Page Not Found</div>} />
      </Routes>
    </Router>
  );
}

export default App;