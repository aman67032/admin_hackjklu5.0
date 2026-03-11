"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Zap, ScrollText, Shield, Landmark, ClipboardList, Settings, MapPin } from "lucide-react";

const navItems = [
    { href: "/dashboard", icon: <Zap size={18} />, label: "Overview", greekName: "Olympus" },
    { href: "/dashboard/registrations", icon: <ScrollText size={18} />, label: "Registrations", greekName: "The Registry" },
    { href: "/dashboard/teams", icon: <Shield size={18} />, label: "Teams", greekName: "Armies" },
    { href: "/dashboard/checkin", icon: <Landmark size={18} />, label: "Check-in", greekName: "The Gates" },
    { href: "/dashboard/exports", icon: <ClipboardList size={18} />, label: "Exports", greekName: "Scrolls" },
    { href: "/dashboard/tracking", icon: <MapPin size={18} />, label: "Live Tracking", greekName: "Eagle Eye" },
    { href: "/dashboard/settings", icon: <Settings size={18} />, label: "Settings", greekName: "Oracle" },
];

export default function Sidebar({
    collapsed,
    setCollapsed
}: {
    collapsed: boolean;
    setCollapsed: (v: boolean) => void
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [admin, setAdmin] = useState<{ username: string; role: string } | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem("hackjklu_admin");
        if (stored) {
            setAdmin(JSON.parse(stored));
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("hackjklu_token");
        localStorage.removeItem("hackjklu_admin");
        router.push("/login");
    };

    return (
        <aside
            className={`fixed left-0 top-0 h-screen flex flex-col z-50 transition-all duration-300 shadow-2xl md:shadow-none ${collapsed ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}`}
            style={{
                width: collapsed ? "80px" : "var(--sidebar-width)",
                background: "rgba(10, 14, 42, 0.95)", // more opaque on mobile
                borderRight: "1px solid rgba(232, 98, 26, 0.15)",
                backdropFilter: "blur(25px)"
            }}
        >
            {/* Header */}
            <div className="p-4 flex items-center gap-3 greek-border-bottom" style={{ minHeight: "var(--header-height)" }}>
                <div
                    className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden"
                    style={{ background: "transparent", border: "1px solid rgba(212,168,67,0.3)" }}
                >
                    <img src="/hackjklu_logo.png" alt="Logo" className="w-full h-full object-cover" />
                </div>
                {!collapsed && (
                    <div className="animate-fade-in overflow-hidden">
                        <h2 className="text-gold-gradient text-sm font-bold tracking-wider" style={{ fontFamily: "var(--font-display)" }}>
                            HACKJKLU 5.0
                        </h2>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>Admin Portal</p>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative mx-2"
                            style={{
                                background: isActive ? "rgba(232, 98, 26, 0.1)" : "transparent",
                                color: isActive ? "var(--accent-orange)" : "var(--text-secondary-alt)",
                                borderLeft: isActive ? "4px solid var(--accent-orange)" : "4px solid transparent",
                            }}
                        >
                            <span className="flex-shrink-0 w-6 flex justify-center text-current">{item.icon}</span>
                            {!collapsed && (
                                <div className="overflow-hidden">
                                    <span className="text-sm font-medium block">{item.label}</span>
                                    <span className="text-[10px] block" style={{ color: "var(--text-muted)", fontFamily: "var(--font-display)" }}>
                                        {item.greekName}
                                    </span>
                                </div>
                            )}
                            {isActive && (
                                <div className="absolute right-2 w-2 h-2 rounded-full" style={{ background: "var(--accent-orange)" }} />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer - Admin info */}
            <div className="p-3 border-t" style={{ borderColor: "var(--border)" }}>
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="w-full flex items-center justify-center p-2 rounded-lg mb-2 transition-colors"
                    style={{ color: "var(--text-muted)" }}
                    title={collapsed ? "Expand" : "Collapse"}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {collapsed ? (
                            <polyline points="9 18 15 12 9 6" />
                        ) : (
                            <polyline points="15 18 9 12 15 6" />
                        )}
                    </svg>
                </button>

                {admin && !collapsed && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-2 rounded-xl animate-fade-in"
                        style={{
                            background: "rgba(232, 98, 26, 0.1)",
                            border: "1px solid rgba(232, 98, 26, 0.1)"
                        }}>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shadow-sm shrink-0"
                            style={{ background: "linear-gradient(135deg, var(--accent-orange), var(--accent-amber))", color: "white" }}>
                            {admin.username[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>{admin.username}</p>
                            <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--gold-dim)" }}>{admin.role}</p>
                        </div>
                        <button onClick={handleLogout} className="text-xs p-1.5 rounded-md transition-colors hover:bg-red-500/10 self-end sm:self-auto"
                            style={{ color: "var(--danger)" }} title="Logout">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                                <polyline points="16 17 21 12 16 7" />
                                <line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>
        </aside>
    );
}
