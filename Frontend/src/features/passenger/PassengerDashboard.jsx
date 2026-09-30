import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import BackButton from "../../components/BackButton.jsx";
import RideWizard from "./RideWizard.jsx";
import RideTracker from "./RideTracker.jsx";
import { History, Zap, ShieldCheck } from "lucide-react";

const PassengerDashboard = () => {
  const { user } = useAuth();
  const [activeRide, setActiveRide] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check on mount if passenger already has an active ride
  useEffect(() => {
    const checkActiveRide = async () => {
      try {
        const res = await api.get("/passenger/ride/status");
        if (res.data && (res.data.status === "WAITING" || res.data.status === "IN_POOL")) {
          setActiveRide(res.data);
        } else {
          setActiveRide(null);
        }
      } catch (err) {
        console.warn("Could not check active ride:", err.message);
      } finally {
        setLoading(false);
      }
    };

    checkActiveRide();
  }, []);

  const handleRequestSuccess = (createdRide) => {
    setActiveRide(createdRide);
  };

  const handleRideClosed = () => {
    setActiveRide(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Top Bar with Navigation & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <BackButton to="/" label="Back to Home" />

        <Link
          to="/passenger/history"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <History className="w-3.5 h-3.5 text-slate-600" />
          <span>My Ride History</span>
        </Link>
      </div>

      {/* Welcome & Context Header */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Welcome, {user?.fullName}
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
              Passenger
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Banani Road 11 rush-hour pool network. Share a Tesla, split the fare.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
          <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
          <span>Max Capacity: 3 Seats (Bullet)</span>
        </div>
      </div>

      {/* Main Feature: Live Ride Tracker OR Booking Wizard */}
      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-xs">
          <div className="w-6 h-6 border-2 border-slate-800 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-slate-500">Checking your active ride status...</p>
        </div>
      ) : activeRide ? (
        <RideTracker initialRide={activeRide} onRideClosed={handleRideClosed} />
      ) : (
        <RideWizard onRequestSuccess={handleRequestSuccess} />
      )}
    </div>
  );
};

export default PassengerDashboard;
