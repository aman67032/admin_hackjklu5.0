"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Shield, User, Landmark, Utensils, CheckCircle, BookOpen, GraduationCap, XCircle } from "lucide-react";
import { statsApi } from "@/lib/api";

interface Stats {
    teams: { total: number; complete: number; incomplete: number; checkedIn: number };
    participants: { total: number; checkedIn: number; notCheckedIn: number };
    batchBreakdown: Record<string, number>;
    courseBreakdown: Record<string, number>;
    messFoodCount: number;
}

function StatCard({ icon, label, value, subtitle, color }: {
    icon: React.ReactNode; label: string; value: number | string; subtitle?: string; color?: string;
}) {
    return (
        <div className="stat-card p-4 md:p-6 rounded-2xl border transition-all duration-300 hover:translate-y-[-2px]"
            style={{
                background: "#111111",
                borderColor: "rgba(232, 98, 26, 0.4)",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
                backdropFilter: "blur(8px)"
            }}>
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase tracking-[0.2em] font-bold mb-2 truncate"
                        style={{ color: "var(--accent-amber)", fontFamily: "var(--font-display)", textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}>
                        {label}
                    </p>
                    <p className="text-2xl md:text-3xl font-bold tracking-tight truncate"
                        style={{ color: color || "var(--accent-orange)", textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}>
                        {value}
                    </p>
                    {subtitle && (
                        <p className="text-[10px] md:text-xs mt-2 font-medium tracking-wide leading-tight text-white/80" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}>
                            {subtitle}
                        </p>
                    )}
                </div>
                <div className="p-2 md:p-3 rounded-xl opacity-80 shrink-0"
                    style={{ background: `rgba(${color === '#2dd4bf' ? '45, 212, 191' : color === '#f0d078' ? '240, 208, 120' : '232, 98, 26'}, 0.1)`, color: color || "var(--accent-orange)" }}>
                    {icon}
                </div>
            </div>
        </div>
    );
}

function BreakdownCard({ title, data, icon }: { title: string; data: Record<string, number>; icon: React.ReactNode }) {
    const total = Object.values(data).reduce((a, b) => a + b, 0);
    const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]);

    return (
        <div className="p-4 md:p-6 rounded-2xl border"
            style={{
                background: "#111111",
                borderColor: "rgba(232, 98, 26, 0.2)",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
                backdropFilter: "blur(12px)"
            }}>
            <h3 className="text-xs md:text-sm font-bold uppercase tracking-[0.2em] mb-4 md:mb-6 flex items-center gap-3"
                style={{ color: "var(--accent-orange)", fontFamily: "var(--font-display)", textShadow: "0 0 8px rgba(0,0,0,0.5)" }}>
                <span className="p-1.5 rounded-lg shrink-0" style={{ background: "rgba(232, 98, 26, 0.1)" }}>{icon}</span>
                <span className="truncate">{title}</span>
            </h3>
            <div className="space-y-4">
                {sorted.map(([key, count]) => {
                    const pct = total > 0 ? (count / total) * 100 : 0;
                    return (
                        <div key={key}>
                            <div className="flex justify-between text-xs md:text-sm mb-2 font-medium gap-2">
                                <span className="truncate" style={{ color: "white", textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}>{key || "Unknown"}</span>
                                <span className="shrink-0" style={{ color: "var(--accent-amber)", textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}>
                                    {count} <span className="text-[10px] opacity-60 ml-1">({pct.toFixed(0)}%)</span>
                                </span>
                            </div>
                            <div className="w-full h-1.5 rounded-full overflow-hidden"
                                style={{ background: "rgba(255, 255, 255, 0.1)" }}>
                                <div className="h-full rounded-full transition-all duration-1000 ease-out"
                                    style={{
                                        width: `${pct}%`,
                                        background: "linear-gradient(90deg, var(--accent-orange), var(--accent-amber))"
                                    }} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function DashboardPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const data = await statsApi.get();
            setStats(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="page-container">
                <div className="mb-8">
                    <div className="skeleton h-8 w-64 mb-2" />
                    <div className="skeleton h-4 w-48" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-28 rounded-xl" />)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {[...Array(2)].map((_, i) => <div key={i} className="skeleton h-56 rounded-xl" />)}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="page-container">
                <div className="glass-card p-8 text-center">
                    <p className="text-lg mb-2 flex justify-center items-center gap-2" style={{ color: "var(--danger)" }}>
                        <AlertTriangle size={20} /> Failed to load data
                    </p>
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>{error}</p>
                    <button onClick={() => { setLoading(true); setError(""); loadStats(); }} className="btn-gold mt-4">
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (!stats) return null;

    return (
        <div className="page-container animate-fade-in pb-24 md:pb-0">
            {/* Header */}
            <div className="mb-10 md:mb-14 text-center">
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-[0.15em] drop-shadow-lg leading-tight inline-block"
                    style={{
                        fontFamily: "var(--font-display)",
                        color: "var(--accent-orange)", // Fallback
                        background: "linear-gradient(135deg, var(--accent-orange) 0%, var(--accent-amber) 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        textShadow: "0 0 30px rgba(232, 98, 26, 0.2)"
                    }}>
                    OLYMPUS OVERVIEW
                </h1>
                <p className="text-xs md:text-sm mt-3 md:mt-4 font-bold tracking-[0.1em] md:tracking-[0.2em] uppercase opacity-90 mx-auto max-w-2xl px-4"
                    style={{
                        color: "var(--accent-amber)",
                        fontFamily: "var(--font-display)",
                        textShadow: "0 1px 2px rgba(0,0,0,0.5)"
                    }}>
                    Real-time statistics for the Heroes of HackJKLU 5.0
                </p>
                <div className="h-1 w-16 md:w-24 bg-gradient-to-r from-transparent via-orange-500/50 to-transparent mx-auto mt-4 md:mt-6" />
            </div>

            {/* Main Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
                <StatCard icon={<Shield size={20} />} label="Teams" value={stats.teams.total}
                    subtitle={`${stats.teams.complete} complete`} />
                <StatCard icon={<User size={20} />} label="Hackers" value={stats.participants.total}
                    subtitle={`${stats.participants.checkedIn} in campus`} color="#10B981" />
                <StatCard icon={<Landmark size={20} />} label="Arrivals"
                    value={stats.teams.total > 0 ? `${((stats.teams.checkedIn / stats.teams.total) * 100).toFixed(0)}%` : "0%"}
                    subtitle={`${stats.teams.total - stats.teams.checkedIn} teams remaining`} color="#f59e0b" />
                <StatCard icon={<Utensils size={20} />} label="Mess" value={stats.messFoodCount}
                    subtitle="opted in" color="#e8621a" />
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 mb-8 mt-2">
                <StatCard icon={<Shield size={20} />} label="Ready Teams" value={stats.teams.complete} color="#10B981" />
                <StatCard icon={<XCircle size={20} />} label="Incomplete" value={stats.teams.incomplete} color="#ef4444" />
                <StatCard icon={<CheckCircle size={20} />} label="Checked In Teams" value={stats.teams.checkedIn} color="#10B981" />
            </div>

            {/* Breakdowns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                <BreakdownCard title="Batch Distribution" data={stats.batchBreakdown} icon={<BookOpen size={18} />} />
                <BreakdownCard title="Course Distribution" data={stats.courseBreakdown} icon={<GraduationCap size={18} />} />
            </div>
        </div>
    );
}
