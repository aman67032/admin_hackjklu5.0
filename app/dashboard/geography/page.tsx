"use client";

import { useEffect, useState } from "react";
import { MapPin, Users, ChevronDown, ChevronUp } from "lucide-react";
import { geographyApi } from "@/lib/api";
import STATE_PATHS from "./paths.json";
import STATE_CENTERS from "./centers.json";

// State ID to name mapping (matches SVG path IDs)
const STATE_ID_MAP: Record<string, string> = {
    "INAP": "Andhra Pradesh", "INAR": "Arunachal Pradesh", "INAS": "Assam",
    "INBR": "Bihar", "INCT": "Chhattisgarh", "INGA": "Goa",
    "INGJ": "Gujarat", "INHR": "Haryana", "INHP": "Himachal Pradesh",
    "INJH": "Jharkhand", "INKA": "Karnataka", "INKL": "Kerala",
    "INMP": "Madhya Pradesh", "INMH": "Maharashtra", "INMN": "Manipur",
    "INML": "Meghalaya", "INMZ": "Mizoram", "INNL": "Nagaland",
    "INOR": "Odisha", "INPB": "Punjab", "INRJ": "Rajasthan",
    "INSK": "Sikkim", "INTN": "Tamil Nadu", "INTG": "Telangana",
    "INTR": "Tripura", "INUP": "Uttar Pradesh", "INUT": "Uttarakhand",
    "INWB": "West Bengal", "INDL": "Delhi", "INJK": "Jammu & Kashmir",
    "INLA": "Ladakh", "INAN": "Andaman & Nicobar", "INCH": "Chandigarh",
    "INDH": "Dadra & Nagar Haveli", "INDD": "Daman & Diu", "INLD": "Lakshadweep",
    "INPY": "Puducherry"
};

// Reverse map: state name -> state ID
const NAME_TO_ID: Record<string, string> = {};
Object.entries(STATE_ID_MAP).forEach(([id, name]) => { NAME_TO_ID[name] = id; });

interface StateData {
    state: string;
    count: number;
    cities: { city: string; count: number }[];
}

// Simplified India SVG state paths (viewBox: 0 0 800 900)
// Now using STATE_PATHS from paths.json

function getColor(count: number, maxCount: number): string {
    if (count === 0 || maxCount === 0) return "rgba(255, 255, 255, 0.05)";
    const intensity = Math.max(0.15, Math.min(1, count / maxCount));
    const r = Math.round(232 * intensity + 40 * (1 - intensity));
    const g = Math.round(98 * intensity + 30 * (1 - intensity));
    const b = Math.round(26 * intensity + 15 * (1 - intensity));
    return `rgba(${r}, ${g}, ${b}, ${0.3 + intensity * 0.7})`;
}

export default function GeographyPage() {
    const [data, setData] = useState<{ totalParticipants: number; states: StateData[] } | null>(null);
    const [loading, setLoading] = useState(true);
    const [hoveredState, setHoveredState] = useState<string | null>(null);
    const [selectedState, setSelectedState] = useState<string | null>(null);
    const [expandedStates, setExpandedStates] = useState<Set<string>>(new Set());

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const result = await geographyApi.get();
            setData(result);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const stateCountMap: Record<string, number> = {};
    const stateCitiesMap: Record<string, StateData> = {};
    data?.states.forEach((s) => {
        stateCountMap[s.state] = s.count;
        stateCitiesMap[s.state] = s;
    });

    const maxCount = data?.states?.[0]?.count || 1;

    const getStateCount = (stateId: string): number => {
        const stateName = STATE_ID_MAP[stateId];
        return stateName ? (stateCountMap[stateName] || 0) : 0;
    };

    const toggleExpand = (state: string) => {
        setExpandedStates(prev => {
            const next = new Set(prev);
            if (next.has(state)) next.delete(state);
            else next.add(state);
            return next;
        });
    };

    if (loading) {
        return (
            <div className="page-container animate-fade-in">
                <div className="flex flex-col items-center text-center mb-12">
                    <div className="skeleton h-12 w-80 mb-4" />
                    <div className="skeleton h-4 w-48" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="skeleton h-[500px] rounded-2xl" />
                    <div className="skeleton h-[500px] rounded-2xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="page-container animate-fade-in">
            {/* Header */}
            <div className="flex flex-col items-center text-center mb-12 gap-4">
                <h1 className="text-6xl font-bold tracking-[0.2em] leading-tight"
                    style={{
                        fontFamily: "var(--font-display)",
                        background: "linear-gradient(135deg, var(--accent-orange) 0%, var(--accent-amber) 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        textShadow: "0 0 20px rgba(232, 98, 26, 0.3)"
                    }}>
                    REALM MAP
                </h1>
                <p className="text-xs font-bold tracking-[0.3em] uppercase opacity-80" style={{ color: "var(--accent-amber)" }}>
                    {data?.totalParticipants || 0} participants mapped across India
                </p>
                <div className="h-1 w-24 bg-gradient-to-r from-transparent via-orange-500/50 to-transparent mx-auto" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Map */}
                <div className="lg:col-span-3 p-6 rounded-2xl border relative"
                    style={{
                        background: "rgba(0, 0, 0, 0.4)",
                        borderColor: "rgba(232, 98, 26, 0.25)",
                        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
                    }}>
                    <svg viewBox="0 0 1000 1000" className="w-full h-auto" style={{ maxHeight: "70vh" }}>
                        {Object.entries(STATE_PATHS).map(([stateId, path]) => {
                            const count = getStateCount(stateId);
                            const stateName = STATE_ID_MAP[stateId] || stateId;
                            const isHovered = hoveredState === stateId;
                            const isSelected = selectedState === stateId;

                            return (
                                <g key={stateId}>
                                    <path
                                        d={path}
                                        fill={getColor(count, maxCount)}
                                        stroke={isHovered || isSelected ? "var(--accent-amber)" : "rgba(232, 98, 26, 0.3)"}
                                        strokeWidth={isHovered || isSelected ? 2.5 : 1}
                                        style={{
                                            cursor: "pointer",
                                            transition: "all 0.2s ease",
                                            filter: isHovered ? "brightness(1.3) drop-shadow(0 0 8px rgba(232,98,26,0.5))" : "none",
                                        }}
                                        onMouseEnter={() => setHoveredState(stateId)}
                                        onMouseLeave={() => setHoveredState(null)}
                                        onClick={() => setSelectedState(isSelected ? null : stateId)}
                                    />
                                    {count > 0 && STATE_CENTERS[stateId as keyof typeof STATE_CENTERS] && (
                                        <text
                                            x={(STATE_CENTERS as any)[stateId].x}
                                            y={(STATE_CENTERS as any)[stateId].y}
                                            textAnchor="middle"
                                            dominantBaseline="central"
                                            style={{
                                                fontSize: "16px",
                                                fill: "white",
                                                fontWeight: 800,
                                                pointerEvents: "none",
                                                textShadow: "0 2px 6px rgba(0,0,0,0.9)",
                                            }}
                                        >
                                            {count}
                                        </text>
                                    )}
                                </g>
                            );
                        })}
                    </svg>

                    {/* Tooltip */}
                    {hoveredState && (
                        <div
                            className="absolute top-4 right-4 p-4 rounded-xl border backdrop-blur-md z-10"
                            style={{
                                background: "rgba(0, 0, 0, 0.85)",
                                borderColor: "rgba(232, 98, 26, 0.4)",
                            }}
                        >
                            <p className="text-sm font-bold text-white mb-1">{STATE_ID_MAP[hoveredState]}</p>
                            <p className="text-xs" style={{ color: "var(--accent-amber)" }}>
                                {getStateCount(hoveredState)} registrations
                            </p>
                        </div>
                    )}

                    {/* Legend */}
                    <div className="flex items-center gap-3 mt-4 justify-center">
                        <span className="text-[10px] uppercase tracking-wider font-bold" style={{ color: "var(--text-muted)" }}>Fewer</span>
                        <div className="flex gap-0.5">
                            {[0.1, 0.25, 0.4, 0.55, 0.7, 0.85, 1].map((intensity, i) => (
                                <div
                                    key={i}
                                    className="w-8 h-3 rounded-sm"
                                    style={{
                                        background: `rgba(${Math.round(232 * intensity + 40 * (1 - intensity))}, ${Math.round(98 * intensity + 30 * (1 - intensity))}, ${Math.round(26 * intensity + 15 * (1 - intensity))}, ${0.3 + intensity * 0.7})`,
                                    }}
                                />
                            ))}
                        </div>
                        <span className="text-[10px] uppercase tracking-wider font-bold" style={{ color: "var(--accent-amber)" }}>More</span>
                    </div>
                </div>

                {/* State List */}
                <div className="lg:col-span-2 p-6 rounded-2xl border overflow-hidden"
                    style={{
                        background: "rgba(0, 0, 0, 0.4)",
                        borderColor: "rgba(232, 98, 26, 0.25)",
                        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
                    }}>
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] mb-6 flex items-center gap-3"
                        style={{ color: "var(--accent-orange)", fontFamily: "var(--font-display)" }}>
                        <MapPin size={16} /> State-wise Registrations
                    </h3>

                    <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2" style={{ scrollbarWidth: "thin" }}>
                        {data?.states.map((stateData, idx) => {
                            const isExpanded = expandedStates.has(stateData.state);
                            const pct = data.totalParticipants > 0 ? ((stateData.count / data.totalParticipants) * 100) : 0;
                            const stateId = NAME_TO_ID[stateData.state];

                            return (
                                <div key={stateData.state}
                                    className="rounded-xl border overflow-hidden transition-all duration-200"
                                    style={{
                                        background: selectedState === stateId ? "rgba(232, 98, 26, 0.15)" : "rgba(0, 0, 0, 0.3)",
                                        borderColor: selectedState === stateId ? "rgba(232, 98, 26, 0.4)" : "rgba(255, 255, 255, 0.05)",
                                    }}
                                    onMouseEnter={() => stateId && setHoveredState(stateId)}
                                    onMouseLeave={() => setHoveredState(null)}
                                    onClick={() => stateId && setSelectedState(selectedState === stateId ? null : stateId)}
                                >
                                    <button
                                        onClick={(e) => { e.stopPropagation(); toggleExpand(stateData.state); }}
                                        className="w-full p-3 flex items-center justify-between text-left group"
                                    >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <span className="text-xs font-bold w-6 text-center" style={{ color: "var(--accent-amber)" }}>
                                                {idx + 1}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-white truncate">{stateData.state}</p>
                                                <div className="w-full h-1 mt-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                                                    <div className="h-full rounded-full" style={{
                                                        width: `${pct}%`,
                                                        background: "linear-gradient(90deg, var(--accent-orange), var(--accent-amber))",
                                                        transition: "width 0.6s ease",
                                                    }} />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                                            <div className="flex items-center gap-1">
                                                <Users size={12} style={{ color: "var(--accent-amber)" }} />
                                                <span className="text-sm font-bold" style={{ color: "var(--accent-orange)" }}>{stateData.count}</span>
                                            </div>
                                            <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>({pct.toFixed(1)}%)</span>
                                            {stateData.cities.length > 0 && (
                                                isExpanded ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />
                                            )}
                                        </div>
                                    </button>

                                    {isExpanded && stateData.cities.length > 0 && (
                                        <div className="px-3 pb-3 pl-12">
                                            <div className="space-y-1 pt-2 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                                                {stateData.cities.map((city) => (
                                                    <div key={city.city} className="flex items-center justify-between py-1">
                                                        <span className="text-xs text-gray-300">{city.city}</span>
                                                        <span className="text-xs font-mono font-bold" style={{ color: "var(--accent-amber)" }}>{city.count}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {(!data?.states || data.states.length === 0) && (
                            <p className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>
                                No geographic data available yet
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// EOF
