"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";

const CampusMapContent = dynamic(
    () => import("../dashboard/campus-map/CampusMapContent"),
    {
        ssr: false,
        loading: () => null,
    }
);

export default function PublicCampusMapPage() {
    const [showSplash, setShowSplash] = useState(true);
    const [fadeOut, setFadeOut] = useState(false);
    const [mapReady, setMapReady] = useState(false);

    useEffect(() => {
        // Give map a moment to load behind the splash
        const loadTimer = setTimeout(() => setMapReady(true), 800);
        // Auto-dismiss splash after 2.5s
        const splashTimer = setTimeout(() => {
            setFadeOut(true);
            setTimeout(() => setShowSplash(false), 600);
        }, 2500);
        return () => { clearTimeout(loadTimer); clearTimeout(splashTimer); };
    }, []);

    const dismissSplash = () => {
        setFadeOut(true);
        setTimeout(() => setShowSplash(false), 600);
    };

    return (
        <div className="relative w-full h-screen overflow-hidden" style={{ background: "#0a0a0f" }}>
            {/* Map loads immediately behind the splash */}
            <div className={`absolute inset-0 transition-opacity duration-700 ${mapReady ? 'opacity-100' : 'opacity-0'}`}>
                <CampusMapContent />
            </div>

            {/* Splash overlay */}
            {showSplash && (
                <div
                    onClick={dismissSplash}
                    className={`absolute inset-0 z-[2000] flex items-center justify-center cursor-pointer transition-all duration-600 ${fadeOut ? 'opacity-0 scale-105' : 'opacity-100 scale-100'}`}
                    style={{
                        background: "radial-gradient(ellipse at center, rgba(10, 10, 20, 0.95) 0%, rgba(5, 5, 12, 0.98) 70%)",
                        backdropFilter: "blur(30px)",
                    }}
                >
                    <style jsx>{`
                        @keyframes float-in {
                            0% { opacity: 0; transform: translateY(30px) scale(0.95); }
                            100% { opacity: 1; transform: translateY(0) scale(1); }
                        }
                        @keyframes pulse-glow {
                            0%, 100% { box-shadow: 0 0 20px rgba(255,167,38,0.2), 0 0 60px rgba(255,167,38,0.1); }
                            50% { box-shadow: 0 0 30px rgba(255,167,38,0.4), 0 0 80px rgba(255,167,38,0.15); }
                        }
                        @keyframes ring-expand {
                            0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.6; }
                            100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
                        }
                        .splash-card { animation: float-in 0.8s ease-out forwards; }
                        .splash-card-delay { animation: float-in 0.8s ease-out 0.2s forwards; opacity: 0; }
                        .splash-card-delay2 { animation: float-in 0.8s ease-out 0.4s forwards; opacity: 0; }
                        .icon-glow { animation: pulse-glow 2s ease-in-out infinite; }
                        .ring {
                            position: absolute;
                            top: 50%; left: 50%;
                            width: 80px; height: 80px;
                            border-radius: 50%;
                            border: 1px solid rgba(255,167,38,0.15);
                            animation: ring-expand 3s ease-out infinite;
                        }
                        .ring:nth-child(2) { animation-delay: 1s; }
                        .ring:nth-child(3) { animation-delay: 2s; }
                    `}</style>

                    <div className="text-center px-8 max-w-sm">
                        {/* Animated icon */}
                        <div className="relative mx-auto mb-8 w-20 h-20">
                            <div className="ring" />
                            <div className="ring" />
                            <div className="ring" />
                            <div
                                className="relative z-10 w-20 h-20 rounded-2xl flex items-center justify-center icon-glow"
                                style={{
                                    background: "linear-gradient(135deg, rgba(255,167,38,0.15), rgba(255,87,34,0.1))",
                                    border: "1px solid rgba(255,167,38,0.3)",
                                }}
                            >
                                <MapPin size={36} className="text-orange-400" strokeWidth={1.5} />
                            </div>
                        </div>

                        {/* Title */}
                        <div className="splash-card">
                            <h1 className="text-2xl font-bold text-white tracking-tight mb-1">
                                JKLU Campus Map
                            </h1>
                            <div className="flex items-center justify-center gap-2 mb-4">
                                <div className="w-6 h-px bg-gradient-to-r from-transparent to-orange-500/50" />
                                <span
                                    className="text-[10px] font-bold tracking-[0.3em] uppercase"
                                    style={{ color: "#ffa726" }}
                                >
                                    HackJKLU 5.0
                                </span>
                                <div className="w-6 h-px bg-gradient-to-l from-transparent to-orange-500/50" />
                            </div>
                        </div>

                        {/* Subtitle */}
                        <p className="splash-card-delay text-sm text-gray-400 leading-relaxed mb-8">
                            Interactive campus navigation<br />
                            <span className="text-gray-500 text-xs">Search buildings · Track your location · Get directions</span>
                        </p>

                        {/* CTA hint */}
                        <div className="splash-card-delay2 text-[11px] text-gray-600 tracking-wider uppercase">
                            Tap anywhere to explore →
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
