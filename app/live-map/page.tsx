"use client";

import dynamic from "next/dynamic";

const ParticipantMap = dynamic(() => import("./ParticipantMap"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-screen bg-[#0a0a0f] flex items-center justify-center flex-col gap-4">
            <div className="w-8 h-8 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
            <div className="text-sky-400 font-medium tracking-widest text-sm uppercase">Loading Radar...</div>
        </div>
    ),
});

export default function LiveMapPage() {
    return <ParticipantMap />;
}
