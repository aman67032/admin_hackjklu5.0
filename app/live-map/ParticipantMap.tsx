"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { campusAreas, CAMPUS_CENTER, CAMPUS_ZOOM } from "../dashboard/campus-map/campus-map-data";
import { MapPin, Navigation, Locate, AlertTriangle } from "lucide-react";
import { mapZonesApi, participantAuthApi } from "@/lib/api";
import { CustomFloorZone } from "../dashboard/map-builder/map-builder-data";

export default function ParticipantMap() {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const locationMarkerRef = useRef<L.Marker | null>(null);
    const accuracyCircleRef = useRef<L.Circle | null>(null);
    const watchIdRef = useRef<number | null>(null);
    const lastLocationRef = useRef<{ lat: number; lng: number } | null>(null);

    // For sync interval
    const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [teamInfo, setTeamInfo] = useState<{ id: string; name: string; email: string } | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isDisqualified, setIsDisqualified] = useState(false);
    const [isTracePass, setIsTracePass] = useState(false);
    const [customZones, setCustomZones] = useState<CustomFloorZone[]>([]);
    const zonesLayerRef = useRef<L.FeatureGroup | null>(null);

    // Initialize map
    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;

        const map = L.map(mapContainerRef.current, {
            center: CAMPUS_CENTER,
            zoom: CAMPUS_ZOOM,
            minZoom: 16,
            maxBoundsViscosity: 1.0,
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

        return () => {
            map.remove();
            mapRef.current = null;
            zonesLayerRef.current = null;
        };
    }, []);

    // Auth & Basic Setup
    useEffect(() => {
        const storedToken = localStorage.getItem("hackjklu_participant_token");
        const storedTeam = localStorage.getItem("hackjklu_participant");
        if (!storedToken || !storedTeam) {
            window.location.href = '/live-map/login';
            return;
        }
        setToken(storedToken);
        setTeamInfo(JSON.parse(storedTeam));

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

    // Draw Zones (Only Ground)
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

    // Track Location
    useEffect(() => {
        if (!navigator.geolocation) {
            setLocationError("Geolocation is not supported by your browser.");
            return;
        }

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude, accuracy } = position.coords;

                if (accuracy > 50 && lastLocationRef.current) return;

                const newLoc = { lat: latitude, lng: longitude, accuracy };
                lastLocationRef.current = { lat: latitude, lng: longitude };
                setUserLocation(newLoc);
                setLocationError(null);

                if (mapRef.current) {
                    if (!locationMarkerRef.current) {
                        const pulsingIcon = L.divIcon({
                            className: "user-location-marker",
                            html: `<div class="user-dot-pulse" style="position: relative; width: 24px; height: 24px;"><div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 14px; height: 14px; background: #38bdf8; border: 3px solid #fff; border-radius: 50%; box-shadow: 0 0 12px rgba(56, 189, 248, 0.6); z-index: 2;"></div></div>`,
                            iconSize: [24, 24],
                            iconAnchor: [12, 12],
                        });
                        locationMarkerRef.current = L.marker([latitude, longitude], { icon: pulsingIcon, zIndexOffset: 1000 }).addTo(mapRef.current);

                        // Recenter on first load
                        mapRef.current.flyTo([latitude, longitude], 19, { duration: 1 });
                    } else {
                        locationMarkerRef.current.setLatLng([latitude, longitude]);
                    }

                    if (!accuracyCircleRef.current) {
                        accuracyCircleRef.current = L.circle([latitude, longitude], {
                            radius: accuracy, color: "#38bdf8", fillColor: "#38bdf8", fillOpacity: 0.1, weight: 1,
                        }).addTo(mapRef.current);
                    } else {
                        accuracyCircleRef.current.setLatLng([latitude, longitude]);
                        accuracyCircleRef.current.setRadius(accuracy);
                    }
                }
            },
            (error) => {
                setLocationError("Location unavailable. Please check permissions & assure you're outdoors.");
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 1000 }
        );

        watchIdRef.current = watchId;
        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    // Sync location every 10 seconds
    useEffect(() => {
        if (!token) return;

        const syncLocation = async () => {
            if (!lastLocationRef.current) return;
            try {
                const res = await participantAuthApi.sendLocation(lastLocationRef.current.lat, lastLocationRef.current.lng, token);
                if (res.tracePassDetected) {
                    setIsTracePass(true);
                } else {
                    setIsTracePass(false);
                }
            } catch (error: any) {
                console.error("Failed to sync location", error);
                if (error.message?.includes("Disqualified")) {
                    setIsDisqualified(true);
                } else if (error.message?.includes("Unauthorized") || error.message?.includes("token")) {
                    localStorage.removeItem("hackjklu_participant_token");
                    localStorage.removeItem("hackjklu_participant");
                    window.location.href = '/live-map/login';
                }
            }
        };

        syncIntervalRef.current = setInterval(syncLocation, 30000);
        return () => {
            if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
            syncIntervalRef.current = null;
        }
    }, [token]);

    const centerOnUser = useCallback(() => {
        if (userLocation && mapRef.current) {
            mapRef.current.flyTo([userLocation.lat, userLocation.lng], 19, { duration: 1 });
        }
    }, [userLocation]);

    if (isDisqualified) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="p-8 bg-red-950 border border-red-500 rounded-2xl text-center max-w-sm">
                    <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">Team Disqualified</h2>
                    <p className="text-red-200">Your tracking has been suspended.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="relative w-full h-screen bg-[#0a0a0f]">
            <div ref={mapContainerRef} className="absolute inset-0 z-0" />

            {/* Top bar info */}
            <div className="absolute top-4 left-4 right-4 z-[1000] flex justify-between items-start pointer-events-none">
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-black/80 backdrop-blur-md border border-sky-500/30 shadow-lg pointer-events-auto">
                    <MapPin size={18} className="text-sky-400" />
                    <div>
                        <div className="text-sm font-bold text-white tracking-wide">{teamInfo?.name || "Participant"}</div>
                    </div>
                </div>

                {isTracePass && (
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-red-950/80 backdrop-blur-md border border-red-500 shadow-lg pointer-events-auto animate-pulse">
                        <AlertTriangle size={18} className="text-red-500" />
                        <div className="text-xs font-bold text-red-200 tracking-wide">TRACE PASS VIOLATION</div>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="absolute bottom-6 left-4 z-[1000] flex flex-col gap-2">
                <button
                    onClick={centerOnUser}
                    className="flex items-center justify-center w-12 h-12 rounded-full bg-black/80 backdrop-blur-md border border-white/10 shadow-lg"
                >
                    <Locate size={20} className="text-sky-400" />
                </button>
            </div>

            {/* Status */}
            <div className="absolute bottom-6 left-20 right-4 z-[1000]">
                <div className="px-4 py-3 rounded-2xl bg-black/80 backdrop-blur-md border border-white/10 shadow-lg flex items-center gap-3">
                    {locationError ? (
                        <>
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-xs font-medium text-red-400">{locationError}</span>
                        </>
                    ) : userLocation ? (
                        <>
                            <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
                            <span className="text-xs font-medium text-sky-100 flex-1">Broadcasting Live Location</span>
                            <span className="text-[10px] text-gray-500">±{Math.round(userLocation.accuracy)}m</span>
                        </>
                    ) : (
                        <>
                            <div className="w-4 h-4 rounded-full border-2 border-sky-500/30 border-t-sky-500 animate-spin" />
                            <span className="text-xs font-medium text-gray-400">Acquiring GPS Signal...</span>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
