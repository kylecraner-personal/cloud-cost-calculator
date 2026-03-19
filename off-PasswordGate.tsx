import { useState } from "react";
import { Calculator, Lock } from "lucide-react";

// ============================================================
// PASSWORD CONFIGURATION
// Change this to whatever password you want for your team.
// This is a simple client-side gate — not meant for
// protecting highly sensitive data, but it keeps casual
// visitors out.
// ============================================================
const SITE_PASSWORD = "mdrn2024";

const SESSION_KEY = "cost_calc_authenticated";

export default function PasswordGate({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem(SESSION_KEY) === "true";
  });
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password === SITE_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "true");
      setIsAuthenticated(true);
      setError(false);
    } else {
      setError(true);
    }
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Calculator className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">
            Cloud Cost Calculator
          </h1>
        </div>

        <p className="text-gray-600 text-sm text-center mb-6">
          Enter the password to access the calculator.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              placeholder="Enter password"
              autoFocus
              className={[
                "w-full pl-10 pr-4 py-3 rounded-lg border text-sm",
                "focus:outline-none focus:ring-2 focus:ring-blue-500",
                error
                  ? "border-red-300 bg-red-50"
                  : "border-gray-200 bg-white",
              ].join(" ")}
            />
          </div>

          {error && (
            <p className="text-red-600 text-xs mt-2">
              Incorrect password. Please try again.
            </p>
          )}

          <button
            type="submit"
            className="w-full mt-4 bg-blue-600 text-white py-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Access Calculator
          </button>
        </form>
      </div>
    </div>
  );
}
