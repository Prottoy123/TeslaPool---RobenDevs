import React, { useState, useEffect } from "react";
import api from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import BackButton from "../../components/BackButton.jsx";
import { DollarSign, CheckCircle2, Users, Calendar, MapPin, Navigation, RefreshCw } from "lucide-react";

const DriverHistory = () => {
  const { user } = useAuth();
  const [data, setData] = useState({
    totalCompletedPools: 0,
    totalCompletedRides: 0,
    totalEarningsInBDT: 0,
    totalEarningsInPoysha: 0,
    history: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchDriverHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get("/driver/history");
      if (res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.warn("Could not fetch driver history:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDriverHistory();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Top Header Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <BackButton to="/driver" label="Back to Driver Radar" />

        <button
          type="button"
          onClick={fetchDriverHistory}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Driver Earnings Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-1">
          <div className="flex items-center gap-2 text-emerald-700">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Total Earnings</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono-num">
            ৳{data.totalEarningsInBDT}
          </div>
          <p className="text-[11px] text-slate-500 font-mono">
            {data.totalEarningsInPoysha?.toLocaleString()} poysha
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-1">
          <div className="flex items-center gap-2 text-amber-700">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Completed Pools</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono-num">
            {data.totalCompletedPools}
          </div>
          <p className="text-[11px] text-slate-500">Tesla Bullet shared journeys</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-1">
          <div className="flex items-center gap-2 text-sky-700">
            <Users className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Passengers Served</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono-num">
            {data.totalCompletedRides}
          </div>
          <p className="text-[11px] text-slate-500">Individual passenger trips</p>
        </div>
      </div>

      {/* History List */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900">Pool Journey History</h2>

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-xs">
            <div className="w-6 h-6 border-2 border-slate-800 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-slate-500">Loading your earnings archive...</p>
          </div>
        ) : data.history.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-xs">
            <p className="text-sm font-semibold text-slate-700">No completed pools yet</p>
            <p className="text-xs text-slate-500 mt-1">
              Start accepting rides on the radar to build your pool history.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.history.map((poolItem) => (
              <div
                key={poolItem.poolId}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-3 hover:border-slate-300 transition-colors"
              >
                {/* Pool Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">
                      Pool #{poolItem.poolId.substring(0, 8)}
                    </span>
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                        poolItem.status === "COMPLETED"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-slate-100 text-slate-800 border-slate-200"
                      }`}
                    >
                      {poolItem.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500">Pool Fare Collected:</span>
                    <span className="font-extrabold text-slate-900 font-mono-num text-sm">
                      ৳{poolItem.poolEarningsInBDT}
                    </span>
                  </div>
                </div>

                {/* Pool Passengers */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Passengers in this Pool:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {poolItem.passengers?.map((p) => (
                      <div
                        key={p.rideId}
                        className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 text-xs space-y-1"
                      >
                        <div className="flex justify-between font-semibold text-slate-900">
                          <span>{p.passengerName || "Passenger"}</span>
                          <span className="font-mono-num">৳{p.fareInBDT}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                          <MapPin className="w-3 h-3 text-amber-600" />
                          <span>{p.pickupZone}</span>
                          <span className="text-slate-400">→</span>
                          <Navigation className="w-3 h-3 text-emerald-600" />
                          <span>{p.dropoffZone}</span>
                          <span className="text-slate-400 ml-auto">({p.status})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverHistory;
