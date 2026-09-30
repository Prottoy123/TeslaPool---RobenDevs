import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import BackButton from "../../components/BackButton.jsx";

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    role: "PASSENGER",
    licensePlate: "",
  });
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.fullName || !formData.email || !formData.phone || !formData.password || !formData.role) {
      showToast("Please fill in all required fields", "warning");
      return;
    }

    try {
      setLoading(true);
      const user = await register(formData);
      showToast(`Account created successfully! Welcome, ${user.fullName}.`, "success");
      navigate(user.role === "DRIVER" ? "/driver" : "/passenger", { replace: true });
    } catch (err) {
      showToast(err.message || "Registration failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto space-y-4">
        {/* Back Button */}
        <div>
          <BackButton to="/login" label="Back to Login" />
        </div>

        {/* Clean, Simple Sign-up Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
          <div className="mb-6">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Create an Account
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Join the Banani rush-hour pool network in Dhaka.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Simple Role Toggle */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Registering As
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, role: "PASSENGER" }))}
                  className={`py-1.5 px-3 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    formData.role === "PASSENGER"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Passenger
                </button>
                <button
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, role: "DRIVER" }))}
                  className={`py-1.5 px-3 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    formData.role === "DRIVER"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Tesla Driver
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="e.g. Nusrat Jahan"
                className="w-full rounded-lg bg-white border border-slate-300 px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="name@example.com"
                className="w-full rounded-lg bg-white border border-slate-300 px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                required
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="01712345678"
                className="w-full rounded-lg bg-white border border-slate-300 px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Minimum 6 characters"
                className="w-full rounded-lg bg-white border border-slate-300 px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-colors"
              />
            </div>

            {formData.role === "DRIVER" && (
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tesla License Plate (Optional)
                </label>
                <input
                  type="text"
                  name="licensePlate"
                  value={formData.licensePlate}
                  onChange={handleChange}
                  placeholder="DHAKA-METRO-TE-1101"
                  className="w-full rounded-lg bg-white border border-slate-300 px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-colors font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Bullet's fixed 3-seat electric Tesla capacity is assigned automatically.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-600">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold text-amber-700 hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
