"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import Dock from "@/components/Dock";
import { Zap, ScrollText, Shield, Landmark, ClipboardList, Settings, LogOut, Globe } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [authenticated, setAuthenticated] = useState(false);
    const [checking, setChecking] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const token = localStorage.getItem("hackjklu_token");
        if (!token) {
            router.push("/login");
            return;
        }
        setAuthenticated(true);
        setChecking(false);
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem("hackjklu_token");
        localStorage.removeItem("hackjklu_admin");
        router.push("/login");
    };

    const dockItems = useMemo(() => [
        { icon: <Zap size={22} />, label: 'Dashboard', onClick: () => router.push('/dashboard'), className: pathname === '/dashboard' ? 'bg-orange-500/20 border-orange-400' : '' },
        { icon: <ScrollText size={22} />, label: 'Registrations', onClick: () => router.push('/dashboard/registrations'), className: pathname.startsWith('/dashboard/registrations') ? 'bg-orange-500/20 border-orange-400' : '' },
        { icon: <Shield size={22} />, label: 'Teams', onClick: () => router.push('/dashboard/teams'), className: pathname.startsWith('/dashboard/teams') ? 'bg-orange-500/20 border-orange-400' : '' },
        { icon: <Landmark size={22} />, label: 'Check-in', onClick: () => router.push('/dashboard/checkin'), className: pathname.startsWith('/dashboard/checkin') ? 'bg-orange-500/20 border-orange-400' : '' },
        { icon: <ClipboardList size={22} />, label: 'Exports', onClick: () => router.push('/dashboard/exports'), className: pathname.startsWith('/dashboard/exports') ? 'bg-orange-500/20 border-orange-400' : '' },
        { icon: <Globe size={22} />, label: 'Geography', onClick: () => router.push('/dashboard/geography'), className: pathname.startsWith('/dashboard/geography') ? 'bg-orange-500/20 border-orange-400' : '' },
        { icon: <Settings size={22} />, label: 'Settings', onClick: () => router.push('/dashboard/settings'), className: pathname.startsWith('/dashboard/settings') ? 'bg-orange-500/20 border-orange-400' : '' },
        { icon: <LogOut size={22} />, label: 'Logout', onClick: handleLogout, className: 'border-red-500/50 hover:bg-red-500/20 transition-colors' },
    ], [router, pathname]);

    if (checking) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--navy)" }}>
                <div className="text-center animate-fade-in">
                    <div className="w-12 h-12 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4"
                        style={{ borderColor: "var(--accent-orange)", borderTopColor: "transparent" }} />
                    <p className="text-sm font-medium tracking-wide" style={{ color: "var(--accent-amber)", fontFamily: "var(--font-display)" }}>
                        Entering Olympus...
                    </p>
                </div>
            </div>
        );
    }

    if (!authenticated) return null;

    return (
        <div className="min-h-screen">
            <main className="transition-all duration-300 min-h-screen pb-40 md:pb-48">
                {children}
            </main>
            <Dock
                items={dockItems}
                panelHeight={68}
                baseItemSize={50}
                magnification={80}
            />
        </div>
    );
}
