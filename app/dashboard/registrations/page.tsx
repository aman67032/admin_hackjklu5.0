"use client";

import { useEffect, useState, useCallback } from "react";
import { Shield, User, Search, Github, Linkedin, FileText, Check, X, ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";
import { teamsApi } from "@/lib/api";

export default function RegistrationsPage() {
    const [teams, setTeams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, limit: 30, total: 0, pages: 0 });
    const [search, setSearch] = useState("");
    const [filters, setFilters] = useState({ city: "", college: "", checkedIn: "" });
    const [viewMode, setViewMode] = useState<"team" | "individual">("team");
    const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

    const loadTeams = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params: Record<string, string> = { page: String(page), limit: "30" };
            if (search) params.search = search;
            Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });

            const data = await teamsApi.list(params);
            setTeams(data.teams);
            setPagination(data.pagination);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [search, filters]);

    useEffect(() => { loadTeams(); }, [loadTeams]);

    const handleSearchChange = (val: string) => {
        setSearch(val);
        if (searchTimeout) clearTimeout(searchTimeout);
        setSearchTimeout(setTimeout(() => loadTeams(1), 400));
    };

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const toggleCheckin = async (teamId: string, target: string, memberIndex?: number) => {
        try {
            await teamsApi.checkin(teamId, target, memberIndex);
            loadTeams(pagination.page);
        } catch (err) {
            console.error(err);
        }
    };

    // Collect unique cities and colleges for filter dropdowns
    const allCities = new Set<string>();
    const allColleges = new Set<string>();
    teams.forEach(team => {
        if (team.leaderCity) allCities.add(team.leaderCity);
        if (team.leaderCollege) allColleges.add(team.leaderCollege);
        team.members?.forEach((m: any) => {
            if (m.city) allCities.add(m.city);
            if (m.college) allColleges.add(m.college);
        });
    });

    // Flatten teams into participants for individual view
    const participants = viewMode === "individual"
        ? teams.flatMap(team => [
            {
                ...team,
                _participantName: team.leaderName,
                _participantEmail: team.leaderEmail,
                _participantCollege: team.leaderCollege,
                _participantCity: team.leaderCity,
                _participantGender: team.leaderGender,
                _participantBio: team.leaderBio,
                _devfolioProfile: team.devfolioProfile,
                _checkedIn: team.leaderCheckedIn,
                _isRsvp: team.leaderIsRsvp,
                _github: team.leaderGithub,
                _linkedin: team.leaderLinkedin,
                _resume: team.leaderResume,
                _role: "Leader",
                _teamId: team._id,
                _memberIndex: -1,
            },
            ...team.members.map((m: any, i: number) => ({
                ...team,
                _participantName: m.name,
                _participantEmail: m.email,
                _participantCollege: m.college,
                _participantCity: m.city,
                _participantGender: m.gender,
                _participantBio: m.bio,
                _devfolioProfile: m.devfolioProfile,
                _checkedIn: m.checkedIn,
                _isRsvp: m.isRsvp,
                _github: m.github,
                _linkedin: m.linkedin,
                _resume: m.resume,
                _role: "Member",
                _teamId: team._id,
                _memberIndex: i,
            })),
        ])
        : [];

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
                        THE REGISTRY
                    </h1>
                    <p className="text-[10px] md:text-xs mt-2 md:mt-3 font-bold tracking-[0.15em] md:tracking-[0.3em] uppercase opacity-80" style={{ color: "var(--accent-amber)" }}>
                        {pagination.total} total registrations
                    </p>
                </div>
                <div className="flex items-center gap-2 p-1 rounded-xl bg-orange-500/5 backdrop-blur-sm border border-orange-500/10">
                    <button className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-all duration-300 ${viewMode === "team" ? "btn-gold shadow-lg shadow-orange-500/20" : "btn-ghost opacity-60 hover:opacity-100"}`} onClick={() => setViewMode("team")}>
                        <Shield size={16} /> Teams
                    </button>
                    <button className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-all duration-300 ${viewMode === "individual" ? "btn-gold shadow-lg shadow-orange-500/20" : "btn-ghost opacity-60 hover:opacity-100"}`} onClick={() => setViewMode("individual")}>
                        <User size={16} /> Individual
                    </button>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="p-4 md:p-5 mb-6 md:mb-8 rounded-2xl border transition-all duration-300 mx-auto w-full max-w-4xl"
                style={{
                    background: "#111111",
                    borderColor: "rgba(232, 98, 26, 0.2)",
                    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
                }}>
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="input-olympus w-full pl-10"
                            placeholder="Search by name, email, or team name..."
                        />
                    </div>
                    <select value={filters.college} onChange={(e) => handleFilterChange("college", e.target.value)} className="select-olympus">
                        <option value="">All Colleges</option>
                        {[...allColleges].sort().map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                    <select value={filters.city} onChange={(e) => handleFilterChange("city", e.target.value)} className="select-olympus">
                        <option value="">All Cities</option>
                        {[...allCities].sort().map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                    <select value={filters.checkedIn} onChange={(e) => handleFilterChange("checkedIn", e.target.value)} className="select-olympus">
                        <option value="">Check-in Status</option>
                        <option value="true">Checked In</option>
                        <option value="false">Not Checked In</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="space-y-3">
                    {[...Array(8)].map((_, i) => <div key={i} className="skeleton h-14 rounded-lg" />)}
                </div>
            ) : viewMode === "team" ? (
                /* Team View */
                <div className="space-y-4">
                    {teams.length === 0 ? (
                        <div className="p-16 text-center rounded-2xl border"
                            style={{
                                background: "var(--card-bg-alt)",
                                borderColor: "var(--card-border-alt)"
                            }}>
                            <p className="text-xl mb-2 font-bold tracking-wider" style={{ fontFamily: "var(--font-display)", color: "var(--accent-orange)" }}>The Oracle sees no data...</p>
                            <p className="text-sm font-medium" style={{ color: "var(--text-secondary-alt)" }}>No teams match your current filters</p>
                        </div>
                    ) : (
                        teams.map((team) => (
                            <div key={team._id} className="p-6 rounded-2xl border mb-4"
                                style={{
                                    background: "#111111",
                                    borderColor: "rgba(232, 98, 26, 0.2)",
                                    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                                }}>
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 border-b border-orange-500/30 pb-4 gap-3">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2 md:gap-3">
                                            <h3 className="font-bold text-lg md:text-xl tracking-wide text-white break-all" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>{team.teamName}</h3>
                                            {team.teamNumber && <span className="badge badge-gold px-2 md:px-3">#{team.teamNumber}</span>}
                                            <span className={`badge px-2 md:px-3 ${team.status === 'complete' ? 'badge-success' : team.status === 'disqualified' ? 'badge-danger' : 'badge-muted'}`}>
                                                {team.status}
                                            </span>
                                            {team.teamFullyRsvp && <span className="badge px-2 md:px-3 badge-success">RSVP ✓</span>}
                                        </div>
                                        {team.roomNumber && <p className="text-[10px] md:text-xs mt-2 font-bold tracking-widest uppercase" style={{ color: "var(--accent-amber)" }}>Room: {team.roomNumber}</p>}
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="olympus-table">
                                        <thead>
                                            <tr>
                                                <th>Role</th>
                                                <th>Name</th>
                                                <th>Email</th>
                                                <th>College</th>
                                                <th>City</th>
                                                <th>Gender</th>
                                                <th>RSVP</th>
                                                <th>Links</th>
                                                <th>Check-in</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td><span className="badge badge-gold">Leader</span></td>
                                                <td style={{ color: "var(--text-primary)", fontWeight: 500 }}>{team.leaderName}</td>
                                                <td>{team.leaderEmail}</td>
                                                <td>{team.leaderCollege || '—'}</td>
                                                <td>{team.leaderCity || '—'}</td>
                                                <td>{team.leaderGender || '—'}</td>
                                                <td>
                                                    <span className={`badge ${team.leaderIsRsvp ? 'badge-success' : 'badge-muted'}`}>
                                                        {team.leaderIsRsvp ? 'Yes' : 'No'}
                                                    </span>
                                                </td>
                                                <td className="flex gap-3 text-lg">
                                                    {team.devfolioProfile && <a href={`https://devfolio.co/@${team.devfolioProfile}`} target="_blank" title="Devfolio" className="text-blue-400 hover:text-blue-300 transition-colors"><ExternalLink size={18} /></a>}
                                                    {team.leaderGithub && <a href={team.leaderGithub} target="_blank" title="GitHub" className="text-gray-400 hover:text-white transition-colors"><Github size={18} /></a>}
                                                    {team.leaderLinkedin && <a href={team.leaderLinkedin} target="_blank" title="LinkedIn" className="text-gray-400 hover:text-white transition-colors"><Linkedin size={18} /></a>}
                                                    {team.leaderResume && <a href={team.leaderResume} target="_blank" title="Resume" className="text-gold hover:text-yellow-300 transition-colors"><FileText size={18} /></a>}
                                                </td>
                                                <td>
                                                    <button
                                                        onClick={() => toggleCheckin(team._id, "leader")}
                                                        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1 w-[70px] ${team.leaderCheckedIn ? 'bg-green-500/20 text-green-400' : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'}`}
                                                    >
                                                        {team.leaderCheckedIn ? <><Check size={14} /> In</> : <><X size={14} /> Out</>}
                                                    </button>
                                                </td>
                                            </tr>
                                            {team.members.map((member: any, idx: number) => (
                                                <tr key={idx}>
                                                    <td><span className="badge badge-muted">Member</span></td>
                                                    <td style={{ color: "var(--text-primary)" }}>{member.name}</td>
                                                    <td>{member.email}</td>
                                                    <td>{member.college || '—'}</td>
                                                    <td>{member.city || '—'}</td>
                                                    <td>{member.gender || '—'}</td>
                                                    <td>
                                                        <span className={`badge ${member.isRsvp ? 'badge-success' : 'badge-muted'}`}>
                                                            {member.isRsvp ? 'Yes' : 'No'}
                                                        </span>
                                                    </td>
                                                    <td className="flex gap-3 text-lg">
                                                        {member.devfolioProfile && <a href={`https://devfolio.co/@${member.devfolioProfile}`} target="_blank" title="Devfolio" className="text-blue-400 hover:text-blue-300 transition-colors"><ExternalLink size={18} /></a>}
                                                        {member.github && <a href={member.github} target="_blank" title="GitHub" className="text-gray-400 hover:text-white transition-colors"><Github size={18} /></a>}
                                                        {member.linkedin && <a href={member.linkedin} target="_blank" title="LinkedIn" className="text-gray-400 hover:text-white transition-colors"><Linkedin size={18} /></a>}
                                                        {member.resume && <a href={member.resume} target="_blank" title="Resume" className="text-gold hover:text-yellow-300 transition-colors"><FileText size={18} /></a>}
                                                    </td>
                                                    <td>
                                                        <button
                                                            onClick={() => toggleCheckin(team._id, "member", idx)}
                                                            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1 w-[70px] ${member.checkedIn ? 'bg-green-500/20 text-green-400' : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'}`}
                                                        >
                                                            {member.checkedIn ? <><Check size={14} /> In</> : <><X size={14} /> Out</>}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                /* Individual View */
                <div className="glass-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="olympus-table">
                            <thead>
                                <tr>
                                    <th>Team</th>
                                    <th>Role</th>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>College</th>
                                    <th>City</th>
                                    <th>Gender</th>
                                    <th>RSVP</th>
                                    <th>Links</th>
                                    <th>Check-in</th>
                                </tr>
                            </thead>
                            <tbody>
                                {participants.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="text-center py-8" style={{ color: "var(--text-muted)" }}>
                                            No participants found
                                        </td>
                                    </tr>
                                ) : (
                                    participants.map((p, idx) => (
                                        <tr key={idx}>
                                            <td style={{ color: "var(--text-primary)" }}>{p.teamName}</td>
                                            <td><span className={`badge ${p._role === 'Leader' ? 'badge-gold' : 'badge-muted'}`}>{p._role}</span></td>
                                            <td style={{ color: "var(--text-primary)" }}>{p._participantName}</td>
                                            <td>{p._participantEmail}</td>
                                            <td>{p._participantCollege || '—'}</td>
                                            <td>{p._participantCity || '—'}</td>
                                            <td>{p._participantGender || '—'}</td>
                                            <td>
                                                <span className={`badge ${p._isRsvp ? 'badge-success' : 'badge-muted'}`}>
                                                    {p._isRsvp ? 'Yes' : 'No'}
                                                </span>
                                            </td>
                                            <td className="flex gap-3 text-lg">
                                                {p._devfolioProfile && <a href={`https://devfolio.co/@${p._devfolioProfile}`} target="_blank" title="Devfolio" className="text-blue-400 hover:text-blue-300 transition-colors"><ExternalLink size={18} /></a>}
                                                {p._github && <a href={p._github} target="_blank" title="GitHub" className="text-gray-400 hover:text-white transition-colors"><Github size={18} /></a>}
                                                {p._linkedin && <a href={p._linkedin} target="_blank" title="LinkedIn" className="text-gray-400 hover:text-white transition-colors"><Linkedin size={18} /></a>}
                                                {p._resume && <a href={p._resume} target="_blank" title="Resume" className="text-gold hover:text-yellow-300 transition-colors"><FileText size={18} /></a>}
                                            </td>
                                            <td>
                                                <button
                                                    onClick={() => toggleCheckin(p._teamId, p._memberIndex === -1 ? "leader" : "member", p._memberIndex === -1 ? undefined : p._memberIndex)}
                                                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1 w-[70px] ${p._checkedIn ? 'bg-green-500/20 text-green-400' : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'}`}
                                                >
                                                    {p._checkedIn ? <><Check size={14} /> In</> : <><X size={14} /> Out</>}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                    <button
                        disabled={pagination.page <= 1}
                        onClick={() => loadTeams(pagination.page - 1)}
                        className="btn-ghost px-3 py-2 text-sm disabled:opacity-30 flex items-center gap-2"
                    >
                        <ArrowLeft size={16} /> Previous
                    </button>
                    <span className="text-sm px-4" style={{ color: "var(--text-muted)" }}>
                        Page {pagination.page} of {pagination.pages}
                    </span>
                    <button
                        disabled={pagination.page >= pagination.pages}
                        onClick={() => loadTeams(pagination.page + 1)}
                        className="btn-ghost px-3 py-2 text-sm disabled:opacity-30 flex items-center gap-2"
                    >
                        Next <ArrowRight size={16} />
                    </button>
                </div>
            )}
        </div>
    );
}
