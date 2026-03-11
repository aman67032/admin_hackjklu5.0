"use client";

import dynamic from "next/dynamic";

// Leaflet requires `window`, so we must disable SSR
const CampusMapContent = dynamic(
    () => import("../dashboard/campus-map/CampusMapContent"),
    {
        ssr: false,
        loading: () => (
            <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0a0f" }}>
                <div className="text-center">
                    <div className="w-14 h-14 border-3 border-t-transparent rounded-full animate-spin mx-auto mb-4"
                        style={{ borderColor: "#ffa726", borderTopColor: "transparent" }} />
                    <p className="text-base font-medium tracking-wide" style={{ color: "#ffa726" }}>
                        Loading Campus Map...
                    </p>
                </div>
            </div>
        ),
    }
);

export default function PublicCampusMapPage() {
    return <CampusMapContent />;
}
