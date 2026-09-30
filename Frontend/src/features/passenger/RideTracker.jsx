import React, { useState, useEffect, useCallback } from "react";
import api from "../../services/api.js";
import { useToast } from "../../context/ToastContext.jsx";
import { Car, Clock, MapPin, Navigation, RefreshCw, XCircle, CheckCircle2, AlertCircle } from "lucide-react";

const LIFECYCLE_STEPS = [
  { key: "WAITING", label: "Waiting", description: "Finding a Tesla nearby" },
  { key: "MATCHED", label: "Matched", description: "Driver assigned" },
  { key: "DRIVER_ARRIVED", label: "Arrived", description: "Tesla at pickup zone" },
  { key: "IN_PROGRESS", label: "In Trip", description: "En route to destination" },
  { key: "COMPLETED", label: "Completed", description: "Arrived at destination" },
];

const RideTracker = ({ initialRide, onRideClosed }) => {
  const [ride, setRide] = useState(initialRide);
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const { showToast } = useToast();

  const fetchRideStatus = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/passenger/ride/status");
      if (res.data) {
        setRide(res.data);
      } else {
        setRide(null);
      }
    } catch (err) {
      console.warn("Failed to update status:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll every 3.5 seconds while ride is in progress
  useEffect(() => {
    if (!ride || ride.status === "COMPLETED" || ride.status === "CANCELLED") {
      return;
    }

    const interval = setInterval(fetchRideStatus, 3500);
    return () => clearInterval(interval);
  }, [ride, fetchRideStatus]);

  const handleCancelRide = async () => {
    if (!ride) return;
    if (!window.confirm("Are you sure you want to cancel this ride request?")) return;

    try {
      setCancelling(true);
      await api.patch("/passenger/ride/cancel", { requestId: ride.id });
      showToast("Ride request cancelled successfully", "info");
      await fetchRideStatus();
    } catch (err) {
      showToast(err.message || "Failed to cancel ride", "error");
    } finally {
      setCancelling(false);
    }
  };

  if (!ride) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-xs space-y-3">
        <p className="text-sm text-slate-600">No active ride in progress.</p>
        <button
          type="button"
          onClick={onRideClosed}
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          Book a Ride
        </button>
      </div>
    );
  }

  const currentStep = ride.lifecycleStatus || ride.status;
  const isCancellable = currentStep === "WAITING" || currentStep === "MATCHED" || currentStep === "DRIVER_ARRIVED";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-7 shadow-xs space-y-6">
      {/* Header & Status Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">Live Journey Tracking</h2>
            <span
              className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                currentStep === "COMPLETED"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : currentStep === "CANCELLED"
                  ? "bg-rose-50 text-rose-800 border-rose-200"
                  : currentStep === "IN_PROGRESS"
                  ? "bg-sky-50 text-sky-800 border-sky-200"
                  : "bg-amber-50 text-amber-800 border-amber-200"
              }`}
            >
              {currentStep}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict Identity Isolation Active — only your fare & journey are visible.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchRideStatus}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Lifecycle Progress Bar */}
      {currentStep !== "CANCELLED" ? (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {LIFECYCLE_STEPS.map((step, idx) => {
            const stepOrder = LIFECYCLE_STEPS.findIndex((s) => s.key === currentStep);
            const isPassed = stepOrder >= idx;
            const isCurrent = step.key === currentStep;

            return (
              <div
                key={step.key}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  isCurrent
                    ? "bg-amber-50 border-amber-300 shadow-xs"
                    : isPassed
                    ? "bg-slate-50 border-slate-200"
                    : "bg-white border-slate-100 opacity-50"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isCurrent
                        ? "bg-amber-600 animate-ping"
                        : isPassed
                        ? "bg-emerald-600"
                        : "bg-slate-300"
                    }`}
                  />
                  <span
                    className={`text-xs font-bold ${
                      isCurrent
                        ? "text-amber-900"
                        : isPassed
                        ? "text-slate-800"
                        : "text-slate-400"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 line-clamp-1">{step.description}</p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-900 text-xs font-medium">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>This ride was cancelled. Seat capacity was released back to the pool.</span>
        </div>
      )}

      {/* Trip & Route Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Route Card */}
        <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/70 space-y-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Route & Seats
          </span>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <span className="text-slate-500">Pickup: </span>
                <span className="font-bold text-slate-900">{ride.pickupZone}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <span className="text-slate-500">Destination: </span>
                <span className="font-bold text-slate-900">{ride.dropoffZone}</span>
              </div>
            </div>
            <div className="pt-1 text-slate-600">
              Seats Booked: <span className="font-bold text-slate-900">{ride.seatsRequested}</span>
            </div>
          </div>
        </div>

        {/* Fare & Driver Card */}
        <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/70 space-y-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Assigned Tesla & Fare
          </span>
          <div className="space-y-2 text-xs">
            <div>
              <span className="text-slate-500">Your Fare: </span>
              <span className="font-bold text-slate-900 font-mono-num text-sm">
                ৳{ride.fareInBDT}{" "}
                <span className="text-[11px] font-normal text-slate-500">
                  ({ride.fareInPoysha?.toLocaleString()} poysha)
                </span>
              </span>
            </div>

            {ride.driver ? (
              <div className="pt-1 space-y-1 border-t border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500">Driver: </span>
                  <span className="font-semibold text-slate-900">{ride.driver.name}</span>
                </div>
                <div>
                  <span className="text-slate-500">Tesla Plate: </span>
                  <span className="font-mono font-semibold text-slate-900">
                    {ride.driver.licensePlate}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Tesla Location: </span>
                  <span className="font-semibold text-slate-900">{ride.driver.currentZone}</span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-amber-700 pt-1">
                Searching for Jashim's Bullet around Banani Road 11...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        {isCancellable ? (
          <button
            type="button"
            onClick={handleCancelRide}
            disabled={cancelling}
            className="px-4 py-2 rounded-lg border border-rose-300 bg-white hover:bg-rose-50 text-rose-700 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            <XCircle className="w-4 h-4 text-rose-600" />
            <span>{cancelling ? "Cancelling..." : "Cancel Ride"}</span>
          </button>
        ) : (
          <span className="text-xs text-slate-400">
            {currentStep === "IN_PROGRESS"
              ? "Trip started — cancellation is locked for passenger safety."
              : ""}
          </span>
        )}

        {(currentStep === "COMPLETED" || currentStep === "CANCELLED") && (
          <button
            type="button"
            onClick={onRideClosed}
            className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs cursor-pointer ml-auto"
          >
            Book Another Ride
          </button>
        )}
      </div>
    </div>
  );
};

export default RideTracker;
