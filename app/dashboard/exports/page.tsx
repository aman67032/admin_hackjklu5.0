"use client";

import { useState } from "react";
import { exportsApi, downloadCSV } from "@/lib/api";

const exportTemplates = [
    { id: "all-teams", label: "All Teams", description: "Complete team data with all members", icon: "🛡️", endpoint: "teams", params: {} },
    { id: "complete-teams", label: "Complete Teams", description: "Only teams marked as complete", icon: "✅", endpoint: "teams", params: { status: "complete" } },
    { id: "checked-in", label: "Checked-in Participants", description: "All participants who have checked in", icon: "🏛️", endpoint: "participants", params: { checkedIn: "true" } },
    { id: "not-checked-in", label: "Not Checked-in", description: "Participants yet to check in", icon: "❌", endpoint: "participants", params: { checkedIn: "false" } },
    { id: "mess-food", label: "Mess Food Opted", description: "Participants who opted for mess food", icon: "🍽️", endpoint: "participants", params: { messFood: "true" } },
    { id: "all-participants", label: "All Participants (Individual)", description: "Every participant as individual rows", icon: "👤", endpoint: "participants", params: {} },
];

export default function ExportsPage() {
    const [downloading, setDownloading] = useState<string | null>(null);
    const [customFilters, setCustomFilters] = useState({ checkedIn: "", messFood: "" });

    const handleExport = async (id: string, endpoint: string, params: Record<string, string>) => {
        setDownloading(id);
        try {
            const csv = endpoint === "teams"
                ? await exportsApi.teams(params)
                : await exportsApi.participants(params);

            downloadCSV(csv, `hackjklu5_${id}_${new Date().toISOString().split('T')[0]}.csv`);
        } catch (err) {
            console.error(err);
        } finally {
            setDownloading(null);
        }
    };

    const handleCustomExport = async () => {
        setDownloading("custom");
        try {
            const params: Record<string, string> = {};
            Object.entries(customFilters).forEach(([k, v]) => { if (v) params[k] = v; });
            const csv = await exportsApi.participants(params);
            downloadCSV(csv, `hackjklu5_custom_${new Date().toISOString().split('T')[0]}.csv`);
        } catch (err) {
            console.error(err);
        } finally {
            setDownloading(null);
        }
    };

    return (
        <div className="page-container animate-fade-in pb-24 md:pb-0">
            {/* Header */}
            <div className="flex flex-col items-center text-center mb-10 md:mb-12 gap-3 md:gap-4">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-[0.1em] md:tracking-[0.25em] leading-tight"
                    style={{
                        fontFamily: "var(--font-display)",
                        background: "linear-gradient(135deg, var(--accent-orange) 0%, var(--accent-amber) 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        textShadow: "0 0 30px rgba(232, 98, 26, 0.4)"
                    }}>
                    SCROLLS OF KNOWLEDGE
                </h1>
                <p className="text-[10px] md:text-xs font-bold tracking-[0.15em] md:tracking-[0.3em] uppercase opacity-80 px-4" style={{ color: "var(--accent-amber)" }}>
                    Export data as CSV for logistics, reporting, and management of the realm
                </p>
                <div className="h-1 w-16 md:w-24 bg-gradient-to-r from-transparent via-orange-500/50 to-transparent mx-auto mt-2" />
            </div>

            {/* Pre-built Exports */}
            <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--gold)", fontFamily: "var(--font-display)" }}>
                Quick Exports
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                {exportTemplates.map((template) => (
                    <button
                        key={template.id}
                        onClick={() => handleExport(template.id, template.endpoint, template.params as Record<string, string>)}
                        disabled={downloading === template.id}
                        className="p-5 text-left rounded-2xl border transition-all group disabled:opacity-50"
                        style={{
                            background: "#111111",
                            borderColor: "rgba(232, 98, 26, 0.2)",
                            boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
                        }}
                    >
                        <span className="text-2xl block mb-3">{template.icon}</span>
                        <h3 className="text-sm font-semibold mb-1 group-hover:text-amber-300 transition-colors text-white" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}>
                            {template.label}
                        </h3>
                        <p className="text-xs" style={{ color: "var(--text-muted-alt)" }}>
                            {template.description}
                        </p>
                        {downloading === template.id && (
                            <div className="mt-3 flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--gold)", borderTopColor: "transparent" }} />
                                <span className="text-xs" style={{ color: "var(--gold)" }}>Generating...</span>
                            </div>
                        )}
                    </button>
                ))}
            </div>

            {/* Custom Export */}
            <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--gold)", fontFamily: "var(--font-display)" }}>
                ⚗️ Custom Export Builder
            </h2>
            <div className="p-6 rounded-2xl border mb-6"
                style={{
                    background: "#111111",
                    borderColor: "rgba(232, 98, 26, 0.2)",
                    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                }}>
                <p className="text-sm mb-4 font-medium text-white" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}>
                    Apply filters and export matching participants as CSV
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    <select
                        value={customFilters.checkedIn}
                        onChange={(e) => setCustomFilters(prev => ({ ...prev, checkedIn: e.target.value }))}
                        className="select-olympus py-3 text-sm"
                    >
                        <option value="">Check-in Status</option>
                        <option value="true">Checked In</option>
                        <option value="false">Not Checked In</option>
                    </select>
                    <select
                        value={customFilters.messFood}
                        onChange={(e) => setCustomFilters(prev => ({ ...prev, messFood: e.target.value }))}
                        className="select-olympus py-3 text-sm"
                    >
                        <option value="">Mess Food</option>
                        <option value="true">Opted In</option>
                        <option value="false">Not Opted</option>
                    </select>
                </div>
                <button
                    onClick={handleCustomExport}
                    disabled={downloading === "custom"}
                    className="btn-gold flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                    {downloading === "custom" ? (
                        <>
                            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>📥 Export Filtered CSV</>
                    )}
                </button>
            </div>
        </div>
    );
}
