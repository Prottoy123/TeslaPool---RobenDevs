import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import DemoPersonaBar from "../auth/DemoPersonaBar.jsx";
import { Zap, Shield, MapPin, Users, ArrowRight } from "lucide-react";

const Home = () => {
  const { isAuthenticated, user, login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSelectPersona = async (persona) => {
    try {
      const loggedUser = await login(persona.email, persona.password);
      showToast(`Signed in as ${persona.name} (${loggedUser.role})`, "success");
      navigate(loggedUser.role === "DRIVER" ? "/driver" : "/passenger");
    } catch (err) {
      showToast(err.message || "Login failed", "error");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-200 bg-amber-50 text-amber-900 text-xs font-semibold">
          <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
          <span>Banani Road 11 Rush Hour Demo</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
          Share a seat. Split the fare. <br />
          <span className="text-amber-600">Survive Dhaka traffic.</span>
        </h1>

        <p className="text-base text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
          8:41 AM at Banani Road 11. Jashim's 3-seat electric Tesla <span className="font-semibold text-slate-900">Bullet</span> is 
          ready. Nusrat, Rafiq, and Shirin can share the route to Mohakhali & Gulshan without exceeding capacity.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {isAuthenticated ? (
            <Link
              to={user?.role === "DRIVER" ? "/driver" : "/passenger"}
              className="px-5 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <span>Go to {user?.role === "DRIVER" ? "Driver Console" : "Passenger Dashboard"}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="px-5 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/register"
                className="px-5 py-2.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-sm shadow-xs transition-colors cursor-pointer"
              >
                Create Account
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Story Cast Fast Sign-in */}
      <div className="max-w-4xl mx-auto">
        <DemoPersonaBar onSelectPersona={handleSelectPersona} isSubmitting={false} />
      </div>

      {/* Architecture Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto pt-4">
        <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
            <Users className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-slate-900">Fixed 3-Seat Mutex Lock</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Bullet never overbooks. Native PostgreSQL row locking (<code className="text-amber-700 bg-amber-50 px-1 py-0.5 rounded">SELECT ... FOR UPDATE</code>) guarantees exactly 3 seats under concurrent rush-hour demand.
          </p>
        </div>

        <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
            <MapPin className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-slate-900">8-Zone Dhaka Corridor</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Pure in-memory BFS shortest path graph for Banani, Gulshan, Mohakhali, and Dhanmondi. Zero external Google Maps dependencies.
          </p>
        </div>

        <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700">
            <Shield className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-slate-900">Integer Poysha Pricing</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            All fares stored in integer poysha (1 BDT = 100 poysha). Nusrat and Rafiq pay 60 BDT (6,000 poysha) with zero floating-point precision errors.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
