"use client";

import dynamic from "next/dynamic";

const TrackingMapContent = dynamic(() => import("./TrackingMapContent"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-[calc(100vh-100px)] flex items-center justify-center flex-col gap-4">
            <div className="w-8 h-8 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
            <div className="text-orange-400 font-medium tracking-widest text-sm uppercase">Loading Tracking Interface...</div>
        </div>
    ),
});

export default function TrackingPage() {
    return <TrackingMapContent />;
}
