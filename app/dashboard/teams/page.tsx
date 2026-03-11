"use client";

import { useEffect, useState, useCallback } from "react";
import { X, Search, Home, Edit2, Check } from "lucide-react";
import { teamsApi } from "@/lib/api";

export default function TeamsPage() {
    const [teams, setTeams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSize, setSelectedSize] = useState<string>("");
    const [selectedStatus, setSelectedStatus] = useState<string>("");
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [metadata, setMetadata] = useState<{ sizeCounts: Record<number, number> }>({ sizeCounts: {} });
    const [editingTeam, setEditingTeam] = useState<string | null>(null);
    const [editData, setEditData] = useState<{ 
        teamName: string;
        teamNumber: string; 
        roomNumber: string; 
        status: string;
        domain: string;
        members: any[];
    }>({ teamName: "", teamNumber: "", roomNumber: "", status: "", domain: "", members: [] });
    
    // Member sub-form state
    const [memberForm, setMemberForm] = useState<any | null>(null); // { index: number | 'new', data: any }

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 500);
        return () => clearTimeout(timer);
    }, [search]);

    const loadMetadata = async () => {
        try {
            const data = await teamsApi.getMetadata();
            setMetadata(data);
        } catch (err) {
            console.error(err);
        }
    };

    const loadTeams = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, string> = { limit: "200" };
            if (debouncedSearch) params.search = debouncedSearch;
            if (selectedSize) params.teamSize = selectedSize;
            if (selectedStatus) params.status = selectedStatus;
            const data = await teamsApi.list(params);
            setTeams(data.teams);
        } catch (err: any) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, selectedSize, selectedStatus]);

    useEffect(() => { loadMetadata(); }, []);
    useEffect(() => { loadTeams(); }, [loadTeams]);

    const handleEdit = (team: any) => {
        setEditingTeam(team._id);
        setEditData({ 
            teamName: team.teamName,
            teamNumber: team.teamNumber || "", 
            roomNumber: team.roomNumber || "", 
            status: team.status,
            domain: team.domain || "",
            members: [...team.members]
        });
        setMemberForm(null);
    };

    const saveEdit = async (teamId: string) => {
        try {
            await teamsApi.update(teamId, {
                teamName: editData.teamName,
                teamNumber: editData.teamNumber ? Number(editData.teamNumber) : undefined,
                roomNumber: editData.roomNumber,
                status: editData.status,
                domain: editData.domain,
                members: editData.members,
            });
            setEditingTeam(null);
            loadTeams();
            loadMetadata();
        } catch (err) {
            console.error(err);
        }
    };

    const handleRemoveMember = (idx: number) => {
        setEditData(prev => ({
            ...prev,
            members: prev.members.filter((_, i) => i !== idx)
        }));
    };

    const handleOpenMemberForm = (idx: number | 'new', existingData?: any) => {
        setMemberForm({
            index: idx,
            data: existingData || {
                name: "",
                email: "",
                phone: "",
                college: "",
                batch: "",
                course: "",
                city: "",
                gender: "",
                messFood: false
            }
        });
    };

    const saveMemberForm = () => {
        if (!memberForm) return;
        const newMembers = [...editData.members];
        if (memberForm.index === 'new') {
            newMembers.push(memberForm.data);
        } else {
            newMembers[memberForm.index] = memberForm.data;
        }
        setEditData(prev => ({ ...prev, members: newMembers }));
        setMemberForm(null);
    };

    const handleExport = async () => {
        try {
            const params: Record<string, string> = {};
            if (search) params.search = search;
            if (selectedSize) params.teamSize = selectedSize;
            
            const csvData = await teamsApi.list(params) as any; // Re-use list to get full filtered set, or call exportApi
            // Actually exportsApi.teams is better for raw CSV
            const { exportsApi, downloadCSV } = await import("@/lib/api");
            if (selectedStatus) params.status = selectedStatus;
            const csv = await exportsApi.teams(params);
            downloadCSV(csv, `teams_size_${selectedSize || 'all'}_status_${selectedStatus || 'any'}_${Date.now()}.csv`);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="page-container animate-fade-in pb-24 md:pb-0">
            {/* Header */}
            <div className="flex flex-col items-center text-center mb-8 md:mb-12 gap-4 md:gap-6">
                <div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-[0.1em] md:tracking-[0.2em] leading-tight"
                        style={{
                            fontFamily: "var(--font-display)",
                            background: "linear-gradient(135deg, var(--accent-orange) 0%, var(--accent-amber) 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            textShadow: "0 0 20px rgba(232, 98, 26, 0.3)"
                        }}>
                        THE ARMIES
                    </h1>
                    <p className="text-[10px] md:text-xs mt-2 md:mt-3 font-bold tracking-[0.15em] md:tracking-[0.3em] uppercase opacity-80 px-4" style={{ color: "var(--accent-amber)" }}>
                        Manage teams, assign numbers, and organize the forge
                    </p>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="mb-8 md:mb-12 max-w-4xl mx-auto space-y-6">
                <div className="flex flex-wrap justify-center gap-3">
                    <button 
                        onClick={() => { setSelectedSize(""); setSelectedStatus(""); }}
                        className={`px-6 py-2 rounded-full text-xs font-bold transition-all duration-300 border ${!selectedSize && !selectedStatus ? 'bg-orange-500 text-white border-orange-400 font-black' : 'bg-black/40 text-gray-400 border-white/10 hover:border-orange-500/50'}`}
                    >
                        ALL ARMIES
                    </button>
                    {[1, 2, 3, 4, 5].map(size => (
                        <button 
                            key={size}
                            onClick={() => setSelectedSize(size.toString())}
                            className={`px-6 py-2 rounded-full text-xs font-bold transition-all duration-300 border flex items-center gap-2 ${selectedSize === size.toString() ? 'bg-orange-500 text-white border-orange-400 shadow-[0_0_15px_rgba(232,98,26,0.4)] font-black' : 'bg-black/40 text-gray-400 border-white/10 hover:border-orange-500/50'}`}
                        >
                            {size} {size === 1 ? 'MEMBER' : 'MEMBERS'}
                            <span className="px-1.5 py-0.5 rounded-md bg-black/60 text-[10px] opacity-80">
                                {metadata.sizeCounts[size] || 0}
                            </span>
                        </button>
                    ))}
                    <button 
                        onClick={() => setSelectedStatus(selectedStatus === "incomplete" ? "" : "incomplete")}
                        className={`px-6 py-2 rounded-full text-xs font-bold transition-all duration-300 border ${selectedStatus === "incomplete" ? 'bg-red-600 text-white border-red-400 shadow-[0_0_15px_rgba(220,38,38,0.4)] font-black' : 'bg-black/40 text-gray-400 border-white/10 hover:border-red-500/30'}`}
                    >
                        INCOMPLETE
                    </button>
                </div>

                <div className="relative group">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500/50 group-focus-within:text-orange-500 transition-colors" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="input-olympus w-full pl-12 py-3 md:py-4 text-center placeholder:text-gray-500 text-sm"
                        placeholder="Search for an army by name or email..."
                    />
                </div>

                <div className="flex justify-center">
                    <button 
                        onClick={handleExport}
                        className="btn-ghost text-[10px] uppercase tracking-widest px-8 py-3 font-bold border-orange-500/30 hover:border-orange-500"
                    >
                        Export Filtered Armies (CSV)
                    </button>
                </div>
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                    {teams.map((team) => (
                        <div key={team._id} className="p-4 md:p-6 rounded-2xl border transition-all duration-300"
                            style={{
                                background: "#111111",
                                borderColor: "rgba(232, 98, 26, 0.2)",
                                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                            }}>
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 md:mb-5 border-b border-orange-500/30 pb-4 gap-3">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2 md:gap-3">
                                        <h3 className="font-bold text-lg md:text-xl tracking-wide text-white break-all" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>{team.teamName}</h3>
                                        {team.teamNumber && <span className="badge badge-gold px-2 md:px-3">#{team.teamNumber}</span>}
                                    </div>
                                    <div className="flex items-center gap-3 mt-2">
                                        <span className={`badge px-2 text-[10px] uppercase font-bold ${team.status === 'complete' ? 'badge-success' : team.status === 'disqualified' ? 'badge-danger' : 'badge-muted'}`}>
                                            {team.status}
                                        </span>
                                        {team.roomNumber && <span className="text-xs font-bold flex items-center gap-1 text-white" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}><Home size={12} /> {team.roomNumber}</span>}
                                        {team.domain && <span className="text-xs font-bold flex items-center gap-1 text-orange-400/80" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}><Edit2 size={12} /> {team.domain}</span>}
                                    </div>
                                </div>
                                <button onClick={() => handleEdit(team)} className="btn-ghost self-start text-[10px] uppercase tracking-wider px-3 py-1.5 flex items-center gap-1 font-bold shrink-0"><Edit2 size={12} /> Edit</button>
                            </div>

                            {/* Edit Form */}
                            {editingTeam === team._id && (
                                <div className="p-3 md:p-4 rounded-xl mb-6 space-y-3" style={{ background: "#0a0a0a", border: "1px solid rgba(232, 98, 26, 0.3)" }}>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <input
                                            value={editData.teamName}
                                            onChange={(e) => setEditData(prev => ({ ...prev, teamName: e.target.value }))}
                                            className="input-olympus text-sm py-2 bg-black/40 flex-[2]"
                                            placeholder="Army Name"
                                        />
                                        <input
                                            type="number"
                                            value={editData.teamNumber}
                                            onChange={(e) => setEditData(prev => ({ ...prev, teamNumber: e.target.value }))}
                                            className="input-olympus text-sm py-2 bg-black/40 flex-1"
                                            placeholder="Army #"
                                        />
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <input
                                            value={editData.roomNumber}
                                            onChange={(e) => setEditData(prev => ({ ...prev, roomNumber: e.target.value }))}
                                            className="input-olympus text-sm py-2 bg-black/40"
                                            placeholder="Room #"
                                        />
                                        <input
                                            value={editData.domain}
                                            onChange={(e) => setEditData(prev => ({ ...prev, domain: e.target.value }))}
                                            className="input-olympus text-sm py-2 bg-black/40"
                                            placeholder="Expertise"
                                        />
                                        <select
                                            value={editData.status}
                                            onChange={(e) => setEditData(prev => ({ ...prev, status: e.target.value }))}
                                            className="select-olympus text-sm py-2 bg-black/40 w-full"
                                        >
                                            <option value="incomplete">Incomplete</option>
                                            <option value="complete">Complete</option>
                                            <option value="disqualified">Disqualified</option>
                                        </select>
                                    </div>

                                    {/* Member Management in Edit */}
                                    <div className="mt-4 border-t border-white/10 pt-4 space-y-2">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[10px] uppercase font-bold text-orange-400">Manage Members ({editData.members.length + 1}/5)</span>
                                            {editData.members.length < 4 && (
                                                <button 
                                                    onClick={() => handleOpenMemberForm('new')}
                                                    className="text-[10px] uppercase font-bold text-white bg-orange-600 px-2 py-1 rounded"
                                                >
                                                    + Add
                                                </button>
                                            )}
                                        </div>

                                        <div className="space-y-1.5">
                                            {/* (Leader is immutable in this view, only members can be removed/replaced) */}
                                            {editData.members.map((m, idx) => (
                                                <div key={idx} className="flex items-center gap-2 p-1.5 rounded bg-white/5 border border-white/5 text-[10px]">
                                                    <span className="text-gray-400 font-mono">M{idx+1}:</span>
                                                    <span className="flex-1 truncate font-bold">{m.name}</span>
                                                    <button onClick={() => handleOpenMemberForm(idx, m)} className="text-blue-400 hover:text-blue-300">Replace</button>
                                                    <button onClick={() => handleRemoveMember(idx)} className="text-red-400 hover:text-red-300">Remove</button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Sub-form for Member Details */}
                                    {memberForm && (
                                        <div className="mt-4 p-4 rounded-lg bg-orange-500/10 border border-orange-500/30 animate-scale-in">
                                            <h4 className="text-[10px] uppercase font-bold mb-3 text-orange-400">
                                                {memberForm.index === 'new' ? 'New Member Details' : 'Replace Member Details'}
                                            </h4>
                                            <div className="grid grid-cols-2 gap-2">
                                                <input 
                                                    placeholder="Name" 
                                                    value={memberForm.data.name} 
                                                    onChange={e => setMemberForm((prev: any) => ({ ...prev, data: { ...prev.data, name: e.target.value } }))}
                                                    className="input-olympus text-[10px] py-1.5"
                                                />
                                                <input 
                                                    placeholder="Email" 
                                                    value={memberForm.data.email} 
                                                    onChange={e => setMemberForm((prev: any) => ({ ...prev, data: { ...prev.data, email: e.target.value } }))}
                                                    className="input-olympus text-[10px] py-1.5"
                                                />
                                                <input 
                                                    placeholder="Phone" 
                                                    value={memberForm.data.phone} 
                                                    onChange={e => setMemberForm((prev: any) => ({ ...prev, data: { ...prev.data, phone: e.target.value } }))}
                                                    className="input-olympus text-[10px] py-1.5"
                                                />
                                                <input 
                                                    placeholder="College" 
                                                    value={memberForm.data.college} 
                                                    onChange={e => setMemberForm((prev: any) => ({ ...prev, data: { ...prev.data, college: e.target.value } }))}
                                                    className="input-olympus text-[10px] py-1.5"
                                                />
                                                <input 
                                                    placeholder="City" 
                                                    value={memberForm.data.city} 
                                                    onChange={e => setMemberForm((prev: any) => ({ ...prev, data: { ...prev.data, city: e.target.value } }))}
                                                    className="input-olympus text-[10px] py-1.5"
                                                />
                                                <input 
                                                    placeholder="Course" 
                                                    value={memberForm.data.course} 
                                                    onChange={e => setMemberForm((prev: any) => ({ ...prev, data: { ...prev.data, course: e.target.value } }))}
                                                    className="input-olympus text-[10px] py-1.5"
                                                />
                                                <input 
                                                    placeholder="Batch" 
                                                    value={memberForm.data.batch} 
                                                    onChange={e => setMemberForm((prev: any) => ({ ...prev, data: { ...prev.data, batch: e.target.value } }))}
                                                    className="input-olympus text-[10px] py-1.5"
                                                />
                                                <select 
                                                    value={memberForm.data.gender} 
                                                    onChange={e => setMemberForm((prev: any) => ({ ...prev, data: { ...prev.data, gender: e.target.value } }))}
                                                    className="select-olympus text-[10px] py-1"
                                                >
                                                    <option value="">Select Gender</option>
                                                    <option value="Male">Male</option>
                                                    <option value="Female">Female</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                                <div className="flex items-center gap-2 px-2">
                                                    <input 
                                                        type="checkbox"
                                                        checked={memberForm.data.messFood}
                                                        onChange={e => setMemberForm((prev: any) => ({ ...prev, data: { ...prev.data, messFood: e.target.checked } }))}
                                                        className="w-3 h-3 accent-orange-500"
                                                    />
                                                    <span className="text-[10px] font-bold text-gray-400">Mess Food?</span>
                                                </div>

                                            </div>
                                            <div className="flex gap-2 mt-3">
                                                <button onClick={saveMemberForm} className="btn-gold flex-1 py-1 text-[10px]">OK</button>
                                                <button onClick={() => setMemberForm(null)} className="btn-ghost flex-1 py-1 text-[10px]">Cancel</button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-2 pt-1 mt-4 border-t border-white/10 pt-4">
                                        <button onClick={() => saveEdit(team._id)} className="btn-gold flex-1 text-[10px] uppercase font-bold px-4 py-2">Save Army</button>
                                        <button onClick={() => setEditingTeam(null)} className="btn-ghost flex-1 text-[10px] uppercase font-bold px-4 py-2">Cancel</button>
                                    </div>
                                </div>
                            )}

                            {/* Members */}
                            <div className="space-y-2">
                                {/* Leader */}
                                <div
                                    className={`flex items-center gap-2 md:gap-3 p-2 md:p-2.5 rounded-lg transition-colors`}
                                    style={{ background: "rgba(212, 168, 67, 0.05)", border: "1px solid rgba(212, 168, 67, 0.1)" }}
                                >
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                                        style={{ background: "linear-gradient(135deg, var(--gold), var(--bronze))", color: "var(--navy)" }}>
                                        L
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs md:text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{team.leaderName}</p>
                                        <p className="text-[10px] md:text-xs truncate" style={{ color: "var(--text-muted)" }}>{team.leaderEmail}</p>
                                    </div>
                                    <span className={`badge flex justify-center items-center w-6 h-6 p-0 shrink-0 rounded-full ${team.checkedIn ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                        {team.checkedIn ? <Check size={14} /> : <X size={14} />}
                                    </span>
                                </div>

                                {/* Members */}
                                {team.members.map((member: any, idx: number) => (
                                    <div
                                        key={idx}
                                        className={`flex items-center gap-2 md:gap-3 p-2 md:p-2.5 rounded-lg transition-colors`}
                                        style={{ background: "var(--navy)", border: "1px solid var(--border)" }}
                                    >
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0"
                                            style={{ background: "var(--navy-mid)", color: "var(--text-muted)" }}>
                                            M{idx + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs md:text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{member.name}</p>
                                            <p className="text-[10px] md:text-xs truncate" style={{ color: "var(--text-muted)" }}>{member.email}</p>
                                        </div>
                                        <span className={`badge flex justify-center items-center w-6 h-6 p-0 shrink-0 rounded-full ${team.checkedIn ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                            {team.checkedIn ? <Check size={14} /> : <X size={14} />}
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
