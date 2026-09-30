import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import BackButton from "../../components/BackButton.jsx";
import { MapPin, Navigation, Calendar, Users, RefreshCw, Car } from "lucide-react";

const PassengerHistory = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get("/passenger/ride/history");
      if (res.data) {
        setHistory(res.data);
      }
    } catch (err) {
      console.warn("Could not fetch history:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Top Header with Back Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <BackButton to="/passenger" label="Back to Dashboard" />

        <button
          type="button"
          onClick={fetchHistory}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* History Header Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Ride History — {user?.fullName}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Complete archive of all requested, completed, and cancelled Tesla pool rides.
        </p>
      </div>

      {/* Rides List */}
      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-xs">
          <div className="w-6 h-6 border-2 border-slate-800 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-slate-500">Loading your ride archive...</p>
        </div>
      ) : history.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-xs space-y-3">
          <p className="text-sm font-semibold text-slate-700">No ride history found</p>
          <p className="text-xs text-slate-500">
            You haven't requested any rides yet. Book a ride from Banani Road 11!
          </p>
          <Link
            to="/passenger"
            className="inline-block px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs"
          >
            Request a Ride Now
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((ride) => (
            <div
              key={ride.id}
              className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs hover:border-slate-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              {/* Route & Metadata */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-600" />
                    <span>{ride.pickupZone}</span>
                    <span className="text-slate-400 font-normal">→</span>
                    <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{ride.dropoffZone}</span>
                  </span>

                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                      ride.status === "COMPLETED"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : ride.status === "CANCELLED"
                        ? "bg-rose-50 text-rose-800 border-rose-200"
                        : "bg-amber-50 text-amber-800 border-amber-200"
                    }`}
                  >
                    {ride.status}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>{new Date(ride.createdAt).toLocaleString()}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-slate-400" />
                    <span>
                      {ride.seatsRequested} {ride.seatsRequested === 1 ? "seat" : "seats"}
                    </span>
                  </span>
                </div>
              </div>

              {/* Fare Display */}
              <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                <div className="text-base font-extrabold text-slate-900 font-mono-num">
                  ৳{ride.fareInBDT}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  {ride.fare?.toLocaleString()} poysha
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PassengerHistory;
