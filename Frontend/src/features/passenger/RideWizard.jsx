import React, { useState, useEffect } from "react";
import api from "../../services/api.js";
import { useToast } from "../../context/ToastContext.jsx";
import { MapPin, Navigation, Users, ArrowRight, ShieldCheck, Zap } from "lucide-react";

const DHAKA_ZONES = [
  "Banani",
  "Gulshan",
  "Mohakhali",
  "Farmgate",
  "Dhanmondi",
  "Mirpur",
  "Uttara",
  "Bashundhara",
];

const RideWizard = ({ onRequestSuccess }) => {
  const [zones, setZones] = useState(DHAKA_ZONES);
  const [pickupZone, setPickupZone] = useState("Banani");
  const [dropoffZone, setDropoffZone] = useState("Mohakhali");
  const [seatsRequested, setSeatsRequested] = useState(1);

  const [estimate, setEstimate] = useState(null);
  const [loadingEstimate, setLoadingEstimate] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { showToast } = useToast();

  // Load available zones from backend API
  useEffect(() => {
    const fetchZones = async () => {
      try {
        const res = await api.get("/passenger/zones");
        if (res.data?.zones?.length) {
          setZones(res.data.zones);
        }
      } catch (err) {
        console.warn("Using fallback Dhaka zones:", err.message);
      }
    };
    fetchZones();
  }, []);

  // Recalculate dynamic fare estimate whenever inputs change
  useEffect(() => {
    if (!pickupZone || !dropoffZone || pickupZone === dropoffZone) {
      setEstimate(null);
      return;
    }

    let isMounted = true;
    const fetchEstimate = async () => {
      setLoadingEstimate(true);
      try {
        const res = await api.get(
          `/passenger/ride/estimate-fare?pickupZone=${pickupZone}&dropoffZone=${dropoffZone}&seatsRequested=${seatsRequested}`
        );
        if (isMounted && res.data) {
          setEstimate(res.data);
        }
      } catch (err) {
        if (isMounted) {
          setEstimate(null);
          showToast(err.message || "Failed to calculate fare estimate", "warning");
        }
      } finally {
        if (isMounted) setLoadingEstimate(false);
      }
    };

    const timer = setTimeout(fetchEstimate, 250);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [pickupZone, dropoffZone, seatsRequested, showToast]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (pickupZone === dropoffZone) {
      showToast("Pickup and destination zones must be different", "warning");
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post("/passenger/ride/request", {
        pickupZone,
        dropoffZone,
        seatsRequested,
      });

      showToast(
        "Ride requested successfully! Waiting for Jashim to accept.",
        "success"
      );
      if (onRequestSuccess) {
        onRequestSuccess(res.data);
      }
    } catch (err) {
      showToast(err.message || "Failed to request ride", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-7 shadow-xs space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-lg font-bold tracking-tight text-slate-900">
          Request a Tesla Pool Ride
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Select your route along Dhaka's active zones. Up to 3 seats per Tesla.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Route Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-600" />
              <span>Pickup Zone</span>
            </label>
            <select
              value={pickupZone}
              onChange={(e) => setPickupZone(e.target.value)}
              className="w-full rounded-lg bg-white border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-colors"
            >
              {zones.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-emerald-600" />
              <span>Destination Zone</span>
            </label>
            <select
              value={dropoffZone}
              onChange={(e) => setDropoffZone(e.target.value)}
              className="w-full rounded-lg bg-white border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-colors"
            >
              {zones.map((zone) => (
                <option key={zone} value={zone} disabled={zone === pickupZone}>
                  {zone} {zone === pickupZone ? "(Same as pickup)" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Seat Count Selector (1-3) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-600" />
            <span>Seats Needed (Max 3 in Bullet)</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setSeatsRequested(num)}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  seatsRequested === num
                    ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                }`}
              >
                {num} {num === 1 ? "Seat (Solo)" : "Seats"}
              </button>
            ))}
          </div>
        </div>

        {/* Live Fare Estimation Card */}
        {pickupZone !== dropoffZone && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Estimated Ride Fare
              </span>
              {loadingEstimate ? (
                <span className="text-xs text-slate-400 animate-pulse">Calculating...</span>
              ) : estimate ? (
                <span className="text-base font-extrabold text-slate-900 font-mono-num">
                  ৳{estimate.fareInBDT}{" "}
                  <span className="text-xs font-normal text-slate-500">
                    ({estimate.fareInPoysha?.toLocaleString()} poysha)
                  </span>
                </span>
              ) : null}
            </div>

            {estimate && (
              <div className="text-[11px] text-slate-600 space-y-1 pt-1 border-t border-slate-200/60">
                <div className="flex justify-between">
                  <span>Hops & Route:</span>
                  <span className="font-semibold text-slate-800">
                    {estimate.shortestPath?.join(" → ")} ({estimate.hops} hop{estimate.hops > 1 ? "s" : ""})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Pool Sharing Discount:</span>
                  <span className="font-semibold text-emerald-700">
                    -৳{(estimate.breakdown?.poolDiscountInPoysha / 100).toFixed(2)} applied
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting || pickupZone === dropoffZone}
          className="w-full py-3 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-colors shadow-xs disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
        >
          {submitting ? (
            "Booking your seat..."
          ) : (
            <>
              <span>Request Ride</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default RideWizard;
