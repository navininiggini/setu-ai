"use client";

import React from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Coins,
  Layers,
  Activity,
  FileSpreadsheet,
  Download,
  Building2,
  ChevronRight,
  ArrowUpRight,
  ShieldCheck,
  FileCheck2,
  ExternalLink,
} from "lucide-react";
import { DashboardData } from "../../lib/types";
import { StatCard } from "../ui/StatCard";
import { RiskBadge } from "../ui/RiskBadge";
import { StateChoroplethMap } from "../maps/StateChoroplethMap";
import { NationalCartelFunnel } from "./visualizers/NationalCartelFunnel";
import { MagicCard } from "../ui/MagicCard";
import { formatTypologyLabel } from "../../lib/typologies";
import { SectorAnalyticsGrid } from "../analytics/SectorAnalyticsGrid";

interface MinistryViewProps {
  data: DashboardData;
  stateChoropleth: any[];
  graphData: { nodes: any[]; links: any[] };
}

export function MinistryView({ data, stateChoropleth, graphData }: MinistryViewProps) {
  const { summary, fraud_breakdown, top_flagged_works, extra_insights } = data;

  return (
    <div className="space-y-6">
      {/* Parliamentary Oversight & PAC Dossier Banner */}
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
                MoSPI NATIONAL CENTRAL COMMAND
              </span>
              <span className="text-[11px] text-[#F5EBE1]/80 font-mono">New Delhi Headquarters</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-editorial font-bold tracking-tight text-white">
              National Parliamentary Audit & Anomaly Intelligence
            </h2>
            <p className="text-xs text-[#F5EBE1]/90 max-w-2xl font-sans">
              Continuous multi-signal algorithmic surveillance across all 790+ parliamentary seats, 28 States, and 8 Union Territories.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/reports"
              className="border border-[#F5EBE1]/80 hover:bg-[#F5EBE1] hover:text-[#6E4529] text-[#F5EBE1] px-4 py-2 text-xs font-mono font-bold tracking-wider uppercase transition-all duration-200 rounded-[2px] shadow-sm flex items-center gap-2 group"
            >
              <FileCheck2 className="h-4 w-4 text-[#FDE68A] group-hover:text-[#6E4529]" />
              <span>Generate PAC Audit Dossier ↗</span>
            </Link>
          </div>
        </div>
      </MagicCard>

      {/* 4 National Macro Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="National Sanctioned Works"
          value={summary.total_works.toLocaleString()}
          subtitle={`Across ${extra_insights.total_active_idas || 1480} Registered IDAs`}
          icon={Layers}
          variant="default"
        />
        <StatCard
          title="Total National Outlay"
          value={`₹${(summary.total_allocation / 10000000).toFixed(2)} Cr`}
          subtitle="Parliamentary allocations tracked"
          icon={Coins}
          variant="accent"
        />
        <StatCard
          title="National Outliers at Risk"
          value={summary.flagged_works_count.toLocaleString()}
          subtitle={`₹${(summary.amount_at_risk / 100000).toFixed(1)} Lakhs in flagged works`}
          icon={ShieldAlert}
          variant={summary.flagged_works_count > 0 ? "danger" : "success"}
          trend={{
            value: `${((summary.flagged_works_count / Math.max(1, summary.total_works)) * 100).toFixed(1)}% anomaly rate`,
            isPositive: false,
          }}
        />
        <StatCard
          title="National Risk Index"
          value={`${summary.avg_risk_score} / 100`}
          subtitle={`Compliance: ${extra_insights.compliance_rate || 94.2}% statutory adherence`}
          icon={Activity}
          variant={summary.avg_risk_score > 50 ? "warning" : "success"}
        />
      </div>

      {/* National GIS State Risk Choropleth Map */}
      <div className="space-y-2">
        <StateChoroplethMap data={stateChoropleth} />
      </div>

      {/* Visual Analytics Layer: Anomaly Distribution & Infrastructure Delays */}
      <SectorAnalyticsGrid
        fraudBreakdown={fraud_breakdown}
        totalFlagged={summary.flagged_works_count}
      />

      {/* Bespoke MoSPI Visualizer: National Capital Flow & Cartel Funnel */}
      <div>
        <NationalCartelFunnel 
          summary={summary} 
          extraInsights={extra_insights} 
          graphData={graphData} 
        />
      </div>

      {/* Top Flagged Works Table */}
      <MagicCard 
        glowColor="245, 158, 11"
        enableBorderGlow={true}
        enableTilt={false}
        className="rounded-xl border border-[#E5DFD3] bg-[#FFFDF9] p-5 shadow-[0_2px_12px_rgba(40,20,10,0.03)]"
      >
        <div className="flex items-center justify-between border-b border-[#E5DFD3] pb-4">
          <div>
            <h3 className="text-base font-editorial font-bold text-[#1C1917]">Top National Audit Outliers</h3>
            <p className="text-xs text-stone-500 font-sans">Highest composite risk scores across all states</p>
          </div>
          <Link
            href="/works"
            className="text-xs font-mono font-bold text-[#6E4529] hover:underline flex items-center gap-1"
          >
            View All Works <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#D9D2C5] text-stone-600 uppercase tracking-wider bg-[#F0ECE1] font-mono text-[11px]">
                <th className="py-2.5 pl-3">Work ID</th>
                <th className="py-2.5">Work Description</th>
                <th className="py-2.5">MP & Location</th>
                <th className="py-2.5">Agency (IDA)</th>
                <th className="py-2.5 text-right">Amount</th>
                <th className="py-2.5 text-center">Risk Score</th>
                <th className="py-2.5 pr-3">Flag Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DFD3]/60">
              {top_flagged_works.map((w) => (
                <tr key={w.id} className="hover:bg-[#FAF7F2] transition-colors">
                  <td className="py-3 pl-3 font-mono font-bold text-[#1C1917]">{w.id}</td>
                  <td className="py-3 font-medium text-stone-800 max-w-xs truncate">{w.work}</td>
                  <td className="py-3 text-stone-600">
                    <p className="font-bold text-[#1C1917]">{w.mp_name}</p>
                    <p className="text-[10px] text-stone-500 font-mono">{w.constituency}, {w.state}</p>
                  </td>
                  <td className="py-3 text-stone-600 max-w-[140px] truncate font-mono">{w.ida}</td>
                  <td className="py-3 text-right font-mono font-bold text-[#1C1917] font-tabular">₹{w.allocation_amount.toLocaleString()}</td>
                  <td className="py-3 text-center">
                    <RiskBadge score={w.risk_score} level={w.risk_level} size="sm" />
                  </td>
                  <td className="py-3 pr-3 text-stone-600 max-w-sm truncate text-[11px]">
                    {w.risk_reasons[0] || "Statistical anomaly detected"}
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
