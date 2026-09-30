import React from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import BackButton from "../../components/BackButton.jsx";

const PassengerHistory = () => {
  const { user } = useAuth();
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
      <div>
        <BackButton to="/passenger" label="Back to Dashboard" />
      </div>

      <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-xs">
        <h1 className="text-xl font-bold text-slate-900">Ride History — {user?.fullName}</h1>
        <p className="text-xs text-slate-500 mt-1">Ready for Branch 2 implementation.</p>
      </div>
    </div>
  );
};

export default PassengerHistory;
