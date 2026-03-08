"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";

// Removed react-leaflet imports to avoid SSR issues

import { campusAreas, CAMPUS_CENTER, CAMPUS_ZOOM, CampusArea } from "../campus-map/campus-map-data";
import { CustomFloorZone, ZONE_TYPE_COLORS } from "./map-builder-data";
import { mapZonesApi } from "@/lib/api";
import { MapPin, Navigation, Save, Trash2, Edit3, Plus, X, Layers, AlertCircle, Loader2 } from "lucide-react";

export default function CampusMapEditorContent() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const drawnItemsRef = useRef<L.FeatureGroup | null>(null);

    const [zones, setZones] = useState<CustomFloorZone[]>([]);
    const [selectedLayerId, setSelectedLayerId] = useState<number | null>(null);
    const [activeZoneData, setActiveZoneData] = useState<Partial<CustomFloorZone> | null>(null);

    const [showForm, setShowForm] = useState(false);
    const [currentFloor, setCurrentFloor] = useState<string>("Ground");
    const [buildings] = useState(campusAreas.filter(a => a.category === 'academic' || a.category === 'hostel' || a.category === 'utility' || a.category === 'sports'));
    const [isSaving, setIsSaving] = useState(false);

    // Load initial zones from backend
    useEffect(() => {
        const fetchZones = async () => {
            try {
                const data = await mapZonesApi.get();
                setZones(data);
            } catch (error) {
                console.error("Failed to load zones:", error);
            }
        };
        fetchZones();
    }, []);

    // Initialize map
    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;

        // Calculate limits
        const boundary = campusAreas.find((a) => a.id === "campus-boundary");
        let maxBounds: L.LatLngBounds | undefined;
        if (boundary) {
            maxBounds = L.latLngBounds(boundary.coordinates).pad(0.15);
        }

        const map = L.map(mapContainerRef.current, {
            center: CAMPUS_CENTER,
            zoom: CAMPUS_ZOOM,
            minZoom: 16,
            maxZoom: 22,
            maxBounds: maxBounds,
            maxBoundsViscosity: 1.0,
            zoomControl: false,
            attributionControl: false,
        });

        // Dark tile layer
        L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
            maxZoom: 22,
            subdomains: "abcd",
        }).addTo(map);

        L.control.zoom({ position: "bottomright" }).addTo(map);

        // FeatureGroup is to store editable layers
        const drawnItems = new L.FeatureGroup();
        map.addLayer(drawnItems);
        drawnItemsRef.current = drawnItems;

        // Draw Base Campus Buildings (Non-editable, just for tracing)
        if (boundary) {
            L.polygon(boundary.coordinates, {
                color: "#4a4a50", weight: 2, opacity: 0.5, fillColor: "#2a2a2e", fillOpacity: 1.0, interactive: false
            }).addTo(map);
        }

        for (const area of campusAreas) {
            if (area.id === "campus-boundary") continue;
            if (area.type === "polygon") {
                L.polygon(area.coordinates, {
                    color: area.color, weight: 2, opacity: 0.3, fillColor: area.fillColor, fillOpacity: 0.1, interactive: false
                }).addTo(map);
            }
        }

        // Initialize Leaflet Draw Control
        // Must dynamically import leaflet-draw to avoid window errors
        import('leaflet-draw').then(() => {
            const drawControl = new L.Control.Draw({
                edit: {
                    featureGroup: drawnItems
                },
                draw: {
                    polygon: {
                        allowIntersection: false,
                        showArea: true,
                        shapeOptions: {
                            color: '#ffa726',
                            weight: 3
                        }
                    },
                    polyline: false,
                    circle: false,
                    rectangle: false,
                    circlemarker: false,
                    marker: false,
                }
            });
            map.addControl(drawControl);

            map.on(L.Draw.Event.CREATED, (e: any) => {
                const layer = e.layer;
                drawnItems.addLayer(layer);

                // Extract coordinates
                const latlngs = layer.getLatLngs()[0] as L.LatLng[];
                const coords: [number, number][] = latlngs.map(ll => [ll.lat, ll.lng]);

                // Prompt Form
                setActiveZoneData({
                    id: crypto.randomUUID(),
                    coordinates: coords,
                    parentBuildingId: buildings[0]?.id || '',
                    floorLevel: currentFloor,
                    zoneType: 'Standard',
                    name: 'New Zone',
                    description: '',
                    color: ZONE_TYPE_COLORS['Standard'].color,
                    fillColor: ZONE_TYPE_COLORS['Standard'].fillColor
                });
                setSelectedLayerId((layer as any)._leaflet_id);
                setShowForm(true);
            });

            // Handle map edits (updating coordinates)
            map.on(L.Draw.Event.EDITED, (e: any) => {
                const layers = e.layers;
                layers.eachLayer((layer: any) => {
                    // Update our react state with new coords
                    const latlngs = layer.getLatLngs()[0] as L.LatLng[];
                    const newCoords: [number, number][] = latlngs.map(ll => [ll.lat, ll.lng]);

                    // We need a way to map leaflet ID back to our zone ID. 
                    // For now, let's keep it simple: we clear and redraw entirely from state on save
                });
            });

            map.on(L.Draw.Event.DELETED, (e: any) => {
                // Handle deletion
            });

        });

        mapRef.current = map;

        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, []);

    // Effect: Draw saved zones onto the map
    useEffect(() => {
        if (!drawnItemsRef.current || !mapRef.current) return;

        // Clear existing editable layers
        drawnItemsRef.current.clearLayers();

        // Add zones to map
        zones.forEach(zone => {
            if (zone.floorLevel === currentFloor) {
                const polygon = L.polygon(zone.coordinates, {
                    color: zone.color,
                    fillColor: zone.fillColor,
                    weight: 3,
                    opacity: 0.9,
                    fillOpacity: 0.4
                });

                // Add tooltip with name
                polygon.bindTooltip(zone.name, { permanent: true, direction: "center", className: "zone-tooltip" });

                polygon.on('click', () => {
                    setActiveZoneData(zone);
                    setShowForm(true);
                });

                drawnItemsRef.current?.addLayer(polygon);
            }
        });
    }, [zones, currentFloor]);


    const handleSaveZone = async () => {
        if (!activeZoneData || !activeZoneData.id) return;

        setIsSaving(true);
        const colors = ZONE_TYPE_COLORS[activeZoneData.zoneType as keyof typeof ZONE_TYPE_COLORS] || ZONE_TYPE_COLORS['Standard'];

        const completeZone: CustomFloorZone = {
            ...(activeZoneData as CustomFloorZone),
            color: colors.color,
            fillColor: colors.fillColor
        };

        let updatedZones = [...zones];
        const existingIndex = updatedZones.findIndex(z => z.id === completeZone.id);

        if (existingIndex >= 0) {
            updatedZones[existingIndex] = completeZone;
        } else {
            updatedZones.push(completeZone);
        }

        try {
            await mapZonesApi.sync([completeZone]);
            setZones(updatedZones);
            setShowForm(false);
            setActiveZoneData(null);
            setSelectedLayerId(null);
        } catch (error) {
            console.error("Failed to save zone:", error);
            alert("Failed to save zone to the database.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteZone = async () => {
        if (!activeZoneData?.id) return;

        const confirmDelete = window.confirm("Are you sure you want to permanently delete this map zone?");
        if (!confirmDelete) return;

        setIsSaving(true);
        try {
            await mapZonesApi.delete(activeZoneData.id);
            const updatedZones = zones.filter(z => z.id !== activeZoneData.id);
            setZones(updatedZones);
            setShowForm(false);
            setActiveZoneData(null);
            setSelectedLayerId(null);
        } catch (error) {
            console.error("Failed to delete zone:", error);
            alert("Failed to delete zone from the database.");
        } finally {
            setIsSaving(false);
        }
    };

    const cancelEdit = () => {
        if (selectedLayerId && drawnItemsRef.current) {
            // Remove the unsaved polygon from map
            const layerToRemove = drawnItemsRef.current.getLayer(selectedLayerId);
            if (layerToRemove) {
                drawnItemsRef.current.removeLayer(layerToRemove);
            }
        }
        setShowForm(false);
        setActiveZoneData(null);
        setSelectedLayerId(null);
    };


    if (!mounted) return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
            <Loader2 className="animate-spin text-orange-500" size={48} />
        </div>
    );

    return (
        <div className="relative w-full overflow-hidden" style={{ height: "100vh", background: "#0a0a0f" }}>
            <style jsx global>{`
                .leaflet-draw-toolbar a { 
                    background-color: #1a1a24 !important; 
                    color: #ffa726 !important; 
                    border: 1px solid rgba(255,167,38,0.4) !important;
                    width: 34px !important;
                    height: 34px !important;
                    line-height: 34px !important;
                }
                .leaflet-draw-toolbar a:hover { 
                    background-color: rgba(255,167,38,0.2) !important; 
                    color: #fff !important;
                }
                .leaflet-draw-actions a {
                    background-color: #1a1a24 !important;
                    color: #fff !important;
                    border: 1px solid rgba(255,167,38,0.2) !important;
                }
                .zone-tooltip { background: transparent; border: none; box-shadow: none; color: white; font-weight: bold; text-shadow: 0px 1px 3px black; font-family: Inter; font-size: 11px;}
                .leaflet-control-zoom a { background: rgba(20, 20, 30, 0.9) !important; color: #ffa726 !important; border-color: rgba(255, 167, 38, 0.3) !important; }
            `}</style>

            {/* Map container */}
            <div ref={mapContainerRef} className="absolute inset-0 z-0 md:ml-64 pt-16 md:pt-0" />

            {/* ── Top Bar ────────────────────────────── */}
            <div className="absolute top-4 left-4 right-4 md:left-[17rem] z-[1000] flex items-start gap-3 mt-16 md:mt-0 pointer-events-none">
                <div
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl shrink-0 pointer-events-auto"
                    style={{
                        background: "rgba(10, 10, 18, 0.85)", backdropFilter: "blur(16px)",
                        border: "1px solid rgba(255, 167, 38, 0.25)", boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
                    }}
                >
                    <Edit3 size={18} className="text-orange-400" />
                    <span className="text-sm font-bold text-white tracking-wide">Map Floor Builder</span>
                </div>
            </div>

            {/* ── Instructions Overlay ────────────────────────────── */}
            {!showForm && (
                <div className="absolute bottom-10 left-4 md:left-[17rem] z-[1000] max-w-xs animate-in slide-in-from-bottom-5 duration-500 pointer-events-none">
                    <div className="bg-[#121217]/90 backdrop-blur-md border border-orange-500/20 rounded-2xl p-4 shadow-2xl pointer-events-auto">
                        <div className="flex items-center gap-2 mb-2">
                            <Plus size={16} className="text-orange-400" />
                            <span className="text-xs font-bold text-white uppercase tracking-wider">Quick Start</span>
                        </div>
                        <ul className="space-y-2">
                            <li className="text-[11px] text-gray-400 flex gap-2">
                                <span className="text-orange-400 font-bold">1.</span>
                                <span>Use the <Edit3 size={10} className="inline" /> icon top-right to start drawing a polygon.</span>
                            </li>
                            <li className="text-[11px] text-gray-400 flex gap-2">
                                <span className="text-orange-400 font-bold">2.</span>
                                <span>Trace the floor area over a building.</span>
                            </li>
                            <li className="text-[11px] text-gray-400 flex gap-2">
                                <span className="text-orange-400 font-bold">3.</span>
                                <span>Fill in the zone name, floor, and venue type.</span>
                            </li>
                        </ul>
                    </div>
                </div>
            )}

            {/* ── Floor Selector Control ────────────────────────────── */}
            <div className="absolute top-20 right-4 z-[1000] mt-16 md:mt-0 bg-[#121217]/90 backdrop-blur-md rounded-xl border border-white/10 p-2 shadow-2xl flex flex-col gap-1 w-14 pointer-events-auto">
                {['2', '1', 'Ground', 'B1'].map(f => (
                    <button
                        key={f}
                        onClick={() => setCurrentFloor(f)}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs transition-colors ${currentFloor === f ? 'bg-orange-500 text-white' : 'text-gray-400 hover:bg-white/5'}`}
                    >
                        {f === 'Ground' ? 'G' : f}
                    </button>
                ))}
            </div>


            {/* ── Zone Configuration Form overlay ────────────────────────────── */}
            {showForm && activeZoneData && (
                <div className="absolute inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#121217] border border-orange-500/30 w-full max-w-md rounded-2xl p-6 shadow-2xl flex flex-col gap-5 relative animate-in fade-in zoom-in duration-200">
                        <button onClick={cancelEdit} className="absolute top-4 right-4 text-gray-500 hover:text-white">
                            <X size={20} />
                        </button>

                        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                            <Layers className="text-orange-400" size={24} />
                            <h2 className="text-xl font-bold text-white">Configure Zone</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Zone Name</label>
                                <input
                                    type="text"
                                    value={activeZoneData.name}
                                    onChange={(e) => setActiveZoneData({ ...activeZoneData, name: e.target.value })}
                                    className="w-full bg-[#1a1a24] border border-white/10 rounded-xl px-4 py-2.5 outline-none text-white focus:border-orange-500/50 transition-colors"
                                    placeholder="e.g. Main Auditorium"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Parent Building</label>
                                    <select
                                        value={activeZoneData.parentBuildingId}
                                        onChange={(e) => setActiveZoneData({ ...activeZoneData, parentBuildingId: e.target.value })}
                                        className="w-full bg-[#1a1a24] border border-white/10 rounded-xl px-3 py-2.5 outline-none text-white appearance-none"
                                    >
                                        {buildings.map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Floor Level</label>
                                    <select
                                        value={activeZoneData.floorLevel}
                                        onChange={(e) => setActiveZoneData({ ...activeZoneData, floorLevel: e.target.value })}
                                        className="w-full bg-[#1a1a24] border border-white/10 rounded-xl px-3 py-2.5 outline-none text-white appearance-none"
                                    >
                                        {['B2', 'B1', 'Ground', '1', '2', '3', '4', 'Roof'].map(f => (
                                            <option key={f} value={f}>{f}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Zone Type / Venue Tag</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {(Object.keys(ZONE_TYPE_COLORS) as Array<keyof typeof ZONE_TYPE_COLORS>).map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setActiveZoneData({ ...activeZoneData, zoneType: type })}
                                            className={`text-xs py-2 px-3 rounded-lg border flex items-center justify-center text-center transition-all ${activeZoneData.zoneType === type ? 'bg-white/10 border-orange-500/50 text-white font-bold' : 'border-white/5 text-gray-400 hover:bg-white/5'}`}
                                            type="button"
                                        >
                                            <div className="w-2 h-2 rounded-full mr-2" style={{ background: ZONE_TYPE_COLORS[type].color }}></div>
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Description (Optional)</label>
                                <textarea
                                    value={activeZoneData.description}
                                    onChange={(e) => setActiveZoneData({ ...activeZoneData, description: e.target.value })}
                                    className="w-full bg-[#1a1a24] border border-white/10 rounded-xl px-4 py-2.5 outline-none text-white focus:border-orange-500/50 transition-colors h-20 resize-none"
                                    placeholder="Enter access rules, capacities, or details..."
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-2">
                            <button
                                onClick={handleDeleteZone}
                                className="flex items-center justify-center px-4 py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                            <button
                                onClick={handleSaveZone}
                                disabled={isSaving}
                                className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold rounded-xl py-2.5 flex items-center justify-center gap-2 transition-colors shadow-lg shadow-orange-500/20"
                            >
                                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                {isSaving ? "Saving..." : "Save Map Zone"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
