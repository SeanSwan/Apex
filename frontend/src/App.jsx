import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.scss";

// Context Providers
import { AuthProvider } from "./context/AuthContext"; // Authentication context provider
import { ToastProvider } from "@/context/ToastContext"; // Toast context provider

// Components
import Header from "./components/Header/header.component"; // Header component
import ErrorBoundary from "./components/ErrorBoundary/error-boundry.component.jsx"; // ErrorBoundary for fallback UI

// Pages and Components
import HomePage from "./pages/HomePage.component.jsx";
import UnauthorizedPage from "./pages/UnauthorizedPage.component.jsx";
import Dashboard from "./pages/DashboardPage.component.jsx";
import SchedulePage from "./pages/SchedulePage.component.jsx";
import Dispatch from "./pages/DispatchPage.component.jsx";
import PropertyGuardSearchPage from "./pages/PropertyGuardSearchPage.jsx";
import TimeClockPage from "./pages/TimeClockPage.component.jsx";
import PayrollPage from "./pages/PayrollPage.component.jsx";
import ReportsPage from "./pages/ReportsPage.component.tsx";
import AdminDashboard from "./pages/AdminDashboard.component.jsx";
import UserManagement from "./pages/UserManagement.component.jsx";
import DetailedReportPage from "./pages/DetailedReportPage.jsx";

// Replace LoginPage with UniversalAuthForm
import UniversalAuthForm from "./components/UniversalAuthForm/UniversalAuthForm.component"; // UniversalAuthForm component

// Other Components
import ObjectDetection from "./components/ObjectDetection/ObjectDetection.component.jsx"; // Object detection component

function App() {
  return (
    <AuthProvider>
      <ToastProvider> {/* ToastProvider wraps the entire app */}
        <Router>
          <ErrorBoundary>
            <div className="App">
              <Header />
              <Routes>
                {/* Public routes that do not require authentication */}
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<UniversalAuthForm />} /> {/* Login/Signup Route */}
                <Route path="/object-detection" element={<ObjectDetection />} />
                <Route path="/unauthorized" element={<UnauthorizedPage />} />
                <Route path="/dispatch" element={<Dispatch />} />
                <Route path="/schedule" element={<SchedulePage />} />
                <Route path="/property-search" element={<PropertyGuardSearchPage />} />
                <Route path="/payroll" element={<PayrollPage />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/reports/:id" element={<DetailedReportPage />} />
                <Route path="/admin-dashboard" element={<AdminDashboard />} />
                <Route path="/admin/user-management" element={<UserManagement />} />

                {/* Catch-all route for undefined paths */}
                <Route path="*" element={<UnauthorizedPage />} />
              </Routes>
            </div>
          </ErrorBoundary>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
