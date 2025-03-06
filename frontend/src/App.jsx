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
import HomePage from "./pages/HomePage.component.tsx";
import UnauthorizedPage from "./pages/UnauthorizedPage.component.tsx";
import Dashboard from "./pages/DashboardPage.component.tsx";
import SchedulePage from "./pages/SchedulePage.component.tsx";
import Dispatch from "./pages/DispatchPage.component.tsx";
import PropertyGuardSearchPage from "./pages/PropertyGuardSearchPage.tsx";
import TimeClockPage from "./pages/TimeClockPage.component.tsx";
import PayrollPage from "./pages/PayrollPage.component.tsx";
import ReportsPage from "./pages/DetailedReportPage";
import AdminDashboard from "./pages/AdminDashboard.component.tsx";
import UserManagement from "./pages/UserManagement.component.tsx";
import DetailedReportPage from "./pages/DetailedReportPage.tsx";

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
                {/* <Route path="/reports/:id" element={<DetailedReportPage />} /> */}
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
