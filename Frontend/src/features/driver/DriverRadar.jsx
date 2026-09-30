import React, { useState } from "react";
import api from "../../services/api.js";
import { useToast } from "../../context/ToastContext.jsx";
import { MapPin, Navigation, Users, Check, RefreshCw, AlertTriangle, Phone } from "lucide-react";

const DriverRadar = ({
  pendingRequests = [],
  activePoolId = null,
  availableSeats = 3,
  isOnline = true,
  loading = false,
  onRideAccepted,
  onRefresh,
}) => {
  const [acceptingId, setAcceptingId] = useState(null);
  const { showToast } = useToast();

  const handleAccept = async (requestItem) => {
    if (!isOnline) {
      showToast("You are currently offline. Please set your Tesla online to accept rides.", "warning");
      return;
    }

    if (requestItem.seatsRequested > availableSeats) {
      showToast(`Cannot accept: Requires ${requestItem.seatsRequested} seats, but only ${availableSeats} available.`, "warning");
      return;
    }

    try {
      setAcceptingId(requestItem.id);
      await api.post("/driver/pool/accept", {
        rideRequestId: requestItem.id,
        poolId: activePoolId,
      });

      showToast(`Accepted ${requestItem.passenger?.fullName || "passenger"} into your Tesla pool!`, "success");
      if (onRideAccepted) {
        onRideAccepted();
      }
    } catch (err) {
      // The Concurrency UI Catch is automatically triggered if err.status === 409
      showToast(err.message || "Failed to accept ride request", "error");
    } finally {
      setAcceptingId(null);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-7 shadow-xs space-y-5">
      {/* Radar Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Passenger Radar (Waiting Requests)</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time feed of passengers requesting rides along your corridor.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Radar</span>
        </button>
      </div>

      {/* Offline Alert */}
      {!isOnline && (
        <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>You are currently offline. Go online to accept incoming passenger requests.</span>
        </div>
      )}

      {/* Requests List */}
      {loading && pendingRequests.length === 0 ? (
        <div className="py-12 text-center">
          <div className="w-6 h-6 border-2 border-slate-800 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-slate-500">Scanning Dhaka zones for passenger requests...</p>
        </div>
      ) : pendingRequests.length === 0 ? (
        <div className="py-10 text-center space-y-1">
          <p className="text-sm font-semibold text-slate-700">No pending requests right now</p>
          <p className="text-xs text-slate-500">
            Waiting for passengers along Banani Road 11 to book rides.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendingRequests.map((reqItem) => {
            const hasEnoughSeats = reqItem.seatsRequested <= availableSeats;
            const isAccepting = acceptingId === reqItem.id;

            return (
              <div
                key={reqItem.id}
                className="rounded-lg border border-slate-200 bg-slate-50/60 p-4 hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                {/* Passenger Info & Route */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">
                      {reqItem.passenger?.fullName || "Passenger"}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {reqItem.passenger?.phone}
                    </span>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                      {reqItem.seatsRequested} {reqItem.seatsRequested === 1 ? "seat" : "seats"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <MapPin className="w-3.5 h-3.5 text-amber-600" />
                    <span>{reqItem.pickupZone}</span>
                    <span className="text-slate-400">→</span>
                    <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{reqItem.dropoffZone}</span>
                  </div>

                  {reqItem.compatibility && (
                    <p className="text-[11px] text-slate-500">
                      Route check:{" "}
                      <span className="text-emerald-700 font-medium">
                        {reqItem.compatibility.reason || "Compatible with trip corridor"}
                      </span>
                    </p>
                  )}
                </div>

                {/* Fare & Accept Action */}
                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200/60">
                  <div className="text-left sm:text-right">
                    <div className="text-sm font-extrabold text-slate-900 font-mono-num">
                      ৳{reqItem.fareInBDT}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {reqItem.fareInPoysha?.toLocaleString()} poysha
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={!isOnline || !hasEnoughSeats || isAccepting}
                    onClick={() => handleAccept(reqItem)}
                    className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isAccepting ? "Accepting..." : "Accept"}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DriverRadar;
