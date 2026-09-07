"use client";

import React from "react";
import Link from "next/link";
import {
  Building2,
  ShieldAlert,
  Coins,
  Layers,
  Activity,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  ChevronRight,
  ArrowUpRight,
  MapPin,
  Send,
  FileCheck2,
} from "lucide-react";
import { DashboardData } from "../../lib/types";
import { StatCard } from "../ui/StatCard";
import { RiskBadge } from "../ui/RiskBadge";
import { DistrictDrilldownMap } from "../maps/DistrictDrilldownMap";
import { StateVendorConcentrationMatrix } from "./visualizers/StateVendorConcentrationMatrix";
import { MagicCard } from "../ui/MagicCard";
import { formatTypologyLabel } from "../../lib/typologies";
import { formatDistrictName } from "../../lib/districts";
import { SectorAnalyticsGrid } from "../analytics/SectorAnalyticsGrid";

interface StateNodalViewProps {
  data: DashboardData;
  districtData: any[];
}

export function StateNodalView({ data, districtData }: StateNodalViewProps) {
  const { summary, fraud_breakdown, top_flagged_works, extra_insights, jurisdiction } = data;
  const highestRiskDistrict = districtData.length > 0 ? districtData[0] : null;

  return (
    <div className="space-y-6">
      {/* State Nodal Vigilance Directive Banner */}
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
                STATE NODAL OVERSIGHT • {jurisdiction.toUpperCase()}
              </span>
              <span className="text-[11px] text-[#F5EBE1]/80 font-mono">Department of Planning & Development</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-editorial font-bold tracking-tight text-white">
              {jurisdiction} Statewide Implementation & Equity Monitor
            </h2>
            <p className="text-xs text-[#F5EBE1]/90 max-w-2xl font-sans">
              Surveillance of inter-district fund allocation parity, cross-constituency contractor syndicates, and state-level audit compliance.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/reports"
              className="border border-[#F5EBE1]/80 hover:bg-[#F5EBE1] hover:text-[#6E4529] text-[#F5EBE1] px-4 py-2 text-xs font-mono font-bold tracking-wider uppercase transition-all duration-200 rounded-[2px] shadow-sm flex items-center gap-2 group"
            >
              <Download className="h-4 w-4 text-[#FDE68A] group-hover:text-[#6E4529]" />
              <span>Export State Compliance CSV ↗</span>
            </Link>
          </div>
        </div>
      </MagicCard>

      {/* 4 State KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={`Total Works in ${jurisdiction}`}
          value={summary.total_works.toLocaleString()}
          subtitle={`Across ${districtData.length} monitored districts`}
          icon={Layers}
          variant="default"
        />
        <StatCard
          title="State Fund Outlay"
          value={`₹${(summary.total_allocation / 10000000).toFixed(2)} Cr`}
          subtitle="Sanctioned across state MPs"
          icon={Coins}
          variant="accent"
        />
        <StatCard
          title="State Funds at Risk"
          value={`₹${(summary.amount_at_risk / 100000).toFixed(1)} Lakhs`}
          subtitle={`${summary.flagged_works_count} high-risk projects flagged`}
          icon={ShieldAlert}
          variant={summary.flagged_works_count > 0 ? "danger" : "success"}
          trend={{
            value: `${((summary.flagged_works_count / Math.max(1, summary.total_works)) * 100).toFixed(1)}% of state works`,
            isPositive: false,
          }}
        />
        <StatCard
          title="Highest Anomaly District"
          value={highestRiskDistrict ? formatDistrictName(highestRiskDistrict.district, jurisdiction) : "N/A"}
          subtitle={
            highestRiskDistrict
              ? `${highestRiskDistrict.flagged_count} flagged works (${highestRiskDistrict.risk_percentage}%)`
              : "No district anomalies"
          }
          icon={Activity}
          variant={highestRiskDistrict && highestRiskDistrict.risk_percentage > 20 ? "danger" : "warning"}
        />
      </div>

      {/* District Drilldown Geospatial Visualizer */}
      <div className="space-y-2">
        <DistrictDrilldownMap stateName={jurisdiction} data={districtData} />
      </div>

      {/* Bespoke SNA Visualizer: Dynamic Vendor Treemap & Cartel Matrix */}
      <StateVendorConcentrationMatrix 
        stateName={jurisdiction} 
        summary={summary} 
        districtData={districtData} 
      />

      {/* State Visual Analytics: Anomaly Distribution & Infrastructure Delays */}
      <SectorAnalyticsGrid
        fraudBreakdown={fraud_breakdown}
        totalFlagged={summary.flagged_works_count}
      />


      {/* State Priority Inspection Works Table */}
      <MagicCard 
        glowColor="245, 158, 11"
        enableBorderGlow={true}
        enableTilt={false}
        className="rounded-xl border border-[#E5DFD3] bg-[#FFFDF9] p-5 shadow-[0_2px_12px_rgba(40,20,10,0.03)]"
      >
        <div className="flex items-center justify-between border-b border-[#E5DFD3] pb-4">
          <div>
            <h3 className="text-base font-editorial font-bold text-[#1C1917]">{jurisdiction} Priority Inspection Queue</h3>
            <p className="text-xs text-stone-500 font-sans">Flagged projects requiring state nodal inspection notices</p>
          </div>
          <Link
            href="/works"
            className="text-xs font-mono font-bold text-[#6E4529] hover:underline flex items-center gap-1"
          >
            View All State Works <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#D9D2C5] text-stone-600 uppercase tracking-wider bg-[#F0ECE1] font-mono text-[11px]">
                <th className="py-2.5 pl-3">Work ID</th>
                <th className="py-2.5">Description</th>
                <th className="py-2.5">District & MP</th>
                <th className="py-2.5">Agency (IDA)</th>
                <th className="py-2.5 text-right">Amount</th>
                <th className="py-2.5 text-center">Risk Score</th>
                <th className="py-2.5 pr-3">Anomaly Category</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DFD3]/60">
              {top_flagged_works.map((w) => (
                <tr key={w.id} className="hover:bg-[#FAF7F2] transition-colors">
                  <td className="py-3 pl-3 font-mono font-bold text-[#1C1917]">{w.id}</td>
                  <td className="py-3 font-medium text-stone-800 max-w-xs truncate">{w.work}</td>
                  <td className="py-3 text-stone-600">
                    <p className="font-bold text-[#1C1917]">{w.constituency}</p>
                    <p className="text-[10px] text-stone-500 font-mono">{w.mp_name}</p>
                  </td>
                  <td className="py-3 text-stone-600 max-w-[140px] truncate font-mono">{w.ida}</td>
                  <td className="py-3 text-right font-mono font-bold text-[#1C1917] font-tabular">₹{w.allocation_amount.toLocaleString()}</td>
                  <td className="py-3 text-center">
                    <RiskBadge score={w.risk_score} level={w.risk_level} size="sm" />
                  </td>
                  <td className="py-3 pr-3 text-stone-600 max-w-sm truncate text-[11px]">
                    {w.risk_reasons[0] || "High risk score"}
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
