"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Building2, ShieldAlert, Users, Network, TrendingUp, 
  ArrowRight, AlertTriangle, Layers, MapPin, Search, 
  Info, ExternalLink, Activity, Filter, CheckCircle2, ChevronRight, BarChart3, Clock, Milestone, Coins
} from "lucide-react";
import { SearchableMpDropdown } from "../SearchableMpDropdown";

interface MPConstituencyFundVelocityProps {
  telemetry: any;
  mpName: string;
  availableMps?: { name: string; works_count: number; total_capital: number }[];
  onSelectMp?: (mp: string) => void;
}

export function MPConstituencyFundVelocity({
  telemetry,
  mpName,
  availableMps = [],
  onSelectMp
}: MPConstituencyFundVelocityProps) {
  const [activeTab, setActiveTab] = useState<"pipeline" | "dwell" | "blocks">("pipeline");

  const forensics = telemetry?.mp_forensics || {
    mp_name: mpName || "Mr Gopal Jee Thakur",
    total_recommended: 52114800.0,
    total_works: 128,
    pipeline_stages: {
      recommended: { works: 128, capital: 52114800.0 },
      sanctioned: { works: 20, capital: 8140000.0 },
      pending: { works: 108, capital: 43974800.0 },
      completed: { works: 0, capital: 0.0, pct: 0.0 }
    },
    completion_rate: 0.0,
    block_allocations: [],
    agency_dwell_matrix: []
  };

  const stages = forensics.pipeline_stages;
  const blocks = forensics.block_allocations || [];
  const dwellMatrix = forensics.agency_dwell_matrix || [];
  const totalStalledWorks = dwellMatrix.reduce((acc: number, item: any) => acc + (item.stalled_works || 0), 0);
  const maxDelayDays = dwellMatrix.length > 0 ? Math.max(...dwellMatrix.map((d: any) => d.max_days_delayed || 0)) : 0;

  return (
    <div className="space-y-5">
      {/* Sleek Sub-Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
            <Milestone className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              {forensics.mp_name} Constituency Fund Flow & Velocity
            </h3>
            <span className="text-[11px] text-slate-500">
              4-stage statutory lifecycle tracking, block allocation spread, and administrative delay accountability.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* In-Component MP Search & Switcher */}
          {availableMps && availableMps.length > 0 && onSelectMp && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 hidden md:inline">MP:</span>
              <SearchableMpDropdown
                selectedMp={mpName || forensics.mp_name}
                mps={availableMps}
                onSelectMp={onSelectMp}
                placeholder="Type to filter MPs..."
                className="shrink-0"
              />
            </div>
          )}

          {/* Clean Pill Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200/80">
            <button
              onClick={() => setActiveTab("pipeline")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "pipeline" 
                  ? "bg-white text-blue-900 shadow-xs border border-blue-200" 
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <Activity className="h-3.5 w-3.5" />
              Delivery Pipeline
            </button>
            <button
              onClick={() => setActiveTab("dwell")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "dwell" 
                  ? "bg-white text-amber-900 shadow-xs border border-amber-200" 
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              Delay Sinks ({dwellMatrix.length})
            </button>
            <button
              onClick={() => setActiveTab("blocks")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "blocks" 
                  ? "bg-white text-cyan-900 shadow-xs border border-cyan-200" 
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Assembly Blocks ({blocks.length})
            </button>
          </div>
        </div>
      </div>

      {/* Streamlined MP Barometer HUD */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Asset Completion Rate
            </span>
            <span className="text-[10px] font-mono text-emerald-700 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 font-bold">
              Delivered
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-emerald-600 font-mono">{forensics.completion_rate}%</span>
            <span className="text-[11px] text-slate-500 font-medium">completed</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block font-medium">
            {stages.completed?.works || 0} of {forensics.total_works} works finished
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Awaiting Sanction
            </span>
            <span className="text-[10px] font-mono text-amber-800 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 font-bold">
              Pending
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-amber-600 font-mono">{stages.pending?.works || 0}</span>
            <span className="text-[11px] text-slate-500 font-medium">works in queue</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block truncate font-medium">
            ₹{((stages.pending?.capital || 0) / 10000000).toFixed(2)} Cr in pipeline
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Max Statutory Delay
            </span>
            <span className="text-[10px] font-mono text-rose-700 px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 font-bold">
              &gt;45d Limit
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-rose-600 font-mono">{maxDelayDays}</span>
            <span className="text-[11px] text-slate-500 font-medium">Days Delayed</span>
          </div>
          <span className="text-[11px] text-rose-600 font-semibold mt-1 block truncate">
            {maxDelayDays > 45 ? "Exceeds 45-day statutory limit" : "Within statutory window"}
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Recommended Outlay
            </span>
            <span className="text-[10px] font-mono text-blue-700 px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 font-bold">
              Constituency
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 font-mono">
            ₹{(forensics.total_recommended / 10000000).toFixed(2)} Cr
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block truncate font-medium">
            Across {blocks.length} Assembly Blocks
          </span>
        </div>
      </div>

      {/* TAB 1: 4-STAGE STATUTORY LIFECYCLE PIPELINE */}
      {activeTab === "pipeline" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 pb-3.5">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <Activity className="h-4 w-4 text-blue-600" />
                4-Stage Recommendation-to-Asset Statutory Lifecycle ({forensics.mp_name})
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Visualizes drop-off velocity from parliamentary recommendation to completed asset delivery.
              </p>
            </div>
            <span className="rounded-md bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 text-xs font-bold font-mono">
              MPLADS Guidelines §4.2
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Stage 1 */}
            <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-700">Stage 1</span>
                <span className="rounded bg-blue-100 text-blue-800 px-2 py-0.5 text-[10px] font-bold">Recommender</span>
              </div>
              <div className="text-xs font-bold text-slate-700">Recommended Works</div>
              <div className="text-2xl font-black text-slate-900 font-mono">{stages.recommended?.works || 0}</div>
              <span className="text-[11px] text-blue-700 block font-mono font-bold">
                ₹{((stages.recommended?.capital || 0) / 10000000).toFixed(2)} Cr
              </span>
              <div className="h-1.5 w-full bg-blue-500 rounded-full mt-2" />
            </div>

            {/* Stage 2 */}
            <div className="rounded-xl border border-cyan-200 bg-cyan-50/40 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-700">Stage 2</span>
                <span className="rounded bg-cyan-100 text-cyan-800 px-2 py-0.5 text-[10px] font-bold">District Office</span>
              </div>
              <div className="text-xs font-bold text-slate-700">Approved / Sanctioned</div>
              <div className="text-2xl font-black text-cyan-700 font-mono">{stages.sanctioned?.works || 0}</div>
              <span className="text-[11px] text-cyan-800 block font-mono font-bold">
                ₹{((stages.sanctioned?.capital || 0) / 10000000).toFixed(2)} Cr
              </span>
              <div className="h-1.5 w-full bg-cyan-500 rounded-full mt-2" />
            </div>

            {/* Stage 3 */}
            <div className="rounded-xl border border-amber-300 bg-amber-50/60 p-4 space-y-2 ring-1 ring-amber-300">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-700">Stage 3</span>
                <span className="rounded bg-amber-200/80 text-amber-900 px-2 py-0.5 text-[10px] font-bold">Pending Sanction</span>
              </div>
              <div className="text-xs font-bold text-slate-800">Action Pending (Dwell)</div>
              <div className="text-2xl font-black text-amber-700 font-mono">{stages.pending?.works || 0}</div>
              <span className="text-[11px] text-amber-800 block font-mono font-bold">
                ₹{((stages.pending?.capital || 0) / 10000000).toFixed(2)} Cr
              </span>
              <div className="h-1.5 w-full bg-amber-500 rounded-full mt-2" />
            </div>

            {/* Stage 4 */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Stage 4</span>
                <span className="rounded bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">Constituents</span>
              </div>
              <div className="text-xs font-bold text-slate-700">Physical Completion</div>
              <div className="text-2xl font-black text-emerald-700 font-mono">{stages.completed?.works || 0}</div>
              <span className="text-[11px] text-emerald-800 block font-mono font-bold">
                ₹{((stages.completed?.capital || 0) / 10000000).toFixed(2)} Cr ({stages.completed?.pct || 0}%)
              </span>
              <div className="h-1.5 w-full bg-emerald-500 rounded-full mt-2" />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <span className="font-bold text-slate-900">
                Execution Status: <strong>{stages.pending?.works || 0} Works Currently Awaiting Action in District Implementing Offices</strong>
              </span>
              <p className="text-slate-500 text-[11px]">
                Under MPLADS Revised Guidelines 2023, the District Magistrate must convey sanction within 45 days.
              </p>
            </div>
            <Link
              href="/reports"
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-500 transition-colors shrink-0 shadow-xs cursor-pointer"
            >
              Export Citizen Scorecard <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* TAB 2: AGENCY DELAY SINKS */}
      {activeTab === "dwell" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 flex items-start gap-3">
            <Clock className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-950">
                Parliamentary Accountability Watchlist: Bureaucratic Dwell Time Sinks
              </h4>
              <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                These executing agencies have received parliamentary recommendations from {forensics.mp_name} but have kept them in "Action Pending" status beyond the 45-day statutory limit.
              </p>
            </div>
          </div>

          {dwellMatrix.length > 0 ? (
            <div className="space-y-3">
              {dwellMatrix.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 hover:border-amber-300 transition-all"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-rose-100 text-rose-800 border border-rose-200 px-2 py-0.5 text-[10px] font-bold font-mono">
                        STATUTORY DELAY
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 truncate max-w-md" title={item.ida}>
                        {item.ida}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Holding <strong>{item.stalled_works} parliamentary proposals</strong> • Max dwell time: <strong className="text-rose-600">{item.max_days_delayed} days</strong>.
                    </p>
                  </div>

                  <div className="text-right space-y-1.5">
                    <div className="text-xs font-bold text-amber-700 font-mono">
                      ₹{(item.delayed_capital / 100000).toFixed(1)} Lakhs Trapped
                    </div>
                    <Link
                      href="/reports"
                      className="inline-flex items-center gap-1 rounded-lg bg-rose-600 hover:bg-rose-500 px-3 py-1.5 text-xs font-bold text-white transition-colors shadow-xs"
                    >
                      Issue Formal MP Inquiry Notice <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-500 shadow-xs">
              <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600 mb-2" />
              <p className="font-bold text-slate-900 text-sm">No Statutory Execution Delays Beyond 45 Days</p>
              <p className="mt-1">All recommendations submitted by {forensics.mp_name} are progressing within standard statutory timelines.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: BLOCK BREAKDOWN */}
      {activeTab === "blocks" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs overflow-x-auto">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-black uppercase tracking-wider text-slate-900">
              Constituency Assembly Block Allocation Breakdown ({forensics.mp_name})
            </span>
            <span className="text-xs text-slate-500 font-medium">Distribution across assembly blocks</span>
          </div>

          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 text-[11px] uppercase">
                <th className="pb-3 font-semibold">Assembly Block</th>
                <th className="pb-3 font-semibold">Works Recommended</th>
                <th className="pb-3 font-semibold">Total Allocation</th>
                <th className="pb-3 font-semibold">Constituency Share</th>
                <th className="pb-3 font-semibold text-right">Delivery Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {blocks.map((blk: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 font-bold text-slate-900">📍 {blk.block}</td>
                  <td className="py-3 text-slate-700 font-mono">{blk.works_count}</td>
                  <td className="py-3 font-mono text-cyan-700 font-bold">
                    ₹{(blk.capital / 100000).toFixed(1)} Lakhs
                  </td>
                  <td className="py-3 text-slate-700 font-mono">{blk.share_pct}%</td>
                  <td className="py-3 text-right">
                    <span className="rounded-md bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 text-[10px] font-bold">
                      Active Deployment
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
