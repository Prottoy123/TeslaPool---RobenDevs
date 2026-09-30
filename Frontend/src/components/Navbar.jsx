import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { Zap, LogOut } from "lucide-react";

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 group-hover:scale-105 transition-transform">
            <Zap className="w-4 h-4 fill-amber-500 text-amber-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-slate-900">Dhaka Tesla Pool</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                3-Seat
              </span>
            </div>
            <p className="text-[11px] text-slate-500 -mt-0.5 font-medium hidden sm:block">
              Share a seat. Split the fare.
            </p>
          </div>
        </Link>

        {/* Navigation & User actions */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              {/* Role-specific Nav Links */}
              <nav className="flex items-center gap-1 sm:gap-2 mr-2">
                {user?.role === "PASSENGER" && (
                  <>
                    <Link
                      to="/passenger"
                      className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                        location.pathname === "/passenger"
                          ? "bg-slate-100 text-slate-900 font-semibold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      Book & Track
                    </Link>
                    <Link
                      to="/passenger/history"
                      className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                        location.pathname === "/passenger/history"
                          ? "bg-slate-100 text-slate-900 font-semibold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      History
                    </Link>
                  </>
                )}

                {user?.role === "DRIVER" && (
                  <>
                    <Link
                      to="/driver"
                      className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                        location.pathname === "/driver"
                          ? "bg-slate-100 text-slate-900 font-semibold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      Pool Radar
                    </Link>
                    <Link
                      to="/driver/history"
                      className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                        location.pathname === "/driver/history"
                          ? "bg-slate-100 text-slate-900 font-semibold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      Earnings
                    </Link>
                  </>
                )}
              </nav>

              {/* User badge */}
              <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200">
                <div className="hidden md:flex flex-col text-right">
                  <span className="text-xs font-semibold text-slate-800">{user?.fullName}</span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {user?.role === "DRIVER" ? "Tesla Driver" : "Passenger"}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3.5 py-1.5 text-xs sm:text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
