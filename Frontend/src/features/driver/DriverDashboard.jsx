import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import BackButton from "../../components/BackButton.jsx";
import PoolManager from "./PoolManager.jsx";
import DriverRadar from "./DriverRadar.jsx";
import { Car, Zap, Power, DollarSign, History, ShieldAlert } from "lucide-react";

const DriverDashboard = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [vehicle, setVehicle] = useState(user?.vehicle || null);
  const [activePool, setActivePool] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingStatus, setTogglingStatus] = useState(false);

  // Fetch driver's vehicle and active pool details
  const loadDriverData = useCallback(async () => {
    try {
      const [vehicleRes, poolRes, requestsRes] = await Promise.all([
        api.get("/driver/vehicle").catch(() => null),
        api.get("/driver/pool/active").catch(() => null),
        api.get("/driver/pending-requests").catch(() => null),
      ]);

      if (vehicleRes?.data) {
        setVehicle(vehicleRes.data);
      }
      if (poolRes?.data) {
        setActivePool(poolRes.data);
      }
      if (requestsRes?.data?.pendingRequests) {
        setPendingRequests(requestsRes.data.pendingRequests);
      }
    } catch (err) {
      console.warn("Failed to load driver state:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDriverData();
    const interval = setInterval(loadDriverData, 3500);
    return () => clearInterval(interval);
  }, [loadDriverData]);

  // Toggle Tesla Online / Offline status
  const handleToggleOnline = async () => {
    const nextState = !vehicle?.isOnline;
    try {
      setTogglingStatus(true);
      const res = await api.patch("/driver/vehicle/status", { isOnline: nextState });
      if (res.data) {
        setVehicle(res.data);
        showToast(
          nextState
            ? "Your Tesla is now ONLINE. Receiving passenger requests!"
            : "Your Tesla is now OFFLINE. New requests paused.",
          nextState ? "success" : "info"
        );
      }
    } catch (err) {
      showToast(err.message || "Failed to update vehicle status", "error");
    } finally {
      setTogglingStatus(false);
    }
  };

  const isOnline = !!vehicle?.isOnline;
  const availableSeats = activePool?.availableSeats ?? (vehicle?.capacity || 3);
  const activePoolId = activePool?.poolId || null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Top Header Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <BackButton to="/" label="Back to Home" />

        <Link
          to="/driver/history"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
          <span>Earnings & History</span>
        </Link>
      </div>

      {/* Driver & Tesla Profile Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              {user?.fullName}
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
              Tesla Driver
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <span>Tesla: <strong className="text-slate-900">Bullet</strong></span>
            <span>•</span>
            <span>Plate: <strong className="font-mono text-slate-900">{vehicle?.licensePlate || "DHAKA-METRO-TE-1101"}</strong></span>
            <span>•</span>
            <span>Capacity: <strong className="text-slate-900">3 Seats</strong></span>
          </div>
        </div>

        {/* Online / Offline Toggle Button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={togglingStatus}
            onClick={handleToggleOnline}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
              isOnline
                ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                : "bg-slate-200 hover:bg-slate-300 text-slate-800"
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{isOnline ? "Online (Available)" : "Offline (Paused)"}</span>
          </button>
        </div>
      </div>

      {/* Active Pool Manager (Visible when a pool is in progress) */}
      {activePool && activePool.poolId && (
        <PoolManager activePool={activePool} onPoolUpdated={loadDriverData} />
      )}

      {/* Live Passenger Radar */}
      <DriverRadar
        pendingRequests={pendingRequests}
        activePoolId={activePoolId}
        availableSeats={availableSeats}
        isOnline={isOnline}
        loading={loading}
        onRideAccepted={loadDriverData}
        onRefresh={loadDriverData}
      />
    </div>
  );
};

export default DriverDashboard;
