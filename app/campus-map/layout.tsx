import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "JKLU Campus Map — HackJKLU 5.0",
    description: "Interactive campus map for JK Lakshmipat University. Find buildings, hostels, sports facilities, and navigate the campus.",
};

export default function CampusMapLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
