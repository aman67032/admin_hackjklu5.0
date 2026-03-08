import { CampusArea } from "../campus-map/campus-map-data";

export interface CustomFloorZone {
    id: string;
    name: string;
    description: string;
    parentBuildingId: string; // ID of the building this zone belongs to (e.g., 'iet1')
    floorLevel: string;       // e.g., 'Ground', '1', '2'
    zoneType: 'Standard' | 'Hackathon Venue' | 'Accommodation Venue' | 'Restricted Area';
    coordinates: [number, number][]; // Polygon coordinates
    color: string;
    fillColor: string;
}

// Temporary local storage key for zones before backend is ready
export const ZONES_STORAGE_KEY = "hackjklu_custom_zones";

export function loadCustomZones(): CustomFloorZone[] {
    if (typeof window === "undefined") return [];
    try {
        const stored = localStorage.getItem(ZONES_STORAGE_KEY);
        if (stored) return JSON.parse(stored);
    } catch (e) {
        console.error("Failed to load custom zones from local storage", e);
    }
    return [];
}

export function saveCustomZones(zones: CustomFloorZone[]) {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(ZONES_STORAGE_KEY, JSON.stringify(zones));
    } catch (e) {
        console.error("Failed to save custom zones to local storage", e);
    }
}

export const ZONE_TYPE_COLORS = {
    'Standard': { color: '#ffa726', fillColor: '#ffa726' },
    'Hackathon Venue': { color: '#ab47bc', fillColor: '#ab47bc' },
    'Accommodation Venue': { color: '#5c6bc0', fillColor: '#5c6bc0' },
    'Restricted Area': { color: '#ef5350', fillColor: '#ef5350' },
};
