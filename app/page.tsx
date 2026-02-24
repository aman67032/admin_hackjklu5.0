"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative py-12 px-4 sm:px-6 lg:px-8">
      {/* Container to restrict max width and center content */}
      <div className="w-full max-w-7xl mx-auto flex flex-col items-center justify-center z-10 animate-fade-in text-center min-h-[80vh]">

        {/* Top Logos Section */}
        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-16 mb-12 opacity-90 animate-slide-in">
          <Image
            src="/JKLU White.png"
            alt="JKLU Logo"
            width={140}
            height={60}
            priority
            loading="eager"
            className="h-[60px] w-auto object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] transition-transform hover:scale-105"
            sizes="(max-width: 768px) 140px, 200px"
          />
          <Image
            src="/TechnicalAffairs.png"
            alt="Technical Affairs Logo"
            width={100}
            height={100}
            priority
            loading="eager"
            className="h-[100px] w-auto object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] transition-transform hover:scale-105"
            style={{
              clipPath: 'polygon(50% 0%, 95% 25%, 95% 75%, 50% 100%, 5% 75%, 5% 25%)'
            }}
            sizes="(max-width: 768px) 100px, 150px"
          />
        </div>

        {/* Central Huge Title Area */}
        <div className="relative mb-16 w-full flex flex-col items-center">
          {/* Main Title Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[150%] bg-[#d4a843]/10 blur-[100px] rounded-full pointer-events-none -z-10" />

          <div className="flex justify-center mb-8 animate-float">
            <Image
              src="/hackjklu_logo.png"
              alt="HackJKLU Logo icon"
              width={220}
              height={220}
              className="h-[220px] w-auto object-contain drop-shadow-[0_0_30px_rgba(212,168,67,0.6)]"
              priority
              loading="eager"
              sizes="(max-width: 768px) 180px, 220px"
            />
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#f5e6d3] via-[#e5d5c3] to-[#c4b5a4] drop-shadow-[0_10px_35px_rgba(229,213,195,0.4)] tracking-widest leading-none mb-6 whitespace-nowrap"
            style={{ fontFamily: 'var(--font-display)' }}>
            HACKJKLU V5.0
          </h1>

          <div className="flex items-center justify-center gap-6 w-full max-w-2xl mx-auto mt-8">
            <div className="h-[2px] bg-gradient-to-r from-transparent via-[#d4a843] to-[#d4a843] flex-1"></div>
            <h2 className="text-sm sm:text-base md:text-xl text-[#eab308] tracking-[0.3em] whitespace-nowrap px-4 uppercase font-semibold drop-shadow-[0_0_10px_rgba(212,168,67,0.8)]"
              style={{ fontFamily: 'var(--font-body)' }}>
              By Council of Technical Affairs
            </h2>
            <div className="h-[2px] bg-gradient-to-l from-transparent via-[#d4a843] to-[#d4a843] flex-1"></div>
          </div>
        </div>

        {/* Refined CTA Button */}
        <div className="mt-12">
          <Link
            href="/login"
            className="group relative inline-flex items-center justify-center gap-3 px-10 py-5 font-bold text-[#2d1810] transition-all duration-300 bg-gradient-to-r from-[#e8621a] via-[#c27e4e] to-[#6b4c3b] rounded-md hover:shadow-[0_0_40px_rgba(232,98,26,0.3)] hover:-translate-y-1 overflow-hidden text-lg md:text-xl border-2 border-[#2d1810]/20"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.15em' }}
          >
            {/* Inner Shine Effect */}
            <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />

            <span>ENTER OLYMPUS</span>
            <ArrowRight size={22} className="transition-transform group-hover:translate-x-2" />
          </Link>
        </div>

      </div>
    </div>
  );
}
