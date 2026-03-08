"use client";

import dynamic from "next/dynamic";

// Leaflet requires `window`, so we must disable SSR
const CampusMapEditorContent = dynamic(() => import("./CampusMapEditorContent"), {
    ssr: false,
    loading: () => (
        <div className="min-h-screen flex items-center justify-center -ml-0 md:-ml-64 pt-16 md:pt-0" style={{ background: "#0a0a0f" }}>
            <div className="text-center">
                <div className="w-14 h-14 border-3 border-t-transparent rounded-full animate-spin mx-auto mb-4"
                    style={{ borderColor: "#ffa726", borderTopColor: "transparent" }} />
                <p className="text-base font-medium tracking-wide" style={{ color: "#ffa726" }}>
                    Loading Map Editor...
                </p>
            </div>
        </div>
    ),
});

export default function CampusMapEditorPage() {
    return <CampusMapEditorContent />;
}
