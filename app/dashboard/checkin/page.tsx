"use client";

import { useState, useCallback } from "react";
import { Shield, Check, ClipboardList, Search } from "lucide-react";
import { teamsApi } from "@/lib/api";

export default function CheckinPage() {
    const [search, setSearch] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [recentCheckins, setRecentCheckins] = useState<{ name: string; team: string; time: string }[]>([]);
    const [stats, setStats] = useState({ total: 0, checkedIn: 0 });

    const searchParticipants = useCallback(async (query: string) => {
        if (!query.trim()) { setResults([]); return; }
        setLoading(true);
        try {
            const data = await teamsApi.list({ search: query, limit: "20" });
            setResults(data.teams);

            // Calculate check-in stats from all results
            let total = 0, checkedIn = 0;
            data.teams.forEach((t: any) => {
                total++;
                if (t.leaderCheckedIn) checkedIn++;
                t.members.forEach((m: any) => { total++; if (m.checkedIn) checkedIn++; });
            });
            setStats({ total, checkedIn });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleSearch = (val: string) => {
        setSearch(val);
        const timeout = setTimeout(() => searchParticipants(val), 300);
        return () => clearTimeout(timeout);
    };

    const toggleCheckin = async (teamId: string, target: string, name: string, teamName: string, memberIndex?: number) => {
        try {
            const updated = await teamsApi.checkin(teamId, target, memberIndex);
            // Check if was just checked in
            const wasCheckedIn = target === "leader" ? updated.leaderCheckedIn : updated.members[memberIndex!].checkedIn;

            if (wasCheckedIn) {
                setRecentCheckins(prev => [
                    { name, team: teamName, time: new Date().toLocaleTimeString() },
                    ...prev.slice(0, 19),
                ]);
            }

            searchParticipants(search);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="page-container animate-fade-in">
            {/* Header */}
            <div className="flex flex-col items-center text-center mb-12 gap-4">
                <h1 className="text-6xl font-bold tracking-[0.25em] leading-tight"
                    style={{
                        fontFamily: "var(--font-display)",
                        background: "linear-gradient(135deg, var(--accent-orange) 0%, var(--accent-amber) 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        textShadow: "0 0 30px rgba(232, 98, 26, 0.4)"
                    }}>
                    GATES OF ENTRY
                </h1>
                <p className="text-xs font-bold tracking-[0.3em] uppercase opacity-80" style={{ color: "var(--accent-amber)" }}>
                    Search and check-in participants at the gates of Olympus
                </p>
                <div className="h-1 w-24 bg-gradient-to-r from-transparent via-orange-500/50 to-transparent mx-auto mt-2" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Check-in Area */}
                <div className="lg:col-span-2">
                    {/* Search */}
                    <div className="mb-10 relative group">
                        <Search size={22} className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500/50 group-focus-within:text-orange-500 transition-colors" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="input-olympus w-full py-5 pl-14 text-xl font-medium placeholder:text-gray-600 transition-all duration-300"
                            placeholder="Type a hero's name or email..."
                            autoFocus
                        />
                        <div className="absolute inset-0 -z-10 bg-orange-500/5 blur-xl group-focus-within:bg-orange-500/10 transition-all" />
                    </div>

                    {/* Results */}
                    {loading ? (
                        <div className="space-y-3">
                            {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)}
                        </div>
                    ) : results.length === 0 && search ? (
                        <div className="glass-card p-8 text-center">
                            <p style={{ fontFamily: "var(--font-display)", color: "var(--text-muted)" }}>No heroes found at the gates...</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {results.map((team) => (
                                <div key={team._id} className="p-4 rounded-2xl border mb-4 transition-all"
                                    style={{
                                        background: "#111111",
                                        borderColor: "rgba(232, 98, 26, 0.2)",
                                        boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
                                    }}>
                                    <p className="text-xs font-bold mb-3 flex items-center gap-2" style={{ color: "var(--accent-amber)", fontFamily: "var(--font-display)", textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}>
                                        <Shield size={16} /> {team.teamName}
                                        {team.teamNumber && <span className="badge badge-gold text-xs">#{team.teamNumber}</span>}
                                    </p>

                                    {/* Leader */}
                                    <div className="flex items-center gap-3 p-3 rounded-xl mb-2" style={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.05)" }}>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-white">{team.leaderName}</p>
                                            <p className="text-xs" style={{ color: "var(--accent-amber)" }}>{team.leaderEmail} · Leader</p>
                                        </div>
                                        <button
                                            onClick={() => toggleCheckin(team._id, "leader", team.leaderName, team.teamName)}
                                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${team.leaderCheckedIn
                                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                : 'bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/30'
                                                } flex items-center gap-2`}
                                        >
                                            {team.leaderCheckedIn ? <><Check size={16} /> Checked In</> : "Check In →"}
                                        </button>
                                    </div>

                                    {/* Members */}
                                    {team.members.map((member: any, idx: number) => (
                                        <div key={idx} className="flex items-center gap-3 p-3 rounded-xl mb-1" style={{ background: "#18181b", border: "1px solid rgba(255,255,255,0.03)" }}>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-white">{member.name}</p>
                                                <p className="text-xs" style={{ color: "var(--accent-amber)" }}>{member.email} · Member</p>
                                            </div>
                                            <button
                                                onClick={() => toggleCheckin(team._id, "member", member.name, team.teamName, idx)}
                                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${member.checkedIn
                                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                    : 'bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/30'
                                                    } flex items-center gap-2`}
                                            >
                                                {member.checkedIn ? <><Check size={16} /> Checked In</> : "Check In →"}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Sidebar — Recent Check-ins */}
                <div>
                    <div className="p-5 sticky top-6 rounded-2xl border"
                        style={{
                            background: "#111111",
                            borderColor: "rgba(232, 98, 26, 0.2)",
                            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                        }}>
                        <h3 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: "var(--accent-orange)", fontFamily: "var(--font-display)", textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}>
                            <ClipboardList size={18} /> Recent Check-ins
                        </h3>
                        {recentCheckins.length === 0 ? (
                            <p className="text-sm text-center py-6 font-medium text-white/60">
                                No check-ins yet this session
                            </p>
                        ) : (
                            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                                {recentCheckins.map((checkin, idx) => (
                                    <div key={idx} className="p-3 rounded-xl animate-fade-in border border-white/5" style={{ background: "#0a0a0a" }}>
                                        <p className="text-sm font-bold text-white">{checkin.name}</p>
                                        <p className="text-[11px] flex justify-between mt-1" style={{ color: "var(--accent-amber)" }}>
                                            <span>{checkin.team}</span>
                                            <span className="opacity-60">{checkin.time}</span>
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
