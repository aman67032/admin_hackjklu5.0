"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AlertTriangle, Zap } from "lucide-react";
import { authApi } from "@/lib/api";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await authApi.login(username, password);
      localStorage.setItem("hackjklu_token", data.token);
      localStorage.setItem("hackjklu_admin", JSON.stringify(data.admin));
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="relative z-10 w-full max-w-md px-6 animate-fade-in">
        {/* Hero / Title */}
        <div className="text-center mb-8 md:mb-10 mt-8 md:mt-0">
          <div className="flex justify-center mb-4 md:mb-6 animate-float">
            <Image
              src="/hackjklu_logo.png"
              alt="HackJKLU Logo"
              width={160}
              height={160}
              className="h-[100px] md:h-[140px] w-auto drop-shadow-[0_0_25px_rgba(232,98,26,0.5)]"
              priority
            />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-wider drop-shadow-lg leading-tight"
            style={{
              fontFamily: "var(--font-display)",
              background: "linear-gradient(135deg, var(--accent-orange) 0%, var(--accent-amber) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}>
            HACKJKLU 5.0
          </h1>
          <p className="mt-2 text-sm md:text-lg font-medium px-4"
            style={{ color: "var(--accent-amber)", fontFamily: "var(--font-body)" }}>
            Admin Portal — Gates of Olympus
          </p>
        </div>

        {/* Login Card */}
        <div className="p-6 md:p-8 rounded-2xl border transition-all duration-300"
          style={{
            background: "var(--card-bg-alt)",
            borderColor: "var(--card-border-alt)",
            boxShadow: "var(--card-shadow-alt)"
          }}>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.2em] mb-3"
                style={{ color: "var(--text-secondary-alt)", fontFamily: "var(--font-display)" }}>
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 outline-none"
                style={{
                  background: "var(--input-bg-alt)",
                  borderColor: "var(--input-border-alt)",
                  color: "var(--text-primary-alt)"
                }}
                onFocus={(e) => e.target.style.borderColor = "var(--accent-orange)"}
                onBlur={(e) => e.target.style.borderColor = "var(--input-border-alt)"}
                placeholder="Enter admin username"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.2em] mb-3"
                style={{ color: "var(--text-secondary-alt)", fontFamily: "var(--font-display)" }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 outline-none"
                style={{
                  background: "var(--input-bg-alt)",
                  borderColor: "var(--input-border-alt)",
                  color: "var(--text-primary-alt)"
                }}
                onFocus={(e) => e.target.style.borderColor = "var(--accent-orange)"}
                onBlur={(e) => e.target.style.borderColor = "var(--input-border-alt)"}
                placeholder="Enter portal password"
                required
              />
            </div>

            {error && (
              <div className="p-4 rounded-xl text-sm flex items-center gap-3 animate-fade-in"
                style={{ background: "rgba(225, 29, 72, 0.1)", color: "var(--accent-rose)", border: "1px solid rgba(225, 29, 72, 0.2)" }}>
                <AlertTriangle size={18} /> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 text-lg font-bold flex items-center justify-center gap-3 rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-orange-500/20"
              style={{
                fontFamily: "var(--font-display)",
                letterSpacing: "0.1em",
                background: "linear-gradient(135deg, var(--accent-orange) 0%, var(--accent-coral) 100%)",
                color: "white"
              }}
            >
              {loading ? (
                <span className="inline-block w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <><Zap size={22} fill="white" /> ENTER OLYMPUS</>
              )}
            </button>
          </form>
        </div>

        <p className="text-center mt-8 text-sm font-medium tracking-wide"
          style={{ color: "var(--accent-amber)", textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}>
          ONLY AUTHORIZED ADMINISTRATORS MAY ENTER
        </p>
      </div>
    </div>
  );
}
