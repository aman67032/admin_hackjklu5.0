"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AlertTriangle, MapPin } from "lucide-react";
import { participantAuthApi } from "@/lib/api";

export default function ParticipantLoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const data = await participantAuthApi.login(email, password);
            localStorage.setItem("hackjklu_participant_token", data.token);
            localStorage.setItem("hackjklu_participant", JSON.stringify(data.team));
            router.push("/live-map");
        } catch (err: any) {
            setError(err.message || "Invalid credentials");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#111111]">
            <div className="relative z-10 w-full max-w-md px-6 animate-fade-in">
                {/* Hero / Title */}
                <div className="text-center mb-8 md:mb-10 mt-8 md:mt-0">
                    <div className="flex justify-center mb-4 md:mb-6 animate-float">
                        <Image
                            src="/hackjklu_logo.png"
                            alt="HackJKLU Logo"
                            width={160}
                            height={160}
                            className="h-[100px] w-auto drop-shadow-[0_0_25px_rgba(56,189,248,0.5)]"
                            priority
                        />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-wider drop-shadow-lg leading-tight"
                        style={{
                            fontFamily: "var(--font-display)",
                            background: "linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent"
                        }}>
                        HACKJKLU 5.0
                    </h1>
                    <p className="mt-2 text-sm md:text-lg font-medium px-4 text-[#7dd3fc]">
                        Participant Live Tracking
                    </p>
                </div>

                {/* Login Card */}
                <div className="p-6 md:p-8 rounded-2xl border"
                    style={{
                        background: "#18181b",
                        borderColor: "#27272a",
                        boxShadow: "0 10px 40px -10px rgba(0,0,0,0.5)"
                    }}>
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-[0.2em] mb-3 text-[#a1a1aa]">
                                Registered Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 outline-none bg-[#09090b] border-[#27272a] text-white focus:border-[#38bdf8]"
                                placeholder="leader or member email"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-[0.2em] mb-3 text-[#a1a1aa]">
                                Passkey
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 outline-none bg-[#09090b] border-[#27272a] text-white focus:border-[#38bdf8]"
                                placeholder="Enter 9 character passkey"
                                minLength={9}
                                maxLength={9}
                                required
                            />
                        </div>

                        {error && (
                            <div className="p-4 rounded-xl text-sm flex items-center gap-3 animate-fade-in bg-rose-500/10 text-rose-500 border border-rose-500/20">
                                <AlertTriangle size={18} /> {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 text-lg font-bold flex items-center justify-center gap-3 rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-sky-500/20 text-white"
                            style={{
                                fontFamily: "var(--font-display)",
                                letterSpacing: "0.1em",
                                background: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)",
                            }}
                        >
                            {loading ? (
                                <span className="inline-block w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <><MapPin size={22} /> LAUNCH RADAR</>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
