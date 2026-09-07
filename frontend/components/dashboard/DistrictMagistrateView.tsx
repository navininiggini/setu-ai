"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  ShieldAlert,
  Coins,
  Layers,
  AlertTriangle,
  ChevronRight,
  MapPin,
  CheckCircle2,
  Clock,
  ArrowRight,
  ClipboardList,
  Filter,
  Zap,
  Search,
  Crosshair,
  Loader2,
  Sparkles,
} from "lucide-react";
import { DashboardData } from "../../lib/types";
import { fetchWorkDetail } from "../../lib/api";
import { StatCard } from "../ui/StatCard";
import { RiskBadge } from "../ui/RiskBadge";
import { ConstituencyMap } from "../maps/ConstituencyMap";
import { FraudEvidenceVisualizer } from "../ui/FraudEvidenceVisualizer";
import { DistrictVendorCaptureRadar } from "./visualizers/DistrictVendorCaptureRadar";
import { MagicCard } from "../ui/MagicCard";
import { formatTypologyLabel } from "../../lib/typologies";
import { SectorAnalyticsGrid } from "../analytics/SectorAnalyticsGrid";
import { formatDistrictName } from "../../lib/districts";

interface DistrictMagistrateViewProps {
  data: DashboardData;
  pinsData: any[];
}

export function DistrictMagistrateView({ data, pinsData }: DistrictMagistrateViewProps) {
  const { summary, fraud_breakdown, top_flagged_works, jurisdiction, extra_insights } = data;
  const initialTopWork = top_flagged_works && top_flagged_works.length > 0 ? top_flagged_works[0] : null;

  const [activeWork, setActiveWork] = useState<any>(initialTopWork);
  const [inputQuery, setInputQuery] = useState("");
  const [isLoadingWork, setIsLoadingWork] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // When jurisdiction or data updates, reset activeWork to the new top flagged proposal of the district
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

    // 1. Check local district works list first
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
        setLookupError(`No proposal found matching "${query}"`);
      }
    } catch (err: any) {
      setLookupError(`Proposal "${query}" not found in MPLADS database.`);
    } finally {
      setIsLoadingWork(false);
    }
  };

  // Count structuring works from extra_insights clusters or fraud_breakdown
  const structuringClusters = extra_insights?.structuring_clusters || [];
  const structuringItem = fraud_breakdown.find(
    (f) => f.fraud_type?.toLowerCase().includes("structuring")
  );
  const structuringCount = structuringClusters.length > 0
    ? structuringClusters.length
    : (structuringItem ? structuringItem.count : 0);
  const structuringAmount = structuringClusters.length > 0
    ? structuringClusters.reduce((sum: number, w: any) => sum + (w.amount || 0), 0)
    : (structuringItem ? structuringItem.total_amount : 0);

  return (
    <div className="space-y-6">
      {/* Statutory DM Sanctioning Authority Banner */}
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
                STATUTORY SANCTIONING AUTHORITY • {formatDistrictName(jurisdiction).toUpperCase()}
              </span>
              <span className="text-[11px] text-[#F5EBE1]/80 font-mono">District Magistrate & Collectorate</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-editorial font-bold tracking-tight text-white">
              Pre-Sanction Anomaly Triage & Statutory Tender Verifier
            </h2>
            <p className="text-xs text-[#F5EBE1]/90 max-w-2xl font-sans">
              Detect duplicate proposals, cost escalations, and statutory ₹5 Lakh tender structuring <em>before</em> signing administrative and financial sanctions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/proposals"
              className="bg-[#FDE68A] hover:bg-[#FCD34D] text-[#3D2312] px-3.5 py-2 text-xs font-mono font-bold tracking-wider uppercase transition-all duration-200 rounded-[2px] shadow-sm flex items-center gap-1.5"
            >
              <Zap className="h-4 w-4 text-[#3D2312]" />
              <span>Feed Plan & Score ↗</span>
            </Link>
            <Link
              href="/cases"
              className="border border-[#F5EBE1]/80 hover:bg-[#F5EBE1] hover:text-[#6E4529] text-[#F5EBE1] px-4 py-2 text-xs font-mono font-bold tracking-wider uppercase transition-all duration-200 rounded-[2px] shadow-sm flex items-center gap-2 group"
            >
              <ClipboardList className="h-4 w-4 text-[#FDE68A] group-hover:text-[#6E4529]" />
              <span>Open DM Triage Kanban ↗</span>
            </Link>
          </div>
        </div>
      </MagicCard>

      {/* 4 DM Statutory KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Works Submitted for Sanction"
          value={summary.total_works.toLocaleString()}
          subtitle={`Across ${jurisdiction} rural & urban blocks`}
          icon={Layers}
          variant="default"
        />
        <StatCard
          title="Sanctioned Capital Outlay"
          value={`₹${(summary.total_allocation / 10000000).toFixed(2)} Cr`}
          subtitle="Total district public expenditure"
          icon={Coins}
          variant="accent"
        />
        <StatCard
          title="Pre-Sanction Flagged Works"
          value={summary.flagged_works_count > 0 ? `${summary.flagged_works_count} flagged` : "0 flagged"}
          subtitle={`₹${(summary.amount_at_risk / 100000).toFixed(1)} Lakhs in flagged works`}
          icon={ShieldAlert}
          variant={summary.flagged_works_count > 0 ? "danger" : "success"}
          trend={{
            value: summary.flagged_works_count > 0 
              ? `${((summary.flagged_works_count / Math.max(1, summary.total_works)) * 100).toFixed(0)}% anomaly rate` 
              : "100% compliant",
            isPositive: summary.flagged_works_count === 0,
          }}
        />
        <StatCard
          title="₹5L Structuring Smurfing Alarms"
          value={structuringCount > 0 ? `${structuringCount} works` : "0 detected"}
          subtitle={
            structuringCount > 0 
              ? `₹${(structuringAmount / 100000).toFixed(1)}L near tender thresholds` 
              : `${summary.critical_cases_count} critical audit flags in queue`
          }
          icon={AlertTriangle}
          variant={structuringCount > 0 ? "danger" : (summary.critical_cases_count > 0 ? "warning" : "success")}
          trend={{
            value: structuringCount > 0 
              ? "Bypasses e-tender limits" 
              : (summary.critical_cases_count > 0 ? `${summary.critical_cases_count} critical proposals` : "Rule 14.2 compliant"),
            isPositive: structuringCount === 0 && summary.critical_cases_count === 0,
          }}
        />
      </div>

      {/* Local Village GPS Marker Pins Map */}
      <div className="space-y-2">
        <ConstituencyMap
          pins={pinsData}
          title={`${jurisdiction} Local Village & Ward Audit GPS Coordinates`}
        />
      </div>

      {/* Dynamic Pre-Sanction Proposal Spotlight & Live Work ID Lookup */}
      <div id="district-stop-work-spotlight" className="space-y-3">
        {/* Interactive Proposal Inspection Bar */}
        <div className="rounded-xl border border-[#E5DFD3] bg-[#FAF7F2] p-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded bg-[#6E4529] text-[#FDE68A] shrink-0 font-mono text-xs">
              <Crosshair className="h-4 w-4" />
            </span>
            <div>
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#6E4529]">
                Pre-Sanction Stop-Work Radar • {formatDistrictName(jurisdiction)}
              </h4>
              <p className="text-[11px] text-stone-500 font-sans">
                Select a proposal from the queue below or enter any Work ID to evaluate statutory risk in real time.
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
                placeholder="Enter Work ID (e.g. MPLADS-001216) or keyword..."
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

        {/* Quick Select Chips from district proposals */}
        {top_flagged_works && top_flagged_works.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500 mr-1">
              District Queue:
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
                <ShieldAlert className="h-4 w-4 text-rose-600" />
                Pre-Sanction Stop-Work Alert ({activeWork.id})
                {activeWork.constituency && (
                  <span className="font-normal text-stone-500 lowercase">
                    • {activeWork.constituency}
                  </span>
                )}
              </span>
              <div className="flex items-center gap-3">
                <Link
                  href="/cases"
                  className="text-xs font-mono font-bold text-[#6E4529] hover:text-[#3D2312] hover:underline flex items-center gap-1"
                >
                  Send to Field Vigilance Team <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
            <FraudEvidenceVisualizer work={activeWork} />
          </div>
        ) : (
          <div className="rounded-xl border border-emerald-300 bg-[#F0FDF4] p-6 text-center shadow-2xs space-y-2">
            <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
            <h4 className="text-sm font-editorial font-bold text-emerald-950">
              No High-Risk Proposals Flagged in {formatDistrictName(jurisdiction)}
            </h4>
            <p className="text-xs text-emerald-800 max-w-lg mx-auto font-sans">
              All submitted proposals currently meet statutory MPLADS and GFR guidelines without anomaly signals. Enter any Work ID above to inspect proposals on-demand, or score incoming proposals in the pre-sanction gate.
            </p>
          </div>
        )}
      </div>

      {/* Bespoke DM Visualizer: Statutory ₹5L Smurfing Radar & Vendor Capture */}
      <DistrictVendorCaptureRadar 
        jurisdiction={jurisdiction} 
        extraInsights={extra_insights} 
      />

      {/* District Visual Analytics: Pre-Sanction Anomalies & Infrastructure Delays */}
      <SectorAnalyticsGrid
        fraudBreakdown={fraud_breakdown}
        totalFlagged={summary.flagged_works_count}
      />

      {/* DM Pre-Sanction Triage Table */}
      <MagicCard 
        glowColor="245, 158, 11"
        enableBorderGlow={true}
        enableTilt={false}
        className="rounded-xl border border-[#E5DFD3] bg-[#FFFDF9] p-5 shadow-[0_2px_12px_rgba(40,20,10,0.03)]"
      >
        <div className="flex items-center justify-between border-b border-[#E5DFD3] pb-4">
          <div>
            <h3 className="text-base font-editorial font-bold text-[#1C1917]">Pre-Sanction Approval Queue</h3>
            <p className="text-xs text-stone-500 font-sans">Review and triage proposals before releasing funds</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/proposals"
              className="rounded-md bg-[#6E4529] px-3 py-1.5 text-xs font-mono font-bold text-white hover:bg-[#5A361F] transition-all inline-flex items-center gap-1.5 shadow-2xs"
            >
              <Zap className="h-3.5 w-3.5 text-[#FDE68A]" />
              <span>+ Feed & Score New Proposal</span>
            </Link>
            <Link
              href="/cases"
              className="text-xs font-mono font-bold text-[#6E4529] hover:underline flex items-center gap-1"
            >
              Manage All Cases in Kanban <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#D9D2C5] text-stone-600 uppercase tracking-wider bg-[#F0ECE1] font-mono text-[11px]">
                <th className="py-2.5 pl-3">Work ID</th>
                <th className="py-2.5">Proposal Title</th>
                <th className="py-2.5">Recommending MP</th>
                <th className="py-2.5">Nominated IDA</th>
                <th className="py-2.5 text-right">Estimate</th>
                <th className="py-2.5 text-center">Risk Score</th>
                <th className="py-2.5 pr-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DFD3]/60">
              {top_flagged_works.map((w) => (
                <tr
                  key={w.id}
                  onClick={() => {
                    setActiveWork(w);
                    const el = document.getElementById("district-stop-work-spotlight");
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
                  <td className="py-3 text-stone-600 font-semibold">{w.mp_name}</td>
                  <td className="py-3 text-stone-600 max-w-[140px] truncate font-mono">{w.ida}</td>
                  <td className="py-3 text-right font-mono font-bold text-[#1C1917] font-tabular">₹{w.allocation_amount.toLocaleString()}</td>
                  <td className="py-3 text-center">
                    <RiskBadge score={w.risk_score} level={w.risk_level} size="sm" />
                  </td>
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveWork(w);
                          const el = document.getElementById("district-stop-work-spotlight");
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
                      <Link
                        href={`/works/${w.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded-md bg-[#FAF7F2] border border-[#D9D2C5] px-2 py-1 text-[11px] font-mono font-bold text-stone-700 hover:bg-[#F0ECE1] transition-all inline-flex items-center gap-1 shadow-2xs"
                      >
                        <span>Triage</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
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
