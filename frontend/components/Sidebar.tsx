"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Layers,
  Map,
  Network,
  KanbanSquare,
  FileCheck,
  Cpu,
  Sparkles,
  AlertTriangle,
  Home,
  Sliders,
  Scale,
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  // If on landing page "/", don't show sidebar to allow full-width landing experience
  if (pathname === "/") {
    return null;
  }

  const navItems = [
    { label: "Public Portal", href: "/", icon: Home },
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Works Explorer", href: "/works", icon: Layers },
    { label: "Statutory Compliance", href: "/compliance", icon: Scale, badge: "SC/ST Mandate" },
    { label: "Plan Risk Scorer", href: "/proposals", icon: Sliders, badge: "Feed Plan" },
    { label: "Geospatial Maps", href: "/maps", icon: Map },
    { label: "Money Flow & Cartels", href: "/graph", icon: Network },
    { label: "Case Workflow", href: "/cases", icon: KanbanSquare },
    { label: "Risk Alerts", href: "/alerts", icon: AlertTriangle },
    { label: "Audit Reports", href: "/reports", icon: FileCheck },
    { label: "Model Metrics", href: "/model-metrics", icon: Cpu },
    { label: "Future Roadmap", href: "/roadmap", icon: Sparkles },
  ];

  return (
    <aside className="w-64 border-r border-[#E5DFD3] bg-[#FAF7F2] p-4 flex flex-col justify-between shrink-0 hidden md:flex min-h-[calc(100vh-52px)] shadow-[1px_0_12px_rgba(40,20,10,0.02)]">
      <div className="space-y-1">
        {/* Sovereign Brand Lockup */}
        <Link
          href="/"
          className="flex items-center gap-3 px-2 py-2 mb-3 rounded-lg hover:bg-[#F0ECE1] transition-all group border border-transparent hover:border-[#E5DFD3]"
        >
          <div className="w-9 h-9 rounded-full bg-[#F6F4EF] border border-[#D97706]/50 flex items-center justify-center overflow-hidden shadow-xs shrink-0">
            <img src="/national-emblem-ivory.png" alt="Emblem" className="w-7 h-7 object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-editorial font-bold text-base tracking-tight text-[#1C1917] group-hover:text-[#6E4529] transition-colors">
                SETU
              </span>
              <span className="bg-[#6E4529] text-[#F5EBE1] text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-[2px]">
                AUDIT
              </span>
            </div>
            <p className="text-[10px] text-[#8C5D3B] font-mono font-semibold tracking-wider">GOVT OF INDIA</p>
          </div>
        </Link>

        <div className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-widest text-[#8C5D3B]/80">
          OPERATIONAL COMMAND
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between rounded-md px-3.5 py-2.5 text-xs transition-all ${
                isActive
                  ? "bg-[#6E4529] text-[#F5EBE1] font-bold shadow-xs border border-[#5A361F]"
                  : "text-stone-700 hover:bg-[#F0ECE1] hover:text-stone-900 font-medium"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-[#FDE68A]" : "text-stone-400"}`} />
                <span>{item.label}</span>
              </div>
              {"badge" in item && item.badge && (
                <span
                  className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded transition-colors ${
                    isActive
                      ? "bg-[#FDE68A] text-[#3D2312]"
                      : "bg-amber-100 text-amber-900 border border-amber-300"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Model & Dataset Status Badge at bottom */}
      <div className="rounded-lg border border-[#E5DFD3] bg-[#FFFDF9] p-3 space-y-1.5 text-[11px] shadow-2xs">
        <div className="flex items-center justify-between text-[#3D2312] font-mono font-bold">
          <span>AI Sentinel Engine</span>
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
        <p className="text-stone-600 text-[10px]">
          XGBoost + Isolation Forest active on 60,356 records.
        </p>
        <div className="pt-1.5 border-t border-[#E5DFD3] flex justify-between text-[10px] text-[#8C5D3B] font-mono">
          <span>Holdout ROC-AUC</span>
          <span className="font-bold text-[#1C1917]">0.980</span>
        </div>
      </div>
    </aside>
  );
}
