"use client";

import { useEffect, useState, useRef } from "react";
import { Lock, Download, Upload, UserPlus, ScrollText, CheckCircle, AlertTriangle, Database } from "lucide-react";
import { settingsApi, teamsApi, authApi } from "@/lib/api";

export default function SettingsPage() {
    const [settings, setSettings] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState<any[]>([]);
    const [logsLoading, setLogsLoading] = useState(true);
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [newAdmin, setNewAdmin] = useState({ username: "", password: "", role: "volunteer" });
    const [adminMsg, setAdminMsg] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadSettings();
        loadLogs();
    }, []);

    const loadSettings = async () => {
        try {
            const data = await settingsApi.get();
            setSettings(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadLogs = async () => {
        try {
            const data = await settingsApi.logs({ limit: "30" });
            setLogs(data.logs);
        } catch (err) {
            console.error(err);
        } finally {
            setLogsLoading(false);
        }
    };

    const toggleRegistrationLock = async () => {
        try {
            const updated = await settingsApi.update({ registrationLocked: !settings.registrationLocked });
            setSettings(updated);
            loadLogs();
        } catch (err) {
            console.error(err);
        }
    };

    const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImporting(true);
        setImportResult(null);

        try {
            const text = await file.text();
            const lines = text.split('\n').filter(l => l.trim());
            if (lines.length < 2) {
                setImportResult({ type: 'error', message: "CSV file is empty or has no data rows" });
                return;
            }

            const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
            const teamsMap = new Map<string, any>();

            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].match(/(".*?"|[^,]+)/g)?.map(v => v.replace(/^"|"$/g, '').trim()) || [];

                const getValue = (name: string) => {
                    const idx = headers.findIndex(h => h.toLowerCase().includes(name.toLowerCase()));
                    return idx >= 0 ? values[idx] || '' : '';
                };

                const teamName = getValue('team') || `Team ${i}`;
                const name = getValue('name') || getValue('first name') || '';
                const email = getValue('email') || '';
                if (!name) continue;

                const participantData = {
                    name,
                    email,
                    phone: getValue('phone'),
                    college: getValue('college') || getValue('education'),
                    batch: getValue('batch'),
                    course: getValue('course'),

                    messFood: getValue('mess')?.toLowerCase() === 'true',
                    gender: getValue('gender'),
                    bio: getValue('bio'),
                    city: getValue('city'),
                    education: getValue('education'),
                    domainExpertise: getValue('domain expertise'),
                    skills: getValue('skills') ? getValue('skills').split(',').map((s: string) => s.trim()) : [],
                    resume: getValue('resume'),
                    github: getValue('github'),
                    linkedin: getValue('linkedin'),
                };

                if (!teamsMap.has(teamName)) {
                    // Create team with leader
                    teamsMap.set(teamName, {
                        teamName,
                        themes: getValue('theme') ? getValue('theme').split(',').map((t: string) => t.trim()) : [],
                        status: 'incomplete',
                        leaderName: participantData.name,
                        leaderEmail: participantData.email,
                        leaderPhone: participantData.phone,
                        leaderCollege: participantData.college,
                        leaderBatch: participantData.batch,
                        leaderCourse: participantData.course,

                        leaderMessFood: participantData.messFood,
                        leaderGender: participantData.gender,
                        leaderBio: participantData.bio,
                        leaderCity: participantData.city,
                        leaderEducation: participantData.education,
                        leaderDomainExpertise: participantData.domainExpertise,
                        leaderSkills: participantData.skills,
                        leaderResume: participantData.resume,
                        leaderGithub: participantData.github,
                        leaderLinkedin: participantData.linkedin,
                        members: []
                    });
                } else {
                    // Add as member
                    const team = teamsMap.get(teamName);
                    team.members.push({
                        ...participantData,

                    });
                    if (team.members.length >= 2) team.status = 'complete'; // Rough estimate
                }
            }

            const teams = Array.from(teamsMap.values());

            if (teams.length === 0) {
                setImportResult({ type: 'error', message: "No valid teams found in CSV" });
                return;
            }

            const result = await teamsApi.import(teams);
            setImportResult({ type: 'success', message: `Imported ${result.count} teams successfully!` });
            loadLogs();
        } catch (err: any) {
            setImportResult({ type: 'error', message: err.message });
        } finally {
            setImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const createAdmin = async () => {
        setAdminMsg(null);
        try {
            if (!newAdmin.username || !newAdmin.password) {
                setAdminMsg({ type: 'error', message: "Username and password are required" });
                return;
            }
            await authApi.createAdmin(newAdmin.username, newAdmin.password, newAdmin.role);
            setAdminMsg({ type: 'success', message: `Admin "${newAdmin.username}" created as ${newAdmin.role}` });
            setNewAdmin({ username: "", password: "", role: "volunteer" });
            loadLogs();
        } catch (err: any) {
            setAdminMsg({ type: 'error', message: err.message });
        }
    };

    return (
        <div className="page-container animate-fade-in pb-24 md:pb-0">
            {/* Header */}
            <div className="flex flex-col items-center text-center mb-10 md:mb-12 gap-3 md:gap-4">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-[0.1em] md:tracking-[0.25em] leading-tight px-2"
                    style={{
                        fontFamily: "var(--font-display)",
                        background: "linear-gradient(135deg, var(--accent-orange) 0%, var(--accent-amber) 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        textShadow: "0 0 30px rgba(232, 98, 26, 0.4)"
                    }}>
                    ORACLE SETTINGS
                </h1>
                <p className="text-xs font-bold tracking-[0.3em] uppercase opacity-80" style={{ color: "var(--accent-amber)" }}>
                    Configuration, data import, and system management from the celestial summit
                </p>
                <div className="h-1 w-24 bg-gradient-to-r from-transparent via-orange-500/50 to-transparent mx-auto mt-2" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Dashboard Control Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
                    {/* Registration Lock */}
                    <div className="p-6 rounded-2xl border transition-all"
                        style={{
                            background: "#111111",
                            borderColor: "rgba(232, 98, 26, 0.2)",
                            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                        }}>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-lg" style={{ background: "rgba(232, 98, 26, 0.1)", color: "var(--accent-orange)" }}>
                                <Lock size={20} />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold uppercase tracking-wider text-white" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}>The Pillars of Order</h2>
                                <p className="text-[10px] uppercase tracking-tighter" style={{ color: "var(--accent-amber)" }}>Global Registration Controls</p>
                            </div>
                        </div>
                        {loading ? (
                            <div className="skeleton h-12 rounded-lg" />
                        ) : (
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-white" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}>Registration Lock</p>
                                    <p className="text-xs text-gray-300" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}>
                                        {settings?.registrationLocked ? "Registration is currently locked" : "Registration is currently open"}
                                    </p>
                                </div>
                                <button
                                    onClick={toggleRegistrationLock}
                                    className={`toggle-switch ${settings?.registrationLocked ? 'active' : ''}`}
                                    aria-label="Toggle registration lock"
                                />
                            </div>
                        )}
                    </div>

                    {/* Data Management */}
                    <div className="p-6 rounded-2xl border transition-all"
                        style={{
                            background: "#111111",
                            borderColor: "rgba(232, 98, 26, 0.2)",
                            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                        }}>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-lg" style={{ background: "rgba(232, 98, 26, 0.1)", color: "var(--accent-orange)" }}>
                                <Database size={20} />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold uppercase tracking-wider text-white" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}>Data Forge</h2>
                                <p className="text-[10px] uppercase tracking-tighter" style={{ color: "var(--accent-amber)" }}>Bulk Import & Management</p>
                            </div>
                        </div>
                        <p className="text-xs mb-3 text-gray-300" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}>
                            Upload a CSV file to bulk-import teams. The CSV should have columns for team name, leader details, etc.
                        </p>
                        <input
                            type="file"
                            ref={fileInputRef}
                            accept=".csv"
                            onChange={handleCSVImport}
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={importing}
                            className="btn-gold flex items-center gap-2"
                        >
                            {importing ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    Importing...
                                </>
                            ) : (
                                <><Upload size={16} /> Upload CSV</>
                            )}
                        </button>
                        {importResult && (
                            <p className="text-sm mt-3 p-3 rounded-lg flex items-center gap-2" style={{
                                background: importResult.type === 'success' ? "var(--success-bg)" : "var(--danger-bg)",
                                color: importResult.type === 'success' ? "var(--success)" : "var(--danger)",
                            }}>
                                {importResult.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                                {importResult.message}
                            </p>
                        )}
                    </div>

                    {/* Create Admin */}
                    <div className="glass-card p-6">
                        <h3 className="text-sm font-semibold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: "var(--gold)", fontFamily: "var(--font-display)" }}>
                            <UserPlus size={18} /> Create Admin Account
                        </h3>
                        <div className="space-y-3">
                            <input
                                value={newAdmin.username}
                                onChange={(e) => setNewAdmin(prev => ({ ...prev, username: e.target.value }))}
                                className="input-olympus"
                                placeholder="Username"
                            />
                            <input
                                type="password"
                                value={newAdmin.password}
                                onChange={(e) => setNewAdmin(prev => ({ ...prev, password: e.target.value }))}
                                className="input-olympus"
                                placeholder="Password"
                            />
                            <select
                                value={newAdmin.role}
                                onChange={(e) => setNewAdmin(prev => ({ ...prev, role: e.target.value }))}
                                className="select-olympus w-full"
                            >
                                <option value="viewer">Viewer</option>
                                <option value="volunteer">Volunteer</option>
                                <option value="superadmin">Super Admin</option>
                            </select>
                            <button onClick={createAdmin} className="btn-gold">Create Admin</button>
                            {adminMsg && (
                                <p className="text-sm p-3 rounded-lg flex items-center gap-2" style={{
                                    background: adminMsg.type === 'success' ? "var(--success-bg)" : "var(--danger-bg)",
                                    color: adminMsg.type === 'success' ? "var(--success)" : "var(--danger)",
                                }}>
                                    {adminMsg.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                                    {adminMsg.message}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column — Activity Logs */}
                <div className="glass-card p-6">
                    <h3 className="text-sm font-semibold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: "var(--gold)", fontFamily: "var(--font-display)" }}>
                        <ScrollText size={18} /> The Chronicles — Activity Logs
                    </h3>
                    {logsLoading ? (
                        <div className="space-y-2">
                            {[...Array(10)].map((_, i) => <div key={i} className="skeleton h-12 rounded-lg" />)}
                        </div>
                    ) : logs.length === 0 ? (
                        <p className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>No chronicles recorded yet</p>
                    ) : (
                        <div className="space-y-2 max-h-[70vh] overflow-y-auto">
                            {logs.map((log: any, idx: number) => (
                                <div key={idx} className="p-3 rounded-lg" style={{ background: "var(--navy)" }}>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                                                {log.action.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                                            </p>
                                            <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                                                {log.details}
                                            </p>
                                        </div>
                                        <div className="text-right flex-shrink-0 ml-3">
                                            <p className="text-xs" style={{ color: "var(--gold-dim)" }}>{log.performedBy}</p>
                                            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                                {new Date(log.timestamp).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
