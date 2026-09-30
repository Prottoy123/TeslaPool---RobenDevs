import React from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import BackButton from "../../components/BackButton.jsx";

const DriverDashboard = () => {
  const { user } = useAuth();
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
      <div>
        <BackButton to="/" label="Back to Home" />
      </div>

      <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-xs">
        <h1 className="text-xl font-bold text-slate-900">Tesla Driver Console — {user?.fullName}</h1>
        <p className="text-xs text-slate-500 mt-1">
          Branch 1 (Auth & Route Guards) Active. Ready for Branch 3 (Driver Radar & Pool Manager).
        </p>
      </div>
    </div>
  );
};

export default DriverDashboard;
