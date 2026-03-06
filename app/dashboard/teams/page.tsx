"use client";

import { useEffect, useState, useCallback } from "react";
import { X, Search, Home, Edit2, Check } from "lucide-react";
import { teamsApi } from "@/lib/api";

export default function TeamsPage() {
    const [teams, setTeams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [editingTeam, setEditingTeam] = useState<string | null>(null);
    const [editData, setEditData] = useState<{ teamNumber: string; roomNumber: string; status: string }>({ teamNumber: "", roomNumber: "", status: "" });

    const loadTeams = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, string> = { limit: "200" };
            if (search) params.search = search;
            const data = await teamsApi.list(params);
            setTeams(data.teams);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => { loadTeams(); }, [loadTeams]);

    const handleEdit = (team: any) => {
        setEditingTeam(team._id);
        setEditData({ teamNumber: team.teamNumber || "", roomNumber: team.roomNumber || "", status: team.status });
    };

    const saveEdit = async (teamId: string) => {
        try {
            await teamsApi.update(teamId, {
                teamNumber: editData.teamNumber ? Number(editData.teamNumber) : undefined,
                roomNumber: editData.roomNumber,
                status: editData.status,
            });
            setEditingTeam(null);
            loadTeams();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="page-container animate-fade-in">
            {/* Header */}
            <div className="flex flex-col items-center text-center mb-12 gap-6">
                <div>
                    <h1 className="text-6xl font-bold tracking-[0.2em] leading-tight"
                        style={{
                            fontFamily: "var(--font-display)",
                            background: "linear-gradient(135deg, var(--accent-orange) 0%, var(--accent-amber) 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            textShadow: "0 0 20px rgba(232, 98, 26, 0.3)"
                        }}>
                        THE ARMIES
                    </h1>
                    <p className="text-xs mt-3 font-bold tracking-[0.3em] uppercase opacity-80" style={{ color: "var(--accent-amber)" }}>
                        Manage teams, assign numbers, and organize the forge
                    </p>
                </div>
            </div>

            {/* Search */}
            <div className="mb-10 max-w-xl mx-auto relative group">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500/50 group-focus-within:text-orange-500 transition-colors" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="input-olympus w-full pl-12 py-4 text-center placeholder:text-gray-500"
                    placeholder="Search for an army by name or email..."
                />
            </div>

            {/* Teams Grid */}
            {loading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-48 rounded-xl" />)}
                </div>
            ) : teams.length === 0 ? (
                <div className="glass-card p-12 text-center">
                    <p className="text-lg mb-1" style={{ fontFamily: "var(--font-display)", color: "var(--text-muted)" }}>No armies found...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {teams.map((team) => (
                        <div key={team._id} className="p-6 rounded-2xl border transition-all duration-300"
                            style={{
                                background: "rgba(0, 0, 0, 0.4)",
                                borderColor: "rgba(232, 98, 26, 0.2)",
                                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                            }}>
                            <div className="flex items-start justify-between mb-5 border-b border-orange-500/30 pb-4">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h3 className="font-bold text-xl tracking-wide text-white" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>{team.teamName}</h3>
                                        {team.teamNumber && <span className="badge badge-gold px-3">#{team.teamNumber}</span>}
                                    </div>
                                    <div className="flex items-center gap-3 mt-2">
                                        <span className={`badge px-2 text-[10px] uppercase font-bold ${team.status === 'complete' ? 'badge-success' : team.status === 'disqualified' ? 'badge-danger' : 'badge-muted'}`}>
                                            {team.status}
                                        </span>
                                        {team.roomNumber && <span className="text-xs font-bold flex items-center gap-1 text-white" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}><Home size={12} /> {team.roomNumber}</span>}
                                    </div>
                                </div>
                                <button onClick={() => handleEdit(team)} className="btn-ghost text-[10px] uppercase tracking-wider px-3 py-1 flex items-center gap-1 font-bold"><Edit2 size={12} /> Edit</button>
                            </div>

                            {/* Edit Form */}
                            {editingTeam === team._id && (
                                <div className="p-4 rounded-xl mb-6 space-y-3" style={{ background: "rgba(0, 0, 0, 0.5)", border: "1px solid rgba(232, 98, 26, 0.3)" }}>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            value={editData.teamNumber}
                                            onChange={(e) => setEditData(prev => ({ ...prev, teamNumber: e.target.value }))}
                                            className="input-olympus text-sm py-2 bg-black/40"
                                            placeholder="Team #"
                                        />
                                        <input
                                            value={editData.roomNumber}
                                            onChange={(e) => setEditData(prev => ({ ...prev, roomNumber: e.target.value }))}
                                            className="input-olympus text-sm py-2 bg-black/40"
                                            placeholder="Room #"
                                        />
                                        <select
                                            value={editData.status}
                                            onChange={(e) => setEditData(prev => ({ ...prev, status: e.target.value }))}
                                            className="select-olympus text-sm py-2 bg-black/40"
                                        >
                                            <option value="incomplete">Incomplete</option>
                                            <option value="complete">Complete</option>
                                            <option value="disqualified">Disqualified</option>
                                        </select>
                                    </div>
                                    <div className="flex gap-2 pt-1">
                                        <button onClick={() => saveEdit(team._id)} className="btn-gold text-[10px] uppercase font-bold px-4 py-2">Save Changes</button>
                                        <button onClick={() => setEditingTeam(null)} className="btn-ghost text-[10px] uppercase font-bold px-4 py-2">Cancel</button>
                                    </div>
                                </div>
                            )}

                            {/* Members */}
                            <div className="space-y-2">
                                {/* Leader */}
                                <div
                                    className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors`}
                                    style={{ background: "rgba(212, 168, 67, 0.05)", border: "1px solid rgba(212, 168, 67, 0.1)" }}
                                >
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                                        style={{ background: "linear-gradient(135deg, var(--gold), var(--bronze))", color: "var(--navy)" }}>
                                        L
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{team.leaderName}</p>
                                        <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{team.leaderEmail}</p>
                                    </div>
                                    <span className={`badge flex justify-center items-center w-6 h-6 p-0 rounded-full ${team.leaderCheckedIn ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                        {team.leaderCheckedIn ? <Check size={14} /> : <X size={14} />}
                                    </span>
                                </div>

                                {/* Members */}
                                {team.members.map((member: any, idx: number) => (
                                    <div
                                        key={idx}
                                        className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors`}
                                        style={{ background: "var(--navy)", border: "1px solid var(--border)" }}
                                    >
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0"
                                            style={{ background: "var(--navy-mid)", color: "var(--text-muted)" }}>
                                            M{idx + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{member.name}</p>
                                            <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{member.email}</p>
                                        </div>
                                        <span className={`badge flex justify-center items-center w-6 h-6 p-0 rounded-full ${member.checkedIn ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                            {member.checkedIn ? <Check size={14} /> : <X size={14} />}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
