
import { useState } from "react";
import axios from "axios";
import { Wallet, Mail, Lock, User, Eye, EyeOff } from "lucide-react";

const AUTH_URL = "http://localhost:5000/api/auth";

function Auth({ onAuthSuccess }) {
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (isSignup && !form.name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const endpoint = isSignup ? "/signup" : "/login";

      const response = await axios.post(`${AUTH_URL}${endpoint}`, {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      if (response.data.success && response.data.token) {
        onAuthSuccess(response.data.token, response.data.user);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to connect. Please check the backend."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f7fc] p-5">
      <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-7 shadow-xl sm:p-9">

        <div className="mb-7 flex flex-col items-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-lg">
            <Wallet size={32} />
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">
            Finance<span className="text-violet-600">Flow.</span>
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            PERSONAL FINANCE MANAGER
          </p>
        </div>

        <div className="mb-7 text-center">
          <h2 className="text-2xl font-bold text-slate-800">
            {isSignup ? "Create your account" : "Welcome back!"}
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            {isSignup
              ? "Start managing your money smarter."
              : "Login to access your financial dashboard."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {isSignup && (
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Full Name
              </label>

              <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4">
                <User size={18} className="text-slate-400" />
                <input
                  required
                  type="text"
                  placeholder="Enter your name"
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  className="w-full py-3 outline-none text-slate-800"
                />
              </div>
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Email Address
            </label>

            <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4">
              <Mail size={18} className="text-slate-400" />
              <input
                required
                type="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
                className="w-full py-3 outline-none text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Password
            </label>

            <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4">
              <Lock size={18} className="text-slate-400" />

              <input
                required
                minLength={6}
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
                className="w-full py-3 outline-none text-slate-800"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-violet-600 py-3.5 font-bold text-white shadow-lg transition hover:bg-violet-700 disabled:opacity-60"
          >
            {loading
              ? "Please wait..."
              : isSignup
                ? "Create Account"
                : "Login"}
          </button>
        </form>

        <div className="mt-7 text-center text-sm text-slate-500">
          {isSignup
            ? "Already have an account?"
            : "Don't have an account?"}

          <button
            type="button"
            onClick={() => {
              setIsSignup(!isSignup);
              setError("");
            }}
            className="ml-2 font-bold text-violet-600 hover:text-violet-800"
          >
            {isSignup ? "Login" : "Sign Up"}
          </button>
        </div>

        <p className="mt-7 text-center text-xs text-slate-400">
          © 2026 FinanceFlow. Secure Personal Finance Management.
        </p>
      </div>
    </div>
  );
}

export default Auth;
