"use client";

import { useEffect, useState } from "react";
import { MapPin, Users, ChevronDown, ChevronUp } from "lucide-react";
import { geographyApi } from "@/lib/api";

// State ID to name mapping (matches SVG path IDs)
const STATE_ID_MAP: Record<string, string> = {
    "IN-AP": "Andhra Pradesh", "IN-AR": "Arunachal Pradesh", "IN-AS": "Assam",
    "IN-BR": "Bihar", "IN-CT": "Chhattisgarh", "IN-GA": "Goa",
    "IN-GJ": "Gujarat", "IN-HR": "Haryana", "IN-HP": "Himachal Pradesh",
    "IN-JH": "Jharkhand", "IN-KA": "Karnataka", "IN-KL": "Kerala",
    "IN-MP": "Madhya Pradesh", "IN-MH": "Maharashtra", "IN-MN": "Manipur",
    "IN-ML": "Meghalaya", "IN-MZ": "Mizoram", "IN-NL": "Nagaland",
    "IN-OR": "Odisha", "IN-PB": "Punjab", "IN-RJ": "Rajasthan",
    "IN-SK": "Sikkim", "IN-TN": "Tamil Nadu", "IN-TG": "Telangana",
    "IN-TR": "Tripura", "IN-UP": "Uttar Pradesh", "IN-UT": "Uttarakhand",
    "IN-WB": "West Bengal", "IN-DL": "Delhi", "IN-JK": "Jammu & Kashmir",
    "IN-LA": "Ladakh",
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
const STATE_PATHS: Record<string, string> = {
    "IN-JK": "M 220 30 L 260 20 L 300 40 L 310 80 L 280 110 L 250 100 L 230 70 Z",
    "IN-LA": "M 310 20 L 350 10 L 380 30 L 370 70 L 340 80 L 310 60 Z",
    "IN-HP": "M 280 110 L 310 100 L 330 120 L 320 150 L 290 140 L 270 130 Z",
    "IN-PB": "M 240 130 L 270 120 L 290 140 L 280 170 L 250 165 L 235 150 Z",
    "IN-UT": "M 320 120 L 360 110 L 380 130 L 370 170 L 340 180 L 310 160 Z",
    "IN-HR": "M 250 165 L 280 160 L 300 180 L 290 210 L 260 205 L 245 185 Z",
    "IN-DL": "M 272 195 L 285 190 L 290 200 L 282 210 L 270 205 Z",
    "IN-RJ": "M 140 195 L 240 180 L 260 210 L 270 280 L 230 330 L 160 320 L 120 270 L 110 230 Z",
    "IN-UP": "M 290 180 L 370 170 L 440 190 L 460 230 L 430 270 L 370 280 L 310 270 L 280 240 L 270 210 Z",
    "IN-BR": "M 460 230 L 530 220 L 560 250 L 540 280 L 490 290 L 460 270 Z",
    "IN-SK": "M 540 200 L 560 195 L 570 210 L 560 220 L 545 215 Z",
    "IN-AR": "M 620 180 L 680 170 L 710 195 L 690 220 L 640 215 L 615 200 Z",
    "IN-NL": "M 680 220 L 710 215 L 720 240 L 700 255 L 680 245 Z",
    "IN-MN": "M 680 255 L 710 250 L 720 280 L 700 295 L 675 280 Z",
    "IN-MZ": "M 665 295 L 695 290 L 710 320 L 690 345 L 665 330 Z",
    "IN-TR": "M 630 305 L 660 300 L 665 325 L 645 335 L 625 320 Z",
    "IN-ML": "M 580 250 L 630 240 L 650 260 L 630 275 L 590 270 Z",
    "IN-AS": "M 560 220 L 620 200 L 680 215 L 670 250 L 580 260 L 555 240 Z",
    "IN-WB": "M 490 280 L 540 270 L 570 300 L 560 380 L 530 400 L 500 370 L 480 320 Z",
    "IN-JH": "M 430 270 L 490 260 L 500 300 L 480 330 L 440 320 L 420 290 Z",
    "IN-OR": "M 400 320 L 480 310 L 510 350 L 500 410 L 440 430 L 390 400 L 380 360 Z",
    "IN-CT": "M 340 320 L 400 300 L 420 340 L 400 400 L 360 420 L 330 380 Z",
    "IN-MP": "M 200 260 L 310 240 L 370 260 L 380 320 L 340 340 L 280 350 L 210 330 L 180 290 Z",
    "IN-GJ": "M 70 260 L 150 250 L 200 280 L 210 340 L 170 380 L 120 400 L 80 370 L 50 320 Z",
    "IN-MH": "M 120 380 L 210 340 L 290 370 L 340 420 L 310 490 L 240 510 L 170 480 L 130 440 Z",
    "IN-TG": "M 300 420 L 380 400 L 420 440 L 400 500 L 340 510 L 290 480 Z",
    "IN-AP": "M 340 470 L 420 440 L 460 490 L 440 560 L 380 580 L 330 540 Z",
    "IN-KA": "M 170 470 L 250 450 L 310 490 L 330 560 L 290 620 L 220 630 L 170 580 L 150 520 Z",
    "IN-GA": "M 150 490 L 175 475 L 185 500 L 170 520 L 148 510 Z",
    "IN-KL": "M 210 600 L 250 580 L 280 630 L 270 700 L 240 730 L 210 710 L 200 650 Z",
    "IN-TN": "M 280 570 L 380 540 L 420 590 L 400 670 L 340 720 L 280 700 L 260 640 Z",
};

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
                        background: "rgba(0, 0, 0, 0.2)",
                        borderColor: "rgba(232, 98, 26, 0.25)",
                        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
                    }}>
                    <svg viewBox="0 0 800 780" className="w-full h-auto" style={{ maxHeight: "70vh" }}>
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
                                    {count > 0 && (
                                        <text
                                            x={getPathCenter(path).x}
                                            y={getPathCenter(path).y}
                                            textAnchor="middle"
                                            dominantBaseline="central"
                                            style={{
                                                fontSize: "11px",
                                                fill: "white",
                                                fontWeight: 700,
                                                pointerEvents: "none",
                                                textShadow: "0 1px 3px rgba(0,0,0,0.8)",
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
                        background: "rgba(0, 0, 0, 0.2)",
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
                                        background: selectedState === stateId ? "rgba(232, 98, 26, 0.1)" : "rgba(0, 0, 0, 0.15)",
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

// Helper to compute center of an SVG path for label placement
function getPathCenter(d: string): { x: number; y: number } {
    const nums = d.match(/[\d.]+/g)?.map(Number) || [];
    let sumX = 0, sumY = 0, count = 0;
    for (let i = 0; i < nums.length - 1; i += 2) {
        sumX += nums[i];
        sumY += nums[i + 1];
        count++;
    }
    return { x: count > 0 ? sumX / count : 0, y: count > 0 ? sumY / count : 0 };
}
