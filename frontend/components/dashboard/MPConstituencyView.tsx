"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  UserCheck,
  Coins,
  Layers,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Send,
  FileCheck2,
  Sparkles,
  Search,
  Crosshair,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { DashboardData } from "../../lib/types";
import { fetchWorkDetail } from "../../lib/api";
import { StatCard } from "../ui/StatCard";
import { RiskBadge } from "../ui/RiskBadge";
import { ConstituencyMap } from "../maps/ConstituencyMap";
import { FraudEvidenceVisualizer } from "../ui/FraudEvidenceVisualizer";
import { ConstituencyDeliveryPipeline } from "./visualizers/ConstituencyDeliveryPipeline";
import { MagicCard } from "../ui/MagicCard";
import { formatTypologyLabel } from "../../lib/typologies";

interface MPConstituencyViewProps {
  data: DashboardData;
  pinsData: any[];
}

export function MPConstituencyView({ data, pinsData }: MPConstituencyViewProps) {
  const { summary, fraud_breakdown, top_flagged_works, extra_insights, jurisdiction } = data;
  const initialTopWork = top_flagged_works && top_flagged_works.length > 0 ? top_flagged_works[0] : null;

  const [activeWork, setActiveWork] = useState<any>(initialTopWork);
  const [inputQuery, setInputQuery] = useState("");
  const [isLoadingWork, setIsLoadingWork] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // When MP jurisdiction or data updates, reset activeWork to the new top project of the MP
  useEffect(() => {
    setActiveWork(top_flagged_works && top_flagged_works.length > 0 ? top_flagged_works[0] : null);
    setInputQuery("");
    setLookupError(null);
  }, [jurisdiction, data]);

  // Ensure activeWork always has full ML sub_scores breakdown
  useEffect(() => {
    if (activeWork?.id && (!activeWork.sub_scores || Object.keys(activeWork.sub_scores).length === 0)) {
      fetchWorkDetail(activeWork.id)
        .then((detail) => {
          if (detail && detail.id === activeWork.id) {
            setActiveWork((prev: any) => ({ ...prev, ...detail }));
          }
        })
        .catch(() => {});
    }
  }, [activeWork?.id]);

  const handleLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = inputQuery.trim();
    if (!query) return;

    setLookupError(null);

    // 1. Check local MP works list first
    const matchedLocal = top_flagged_works.find(
      (w) =>
        w.id.toLowerCase() === query.toLowerCase() ||
        w.work.toLowerCase().includes(query.toLowerCase())
    );
    if (matchedLocal) {
      setActiveWork(matchedLocal);
      return;
    }

    // 2. Fetch directly from backend via fetchWorkDetail
    setIsLoadingWork(true);
    try {
      const detailed = await fetchWorkDetail(query.toUpperCase());
      if (detailed && detailed.id) {
        setActiveWork(detailed);
      } else {
        setLookupError(`No project found matching "${query}"`);
      }
    } catch (err: any) {
      setLookupError(`Project "${query}" not found in MPLADS database.`);
    } finally {
      setIsLoadingWork(false);
    }
  };

  // Stalled works count (matches delayed_work, abandoned_work, ghost_work, or legacy ghost_project)
  const stalledItem = fraud_breakdown.find((f) => {
    const t = f.fraud_type?.toLowerCase() || "";
    return t.includes("ghost") || t.includes("delayed") || t.includes("abandoned") || t.includes("stall");
  });
  const stalledCount = stalledItem ? stalledItem.count : 0;
  const stalledAmount = stalledItem ? stalledItem.total_amount : 0;

  // Utilization calculation (% of ₹5 Crore annual allocation)
  const annualLimit = 50000000; // ₹5 Crore
  const utilizationPct = Math.min(100, Math.round((summary.total_allocation / annualLimit) * 100));

  return (
    <div className="space-y-6">
      {/* MP Parliamentary Accountability Banner */}
      <MagicCard 
        glowColor="245, 158, 11"
        enableBorderGlow={true}
        enableTilt={true}
        className="relative overflow-hidden rounded-xl border border-[#4E2F1A] bg-[#6E4529] p-5 text-[#F5EBE1] shadow-[0_4px_20px_rgba(40,20,10,0.12)]"
      >
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="rounded bg-[#3D2312] px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#FDE68A] border border-[#FDE68A]/30">
                PARLIAMENTARY CONSTITUENCY • {jurisdiction.toUpperCase()}
              </span>
              <span className="text-[11px] text-[#F5EBE1]/80 font-mono">Member of Parliament Dashboard</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-editorial font-bold tracking-tight text-white">
              Constituency Fund Utilization & Progress Cockpit
            </h2>
            <p className="text-xs text-[#F5EBE1]/90 max-w-2xl font-sans">
              Monitor recommended development works, track project execution timelines, prevent stalling by implementing agencies, and showcase transparent governance to your constituents.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/reports"
              className="border border-[#F5EBE1]/80 hover:bg-[#F5EBE1] hover:text-[#6E4529] text-[#F5EBE1] px-4 py-2 text-xs font-mono font-bold tracking-wider uppercase transition-all duration-200 rounded-[2px] shadow-sm flex items-center gap-2 group"
            >
              <FileCheck2 className="h-4 w-4 text-[#FDE68A] group-hover:text-[#6E4529]" />
              <span>Constituent Transparency Report ↗</span>
            </Link>
          </div>
        </div>
      </MagicCard>

      {/* 4 MP Parliamentary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Constituency Works Sanctioned"
          value={summary.total_works.toLocaleString()}
          subtitle={`Across ${pinsData.length || summary.total_works} village panchayats`}
          icon={Layers}
          variant="default"
        />
        <StatCard
          title="₹5 Cr Annual Fund Outlay"
          value={`₹${(summary.total_allocation / 10000000).toFixed(2)} Cr`}
          subtitle={`${utilizationPct}% utilized of statutory allocation`}
          icon={Coins}
          variant="accent"
          trend={{
            value: `${utilizationPct}% utilized`,
            isPositive: utilizationPct >= 60,
          }}
        />
        <StatCard
          title="Stalled / Delayed Projects"
          value={stalledCount > 0 ? `${stalledCount} works` : "0 stalled"}
          subtitle={`₹${(stalledAmount / 100000).toFixed(1)}L pending execution`}
          icon={Clock}
          variant={stalledCount > 0 ? "warning" : "success"}
          trend={{
            value: ">180 days in pending status",
            isPositive: false,
          }}
        />
        <StatCard
          title="Constituency Governance Score"
          value={`${extra_insights.compliance_rate || 94.2}%`}
          subtitle="Audit compliance & public transparency"
          icon={ShieldCheck}
          variant="success"
        />
      </div>

      {/* Local Constituency Progress Map */}
      <div className="space-y-2">
        <ConstituencyMap
          pins={pinsData}
          title={`${jurisdiction} Constituency Physical Progress & Asset Audit`}
        />
        {/* Bespoke MP Visualizer: Recommendation-to-Asset Pipeline & Delay Sinks */}
        <ConstituencyDeliveryPipeline 
          jurisdiction={jurisdiction} 
          summary={summary} 
          extraInsights={extra_insights} 
        />
      </div>

      {/* Constituency Typologies & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Constituency Anomaly Signatures */}
        <MagicCard 
          glowColor="245, 158, 11"
          enableBorderGlow={true}
          enableTilt={false}
          className="lg:col-span-12 rounded-xl border border-[#E5DFD3] bg-[#FFFDF9] p-5 shadow-[0_2px_12px_rgba(40,20,10,0.03)]"
        >
          <div className="flex items-center justify-between border-b border-[#E5DFD3] pb-3">
            <div>
              <h3 className="text-base font-editorial font-bold text-[#1C1917]">Constituency Risk Profile</h3>
              <p className="text-xs text-stone-500 font-sans">Anomaly signatures detected in recommended projects</p>
            </div>
            <span className="rounded bg-[#FAF7F2] px-2.5 py-0.5 text-xs font-mono font-bold text-[#6E4529] border border-[#D9D2C5]">
              Transparency
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {fraud_breakdown.map((item) => (
              <div key={item.fraud_type} className="rounded-lg border border-[#E5DFD3] bg-[#FAF7F2] p-3 shadow-2xs">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#1C1917]">{formatTypologyLabel(item.label || item.fraud_type)}</span>
                  <span className="font-mono font-bold text-[#6E4529]">{item.count} projects</span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-stone-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 via-[#6E4529] to-rose-600"
                    style={{ width: `${Math.min(100, Math.max(8, item.percentage))}%` }}
                  />
                </div>
                <div className="mt-1.5 flex justify-between text-[11px] text-stone-500 font-mono">
                  <span>₹{(item.total_amount / 100000).toFixed(1)}L allocated</span>
                  <span>{item.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </MagicCard>
      </div>

      {/* Dynamic MP Project Spotlight & Live Work ID Lookup */}
      <div id="mp-project-spotlight" className="space-y-3">
        {/* Interactive Project Inspection Bar */}
        <div className="rounded-xl border border-[#E5DFD3] bg-[#FAF7F2] p-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded bg-[#6E4529] text-[#FDE68A] shrink-0 font-mono text-xs">
              <Crosshair className="h-4 w-4" />
            </span>
            <div>
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#6E4529]">
                Constituency Project Spotlight & Trace • {jurisdiction}
              </h4>
              <p className="text-[11px] text-stone-500 font-sans">
                Select a recommended project below or enter any Work ID to review physical progress & forensic telemetry.
              </p>
            </div>
          </div>

          <form onSubmit={handleLookup} className="flex items-center gap-2 grow max-w-md">
            <div className="relative grow">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-stone-400" />
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Enter Work ID (e.g. MPLADS-003282) or keyword..."
                className="w-full rounded-md border border-[#D9D2C5] bg-white py-1.5 pl-8 pr-3 text-xs text-[#1C1917] placeholder-stone-400 focus:border-[#6E4529] focus:outline-none focus:ring-1 focus:ring-[#6E4529] font-mono shadow-2xs"
              />
            </div>
            <button
              type="submit"
              disabled={isLoadingWork || !inputQuery.trim()}
              className="rounded-md bg-[#6E4529] hover:bg-[#5A361F] text-white px-3 py-1.5 text-xs font-mono font-bold tracking-wider uppercase transition-all duration-150 disabled:opacity-50 inline-flex items-center gap-1.5 shrink-0 shadow-2xs"
            >
              {isLoadingWork ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <Crosshair className="h-3.5 w-3.5 text-[#FDE68A]" />
                  <span>Inspect</span>
                </>
              )}
            </button>
          </form>
        </div>

        {lookupError && (
          <div className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-mono text-rose-800 flex items-center justify-between">
            <span>⚠ {lookupError}</span>
            <button onClick={() => setLookupError(null)} className="text-rose-600 hover:text-rose-900 font-bold ml-2">✕</button>
          </div>
        )}

        {/* Quick Select Chips from MP projects */}
        {top_flagged_works && top_flagged_works.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500 mr-1">
              Constituency Queue:
            </span>
            {top_flagged_works.slice(0, 5).map((w) => {
              const isSelected = activeWork?.id === w.id;
              return (
                <button
                  key={w.id}
                  onClick={() => {
                    setActiveWork(w);
                    setLookupError(null);
                  }}
                  type="button"
                  className={`rounded-md px-2.5 py-1 text-[11px] font-mono transition-all flex items-center gap-1.5 border ${
                    isSelected
                      ? "bg-[#6E4529] text-[#F5EBE1] border-[#5A361F] shadow-xs font-bold"
                      : "bg-[#FFFDF9] text-stone-700 border-[#D9D2C5] hover:bg-white hover:border-[#8C5D3B]"
                  }`}
                >
                  <span>{w.id}</span>
                  <span className={`text-[10px] ${isSelected ? "text-[#FDE68A]" : "text-stone-500"}`}>
                    (Score: {w.risk_score?.toFixed(0)})
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* The Spotlight Card */}
        {activeWork ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-mono font-bold text-[#6E4529] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                Constituency High-Priority Project Spotlight ({activeWork.id})
                {activeWork.constituency && (
                  <span className="font-normal text-stone-500 lowercase">
                    • {activeWork.constituency}
                  </span>
                )}
              </span>
              <Link
                href={`/works/${activeWork.id}`}
                className="text-xs font-mono font-bold text-[#6E4529] hover:text-[#3D2312] hover:underline flex items-center gap-1"
              >
                Review Execution Trace <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <FraudEvidenceVisualizer work={activeWork} />
          </div>
        ) : (
          <div className="rounded-xl border border-emerald-300 bg-[#F0FDF4] p-6 text-center shadow-2xs space-y-2">
            <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
            <h4 className="text-sm font-editorial font-bold text-emerald-950">
              All Recommended Projects on Track for {jurisdiction}
            </h4>
            <p className="text-xs text-emerald-800 max-w-lg mx-auto font-sans">
              No developmental works under this parliamentary jurisdiction exhibit execution anomalies or statutory stalling. Enter any Work ID above to inspect a specific physical asset.
            </p>
          </div>
        )}
      </div>

      {/* MP Constituency Works Table */}
      <MagicCard 
        glowColor="245, 158, 11"
        enableBorderGlow={true}
        enableTilt={false}
        className="rounded-xl border border-[#E5DFD3] bg-[#FFFDF9] p-5 shadow-[0_2px_12px_rgba(40,20,10,0.03)]"
      >
        <div className="flex items-center justify-between border-b border-[#E5DFD3] pb-4">
          <div>
            <h3 className="text-base font-editorial font-bold text-[#1C1917]">Recommended Constituency Projects</h3>
            <p className="text-xs text-stone-500 font-sans">Track progress of physical assets for your constituents</p>
          </div>
          <Link
            href="/works"
            className="text-xs font-mono font-bold text-[#6E4529] hover:underline flex items-center gap-1"
          >
            View All Constituency Works <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#D9D2C5] text-stone-600 uppercase tracking-wider bg-[#F0ECE1] font-mono text-[11px]">
                <th className="py-2.5 pl-3">Work ID</th>
                <th className="py-2.5">Project Title</th>
                <th className="py-2.5">Block / Village</th>
                <th className="py-2.5">Executing Agency (IDA)</th>
                <th className="py-2.5 text-right">Outlay</th>
                <th className="py-2.5 text-center">Status</th>
                <th className="py-2.5 text-center">Integrity Score</th>
                <th className="py-2.5 pr-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DFD3]/60">
              {top_flagged_works.map((w) => (
                <tr
                  key={w.id}
                  onClick={() => {
                    setActiveWork(w);
                    const el = document.getElementById("mp-project-spotlight");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className={`transition-colors cursor-pointer ${
                    activeWork?.id === w.id
                      ? "bg-amber-50/80 ring-1 ring-inset ring-[#6E4529]/40"
                      : "hover:bg-[#FAF7F2]"
                  }`}
                >
                  <td className="py-3 pl-3 font-mono font-bold text-[#1C1917]">{w.id}</td>
                  <td className="py-3 font-medium text-stone-800 max-w-xs truncate">{w.work}</td>
                  <td className="py-3 text-stone-600">{w.constituency}</td>
                  <td className="py-3 text-stone-600 max-w-[140px] truncate font-mono">{w.ida}</td>
                  <td className="py-3 text-right font-mono font-bold text-[#1C1917] font-tabular">₹{w.allocation_amount.toLocaleString()}</td>
                  <td className="py-3 text-center">
                    <span className="rounded px-2 py-0.5 text-[10px] font-mono font-bold bg-[#FAF7F2] text-stone-700 border border-[#E5DFD3]">
                      {w.status || "Sanctioned"}
                    </span>
                  </td>
                  <td className="py-3 text-center">
                    <RiskBadge score={w.risk_score} level={w.risk_level} size="sm" />
                  </td>
                  <td className="py-3 pr-3 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveWork(w);
                        const el = document.getElementById("mp-project-spotlight");
                        if (el) el.scrollIntoView({ behavior: "smooth" });
                      }}
                      className={`rounded-md px-2 py-1 text-[11px] font-mono font-bold transition-all inline-flex items-center gap-1 shadow-2xs border ${
                        activeWork?.id === w.id
                          ? "bg-[#6E4529] text-white border-[#5A361F]"
                          : "bg-[#FFFDF9] text-[#6E4529] border-[#D9D2C5] hover:bg-[#F0ECE1]"
                      }`}
                    >
                      <Crosshair className="h-3 w-3" />
                      <span>{activeWork?.id === w.id ? "Inspecting" : "Inspect"}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </MagicCard>
    </div>
  );
}
