import React from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import BackButton from "../../components/BackButton.jsx";

const DriverHistory = () => {
  const { user } = useAuth();
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
      <div>
        <BackButton to="/driver" label="Back to Driver Radar" />
      </div>

      <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-xs">
        <h1 className="text-xl font-bold text-slate-900">Pool Earnings & History — {user?.fullName}</h1>
        <p className="text-xs text-slate-500 mt-1">Ready for Branch 3 implementation.</p>
      </div>
    </div>
  );
};

export default DriverHistory;
