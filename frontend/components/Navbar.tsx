"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Search, ArrowRight, Shield, AlertTriangle, Activity,
  Database, MapPin, Radio, Terminal, Cpu, FileText,
  Zap, ChevronRight, Sparkles, SlidersHorizontal, Lock
} from "lucide-react";
import { useRole } from "../context/RoleContext";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { role, roleConfig } = useRole();
  const [searchQuery, setSearchQuery] = useState("");
  const [tickerIndex, setTickerIndex] = useState(0);
  const [timeString, setTimeString] = useState("");
  const [mounted, setMounted] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
          timeZone: "Asia/Kolkata"
        }) + " IST"
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const telemetryItems = [
    { label: "MONITORED CORPUS", value: "₹9,062.10 Cr", highlight: "text-amber-400" },
    { label: "REGISTERED WORKS", value: "60,356 Live", highlight: "text-emerald-400" },
    { label: "STATUTORY SENTINEL", value: "GFR Rule 155 Enforced", highlight: "text-amber-300" },
    { label: "RISK FLAGS AT STAKE", value: "₹381.20 Cr (6,395 Flags)", highlight: "text-rose-400" },
    { label: "GEO SATELLITE RADAR", value: "28 States • 8 UTs", highlight: "text-sky-400" },
    { label: "AUDIT DRIFT LATENCY", value: "14ms (CAG Realtime)", highlight: "text-emerald-400" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % telemetryItems.length);
    }, 3800);
    return () => clearInterval(interval);
  }, [telemetryItems.length]);

  const navLinks = [
    { href: "/dashboard", label: "Command Center", badge: "LIVE", hotkey: "1" },
    { href: "/works", label: "Works Registry", badge: "60K+", hotkey: "2" },
    { href: "/graph", label: "Cartel Graph", badge: "AI Flow", hotkey: "3" },
    { href: "/maps", label: "GIS Radar", badge: "28 States", hotkey: "4" },
    { href: "/alerts", label: "Audit Alerts", badge: "14 High", badgeColor: "bg-rose-500/20 text-rose-400 border-rose-500/30", hotkey: "5" },
    { href: "/compliance", label: "Statutory Audit", badge: "SC/ST", badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", hotkey: "7" },
    { href: "/reports", label: "Audit Dossiers", badge: "CAG", hotkey: "8" },
    { href: "/proposals", label: "Proposal Scorer", badge: "Live ML", badgeColor: "bg-amber-500/20 text-amber-400 border-amber-500/30", hotkey: "9" },
  ];

  // On landing page "/", completely remove navbar per user instruction
  if (pathname === "/") {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#F59E0B]/25 bg-[#090D15]/95 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.65)] selection:bg-amber-500/30 selection:text-amber-200">

      {/* ────────────────────────────────────────────────────────────
          1. TOP SUPREME TELEMETRY BANNER (MAXIMALIST STREAM)
      ──────────────────────────────────────────────────────────── */}
      <div className="relative border-b border-white/10 bg-[#06080E] px-3 sm:px-6 py-1 text-[10px] font-mono tracking-wider overflow-hidden">
        {/* Subtle holographic grid background overlay */}
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(#F59E0B 1px, transparent 1px)",
            backgroundSize: "16px 16px"
          }}
        />

        <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-4 text-slate-400">

          {/* Left Telemetry Cluster: Live Security Level & Jurisdiction */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 font-bold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="tracking-widest">SENTINEL-ONLINE</span>
            </div>

            <div className="hidden md:flex items-center gap-2 text-slate-400">
              <span className="text-white/20">|</span>
              <span className="text-[#D97706] font-bold">GOI-MoSPI</span>
              <span className="text-white/20">•</span>
              <span>CONSTITUTIONAL AUDIT PORTAL</span>
              <span className="text-white/20">•</span>
              <span className="text-slate-300">GFR 2017 SEC 155/157</span>
            </div>
          </div>

          {/* Center Dynamic Telemetry Carousel */}
          <div className="hidden lg:flex items-center gap-3 overflow-hidden text-center">
            <span className="text-amber-500/70 font-semibold">[TELEMETRY STREAM]</span>
            <div className="flex items-center gap-2 animate-pulse">
              <span className="text-slate-400 font-bold">{telemetryItems[tickerIndex].label}:</span>
              <span className={`font-black ${telemetryItems[tickerIndex].highlight}`}>
                {telemetryItems[tickerIndex].value}
              </span>
            </div>
          </div>

          {/* Right Status & Time Badge */}
          <div className="flex items-center gap-3 shrink-0 font-mono text-[10px]">
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">
              <Lock className="h-2.5 w-2.5 text-amber-400" />
              <span>256-BIT PKI AUDIT TRAIL</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-300 bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded font-bold">
              <Activity className="h-3 w-3 animate-spin text-amber-400" style={{ animationDuration: "8s" }} />
              <span>{mounted ? timeString : "12:00:00 IST"}</span>
            </div>
          </div>

        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────
          2. MAIN MAXIMALIST COMMAND DECK (HIGH DENSITY NAVIGATION)
      ──────────────────────────────────────────────────────────── */}
      <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8 gap-4">

        {/* Brand Insignia & Holographic Crest */}
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#1E1711] via-[#120F0D] to-[#080706] p-0.5 border border-amber-500/40 shadow-[0_0_20px_rgba(217,119,6,0.25)] group-hover:border-amber-400 group-hover:shadow-[0_0_28px_rgba(217,119,6,0.45)] transition-all duration-300">
            {/* Spinning Radar Ring */}
            <div className="absolute inset-0 rounded-xl border border-amber-500/20 animate-spin" style={{ animationDuration: "14s" }} />

            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-[#0E0C0A] overflow-hidden">
              <img
                src="/national-emblem-circle.png"
                alt="Emblem"
                className="h-8 w-8 object-contain filter drop-shadow-[0_0_6px_rgba(245,158,11,0.5)] group-hover:scale-110 transition-transform duration-300"
              />
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-editorial text-xl sm:text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#FFF5DC] via-[#FDE68A] to-[#D97706] group-hover:from-white group-hover:to-amber-400 transition-colors">
                SETU
              </span>
              <span className="inline-flex items-center gap-1 rounded bg-amber-500/15 border border-amber-500/40 px-1.5 py-0.5 text-[8px] font-mono font-black uppercase tracking-widest text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.15)]">
                <Sparkles className="h-2 w-2 text-amber-400" />
                <span>GOV.AI</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-400 leading-none">
              <span className="text-[#B45309] font-bold">STATUTORY AUDIT</span>
              <span className="text-white/20">•</span>
              <span className="hidden sm:inline text-slate-400">MPLADS EXPENDITURE RADAR</span>
            </div>
          </div>
        </Link>

        {/* Central Segmented Command Routes (Maximalist Pills with Badges) */}
        <nav className="hidden xl:flex items-center gap-1.5 bg-[#0D121D]/80 p-1.5 rounded-xl border border-white/10 shadow-inner">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 group ${isActive
                    ? "bg-amber-500/20 text-amber-200 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                    : "text-slate-300 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
              >
                <span>{link.label}</span>
                {link.badge && (
                  <span
                    className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${link.badgeColor || (isActive ? "bg-amber-400/20 text-amber-300 border-amber-400/40" : "bg-white/10 text-slate-400 border-white/15")
                      }`}
                  >
                    {link.badge}
                  </span>
                )}
                <span className="hidden group-hover:inline-block text-[8px] font-mono text-slate-500 opacity-60">
                  [{link.hotkey}]
                </span>
                {isActive && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-amber-400 rounded-full shadow-[0_0_8px_#F59E0B]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Search, Quick Command, and Action Buttons */}
        <div className="flex items-center gap-2.5">

          {/* Maximalist Tactical Search Input */}
          <div className="relative hidden md:flex items-center rounded-lg border border-amber-500/30 bg-[#06080E]/90 px-2.5 py-1.5 text-xs text-slate-300 shadow-inner focus-within:border-amber-400 focus-within:ring-1 focus-within:ring-amber-500/30 transition-all">
            <Search className="h-3.5 w-3.5 text-amber-400/80 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Search works, MPs, vendors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none w-36 lg:w-44 font-sans"
            />
            <kbd className="ml-2 flex items-center gap-0.5 rounded border border-white/20 bg-white/10 px-1.5 py-0.5 text-[9px] font-mono font-semibold text-slate-300 shadow-xs">
              <span className="text-[10px]">⌘</span>K
            </kbd>
          </div>

          {/* Quick Anomaly Count Indicator */}
          <Link
            href="/alerts"
            className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-rose-500/30 bg-rose-950/30 hover:bg-rose-900/40 transition-colors text-xs text-rose-300 font-mono"
            title="Active High-Risk Anomalies Detected by Sentinel AI"
          >
            <AlertTriangle className="h-3.5 w-3.5 text-rose-400 animate-pulse" />
            <span className="font-bold">6,395</span>
            <span className="text-[9px] uppercase tracking-wider text-rose-400/70">Flags</span>
          </Link>

          {/* Primary Maximalist CTA: Command Center */}
          <Link
            href="/dashboard"
            className="relative inline-flex items-center gap-2 overflow-hidden rounded-lg bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 px-4 py-2 text-xs font-black text-[#0B0F17] shadow-[0_0_22px_rgba(245,158,11,0.4)] hover:shadow-[0_0_32px_rgba(245,158,11,0.65)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 tracking-wider uppercase border border-amber-300 group"
          >
            {/* Shimmer sweep */}
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:translate-x-full transition-transform duration-700 ease-out" />
            <Terminal className="h-3.5 w-3.5 text-[#0B0F17]" />
            <span className="relative font-mono font-black">CONSOLE</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </Link>

        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────
          3. BOTTOM MICRO-NAVIGATION SCROLLER FOR SMALLER SCREENS
      ──────────────────────────────────────────────────────────── */}
      <div className="flex xl:hidden overflow-x-auto border-t border-white/5 bg-[#070A10] px-3 py-1.5 gap-2 scrollbar-none">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wide ${isActive
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  : "text-slate-400 hover:text-white bg-white/5 border border-white/5"
                }`}
            >
              <span>{link.label}</span>
              {link.badge && (
                <span className="text-[8px] font-mono px-1 py-0.1 rounded bg-white/10 text-slate-300">
                  {link.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

    </header>
  );
}

export default Navbar;
