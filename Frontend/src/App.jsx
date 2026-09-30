import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import RequireAuth from "./guards/RequireAuth.jsx";
import RoleGuard from "./guards/RoleGuard.jsx";
import Navbar from "./components/Navbar.jsx";
import Home from "./features/home/Home.jsx";
import Login from "./features/auth/Login.jsx";
import Register from "./features/auth/Register.jsx";
import PassengerDashboard from "./features/passenger/PassengerDashboard.jsx";
import PassengerHistory from "./features/passenger/PassengerHistory.jsx";
import DriverDashboard from "./features/driver/DriverDashboard.jsx";
import DriverHistory from "./features/driver/DriverHistory.jsx";

const App = () => {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
            <Navbar />
            <main className="flex-1">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected Passenger Routes */}
                <Route
                  path="/passenger"
                  element={
                    <RequireAuth>
                      <RoleGuard allowedRole="PASSENGER">
                        <PassengerDashboard />
                      </RoleGuard>
                    </RequireAuth>
                  }
                />
                <Route
                  path="/passenger/history"
                  element={
                    <RequireAuth>
                      <RoleGuard allowedRole="PASSENGER">
                        <PassengerHistory />
                      </RoleGuard>
                    </RequireAuth>
                  }
                />

                {/* Protected Driver Routes */}
                <Route
                  path="/driver"
                  element={
                    <RequireAuth>
                      <RoleGuard allowedRole="DRIVER">
                        <DriverDashboard />
                      </RoleGuard>
                    </RequireAuth>
                  }
                />
                <Route
                  path="/driver/history"
                  element={
                    <RequireAuth>
                      <RoleGuard allowedRole="DRIVER">
                        <DriverHistory />
                      </RoleGuard>
                    </RequireAuth>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;
