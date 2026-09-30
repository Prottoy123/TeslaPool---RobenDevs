import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import DemoPersonaBar from "./DemoPersonaBar.jsx";
import BackButton from "../../components/BackButton.jsx";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname;

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!email || !password) {
      showToast("Please enter both email and password", "warning");
      return;
    }

    try {
      setLoading(true);
      const user = await login(email, password);
      showToast(`Welcome back, ${user.fullName}!`, "success");
      
      const destination = from || (user.role === "DRIVER" ? "/driver" : "/passenger");
      navigate(destination, { replace: true });
    } catch (err) {
      showToast(err.message || "Failed to sign in", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPersona = async (persona) => {
    setEmail(persona.email);
    setPassword(persona.password);
    try {
      setLoading(true);
      const user = await login(persona.email, persona.password);
      showToast(`Logged in as ${persona.name} (${user.role})`, "success");
      const destination = user.role === "DRIVER" ? "/driver" : "/passenger";
      navigate(destination, { replace: true });
    } catch (err) {
      showToast(err.message || "Login failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto space-y-4">
        {/* Back Button */}
        <div>
          <BackButton to="/" label="Back to Home" />
        </div>

        {/* Demo Fast-Login */}
        <DemoPersonaBar onSelectPersona={handleSelectPersona} isSubmitting={loading} />

        {/* Simple, Human Login Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
          <div className="mb-6">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Sign In
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Enter your credentials to access your Dhaka Tesla Pool account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-lg bg-white border border-slate-300 px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg bg-white border border-slate-300 px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-600">
              Don't have an account?{" "}
              <Link to="/register" className="font-semibold text-amber-700 hover:underline">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
