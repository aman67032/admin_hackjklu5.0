
"use client";

import { useState, useCallback, useEffect } from "react";
import { Shield, Check, ClipboardList, Search, Edit3, Save, Plug, Monitor, MapPin, Users } from "lucide-react";
import { teamsApi, SOCKET_URL } from "@/lib/api";
import { io } from "socket.io-client";

export default function CheckinPage() {
    const [search, setSearch] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [recentCheckins, setRecentCheckins] = useState<{ name: string; team: string; time: string }[]>([]);
    const [stats, setStats] = useState({ total: 0, checkedIn: 0 });
    const [editingTeam, setEditingTeam] = useState<string | null>(null);
    const [editData, setEditData] = useState<{ roomNumber?: string; domain?: string; extensionBoard?: boolean }>({});

    // Socket.io for live updates
    useEffect(() => {
        const socket = io(SOCKET_URL);
        
        socket.on('team_updated', (updatedTeam) => {
            setResults(prev => prev.map(t => t._id === updatedTeam._id ? updatedTeam : t));
            
            // If it was a check-in, add to recent
            if (updatedTeam.checkedIn) {
                setRecentCheckins(prev => {
                    // Avoid duplicates if we already added it locally
                    if (prev.some(r => r.team === updatedTeam.teamName && r.time === new Date(updatedTeam.checkedInAt).toLocaleTimeString())) {
                        return prev;
                    }
                    return [
                        { name: updatedTeam.leaderName, team: updatedTeam.teamName, time: new Date(updatedTeam.checkedInAt).toLocaleTimeString() },
                        ...prev.slice(0, 19)
                    ];
                });
            }
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const searchParticipants = useCallback(async (query: string) => {
        if (!query.trim()) { 
            setResults([]); 
            setStats({ total: 0, checkedIn: 0 });
            return; 
        }
        setLoading(true);
        try {
            const data = await teamsApi.list({ search: query, limit: "20" });
            setResults(data.teams || []);
            setStats({ 
                total: data.pagination?.total || 0, 
                checkedIn: (data.teams || []).filter((t: any) => t.checkedIn).length 
            });
        } catch (err) {
            console.error("Search error:", err);
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Debounced search effect
    useEffect(() => {
        const timer = setTimeout(() => {
            searchParticipants(search);
        }, 400);
        return () => clearTimeout(timer);
    }, [search, searchParticipants]);

    const toggleTeamCheckin = async (teamId: string, teamName: string, leaderName: string) => {
        try {
            const updated = await teamsApi.checkin(teamId);
            
            // Update local state immediately for snappy UI
            setResults(prev => prev.map(t => t._id === teamId ? updated : t));

            if (updated.checkedIn) {
                setRecentCheckins(prev => [
                    { name: leaderName, team: teamName, time: new Date().toLocaleTimeString() },
                    ...prev.slice(0, 19),
                ]);
            }
        } catch (err) {
            console.error(err);
            alert("Failed to toggle check-in.");
        }
    };

    const handleEditToggle = (teamId: string, teamData: any) => {
        if (editingTeam === teamId) {
            setEditingTeam(null);
            setEditData({});
        } else {
            setEditingTeam(teamId);
            setEditData({
                roomNumber: teamData.roomNumber || "",
                domain: teamData.domain || "",
                extensionBoard: !!teamData.extensionBoard
            });
        }
    };

    const handleSaveMetadata = async (teamId: string) => {
        try {
            const updated = await teamsApi.update(teamId, editData);
            setEditingTeam(null);
            // Update local state instead of full search
            setResults(prev => prev.map(t => t._id === teamId ? updated : t));
        } catch (err) {
            console.error("Failed to update team metadata:", err);
            alert("Failed to save team tracking data.");
        }
    };

    return (
        <div className="page-container animate-fade-in pb-24 md:pb-0">
            {/* Header */}
            <div className="flex flex-col items-center text-center mb-8 md:mb-12 gap-4">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-[0.1em] md:tracking-[0.25em] leading-tight"
                    style={{
                        fontFamily: "var(--font-display)",
                        background: "linear-gradient(135deg, var(--accent-orange) 0%, var(--accent-amber) 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        textShadow: "0 0 30px rgba(232, 98, 26, 0.4)"
                    }}>
                    GATES OF ENTRY
                </h1>
                <p className="text-[10px] md:text-xs font-bold tracking-[0.15em] md:tracking-[0.3em] uppercase opacity-80 px-4" style={{ color: "var(--accent-amber)" }}>
                    Team-wide check-in and logistical coordination
                </p>
                <div className="h-1 w-16 md:w-24 bg-gradient-to-r from-transparent via-orange-500/50 to-transparent mx-auto mt-2" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Check-in Area */}
                <div className="lg:col-span-2">
                    {/* Search */}
                    <div className="mb-8 md:mb-10 relative group">
                        <Search size={22} className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500/50 group-focus-within:text-orange-500 transition-colors" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="input-olympus w-full py-4 md:py-5 pl-12 md:pl-14 text-base md:text-xl font-medium placeholder:text-gray-600 transition-all duration-300"
                            placeholder="Search Team or Captain..."
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
                            <p style={{ fontFamily: "var(--font-display)", color: "var(--text-muted)" }}>No teams found at the gates...</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {results.map((team) => (
                                <div key={team._id} className="p-5 rounded-2xl border transition-all duration-300"
                                    style={{
                                        background: team.checkedIn ? "rgba(34, 197, 94, 0.05)" : "#111111",
                                        borderColor: team.checkedIn ? "rgba(34, 197, 94, 0.3)" : "rgba(232, 98, 26, 0.2)",
                                        boxShadow: team.checkedIn ? "0 4px 20px rgba(34, 197, 94, 0.1)" : "0 4px 15px rgba(0,0,0,0.1)",
                                    }}>
                                    
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h2 className="text-lg font-bold text-white flex items-center gap-2" style={{ fontFamily: "var(--font-display)" }}>
                                                    <Shield size={20} className="text-orange-500" /> {team.teamName}
                                                </h2>
                                                {team.teamNumber && <span className="bg-orange-500/20 text-orange-400 text-[10px] px-2 py-0.5 rounded-full font-bold border border-orange-500/30">#{team.teamNumber}</span>}
                                            </div>
                                            <p className="text-xs text-gray-400 flex items-center gap-2">
                                                <Users size={14} /> {team.members.length + 1} Members · {team.leaderName} (Captain)
                                            </p>
                                        </div>

                                        <button
                                            onClick={() => toggleTeamCheckin(team._id, team.teamName, team.leaderName)}
                                            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all transform active:scale-95 ${team.checkedIn
                                                ? 'bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.4)]'
                                                : 'bg-orange-600 hover:bg-orange-500 text-white shadow-[0_0_20px_rgba(232,98,26,0.3)]'
                                                } flex items-center justify-center gap-2 w-full md:w-auto`}
                                        >
                                            {team.checkedIn ? <><Check size={18} /> TEAM CHECKED IN</> : "CHECK IN TEAM →"}
                                        </button>
                                    </div>

                                    {/* Logistical Metadata Panel */}
                                    <div className="p-4 rounded-xl relative overflow-hidden" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                                <ClipboardList size={14} /> Logistical Details
                                            </h3>
                                            <button 
                                                onClick={() => handleEditToggle(team._id, team)}
                                                className="text-[10px] font-bold uppercase tracking-widest text-orange-400 hover:text-orange-300 transition-colors flex items-center gap-1"
                                            >
                                                {editingTeam === team._id ? "Cancel" : <><Edit3 size={12} /> Edit Details</>}
                                            </button>
                                        </div>

                                        {editingTeam === team._id ? (
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">Room Assignment</label>
                                                    <div className="relative">
                                                        <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                                        <input 
                                                            type="text" 
                                                            value={editData.roomNumber} 
                                                            onChange={e => setEditData({...editData, roomNumber: e.target.value})}
                                                            className="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm focus:border-orange-500/50 outline-none transition-all"
                                                            placeholder="E.g. AL-204"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">Tech Domain</label>
                                                    <div className="relative">
                                                        <Monitor size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                                        <input 
                                                            type="text" 
                                                            value={editData.domain} 
                                                            onChange={e => setEditData({...editData, domain: e.target.value})}
                                                            className="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm focus:border-orange-500/50 outline-none transition-all"
                                                            placeholder="E.g. Web3, AI"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex flex-col justify-end gap-2">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <button 
                                                            onClick={() => setEditData({...editData, extensionBoard: !editData.extensionBoard})}
                                                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-xs font-bold transition-all ${editData.extensionBoard ? 'bg-green-500/20 border-green-500/40 text-green-400' : 'bg-black/40 border-white/10 text-gray-500 hover:border-white/20'}`}
                                                        >
                                                            <Plug size={14} /> {editData.extensionBoard ? "Board Provided" : "Request Board"}
                                                        </button>
                                                        <button 
                                                            onClick={() => handleSaveMetadata(team._id)}
                                                            className="bg-orange-600 hover:bg-orange-500 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 shadow-lg shadow-orange-900/20 transition-all"
                                                        >
                                                            <Save size={14} /> Save
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-wrap gap-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${team.roomNumber ? 'bg-blue-500/10 text-blue-400' : 'bg-white/5 text-gray-600'}`}>
                                                        <MapPin size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] uppercase font-bold text-gray-500">Room</p>
                                                        <p className="text-sm font-bold text-white">{team.roomNumber || "Not Assigned"}</p>
                                                    </div>
                                                </div>
                                                <div className="h-8 w-px bg-white/5 self-center mx-2 hidden md:block" />
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${team.domain ? 'bg-purple-500/10 text-purple-400' : 'bg-white/5 text-gray-600'}`}>
                                                        <Monitor size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] uppercase font-bold text-gray-500">Domain</p>
                                                        <p className="text-sm font-bold text-white">{team.domain || "N/A"}</p>
                                                    </div>
                                                </div>
                                                <div className="h-8 w-px bg-white/5 self-center mx-2 hidden md:block" />
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${team.extensionBoard ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-gray-600'}`}>
                                                        <Plug size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] uppercase font-bold text-gray-500">Hardware</p>
                                                        <p className="text-sm font-bold text-white">{team.extensionBoard ? "Extension Board Provided" : "No Board Assigned"}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
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
                            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
                                {recentCheckins.map((checkin, idx) => (
                                    <div key={idx} className="p-3 rounded-xl animate-fade-in border border-white/5 group relative overflow-hidden" style={{ background: "#0a0a0a" }}>
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                                        <p className="text-sm font-bold text-white truncate pl-2">{checkin.name}</p>
                                        <p className="text-[11px] flex justify-between mt-1 pl-2" style={{ color: "var(--accent-amber)" }}>
                                            <span className="truncate flex-1 pr-2">{checkin.team}</span>
                                            <span className="opacity-60 whitespace-nowrap">{checkin.time}</span>
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        {/* Stats mini card */}
                        <div className="mt-6 pt-6 border-t border-white/5">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Gate Pass Statistics</p>
                                    <p className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>{stats.checkedIn} <span className="text-xs text-gray-500 font-sans">/ {stats.total} TEAMS</span></p>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full inline-block">LIVE</div>
                                </div>
                            </div>
                            <div className="w-full h-1.5 bg-white/5 rounded-full mt-3 overflow-hidden">
                                <div 
                                    className="h-full bg-gradient-to-r from-orange-500 to-green-500 transition-all duration-1000"
                                    style={{ width: `${(stats.checkedIn / (stats.total || 1)) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
