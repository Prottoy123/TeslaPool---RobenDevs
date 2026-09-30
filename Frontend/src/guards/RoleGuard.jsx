import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const RoleGuard = ({ allowedRole, children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium">Checking role clearance...</p>
      </div>
    );
  }

  if (!user || user.role !== allowedRole) {
    // If passenger attempts to access driver route, send to passenger dashboard
    // If driver attempts to access passenger route, send to driver dashboard
    const redirectPath = user?.role === "DRIVER" ? "/driver" : "/passenger";
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

export default RoleGuard;
