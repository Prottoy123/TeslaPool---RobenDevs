import React, { useState } from "react";
import api from "../../services/api.js";
import { useToast } from "../../context/ToastContext.jsx";
import { Users, Phone, MapPin, Navigation, CheckCircle2, ArrowRight, Play, CheckCheck, AlertCircle } from "lucide-react";

const PoolManager = ({ activePool, onPoolUpdated }) => {
  const [updating, setUpdating] = useState(false);
  const { showToast } = useToast();

  if (!activePool || !activePool.poolId) {
    return null;
  }

  const {
    poolId,
    status,
    currentZone,
    capacity = 3,
    availableSeats = 3,
    occupiedSeats = 0,
    passengers = [],
    totalFareInBDT = 0,
  } = activePool;

  const handleUpdateStatus = async (newStatus) => {
    try {
      setUpdating(true);
      await api.patch("/driver/pool/status", {
        newStatus,
        status: newStatus,
        poolId,
      });
      showToast(`Trip status transitioned to '${newStatus}' successfully`, "success");
      if (onPoolUpdated) {
        onPoolUpdated();
      }
    } catch (err) {
      showToast(err.message || "Failed to update pool status", "error");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-7 shadow-xs space-y-6">
      {/* Header & Seat Gauge */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">Active Tesla Pool</h2>
            <span
              className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                status === "STARTED"
                  ? "bg-sky-50 text-sky-800 border-sky-200"
                  : status === "DRIVER_ARRIVED"
                  ? "bg-amber-50 text-amber-800 border-amber-200"
                  : "bg-emerald-50 text-emerald-800 border-emerald-200"
              }`}
            >
              {status}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Current Zone: <span className="font-semibold text-slate-800">{currentZone}</span>
          </p>
        </div>

        {/* 3-Seat Capacity Visual Indicator */}
        <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-lg border border-slate-200">
          <div className="flex items-center gap-1">
            {[1, 2, 3].map((seatIndex) => {
              const isOccupied = seatIndex <= occupiedSeats;
              return (
                <div
                  key={seatIndex}
                  title={isOccupied ? `Seat ${seatIndex}: Occupied` : `Seat ${seatIndex}: Available`}
                  className={`w-3.5 h-3.5 rounded-sm border transition-colors ${
                    isOccupied
                      ? "bg-amber-500 border-amber-600"
                      : "bg-slate-200 border-slate-300"
                  }`}
                />
              );
            })}
          </div>
          <div className="text-xs font-bold text-slate-800 ml-1">
            Seats: <span className="font-mono">{occupiedSeats}/{capacity}</span>{" "}
            <span className="text-[11px] font-normal text-slate-500">
              ({availableSeats} free)
            </span>
          </div>
        </div>
      </div>

      {/* Passengers in the Pool */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Assigned Passengers ({passengers.length})
          </span>
          <span className="text-xs font-extrabold text-slate-900 font-mono-num">
            Total Fare: ৳{totalFareInBDT}
          </span>
        </div>

        {passengers.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-2">
            No passengers in this pool yet. Accept requests from the radar below.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {passengers.map((p) => (
              <div
                key={p.rideId}
                className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{p.name}</span>
                  <span className="font-extrabold text-slate-900 font-mono-num">৳{p.fareInBDT}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <a href={`tel:${p.phone}`} className="hover:underline font-mono">
                    {p.phone}
                  </a>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600 pt-0.5">
                  <MapPin className="w-3 h-3 text-amber-600" />
                  <span>{p.pickupZone}</span>
                  <span className="text-slate-400">→</span>
                  <Navigation className="w-3 h-3 text-emerald-600" />
                  <span>{p.dropoffZone}</span>
                  <span className="text-slate-400 ml-auto">({p.seats} seat)</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* State Machine Transition Action Buttons */}
      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-slate-500">
          Trip Progression: <span className="font-semibold text-slate-700">{status}</span>
        </div>

        <div className="flex items-center gap-2">
          {status === "MATCHED" && (
            <button
              type="button"
              disabled={updating}
              onClick={() => handleUpdateStatus("DRIVER_ARRIVED")}
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Mark Arrived at Pickup</span>
            </button>
          )}

          {status === "DRIVER_ARRIVED" && (
            <button
              type="button"
              disabled={updating}
              onClick={() => handleUpdateStatus("STARTED")}
              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Start Trip</span>
            </button>
          )}

          {status === "STARTED" && (
            <button
              type="button"
              disabled={updating}
              onClick={() => handleUpdateStatus("COMPLETED")}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Complete Trip</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PoolManager;
