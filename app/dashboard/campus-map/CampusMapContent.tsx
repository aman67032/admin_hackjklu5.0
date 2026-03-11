"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { campusAreas, CAMPUS_CENTER, CAMPUS_ZOOM, categoryColors, CampusArea, CustomFloorZone } from "./campus-map-data";
import { MapPin, Navigation, Search, ChevronDown, ChevronUp, Layers, X, Locate, Info, Loader2 } from "lucide-react";
// import { mapZonesApi } from "@/lib/api";

// Point-in-polygon ray casting
function isPointInPolygon(point: [number, number], polygon: [number, number][]): boolean {
    const [y, x] = point;
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [yi, xi] = polygon[i];
        const [yj, xj] = polygon[j];
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
            inside = !inside;
        }
    }
    return inside;
}

// Find nearest building to a point
function findNearestBuilding(lat: number, lng: number): CampusArea | null {
    let nearest: CampusArea | null = null;
    let minDist = Infinity;

    for (const area of campusAreas) {
        if (area.id === "campus-boundary") continue;
        // Calculate centroid
        const centLat = area.coordinates.reduce((s, c) => s + c[0], 0) / area.coordinates.length;
        const centLng = area.coordinates.reduce((s, c) => s + c[1], 0) / area.coordinates.length;
        const dist = Math.sqrt((lat - centLat) ** 2 + (lng - centLng) ** 2);
        if (dist < minDist) {
            minDist = dist;
            nearest = area;
        }
    }
    return nearest;
}

export default function CampusMapContent() {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const locationMarkerRef = useRef<L.Marker | null>(null);
    const accuracyCircleRef = useRef<L.Circle | null>(null);
    const watchIdRef = useRef<number | null>(null);
    const lastLocationRef = useRef<{ lat: number; lng: number; accuracy: number } | null>(null);

    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
    const [isOnCampus, setIsOnCampus] = useState<boolean | null>(null);
    const [currentBuilding, setCurrentBuilding] = useState<string | null>(null);
    const [nearestBuilding, setNearestBuilding] = useState<string | null>(null);
    const [selectedArea, setSelectedArea] = useState<CampusArea | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [showLegend, setShowLegend] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [trackingActive, setTrackingActive] = useState(false);

    // Custom Zones & Floors
    // Removed mapZonesApi dependency but keeping UI state for now to minimize refactor risk
    const [customZones, setCustomZones] = useState<CustomFloorZone[]>([]);
    const [selectedFloor, setSelectedFloor] = useState<string>("Ground");
    const [availableFloors, setAvailableFloors] = useState<string[]>([]);
    const zonesLayerRef = useRef<L.FeatureGroup | null>(null);
    const [isLoadingZones, setIsLoadingZones] = useState(false);
    const [highlightedAreaId, setHighlightedAreaId] = useState<string | null>(null);
    const [isNavigating, setIsNavigating] = useState(false);
    const navigationLayerRef = useRef<L.LayerGroup | null>(null);

    // Filter areas by search
    const filteredAreas = campusAreas.filter(
        (a) =>
            a.id !== "campus-boundary" &&
            !a.hidden &&
            (a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                a.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Initialize map
    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;

        // Calculate limits
        const boundary = campusAreas.find((a) => a.id === "campus-boundary");
        let maxBounds: L.LatLngBounds | undefined;
        if (boundary) {
            maxBounds = L.latLngBounds(boundary.coordinates).pad(0.15); // Add 15% padding around limits
        }

        const map = L.map(mapContainerRef.current, {
            center: CAMPUS_CENTER,
            zoom: CAMPUS_ZOOM,
            minZoom: 16,        // Prevent zooming out too far
            maxBounds: maxBounds,
            maxBoundsViscosity: 1.0, // Solid wall against panning outside
            zoomControl: false,
            attributionControl: false,
        });

        // Dark tile layer
        L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
            maxZoom: 22,
            subdomains: "abcd",
        }).addTo(map);

        // Zoom control bottom-right
        L.control.zoom({ position: "bottomright" }).addTo(map);

        // Attribution
        L.control
            .attribution({ position: "bottomleft" })
            .addAttribution('© <a href="https://carto.com/">CARTO</a> | © <a href="https://osm.org/">OSM</a>')
            .addTo(map);

        // Draw campus boundary (acts as the base road/path network)
        if (boundary) {
            L.polygon(boundary.coordinates, {
                color: "#4a4a50", // Subtle border for the campus
                weight: 2,
                opacity: 0.5,
                fillColor: "#2a2a2e", // Asphalt/road color
                fillOpacity: 1.0,     // Solid background for the campus
            }).addTo(map);
        }

        // Draw all buildings/areas
        for (const area of campusAreas) {
            if (area.id === "campus-boundary" || area.hidden) continue;

            const centLat = area.coordinates.reduce((s, c) => s + c[0], 0) / area.coordinates.length;
            const centLng = area.coordinates.reduce((s, c) => s + c[1], 0) / area.coordinates.length;

            if (area.type === "polygon") {
                const polygon = L.polygon(area.coordinates, {
                    color: area.id === highlightedAreaId ? "#ffffff" : area.color,
                    weight: area.id === highlightedAreaId ? 4 : 2,
                    opacity: 0.85,
                    fillColor: area.id === highlightedAreaId ? "#ffffff" : area.fillColor,
                    fillOpacity: area.id === highlightedAreaId ? 0.6 : 0.3,
                    className: area.id === highlightedAreaId ? "searching-highlight-pulse" : ""
                }).addTo(map);

                // We rely entirely on the React custom panel now, no Leaflet popups
                polygon.on("click", (e) => {
                    L.DomEvent.stopPropagation(e);
                    setSelectedArea(area);
                });
            } else if (area.type === "line") {
                const polyline = L.polyline(area.coordinates, {
                    color: area.color,
                    weight: 3,
                    opacity: 0.85,
                }).addTo(map);

                polyline.on("click", (e) => {
                    L.DomEvent.stopPropagation(e);
                    setSelectedArea(area);
                });
            }

            // Labels
            const labelIcon = L.divIcon({
                className: "campus-label",
                html: `<div class="campus-label-content">${area.icon} ${area.name}</div>`,
                iconSize: [0, 0],
                iconAnchor: [0, 0],
            });
            L.marker([centLat, centLng], { icon: labelIcon, interactive: false }).addTo(map);
        }

        mapRef.current = map;

        // Create a layer group for custom zones
        zonesLayerRef.current = L.featureGroup().addTo(map);
        navigationLayerRef.current = L.layerGroup().addTo(map);

        return () => {
            map.remove();
            mapRef.current = null;
            zonesLayerRef.current = null;
            navigationLayerRef.current = null;
        };
    }, []);

    // Load custom zones - DISABLED as mapZonesApi is removed
    useEffect(() => {
        /*
        const fetchZones = async () => {
            setIsLoadingZones(true);
            try {
                const data = await mapZonesApi.get();
                setCustomZones(data);
            } catch (error) {
                console.error("Failed to fetch custom zones:", error);
            } finally {
                setIsLoadingZones(false);
            }
        };
        fetchZones();
        */
    }, []);

    // Effect: Update available floors based on selected area
    useEffect(() => {
        if (!selectedArea) {
            setAvailableFloors([]);
            return;
        }

        const relatedZones = customZones.filter(z => z.parentBuildingId === selectedArea.id);
        const floors = Array.from(new Set(relatedZones.map(z => z.floorLevel))).sort();

        // Ensure "Ground" is always an option if there are any zones
        if (floors.length > 0 && !floors.includes("Ground")) {
            // Check if any zone is actually on ground
            // If not, we still might want to show it as base
        }

        setAvailableFloors(floors);

        // Default to Ground if available, else first available
        if (floors.length > 0) {
            if (floors.includes("Ground")) {
                setSelectedFloor("Ground");
            } else {
                setSelectedFloor(floors[0]);
            }
        }
    }, [selectedArea, customZones]);

    // Effect: Render custom zones on the map
    useEffect(() => {
        if (!zonesLayerRef.current || !mapRef.current) return;

        zonesLayerRef.current.clearLayers();

        // Filter zones by current floor and selected building
        const activeZones = customZones.filter(z =>
            z.floorLevel === selectedFloor &&
            (!selectedArea || z.parentBuildingId === selectedArea.id)
        );

        activeZones.forEach(zone => {
            const polygon = L.polygon(zone.coordinates, {
                color: zone.color,
                fillColor: zone.fillColor,
                weight: 2,
                opacity: 0.9,
                fillOpacity: 0.5,
                dashArray: zone.zoneType === 'Restricted Area' ? '5, 5' : undefined
            });

            polygon.bindPopup(`
                <div style="font-family:Inter,sans-serif;min-width:150px;">
                    <div style="font-weight:700;font-size:13px;color:#fff;margin-bottom:2px;">${zone.name}</div>
                    <div style="font-size:10px;color:${zone.color};font-weight:bold;text-transform:uppercase;margin-bottom:4px;">${zone.zoneType}</div>
                    <div style="font-size:11px;color:#b0b0b0;line-height:1.3;">${zone.description || 'No description available.'}</div>
                    <div style="font-size:10px;color:#666;margin-top:4px;">Floor: ${zone.floorLevel}</div>
                </div>
            `, { className: "campus-popup" });

            zonesLayerRef.current?.addLayer(polygon);
        });
    }, [customZones, selectedFloor, selectedArea]);

    // Start/Stop location tracking
    const toggleTracking = useCallback(() => {
        if (trackingActive) {
            setTrackingActive(false);
            setUserLocation(null);
            lastLocationRef.current = null;
            setIsOnCampus(null);
            setCurrentBuilding(null);
            setNearestBuilding(null);
            setLocationError(null);
            return;
        }

        if (!navigator.geolocation) {
            setLocationError(
                window.isSecureContext === false
                    ? "Location requires a secure connection (HTTPS or localhost)."
                    : "Geolocation is not supported by your browser."
            );
            return;
        }

        setTrackingActive(true);
        setLocationError(null);
    }, [trackingActive]);

    // Robust Geolocation Tracking Effect
    useEffect(() => {
        if (!trackingActive) {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
            }
            if (locationMarkerRef.current && mapRef.current) {
                mapRef.current.removeLayer(locationMarkerRef.current);
                locationMarkerRef.current = null;
            }
            if (accuracyCircleRef.current && mapRef.current) {
                mapRef.current.removeLayer(accuracyCircleRef.current);
                accuracyCircleRef.current = null;
            }
            return;
        }

        const onLocationSuccess = (position: GeolocationPosition) => {
            const { latitude, longitude, accuracy } = position.coords;
            setLocationError(null);

            // Accuracy threshold - ignore if extremely poor (e.g. tower triangulated > 100m)
            if (accuracy > 100 && lastLocationRef.current) return;

            if (lastLocationRef.current && mapRef.current) {
                const dist = mapRef.current.distance(
                    [lastLocationRef.current.lat, lastLocationRef.current.lng],
                    [latitude, longitude]
                );

                // Threshold: Ignore movements < 5m unless accuracy improves significantly
                if (dist < 5 && accuracy >= lastLocationRef.current.accuracy - 2) return;
            }

            const newLoc = { lat: latitude, lng: longitude, accuracy };
            lastLocationRef.current = newLoc;
            setUserLocation(newLoc);

            // Business logic
            const campus = campusAreas.find((a) => a.id === "campus-boundary");
            if (campus) {
                setIsOnCampus(isPointInPolygon([latitude, longitude], campus.coordinates));
            }

            let foundBuilding: string | null = null;
            for (const area of campusAreas) {
                if (area.id === "campus-boundary" || area.type !== "polygon") continue;
                if (isPointInPolygon([latitude, longitude], area.coordinates)) {
                    foundBuilding = area.name;
                    break;
                }
            }
            setCurrentBuilding(foundBuilding);
            const nearest = findNearestBuilding(latitude, longitude);
            setNearestBuilding(nearest ? nearest.name : null);

            // Map updates
            if (mapRef.current) {
                const isFirstFix = !locationMarkerRef.current;
                
                if (!locationMarkerRef.current) {
                    const pulsingIcon = L.divIcon({
                        className: "user-location-marker",
                        html: `<div class="user-dot-pulse"><div class="user-dot-core"></div></div>`,
                        iconSize: [24, 24],
                        iconAnchor: [12, 12],
                    });
                    locationMarkerRef.current = L.marker([latitude, longitude], { icon: pulsingIcon, zIndexOffset: 1000 }).addTo(mapRef.current);
                } else {
                    locationMarkerRef.current.setLatLng([latitude, longitude]);
                }

                if (!accuracyCircleRef.current) {
                    accuracyCircleRef.current = L.circle([latitude, longitude], {
                        radius: accuracy,
                        color: "#4fc3f7",
                        fillColor: "#4fc3f7",
                        fillOpacity: 0.1,
                        weight: 1,
                    }).addTo(mapRef.current);
                } else {
                    accuracyCircleRef.current.setLatLng([latitude, longitude]);
                    accuracyCircleRef.current.setRadius(accuracy);
                }

                // Only center on the very first location fix, not continuously
                if (isFirstFix && trackingActive) {
                    mapRef.current.flyTo([latitude, longitude], 19, { duration: 1 });
                }
            }
        };

        const onLocationError = (error: GeolocationPositionError) => {
            console.warn("Geolocation warning:", error.message);
            if (error.code === error.PERMISSION_DENIED) {
                setLocationError("Location permission denied. Please enable GPS.");
                setTrackingActive(false);
            } else if (error.code === error.TIMEOUT) {
                // Transient timeout, ignore and let watchPosition retry
            } else {
                setLocationError("Searching for GPS fix...");
            }
        };

        const watchOptions = {
            enableHighAccuracy: true,
            timeout: 30000,
            maximumAge: 0,
        };

        const watchId = navigator.geolocation.watchPosition(onLocationSuccess, onLocationError, watchOptions);
        watchIdRef.current = watchId;

        // Auto-restart tracking on visibility change (reopening tab)
        const handleVisibility = () => {
            if (document.visibilityState === 'visible' && trackingActive) {
                navigator.geolocation.clearWatch(watchIdRef.current!);
                watchIdRef.current = navigator.geolocation.watchPosition(onLocationSuccess, onLocationError, watchOptions);
            }
        };

        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibility);
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
            }
        };
    }, [trackingActive]);

    // Center on user location
    const centerOnUser = useCallback(() => {
        if (userLocation && mapRef.current) {
            mapRef.current.flyTo([userLocation.lat, userLocation.lng], 19, { duration: 1 });
        }
    }, [userLocation]);

    // Center on campus
    const centerOnCampus = useCallback(() => {
        if (mapRef.current) {
            mapRef.current.flyTo(CAMPUS_CENTER, CAMPUS_ZOOM, { duration: 1 });
        }
    }, []);

    // Navigate to a specific area
    const navigateToArea = useCallback((area: CampusArea) => {
        if (mapRef.current) {
            const centLat = area.coordinates.reduce((s, c) => s + c[0], 0) / area.coordinates.length;
            const centLng = area.coordinates.reduce((s, c) => s + c[1], 0) / area.coordinates.length;
            mapRef.current.flyTo([centLat, centLng], 19, { duration: 1 });
            setSelectedArea(area);
            setHighlightedAreaId(area.id);
            setShowSearch(false);

            // Clear highlight after 5 seconds
            setTimeout(() => {
                setHighlightedAreaId(null);
            }, 5000);
        }
    }, []);

    // Effect: Handle navigation path rendering
    useEffect(() => {
        if (!navigationLayerRef.current || !mapRef.current) return;
        navigationLayerRef.current.clearLayers();

        if (isNavigating) {
            const navPath = campusAreas.find(a => a.id === 'direction-path');
            if (navPath) {
                const polyline = L.polyline(navPath.coordinates, {
                    color: navPath.color,
                    weight: 5,
                    opacity: 1,
                    dashArray: '10, 10',
                    className: 'nav-path-animation'
                }).addTo(navigationLayerRef.current);

                // Fit bounds to path
                mapRef.current.flyToBounds(polyline.getBounds(), { padding: [50, 50], duration: 1.5 });
            }
        }
    }, [isNavigating]);

    return (
        <div className="relative w-full" style={{ height: "100vh", background: "#0a0a0f" }}>
            {/* Global styles for map */}
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
        .campus-popup .leaflet-popup-close-btn {
          color: #888 !important;
          font-size: 18px !important;
          top: 6px !important;
          right: 8px !important;
        }
        .campus-popup .leaflet-popup-close-btn:hover {
          color: #ffa726 !important;
        }
        .campus-label {
          background: none !important;
          border: none !important;
          box-shadow: none !important;
        }
        .campus-label-content {
          font-family: 'Inter', sans-serif;
          font-size: 14px; /* Increased from 10px */
          font-weight: 700; /* Made slightly bolder */
          color: rgba(255, 255, 255, 0.95);
          text-shadow: 0 1px 4px rgba(0, 0, 0, 0.9), 0 0 8px rgba(0, 0, 0, 0.7);
          white-space: nowrap;
          pointer-events: none;
          transform: translate(-50%, -50%);
        }
        .user-location-marker {
          background: none !important;
          border: none !important;
        }
        .user-dot-pulse {
          position: relative;
          width: 24px;
          height: 24px;
        }
        .user-dot-core {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 14px;
          height: 14px;
          background: #4fc3f7;
          border: 3px solid #fff;
          border-radius: 50%;
          box-shadow: 0 0 12px rgba(79, 195, 247, 0.6), 0 0 24px rgba(79, 195, 247, 0.3);
          z-index: 2;
        }
        .user-dot-pulse::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 24px;
          height: 24px;
          background: rgba(79, 195, 247, 0.3);
          border-radius: 50%;
          animation: pulse-ring 2s ease-out infinite;
        }
        @keyframes pulse-ring {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(3); opacity: 0; }
        }

        .user-location-marker, .accuracy-circle {
          transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1), left 0.8s cubic-bezier(0.4, 0, 0.2, 1), top 0.8s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }

        .searching-highlight-pulse {
          animation: searching-glow 1.5s ease-in-out infinite;
          z-index: 1000 !important;
        }

        @keyframes searching-glow {
          0% { stroke-width: 4; fill-opacity: 0.3; stroke-opacity: 0.8; }
          50% { stroke-width: 8; fill-opacity: 0.7; stroke-opacity: 1; }
          100% { stroke-width: 4; fill-opacity: 0.3; stroke-opacity: 0.8; }
        }

        .leaflet-control-zoom a {
          background: rgba(20, 20, 30, 0.9) !important;
          color: #ffa726 !important;
          border-color: rgba(255, 167, 38, 0.3) !important;
          backdrop-filter: blur(8px);
        }
        .leaflet-control-zoom a:hover {
          background: rgba(255, 167, 38, 0.15) !important;
          color: #ffcc02 !important;
        }
      `}</style>

            {/* Map container */}
            <div ref={mapContainerRef} className="absolute inset-0 z-0" />

            {/* ── Top Bar ────────────────────────────── */}
            <div className="absolute top-4 left-4 right-4 z-[1000] flex items-start gap-3">
                {/* Title pill */}
                <div
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl shrink-0"
                    style={{
                        background: "rgba(10, 10, 18, 0.85)",
                        backdropFilter: "blur(16px)",
                        border: "1px solid rgba(255, 167, 38, 0.25)",
                        boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
                    }}
                >
                    <MapPin size={18} className="text-orange-400" />
                    <span className="text-sm font-bold text-white tracking-wide">JKLU Campus Map</span>
                </div>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Search + Legend buttons */}
                <div className="flex gap-2">
                    <button
                        onClick={() => { setShowSearch(!showSearch); setShowLegend(false); }}
                        className="p-2.5 rounded-xl transition-all duration-200"
                        style={{
                            background: showSearch ? "rgba(255, 167, 38, 0.2)" : "rgba(10, 10, 18, 0.85)",
                            backdropFilter: "blur(16px)",
                            border: `1px solid ${showSearch ? "rgba(255, 167, 38, 0.5)" : "rgba(255,255,255,0.1)"}`,
                        }}
                    >
                        {showSearch ? <X size={18} className="text-orange-400" /> : <Search size={18} className="text-gray-300" />}
                    </button>
                    <button
                        onClick={() => { setShowLegend(!showLegend); setShowSearch(false); }}
                        className="p-2.5 rounded-xl transition-all duration-200"
                        style={{
                            background: showLegend ? "rgba(255, 167, 38, 0.2)" : "rgba(10, 10, 18, 0.85)",
                            backdropFilter: "blur(16px)",
                            border: `1px solid ${showLegend ? "rgba(255, 167, 38, 0.5)" : "rgba(255,255,255,0.1)"}`,
                        }}
                    >
                        <Layers size={18} className={showLegend ? "text-orange-400" : "text-gray-300"} />
                    </button>
                </div>
            </div>

            {/* ── Search Panel ────────────────────────────── */}
            {showSearch && (
                <div
                    className="absolute top-16 left-4 right-4 md:left-auto md:right-4 z-[1000] md:w-80 max-h-[60vh] rounded-2xl overflow-hidden flex flex-col"
                    style={{
                        background: "rgba(10, 10, 18, 0.92)",
                        backdropFilter: "blur(20px)",
                        border: "1px solid rgba(255, 167, 38, 0.2)",
                        boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
                    }}
                >
                    <div className="p-3 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search buildings, areas..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl outline-none text-white placeholder-gray-500"
                                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
                                autoFocus
                            />
                        </div>
                    </div>
                    <div className="overflow-y-auto flex-1 p-2" style={{ maxHeight: "50vh" }}>
                        {filteredAreas.map((area) => (
                            <button
                                key={area.id}
                                onClick={() => navigateToArea(area)}
                                className="w-full text-left px-3 py-2.5 rounded-xl mb-1 flex items-center gap-3 transition-colors duration-150 hover:bg-white/5"
                            >
                                <span className="text-lg">{area.icon}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-semibold text-white truncate">{area.name}</div>
                                    <div className="text-[10px] text-gray-500 truncate">{area.description}</div>
                                </div>
                                <div className="w-3 h-3 rounded-full shrink-0" style={{ background: area.color }} />
                            </button>
                        ))}
                        {filteredAreas.length === 0 && (
                            <div className="text-center text-gray-500 text-sm py-8">No results found</div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Legend Panel ────────────────────────────── */}
            {showLegend && (
                <div
                    className="absolute top-16 left-4 right-4 md:left-auto md:right-4 z-[1000] md:w-56 rounded-2xl overflow-hidden"
                    style={{
                        background: "rgba(10, 10, 18, 0.92)",
                        backdropFilter: "blur(20px)",
                        border: "1px solid rgba(255, 167, 38, 0.2)",
                        boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
                    }}
                >
                    <div className="p-3 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                        <span className="text-xs font-bold text-white tracking-wider uppercase">Legend</span>
                    </div>
                    <div className="p-3 space-y-2 max-h-[50vh] overflow-y-auto">
                        {Object.entries(categoryColors).map(([key, { label, color }]) => (
                            <div key={key} className="flex items-center gap-2">
                                <div className="w-3 h-3 shrink-0 rounded-sm" style={{ background: color }} />
                                <span className="text-xs text-gray-300">{label}</span>
                            </div>
                        ))}
                        <div className="flex items-center gap-2 pt-1 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                            <div className="w-3 h-3 shrink-0 rounded-full border-2 border-dashed" style={{ borderColor: "#4a4a50" }} />
                            <span className="text-xs text-gray-300">Campus Boundary / Roads</span>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Location Controls (bottom-right FABs on mobile, bottom-left on desktop) ────────────────────────────── */}
            <div className="absolute bottom-32 right-4 md:bottom-28 md:left-4 md:right-auto z-[1000] flex flex-col gap-2">
                {/* Track my location */}
                <button
                    onClick={toggleTracking}
                    title={trackingActive ? "Tracking ON" : "Track Me"}
                    className="flex items-center justify-center md:justify-start gap-2 w-12 h-12 md:w-auto md:px-4 md:py-2.5 rounded-full md:rounded-xl transition-all duration-200 shadow-lg"
                    style={{
                        background: trackingActive ? "rgba(79, 195, 247, 0.2)" : "rgba(10, 10, 18, 0.85)",
                        backdropFilter: "blur(16px)",
                        border: `1px solid ${trackingActive ? "rgba(79, 195, 247, 0.5)" : "rgba(255,255,255,0.1)"}`,
                    }}
                >
                    <Navigation size={20} className={trackingActive ? "text-blue-400" : "text-gray-400"} />
                    <span className={`hidden md:inline text-xs font-semibold ${trackingActive ? "text-blue-300" : "text-gray-300"}`}>
                        {trackingActive ? "Tracking ON" : "Track Me"}
                    </span>
                </button>

                {/* Center on user */}
                {userLocation && (
                    <button
                        onClick={centerOnUser}
                        title="My Location"
                        className="flex items-center justify-center md:justify-start gap-2 w-12 h-12 md:w-auto md:px-4 md:py-2.5 rounded-full md:rounded-xl transition-all duration-200 shadow-lg"
                        style={{
                            background: "rgba(10, 10, 18, 0.85)",
                            backdropFilter: "blur(16px)",
                            border: "1px solid rgba(255,255,255,0.1)",
                        }}
                    >
                        <Locate size={20} className="text-gray-400" />
                        <span className="hidden md:inline text-xs font-semibold text-gray-300">My Location</span>
                    </button>
                )}

                {/* Reset view */}
                <button
                    onClick={centerOnCampus}
                    title="Reset View"
                    className="flex items-center justify-center md:justify-start gap-2 w-12 h-12 md:w-auto md:px-4 md:py-2.5 rounded-full md:rounded-xl transition-all duration-200 shadow-lg"
                    style={{
                        background: "rgba(10, 10, 18, 0.85)",
                        backdropFilter: "blur(16px)",
                        border: "1px solid rgba(255,255,255,0.1)",
                    }}
                >
                    <MapPin size={20} className="text-gray-400" />
                    <span className="hidden md:inline text-xs font-semibold text-gray-300">Reset View</span>
                </button>
            </div>

            {/* ── Location Status Bar (top-centered on mobile, bottom-centered on desktop) ────────────────────────────── */}
            {(trackingActive || locationError) && (
                <div
                    className="absolute top-20 md:top-auto md:bottom-28 left-1/2 -translate-x-1/2 z-[1000] rounded-2xl px-4 py-3 max-w-md w-[calc(100vw-6rem)] md:w-[90vw]"
                    style={{
                        background: "rgba(10, 10, 18, 0.92)",
                        backdropFilter: "blur(20px)",
                        border: `1px solid ${locationError ? "rgba(239,83,80,0.3)" : isOnCampus ? "rgba(76,175,80,0.3)" : "rgba(255,167,38,0.3)"}`,
                        boxShadow: "0 4px 32px rgba(0,0,0,0.5)",
                    }}
                >
                    {locationError ? (
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 shrink-0 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-xs text-red-400 break-words">{locationError}</span>
                        </div>
                    ) : userLocation ? (
                        <div className="space-y-1.5 overflow-hidden">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 shrink-0 rounded-full animate-pulse ${isOnCampus ? "bg-green-500" : "bg-orange-400"}`} />
                                <span className="text-xs font-semibold text-white truncate">
                                    {isOnCampus ? "📍 You are on JKLU Campus" : "📍 You are outside campus"}
                                </span>
                            </div>
                            {currentBuilding && (
                                <div className="text-[11px] text-blue-300 pl-4 truncate">
                                    🏛️ Currently at: <strong>{currentBuilding}</strong>
                                </div>
                            )}
                            {!currentBuilding && nearestBuilding && (
                                <div className="text-[11px] text-gray-400 pl-4 truncate">
                                    📌 Nearest: <strong className="text-gray-300">{nearestBuilding}</strong>
                                </div>
                            )}
                            <div className="text-[10px] text-gray-500 pl-4">
                                Accuracy: ±{Math.round(userLocation.accuracy)}m
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs text-blue-300">Acquiring your location...</span>
                        </div>
                    )}
                </div>
            )}

            {/* ── Selected Area Info Panel ────────────────────────────── */}
            {selectedArea && (
                <div
                    className="absolute bottom-32 left-4 right-4 md:bottom-28 md:left-auto md:right-4 z-[1000] md:w-72 rounded-2xl overflow-hidden"
                    style={{
                        background: "rgba(10, 10, 18, 0.92)",
                        backdropFilter: "blur(20px)",
                        border: `1px solid ${selectedArea.color}33`,
                        boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
                    }}
                >
                    <div className="flex items-center justify-between p-3 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                        <div className="flex items-center gap-2 overflow-hidden">
                            <span className="text-lg shrink-0">{selectedArea.icon}</span>
                            <span className="text-sm font-bold text-white truncate">{selectedArea.name}</span>
                        </div>
                        <button onClick={() => setSelectedArea(null)} className="text-gray-500 hover:text-gray-300 shrink-0 ml-2">
                            <X size={16} />
                        </button>
                    </div>
                    <div className="p-3">
                        <p className="text-xs text-gray-400 leading-relaxed max-h-32 overflow-y-auto">{selectedArea.description}</p>

                        {/* Floor Switcher */}
                        {availableFloors.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-white/5">
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Available Floors</label>
                                <div className="flex flex-wrap gap-2">
                                    {availableFloors.map(floor => (
                                        <button
                                            key={floor}
                                            onClick={() => setSelectedFloor(floor)}
                                            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${selectedFloor === floor ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                                        >
                                            {floor}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col gap-2 mt-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 shrink-0 rounded-full" style={{ background: selectedArea.color }} />
                                <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold truncate">
                                    {categoryColors[selectedArea.category]?.label || selectedArea.category}
                                </span>
                            </div>

                            <button
                                onClick={() => setIsNavigating(!isNavigating)}
                                className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${isNavigating ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-orange-500 text-white shadow-lg shadow-orange-500/20 hover:bg-orange-600'}`}
                            >
                                <Navigation size={14} className={isNavigating ? "animate-pulse" : ""} />
                                {isNavigating ? "Stop Navigation" : "Get Directions"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation Path Layer */}
            <style jsx global>{`
                @keyframes dash {
                    to {
                        stroke-dashoffset: -20;
                    }
                }
                .nav-path-animation {
                    animation: dash 1.5s linear infinite;
                }
            `}</style>
        </div>
    );
}
