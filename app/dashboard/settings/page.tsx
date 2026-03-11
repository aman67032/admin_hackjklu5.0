"use client";

import { useEffect, useState, useRef } from "react";
import { Lock, ScrollText, CheckCircle, AlertTriangle } from "lucide-react";
import { settingsApi } from "@/lib/api";

export default function SettingsPage() {
    const [settings, setSettings] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState<any[]>([]);
    const [logsLoading, setLogsLoading] = useState(true);

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
