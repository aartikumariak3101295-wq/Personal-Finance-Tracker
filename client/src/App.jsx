import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import Auth from "./Auth";
import {
  LayoutDashboard,
  ArrowLeftRight,
  ChartNoAxesCombined,
  Wallet,
  Settings,
  Bell,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingBag,
  Car,
  House,
  Utensils,
  Search,
  X,
  TrendingUp,
  LogOut,
  Trash2,
} from "lucide-react";

const API_URL = "https://personal-finance-tracker-1-u7qq.onrender.com/api/transactions";

const initialForm = () => ({
  name: "",
  amount: "",
  type: "expense",
  category: "Food & Dining",
  date: new Date().toISOString().slice(0, 10),
  payment: "UPI",
  description: "",
});

function App() {
  const [token, setToken] = useState(() =>
    localStorage.getItem("financeflow_token")
  );

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("financeflow_user")) || null;
    } catch {
      return null;
    }
  });

  const [transactions, setTransactions] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [transactionFilter, setTransactionFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [form, setForm] = useState(initialForm);

  const handleAuthSuccess = (newToken, newUser) => {
    localStorage.setItem("financeflow_token", newToken);
    localStorage.setItem("financeflow_user", JSON.stringify(newUser));
    setUser(newUser);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem("financeflow_token");
    localStorage.removeItem("financeflow_user");
    setToken(null);
    setUser(null);
    setTransactions([]);
    setLoading(false);
  };

  const fetchTransactions = useCallback(async () => {
    if (!token) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setTransactions(response.data.transactions || []);
    } catch (error) {
      console.error("Error loading transactions:", error);

      if (error.response?.status === 401) {
        handleLogout();
      } else {
        alert(
          error.response?.data?.message ||
            "Unable to load transactions. Check that backend and MongoDB are running."
        );
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    setLoading(true);
    fetchTransactions();
  }, [fetchTransactions]);

  const totalIncome = useMemo(
    () =>
      transactions
        .filter((item) => item.type === "income")
        .reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [transactions]
  );

  const totalExpenses = useMemo(
    () =>
      transactions
        .filter((item) => item.type === "expense")
        .reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [transactions]
  );

  const balance = totalIncome - totalExpenses;

  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return transactions.filter((item) => {
      const name = String(item.name || "").toLowerCase();
      const category = String(item.category || "").toLowerCase();

      const matchesSearch =
        !query || name.includes(query) || category.includes(query);

      const matchesFilter =
        transactionFilter === "all" || item.type === transactionFilter;

      return matchesSearch && matchesFilter;
    });
  }, [transactions, search, transactionFilter]);

  const addTransaction = async (event) => {
    event.preventDefault();

    if (!token) {
      alert("Please login first.");
      handleLogout();
      return;
    }

    if (
      !form.name.trim() ||
      !Number.isFinite(Number(form.amount)) ||
      Number(form.amount) <= 0
    ) {
      alert("Please enter a valid name and amount.");
      return;
    }

    setSaving(true);

    try {
      await axios.post(
        API_URL,
        {
          name: form.name.trim(),
          amount: Number(form.amount),
          type: form.type,
          category: form.category,
          date: form.date,
          payment: form.payment,
          description: form.description.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await fetchTransactions();

      setForm(initialForm());
      setShowForm(false);

      alert("Transaction saved successfully!");
    } catch (error) {
      console.error("Error saving transaction:", error);

      alert(
        error.response?.data?.message ||
          "Unable to save transaction. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteTransaction = async (id) => {
    if (!window.confirm("Are you sure you want to delete this transaction?")) {
      return;
    }

    setDeletingId(id);

    try {
      await axios.delete(`${API_URL}/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      await fetchTransactions();
    } catch (error) {
      console.error("Error deleting transaction:", error);

      alert(
        error.response?.data?.message || "Unable to delete transaction."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const formatAmount = (amount) =>
    Number(amount || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    });

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const getIcon = (transaction) => {
    if (transaction.type === "income") return Wallet;

    const category = String(transaction.category || "").toLowerCase();

    if (category.includes("transport")) return Car;
    if (category.includes("housing")) return House;
    if (category.includes("food")) return Utensils;
    if (category.includes("shopping")) return ShoppingBag;

    return Wallet;
  };

  const panel = darkMode
    ? "bg-slate-800 border-slate-700 text-slate-100"
    : "bg-white border-slate-100 text-slate-800";

  const muted = darkMode ? "text-slate-400" : "text-slate-500";

  const inputStyle = darkMode
    ? "bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
    : "bg-white border-slate-200 text-slate-800";

  if (!token) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-300 md:flex ${
        darkMode
          ? "bg-slate-950 text-white"
          : "bg-[#f7f7fc] text-slate-800"
      }`}
    >
      <style>{`
        .finance-input:focus {
          outline: 2px solid #8b5cf6;
        }

        .finance-dark select option {
          background: #1e293b;
          color: white;
        }
      `}</style>

      {/* Sidebar */}
      <aside
        className={`hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col border-r p-6 ${
          darkMode
            ? "bg-slate-900 border-slate-700"
            : "bg-white border-slate-100"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-600 text-white">
            <Wallet size={23} />
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight">
            Finance<span className="text-violet-500">Flow.</span>
          </h1>
        </div>

        <p className="mb-3 mt-12 text-xs font-bold uppercase tracking-widest text-slate-400">
          Main Menu
        </p>

        <nav className="space-y-2">
          <button
            onClick={() => {
              setTransactionFilter("all");
              setSearch("");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="flex w-full items-center gap-3 rounded-xl bg-violet-500/10 px-4 py-3 text-left text-sm font-semibold text-violet-500"
          >
            <LayoutDashboard size={19} />
            Dashboard
          </button>

          <button
            onClick={() =>
              document
                .getElementById("transactions")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold ${muted} transition hover:bg-slate-500/10`}
          >
            <ArrowLeftRight size={19} />
            Transactions
          </button>

          <button
            onClick={() =>
              document
                .getElementById("analytics")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold ${muted} transition hover:bg-slate-500/10`}
          >
            <ChartNoAxesCombined size={19} />
            Analytics
          </button>

          <button
            onClick={() =>
              alert("Budget planning will be added in the next update.")
            }
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold ${muted} transition hover:bg-slate-500/10`}
          >
            <Wallet size={19} />
            Budget
          </button>
        </nav>

        <div
          className={`mt-auto border-t pt-5 ${
            darkMode ? "border-slate-700" : "border-slate-100"
          }`}
        >
          <button
            onClick={() =>
              alert("Your account: " + (user?.email || "Signed in"))
            }
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm ${muted} hover:bg-slate-500/10`}
          >
            <Settings size={19} />
            Settings
          </button>

          <button
            onClick={handleLogout}
            className="mt-2 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-rose-500 hover:bg-rose-500/10"
          >
            <LogOut size={19} />
            Logout
          </button>

          <div className="mt-5 rounded-2xl bg-violet-500/10 p-4">
            <p className="text-sm font-bold text-violet-500">
              Save more every day!
            </p>

            <p className="mt-1 text-xs leading-5 text-violet-400">
              Keep track of your spending and reach your financial goals.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Dashboard */}
      <main className="min-w-0 flex-1 p-4 sm:p-6 md:ml-64 md:p-9">
        {/* Header */}
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-400">
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>

            <h2 className="mt-1 text-2xl font-extrabold tracking-tight md:text-3xl">
              Welcome back{user?.name ? `, ${user.name}` : ""}! 👋
            </h2>

            <p className={`mt-1 text-sm ${muted}`}>
              Here's what's happening with your money.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setDarkMode((value) => !value)}
              className={`rounded-xl border px-4 py-3 text-sm font-bold shadow-sm transition ${
                darkMode
                  ? "border-slate-600 bg-slate-800 text-yellow-400"
                  : "border-slate-100 bg-white text-slate-700"
              }`}
            >
              {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
            </button>

            <button
              onClick={() => alert("You are all caught up!")}
              aria-label="Notifications"
              className={`rounded-xl border p-3 shadow-sm ${
                darkMode
                  ? "border-slate-700 bg-slate-800 text-slate-300"
                  : "border-slate-100 bg-white text-slate-500"
              }`}
            >
              <Bell size={19} />
            </button>

            <div
              title={user?.email || "Account"}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-100 font-bold text-violet-700"
            >
              {(user?.name || user?.email || "U")
                .charAt(0)
                .toUpperCase()}
            </div>
          </div>
        </header>

        {/* Overview Heading */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-bold">Financial Overview</h3>
            <p className="mt-1 text-xs text-slate-400">
              Track your money at a glance
            </p>
          </div>

          <button
            onClick={() => {
              setForm(initialForm());
              setShowForm(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-violet-700"
          >
            <Plus size={18} />
            Add Transaction
          </button>
        </div>

        {/* Summary Cards */}
        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          <button
            type="button"
            onClick={() => {
              setTransactionFilter("all");
              setSearch("");
              document
                .getElementById("transactions")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
            className="rounded-3xl bg-gradient-to-br from-violet-700 to-indigo-600 p-6 text-left text-white shadow-lg transition hover:scale-[1.01]"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-violet-100">
                Total Balance
              </p>

              <span className="rounded-xl bg-white/15 p-3">
                <Wallet size={21} />
              </span>
            </div>

            <h3 className="mt-6 text-3xl font-extrabold">
              ₹{formatAmount(balance)}
            </h3>

            <p className="mt-3 text-xs text-violet-100">
              Your available balance
            </p>

            <div className="mt-5 flex items-center gap-2 text-xs text-violet-100">
              <TrendingUp size={15} />
              View all transactions
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setTransactionFilter("income");
              setSearch("");
              document
                .getElementById("transactions")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
            className={`rounded-3xl border p-6 text-left shadow-sm transition hover:scale-[1.01] ${panel}`}
          >
            <div className="flex items-center justify-between">
              <p className={`text-sm font-semibold ${muted}`}>
                Total Income
              </p>

              <span className="rounded-xl bg-emerald-500/10 p-3 text-emerald-500">
                <ArrowUpRight size={22} />
              </span>
            </div>

            <h3 className="mt-6 text-3xl font-extrabold">
              ₹{formatAmount(totalIncome)}
            </h3>

            <p className="mt-3 text-xs font-medium text-emerald-500">
              View income transactions
            </p>
          </button>

          <button
            type="button"
            onClick={() => {
              setTransactionFilter("expense");
              setSearch("");
              document
                .getElementById("transactions")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
            className={`rounded-3xl border p-6 text-left shadow-sm transition hover:scale-[1.01] ${panel}`}
          >
            <div className="flex items-center justify-between">
              <p className={`text-sm font-semibold ${muted}`}>
                Total Expenses
              </p>

              <span className="rounded-xl bg-rose-500/10 p-3 text-rose-500">
                <ArrowDownRight size={22} />
              </span>
            </div>

            <h3 className="mt-6 text-3xl font-extrabold">
              ₹{formatAmount(totalExpenses)}
            </h3>

            <p className="mt-3 text-xs font-medium text-rose-500">
              View expense transactions
            </p>
          </button>
        </section>

        {/* Analytics */}
        <section
          id="analytics"
          className="mt-7 grid gap-6 xl:grid-cols-3"
        >
          {/* Spending Overview */}
          <div
            className={`rounded-3xl border p-6 shadow-sm xl:col-span-2 ${panel}`}
          >
            <h3 className="font-bold">Spending Overview</h3>

            <p className="mt-1 text-xs text-slate-400">
              Monthly financial activity based on saved expenses
            </p>

            <div
              className={`mt-8 flex h-48 items-end justify-between gap-2 border-b pb-2 ${
                darkMode ? "border-slate-700" : "border-slate-100"
              }`}
            >
              {Array.from({ length: 12 }, (_, index) => {
                const month = new Date().getMonth() - 11 + index;

                const date = new Date(
                  new Date().getFullYear(),
                  month,
                  1
                );

                const monthTotal = transactions
                  .filter((item) => {
                    const itemDate = new Date(item.date);

                    return (
                      item.type === "expense" &&
                      itemDate.getMonth() === date.getMonth() &&
                      itemDate.getFullYear() === date.getFullYear()
                    );
                  })
                  .reduce(
                    (sum, item) => sum + Number(item.amount || 0),
                    0
                  );

                const maxTotal = Math.max(
                  1,
                  ...Array.from({ length: 12 }, (_, i) => {
                    const d = new Date(
                      new Date().getFullYear(),
                      new Date().getMonth() - 11 + i,
                      1
                    );

                    return transactions
                      .filter((item) => {
                        const itemDate = new Date(item.date);

                        return (
                          item.type === "expense" &&
                          itemDate.getMonth() === d.getMonth() &&
                          itemDate.getFullYear() === d.getFullYear()
                        );
                      })
                      .reduce(
                        (sum, item) => sum + Number(item.amount || 0),
                        0
                      );
                  })
                );

                const height =
                  monthTotal === 0
                    ? 3
                    : Math.max(8, (monthTotal / maxTotal) * 100);

                return (
                  <div
                    key={`${date.getFullYear()}-${date.getMonth()}`}
                    className="flex h-full flex-1 items-end"
                  >
                    <div
                      title={`${date.toLocaleDateString("en-IN", {
                        month: "short",
                        year: "numeric",
                      })}: ₹${formatAmount(monthTotal)}`}
                      className={`w-full rounded-t-lg transition hover:opacity-70 ${
                        darkMode ? "bg-violet-400/60" : "bg-violet-400"
                      }`}
                      style={{ height: `${height}%` }}
                    />
                  </div>
                );
              })}
            </div>

            <div className="mt-3 flex justify-between text-xs text-slate-400">
              <span>12 months ago</span>
              <span>Recent months</span>
              <span>This month</span>
            </div>
          </div>

          {/* Expense Categories */}
          <div className={`rounded-3xl border p-6 shadow-sm ${panel}`}>
            <h3 className="font-bold">Expense Categories</h3>

            <p className="mt-1 text-xs text-slate-400">
              Your saved expense breakdown
            </p>

            {(() => {
              const expensesByCategory = transactions
                .filter((item) => item.type === "expense")
                .reduce((result, item) => {
                  const category = item.category || "Other";

                  result[category] =
                    (result[category] || 0) +
                    Number(item.amount || 0);

                  return result;
                }, {});

              const entries = Object.entries(
                expensesByCategory
              ).sort((a, b) => b[1] - a[1]);

              const colors = [
                "bg-violet-600",
                "bg-amber-500",
                "bg-teal-600",
                "bg-pink-400",
                "bg-sky-500",
                "bg-orange-500",
              ];

              const total = entries.reduce(
                (sum, [, amount]) => sum + amount,
                0
              );

              return (
                <>
                  <div
                    className="mx-auto my-7 flex h-40 w-40 items-center justify-center rounded-full"
                    style={{
                      background:
                        total > 0
                          ? `conic-gradient(${entries
                              .map(([, amount], index) => {
                                const start =
                                  (entries
                                    .slice(0, index)
                                    .reduce(
                                      (sum, entry) => sum + entry[1],
                                      0
                                    ) /
                                    total) *
                                  100;

                                const end =
                                  start + (amount / total) * 100;

                                const palette = [
                                  "#7c3aed",
                                  "#f59e0b",
                                  "#0d9488",
                                  "#f472b6",
                                  "#0ea5e9",
                                  "#f97316",
                                ];

                                return `${palette[index % palette.length]} ${start}% ${end}%`;
                              })
                              .join(", ")})`
                          : darkMode
                            ? "#334155"
                            : "#e2e8f0",
                    }}
                  >
                    <div
                      className={`flex h-24 w-24 flex-col items-center justify-center rounded-full ${
                        darkMode ? "bg-slate-800" : "bg-white"
                      }`}
                    >
                      <span className="text-xs text-slate-400">
                        Expenses
                      </span>

                      <strong className="text-lg">
                        ₹{formatAmount(total)}
                      </strong>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    {entries.length === 0 ? (
                      <p className="text-center text-xs text-slate-400">
                        No expense data yet.
                      </p>
                    ) : (
                      entries.slice(0, 6).map(([name, amount], index) => (
                        <div
                          key={name}
                          className="flex items-center justify-between gap-2"
                        >
                          <span
                            className={`flex min-w-0 items-center gap-2 ${muted}`}
                          >
                            <span
                              className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                                colors[index % colors.length]
                              }`}
                            />

                            <span className="truncate">{name}</span>
                          </span>

                          <strong>
                            {total
                              ? `${Math.round((amount / total) * 100)}%`
                              : "0%"}
                          </strong>
                        </div>
                      ))
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </section>

        {/* Transactions */}
        <section
          id="transactions"
          className={`mt-7 scroll-mt-6 rounded-3xl border p-5 shadow-sm sm:p-6 ${panel}`}
        >
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-bold">Recent Transactions</h3>

              <p className="mt-1 text-xs text-slate-400">
                Your latest financial activities
              </p>
            </div>

            <div
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${
                darkMode ? "border-slate-600" : "border-slate-200"
              }`}
            >
              <Search size={16} className="text-slate-400" />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search..."
                className={`w-28 bg-transparent text-sm outline-none sm:w-36 ${muted}`}
              />
            </div>
          </div>

          {/* Transaction Filters */}
          <div className="mb-5 flex flex-wrap gap-2">
            {[
              ["all", "All"],
              ["income", "Income"],
              ["expense", "Expenses"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setTransactionFilter(value)}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                  transactionFilter === value
                    ? "bg-violet-600 text-white"
                    : "bg-slate-500/10 text-slate-500 hover:bg-violet-500/10"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Transaction List */}
          <div className="space-y-1">
            {loading ? (
              <p className="py-8 text-center text-sm text-slate-400">
                Loading transactions...
              </p>
            ) : (
              filteredTransactions.map((item) => {
                const Icon = getIcon(item);
                const income = item.type === "income";

                return (
                  <div
                    key={item._id}
                    className="flex items-center justify-between gap-3 rounded-2xl p-3 transition hover:bg-violet-500/10"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={`rounded-xl p-3 ${
                          income
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "bg-violet-500/10 text-violet-500"
                        }`}
                      >
                        <Icon size={19} />
                      </span>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold">
                          {item.name}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {item.category} · {formatDate(item.date)} ·{" "}
                          {item.payment || "UPI"}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      <strong
                        className={`whitespace-nowrap text-sm ${
                          income
                            ? "text-emerald-500"
                            : darkMode
                              ? "text-slate-200"
                              : "text-slate-700"
                        }`}
                      >
                        {income ? "+" : "-"}₹{formatAmount(item.amount)}
                      </strong>

                      <button
                        type="button"
                        onClick={() => deleteTransaction(item._id)}
                        disabled={deletingId === item._id}
                        title="Delete transaction"
                        aria-label="Delete transaction"
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-500 disabled:opacity-50"
                      >
                        {deletingId === item._id ? (
                          "..."
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}

            {!loading && filteredTransactions.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-400">
                No transactions found. Add your first transaction!
              </p>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-8 pb-4 text-center text-xs text-slate-400">
          © 2026 FinanceFlow. Manage your money with confidence.
        </footer>
      </main>

      {/* Add Transaction Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div
            className={`max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border p-6 shadow-2xl ${panel}`}
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold">
                  Add Transaction
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Enter your transaction details
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl bg-slate-500/10 p-2 text-slate-400 hover:bg-slate-500/20"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={addTransaction} className="space-y-4">
              {/* Transaction Type */}
              <div>
                <label className="mb-1 block text-sm font-semibold">
                  Transaction Type
                </label>

                <select
                  value={form.type}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      type: event.target.value,
                      category:
                        event.target.value === "income"
                          ? "Salary"
                          : "Food & Dining",
                    })
                  }
                  className={`w-full rounded-xl border p-3 outline-none focus:border-violet-500 ${inputStyle}`}
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>

              {/* Name */}
              <div>
                <label className="mb-1 block text-sm font-semibold">
                  Name / Source
                </label>

                <input
                  required
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  placeholder="e.g. Grocery Shopping or Salary"
                  className={`w-full rounded-xl border p-3 outline-none focus:border-violet-500 ${inputStyle}`}
                />
              </div>

              {/* Amount */}
              <div>
                <label className="mb-1 block text-sm font-semibold">
                  Amount (₹)
                </label>

                <input
                  required
                  min="1"
                  step="0.01"
                  type="number"
                  value={form.amount}
                  onChange={(event) =>
                    setForm({ ...form, amount: event.target.value })
                  }
                  placeholder="Enter amount"
                  className={`w-full rounded-xl border p-3 outline-none focus:border-violet-500 ${inputStyle}`}
                />
              </div>

              {/* Category */}
              <div>
                <label className="mb-1 block text-sm font-semibold">
                  Category
                </label>

                <select
                  value={form.category}
                  onChange={(event) =>
                    setForm({ ...form, category: event.target.value })
                  }
                  className={`w-full rounded-xl border p-3 outline-none focus:border-violet-500 ${inputStyle}`}
                >
                  {(form.type === "income"
                    ? [
                        "Salary",
                        "Freelance",
                        "Business",
                        "Investment",
                        "Other Income",
                      ]
                    : [
                        "Food & Dining",
                        "Shopping",
                        "Transport",
                        "Housing",
                        "Education",
                        "Health",
                        "Entertainment",
                        "Other",
                      ]
                  ).map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date and Payment */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-semibold">
                    Date
                  </label>

                  <input
                    required
                    type="date"
                    value={form.date}
                    onChange={(event) =>
                      setForm({ ...form, date: event.target.value })
                    }
                    className={`w-full rounded-xl border p-3 text-sm outline-none focus:border-violet-500 ${inputStyle}`}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold">
                    Payment Method
                  </label>

                  <select
                    value={form.payment}
                    onChange={(event) =>
                      setForm({ ...form, payment: event.target.value })
                    }
                    className={`w-full rounded-xl border p-3 text-sm outline-none focus:border-violet-500 ${inputStyle}`}
                  >
                    {[
                      "UPI",
                      "Cash",
                      "Debit Card",
                      "Credit Card",
                      "Net Banking",
                    ].map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="mb-1 block text-sm font-semibold">
                  Description (Optional)
                </label>

                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      description: event.target.value,
                    })
                  }
                  placeholder="Add a note..."
                  className={`w-full rounded-xl border p-3 outline-none focus:border-violet-500 ${inputStyle}`}
                />
              </div>

              {/* Form Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className={`w-1/2 rounded-xl border py-3 text-sm font-bold ${
                    darkMode
                      ? "border-slate-600 text-slate-300 hover:bg-slate-700"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-1/2 rounded-xl bg-violet-600 py-3 text-sm font-bold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : form.type === "income"
                      ? "Add Income"
                      : "Add Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
