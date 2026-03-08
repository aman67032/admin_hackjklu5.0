"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
import { io, Socket } from "socket.io-client";
import { campusAreas, CAMPUS_CENTER, CAMPUS_ZOOM } from "../campus-map/campus-map-data";
import { MapPin, Navigation, Locate, AlertTriangle, Users, AlertOctagon, RotateCcw } from "lucide-react";
import { participantAdminApi, mapZonesApi } from "@/lib/api";
import { CustomFloorZone } from "../map-builder/map-builder-data";

interface TrackingLocation {
    teamId: string;
    teamName: string;
    email: string;
    isLeader: boolean;
    lat: number;
    lng: number;
    timestamp: Date;
    violating: boolean;
    status: string;
}

export default function TrackingMapContent() {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const markersRef = useRef<{ [email: string]: L.Marker }>({});
    const markerClusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
    const socketRef = useRef<Socket | null>(null);
    const [locations, setLocations] = useState<TrackingLocation[]>([]);
    const [violations, setViolations] = useState<TrackingLocation[]>([]);
    const [customZones, setCustomZones] = useState<CustomFloorZone[]>([]);
    const zonesLayerRef = useRef<L.FeatureGroup | null>(null);

    // Initialize map
    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;

        const map = L.map(mapContainerRef.current, {
            center: CAMPUS_CENTER,
            zoom: CAMPUS_ZOOM - 1,
            minZoom: 15,
            zoomControl: false,
            attributionControl: false,
        });

        L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
            maxZoom: 22,
            subdomains: "abcd",
        }).addTo(map);

        L.control.zoom({ position: "bottomright" }).addTo(map);

        const boundary = campusAreas.find((a) => a.id === "campus-boundary");
        if (boundary) {
            L.polygon(boundary.coordinates, {
                color: "#4a4a50",
                weight: 2,
                opacity: 0.5,
                fillColor: "#2a2a2e",
                fillOpacity: 1.0,
            }).addTo(map);
        }

        mapRef.current = map;
        zonesLayerRef.current = L.featureGroup().addTo(map);

        // Init Cluster Group
        markerClusterGroupRef.current = L.markerClusterGroup({
            chunkedLoading: true,
            maxClusterRadius: 50,
            spiderfyOnMaxZoom: true,
            iconCreateFunction: function (cluster) {
                var count = cluster.getChildCount();
                return L.divIcon({
                    html: `<div style="background: var(--accent-orange); color: white; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-weight: bold; border: 2px solid white; box-shadow: 0 0 10px rgba(232, 98, 26, 0.5);">${count}</div>`,
                    className: 'custom-cluster-icon',
                    iconSize: L.point(30, 30)
                });
            }
        });
        map.addLayer(markerClusterGroupRef.current);

        return () => {
            map.remove();
            mapRef.current = null;
            zonesLayerRef.current = null;
            markerClusterGroupRef.current = null;
        };
    }, []);

    // Fetch Zones
    useEffect(() => {
        const fetchZones = async () => {
            try {
                const data = await mapZonesApi.get();
                setCustomZones(data);
            } catch (error) {
                console.error("Failed to fetch custom zones:", error);
            }
        };
        fetchZones();
    }, []);

    // Draw Zones
    useEffect(() => {
        if (!zonesLayerRef.current || !mapRef.current) return;
        zonesLayerRef.current.clearLayers();

        const groundZones = customZones.filter(z => z.floorLevel === "Ground");
        groundZones.forEach(zone => {
            const polygon = L.polygon(zone.coordinates, {
                color: zone.color,
                fillColor: zone.fillColor,
                weight: 2,
                opacity: 0.9,
                fillOpacity: 0.5,
                dashArray: zone.zoneType === 'Restricted Area' ? '5, 5' : undefined
            });
            zonesLayerRef.current?.addLayer(polygon);
        });
    }, [customZones]);

    // Data Polling
    const fetchLocations = useCallback(async () => {
        try {
            const res = await participantAdminApi.getLocations();
            setLocations(res.locations);
            setViolations(res.violations);
        } catch (error) {
            console.error("Failed to fetch locations:", error);
        }
    }, []);

    useEffect(() => {
        fetchLocations();

        // Socket logic
        const socket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000");
        socketRef.current = socket;

        socket.on("connect", () => {
            socket.emit("join_admin");
        });

        socket.on("location_update", (data: TrackingLocation) => {
            setLocations(prev => {
                const idx = prev.findIndex(l => l.email === data.email);
                if (idx >= 0) {
                    const newArr = [...prev];
                    newArr[idx] = data;
                    return newArr;
                }
                return [...prev, data];
            });

            if (data.violating) {
                setViolations(prev => {
                    const idx = prev.findIndex(l => l.teamId === data.teamId);
                    if (idx >= 0) {
                        const newArr = [...prev];
                        newArr[idx] = data;
                        return newArr;
                    }
                    return [...prev, data];
                });
            } else {
                setViolations(prev => prev.filter(v => v.teamId !== data.teamId));
            }
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [fetchLocations]);

    // Update Markers
    useEffect(() => {
        if (!mapRef.current || !markerClusterGroupRef.current) return;

        // Keep track of which emails are currently in state
        const currentEmails = new Set(locations.map(l => l.email));

        // Remove old markers
        Object.keys(markersRef.current).forEach(email => {
            if (!currentEmails.has(email) && markerClusterGroupRef.current) {
                markerClusterGroupRef.current.removeLayer(markersRef.current[email]);
                delete markersRef.current[email];
            }
        });

        // Add or update markers
        locations.forEach(loc => {
            const isFresh = (new Date().getTime() - new Date(loc.timestamp).getTime()) < 5 * 60 * 1000; // < 5 mins old
            if (!isFresh) {
                if (markersRef.current[loc.email]) {
                    markerClusterGroupRef.current?.removeLayer(markersRef.current[loc.email]);
                    delete markersRef.current[loc.email];
                }
                return;
            }

            const markerColor = loc.violating ? "var(--accent-rose)" : "var(--accent-sky)";
            const iconHtml = `<div style="width: 14px; height: 14px; background: ${markerColor}; border: 2px solid #fff; border-radius: 50%; box-shadow: 0 0 10px ${markerColor};"></div>`;

            if (markersRef.current[loc.email]) {
                const marker = markersRef.current[loc.email];
                // Update position
                marker.setLatLng([loc.lat, loc.lng]);
                // Update icon if status changed
                const existingIcon = marker.getIcon() as L.DivIcon;
                if (existingIcon.options.html !== iconHtml) {
                    marker.setIcon(L.divIcon({
                        className: "track-marker",
                        html: iconHtml,
                        iconSize: [14, 14],
                        iconAnchor: [7, 7]
                    }));
                }
            } else {
                // Create new
                const pulsingIcon = L.divIcon({
                    className: "track-marker",
                    html: iconHtml,
                    iconSize: [14, 14],
                    iconAnchor: [7, 7],
                });
                const marker = L.marker([loc.lat, loc.lng], { icon: pulsingIcon });

                // Add popup
                marker.bindPopup(`
                    <div style="font-family:Inter,sans-serif;min-width:150px;">
                        <div style="font-weight:700;font-size:13px;color:#fff;">${loc.teamName}</div>
                        <div style="font-size:11px;color:#b0b0b0;">${loc.email}</div>
                        ${loc.violating ? `<div style="font-size:10px;color:var(--accent-rose);font-weight:bold;margin-top:4px;">TRACE PASS VIOLATION</div>` : ''}
                        <div style="font-size:10px;color:#666;margin-top:4px;">Last seen: ${new Date(loc.timestamp).toLocaleTimeString()}</div>
                    </div>
                `, { className: "campus-popup" });

                markerClusterGroupRef.current?.addLayer(marker);
                markersRef.current[loc.email] = marker;
            }
        });

    }, [locations]);

    const handleDisqualify = async (teamId: string) => {
        if (!confirm("Are you sure you want to DISQUALIFY this team? This action cannot be reversed from the frontend.")) return;
        try {
            await participantAdminApi.disqualifyTeam(teamId);
            fetchLocations(); // refresh immediately
            alert("Team has been disqualified.");
        } catch (error: any) {
            alert(error.message || "Failed to disqualify team");
        }
    };

    const flyToViolation = (lat: number, lng: number) => {
        if (mapRef.current) {
            mapRef.current.flyTo([lat, lng], 20, { duration: 1 });
        }
    };

    return (
        <div className="page-container flex flex-col md:flex-row gap-6 h-[calc(100vh-100px)] pt-6 pl-4 animate-fade-in">
            <style jsx global>{`
                .campus-popup .leaflet-popup-content-wrapper {
                  background: rgba(20, 20, 30, 0.95);
                  backdrop-filter: blur(16px);
                  border: 1px solid rgba(255, 167, 38, 0.3);
                  border-radius: 12px;
                  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
                  padding: 0;
                }
                .campus-popup .leaflet-popup-content {
                  margin: 12px 16px;
                  color: #fff;
                }
                .campus-popup .leaflet-popup-tip {
                  background: rgba(20, 20, 30, 0.95);
                  border: 1px solid rgba(255, 167, 38, 0.3);
                }
            `}</style>

            {/* Control Panel (Sidebar) */}
            <div className="w-full md:w-80 flex flex-col gap-4">
                <div className="flex flex-col gap-1 mb-2">
                    <h1 className="text-2xl font-bold tracking-wider" style={{ fontFamily: "var(--font-display)", color: "var(--accent-orange)" }}>LIVE TRACKING</h1>
                    <p className="text-xs text-gray-400">Monitoring {locations.length} active participant signals.</p>
                </div>

                <div className="p-4 rounded-xl border flex items-center justify-between"
                    style={{ background: "#111111", borderColor: "rgba(232, 98, 26, 0.2)" }}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20">
                            <AlertOctagon size={20} />
                        </div>
                        <div>
                            <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Violations</div>
                            <div className="text-xl font-bold text-white">{violations.length}</div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex flex-col overflow-hidden rounded-xl border"
                    style={{ background: "#111111", borderColor: "rgba(232, 98, 26, 0.2)" }}>
                    <div className="p-3 border-b border-white/10">
                        <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">Trace Alerts</span>
                    </div>
                    <div className="overflow-y-auto p-2 space-y-2 flex-1 scrollbar-hide">
                        {violations.length === 0 ? (
                            <div className="text-center text-gray-500 text-xs py-10 opacity-70">
                                No boundary violations detected.
                            </div>
                        ) : (
                            violations.map((v, i) => (
                                <div key={i} className="p-3 rounded-lg bg-red-500/5 border border-red-500/20 hover:bg-red-500/10 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="font-bold text-sm text-red-400 truncate pr-2">{v.teamName}</div>
                                        <button
                                            onClick={() => flyToViolation(v.lat, v.lng)}
                                            className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 text-gray-300 transition-colors"
                                            title="View on map"
                                        >
                                            <Locate size={14} />
                                        </button>
                                    </div>
                                    <div className="text-[10px] text-gray-400 mb-3 truncate">{v.email}</div>

                                    <button
                                        onClick={() => handleDisqualify(v.teamId)}
                                        className="w-full py-2 rounded-md bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-lg shadow-red-900/20"
                                    >
                                        Disqualify
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Map Area */}
            <div className="flex-1 rounded-2xl border overflow-hidden relative" style={{ borderColor: "rgba(232, 98, 26, 0.2)", minHeight: "400px" }}>
                <div ref={mapContainerRef} className="absolute inset-0" />
                <button
                    onClick={() => {
                        if (mapRef.current) {
                            mapRef.current.flyTo(CAMPUS_CENTER, CAMPUS_ZOOM - 1, { duration: 1 });
                        }
                    }}
                    className="absolute top-4 right-4 z-[1000] p-3 rounded-xl bg-black/80 backdrop-blur-md border border-white/10 hover:border-orange-500/50 hover:text-orange-400 text-gray-300 transition-all shadow-lg"
                    title="Reset Map View"
                >
                    <RotateCcw size={18} />
                </button>
            </div>
        </div>
    );
}
