"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Scale,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  FileCheck2,
  Building2,
  Search,
  Filter,
  ArrowUpDown,
  BookOpen,
  ChevronRight,
  RefreshCw,
  ExternalLink,
  Info,
  CheckCircle2,
  XCircle,
  Clock,
  Ban
} from "lucide-react";
import {
  fetchComplianceSummary,
  fetchComplianceLeaderboard,
  fetchNegativeListViolations,
  fetchTrustSocietyReport,
  ComplianceSummary,
  MPComplianceItem,
  NegativeListViolationItem,
  TrustSocietyReport
} from "@/lib/api";

export default function CompliancePage() {
  const [activeTab, setActiveTab] = useState<"earmarking" | "negative_list" | "uc_tracker" | "trust_ceiling" | "rules">("earmarking");
  const [summary, setSummary] = useState<ComplianceSummary | null>(null);
  const [leaderboard, setLeaderboard] = useState<MPComplianceItem[]>([]);
  const [leaderboardTotal, setLeaderboardTotal] = useState(0);
  const [negativeList, setNegativeList] = useState<NegativeListViolationItem[]>([]);
  const [negativeListTotal, setNegativeListTotal] = useState(0);
  const [trustReport, setTrustReport] = useState<TrustSocietyReport | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters for leaderboard
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [gradeFilter, setGradeFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("sc_pct");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  // Selected MP for detail modal
  const [selectedMP, setSelectedMP] = useState<MPComplianceItem | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sumRes, leadRes, negRes, trustRes] = await Promise.all([
        fetchComplianceSummary(),
        fetchComplianceLeaderboard({
          status: statusFilter || undefined,
          grade: gradeFilter || undefined,
          sort_by: sortBy,
          order: sortOrder,
          limit: 25,
          offset: (page - 1) * 25
        }),
        fetchNegativeListViolations({ limit: 50 }),
        fetchTrustSocietyReport()
      ]);
      setSummary(sumRes);
      setLeaderboard(leadRes.items || []);
      setLeaderboardTotal(leadRes.total || 0);
      setNegativeList(negRes.items || []);
      setNegativeListTotal(negRes.total || 0);
      setTrustReport(trustRes);
    } catch (err) {
      console.error("Failed to load compliance data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, gradeFilter, sortBy, sortOrder, page]);

  const filteredLeaderboard = leaderboard.filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.constituency.toLowerCase().includes(q) ||
      item.state.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1F2937] p-4 sm:p-6 lg:p-8 space-y-6">
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & STATUTORY BREADCRUMB
      ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5DFD3] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono tracking-wider text-[#6E4529] uppercase mb-1">
            <Scale className="w-4 h-4 text-[#D97706]" />
            <span>Sovereign Administrative Audit</span>
            <span>•</span>
            <span className="text-[#059669] font-bold">MPLADS Guidelines 2023 Revision</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-black tracking-tight text-[#0B132B]">
            Statutory Compliance Auditing Engine
          </h1>
          <p className="text-sm text-[#4B5563] mt-1 max-w-3xl font-sans">
            Independent, deterministic legal compliance verification enforcing <b>SC/ST Earmarking (Para 2.5)</b>,{" "}
            <b>Utilization Certificate Deadlines (Para 4.6)</b>, <b>Negative List Prohibitions (Annexure-III)</b>, and{" "}
            <b>₹50.0 Lakhs Trust/Society Ceilings (Para 3.14)</b>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData()}
            className="flex items-center gap-2 px-3 py-2 text-xs font-mono bg-white border border-[#E5DFD3] rounded-lg hover:bg-[#F0ECE1] shadow-xs transition-all text-[#1F2937]"
            title="Refresh live telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#D97706]" : ""}`} />
            <span>Sync Audit Log</span>
          </button>
          <Link
            href="/reports"
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-mono font-bold bg-[#0B132B] text-white rounded-lg hover:bg-[#14213D] shadow-xs transition-all"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Download Audit Dossier</span>
          </Link>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. STATUTORY BAROMETER CARDS (4 TILES)
      ───────────────────────────────────────────────────────────── */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: SC Habitation Earmarking */}
          <div className="bg-white border border-[#E5DFD3] rounded-xl p-4 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between text-xs font-mono text-[#6E4529] mb-1">
              <span>SC Earmarking (Para 2.5)</span>
              <span className="font-bold text-[#059669]">Target: ≥15.0%</span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-serif font-black text-[#0B132B]">
                {summary.avg_sc_pct.toFixed(1)}%
              </span>
              <span className="text-xs font-mono text-[#6B7280]">Natl Avg</span>
            </div>
            <div className="mt-3 w-full bg-[#F3EFE6] h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  summary.avg_sc_pct >= 15.0 ? "bg-[#059669]" : "bg-[#D97706]"
                }`}
                style={{ width: `${Math.min(100, (summary.avg_sc_pct / 15.0) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-[#4B5563] mt-2 font-mono">
              <span>Allocated: ₹{(summary.total_sc_allocation / 10000000).toFixed(1)} Cr</span>
              <span className={summary.avg_sc_pct >= 15.0 ? "text-[#059669] font-bold" : "text-[#D97706] font-bold"}>
                {summary.avg_sc_pct >= 15.0 ? "COMPLIANT" : "SUB-STATUTORY"}
              </span>
            </div>
          </div>

          {/* Card 2: ST Habitation Earmarking */}
          <div className="bg-white border border-[#E5DFD3] rounded-xl p-4 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between text-xs font-mono text-[#6E4529] mb-1">
              <span>ST Earmarking (Para 2.5)</span>
              <span className="font-bold text-[#059669]">Target: ≥7.5%</span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-serif font-black text-[#0B132B]">
                {summary.avg_st_pct.toFixed(1)}%
              </span>
              <span className="text-xs font-mono text-[#6B7280]">Natl Avg</span>
            </div>
            <div className="mt-3 w-full bg-[#F3EFE6] h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  summary.avg_st_pct >= 7.5 ? "bg-[#059669]" : "bg-[#D97706]"
                }`}
                style={{ width: `${Math.min(100, (summary.avg_st_pct / 7.5) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-[#4B5563] mt-2 font-mono">
              <span>Allocated: ₹{(summary.total_st_allocation / 10000000).toFixed(1)} Cr</span>
              <span className={summary.avg_st_pct >= 7.5 ? "text-[#059669] font-bold" : "text-[#D97706] font-bold"}>
                {summary.avg_st_pct >= 7.5 ? "COMPLIANT" : "SUB-STATUTORY"}
              </span>
            </div>
          </div>

          {/* Card 3: UC Compliance Rate */}
          <div className="bg-white border border-[#E5DFD3] rounded-xl p-4 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between text-xs font-mono text-[#6E4529] mb-1">
              <span>UC On-Time Rate (Para 4.6)</span>
              <span className="font-bold text-[#2563EB]">30-Day Mandate</span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-serif font-black text-[#0B132B]">
                {summary.national_uc_compliance_rate.toFixed(1)}%
              </span>
              <span className="text-xs font-mono text-[#6B7280]">
                {summary.total_uc_submitted_works} / {summary.total_completed_works}
              </span>
            </div>
            <div className="mt-3 w-full bg-[#F3EFE6] h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  summary.national_uc_compliance_rate >= 80 ? "bg-[#059669]" : summary.national_uc_compliance_rate >= 60 ? "bg-[#D97706]" : "bg-[#DC2626]"
                }`}
                style={{ width: `${summary.national_uc_compliance_rate}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-[#4B5563] mt-2 font-mono">
              <span className="text-[#DC2626] font-bold">{summary.total_uc_overdue_works} Works Overdue</span>
              <span>GFR Rule 238</span>
            </div>
          </div>

          {/* Card 4: Negative List & Ceilings */}
          <div className="bg-white border border-[#E5DFD3] rounded-xl p-4 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between text-xs font-mono text-[#6E4529] mb-1">
              <span>Statutory Breaches</span>
              <span className="font-bold text-[#DC2626]">Strict Prohibition</span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-serif font-black text-[#DC2626]">
                {summary.negative_list_violations_count}
              </span>
              <span className="text-xs font-mono text-[#6B7280]">Prohibited Works</span>
            </div>
            <div className="mt-3 flex items-center gap-2 text-[11px] text-[#4B5563] font-mono">
              <span className="inline-flex items-center gap-1 text-[#D97706] font-bold">
                <Building2 className="w-3.5 h-3.5" />
                {summary.trust_society_breaches_count} Trust Ceilings Breached (&gt;₹50L)
              </span>
            </div>
            <div className="flex justify-between text-[11px] text-[#4B5563] mt-2 font-mono border-t border-[#F3EFE6] pt-1.5">
              <span>MP Compliance: {summary.compliance_rate_pct}%</span>
              <span>Annexure-III</span>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. TAB NAVIGATION
      ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E5DFD3] pb-2">
        <button
          onClick={() => setActiveTab("earmarking")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
            activeTab === "earmarking"
              ? "bg-[#0B132B] text-white shadow-xs"
              : "bg-white text-[#4B5563] hover:bg-[#F0ECE1] border border-[#E5DFD3]"
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>SC/ST Earmarking Leaderboard</span>
          {summary && (
            <span className="ml-1 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px]">
              {summary.total_mps} MPs
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("negative_list")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
            activeTab === "negative_list"
              ? "bg-[#0B132B] text-white shadow-xs"
              : "bg-white text-[#4B5563] hover:bg-[#F0ECE1] border border-[#E5DFD3]"
          }`}
        >
          <Ban className="w-3.5 h-3.5 text-rose-400" />
          <span>Negative List Violations</span>
          {summary && summary.negative_list_violations_count > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-600 text-[10px] font-bold">
              {summary.negative_list_violations_count}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("uc_tracker")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
            activeTab === "uc_tracker"
              ? "bg-[#0B132B] text-white shadow-xs"
              : "bg-white text-[#4B5563] hover:bg-[#F0ECE1] border border-[#E5DFD3]"
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-500" />
          <span>Utilization Certificate Aging</span>
        </button>

        <button
          onClick={() => setActiveTab("trust_ceiling")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
            activeTab === "trust_ceiling"
              ? "bg-[#0B132B] text-white shadow-xs"
              : "bg-white text-[#4B5563] hover:bg-[#F0ECE1] border border-[#E5DFD3]"
          }`}
        >
          <Building2 className="w-3.5 h-3.5 text-blue-500" />
          <span>Trust & Society ₹50L Ceiling</span>
        </button>

        <button
          onClick={() => setActiveTab("rules")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
            activeTab === "rules"
              ? "bg-[#0B132B] text-white shadow-xs"
              : "bg-white text-[#4B5563] hover:bg-[#F0ECE1] border border-[#E5DFD3]"
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
          <span>Statutory Rules Compendium</span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. TAB 1: SC/ST EARMARKING LEADERBOARD
      ───────────────────────────────────────────────────────────── */}
      {activeTab === "earmarking" && (
        <div className="space-y-4">
          {/* Controls & Search */}
          <div className="bg-white border border-[#E5DFD3] rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[260px]">
              <Search className="w-4 h-4 text-[#9CA3AF]" />
              <input
                type="text"
                placeholder="Search MP name, constituency, or state..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs font-sans bg-transparent focus:outline-hidden text-[#1F2937] placeholder-[#9CA3AF]"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
              <label className="text-[#6B7280]">Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-[#FAF7F2] border border-[#E5DFD3] rounded-md px-2 py-1 text-xs text-[#1F2937] focus:outline-hidden"
              >
                <option value="">All Statuses</option>
                <option value="COMPLIANT">Compliant (SC≥15%, ST≥7.5%)</option>
                <option value="DEFICIT">Deficit</option>
                <option value="CRITICAL_LAPSE">Critical Lapse</option>
              </select>

              <label className="text-[#6B7280] ml-2">Grade:</label>
              <select
                value={gradeFilter}
                onChange={(e) => {
                  setGradeFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-[#FAF7F2] border border-[#E5DFD3] rounded-md px-2 py-1 text-xs text-[#1F2937] focus:outline-hidden"
              >
                <option value="">All Grades</option>
                <option value="A">Grade A (Exemplary)</option>
                <option value="B">Grade B (Satisfactory)</option>
                <option value="C">Grade C (Sub-Statutory)</option>
                <option value="D">Grade D (Severe Deficit)</option>
                <option value="F">Grade F (Non-Compliant)</option>
              </select>

              <label className="text-[#6B7280] ml-2">Sort:</label>
              <select
                value={`${sortBy}_${sortOrder}`}
                onChange={(e) => {
                  const [sb, so] = e.target.value.split("_");
                  setSortBy(sb);
                  setSortOrder(so);
                }}
                className="bg-[#FAF7F2] border border-[#E5DFD3] rounded-md px-2 py-1 text-xs text-[#1F2937] focus:outline-hidden"
              >
                <option value="sc_pct_desc">SC % (Highest First)</option>
                <option value="sc_pct_asc">SC % (Lowest First)</option>
                <option value="st_pct_desc">ST % (Highest First)</option>
                <option value="st_pct_asc">ST % (Lowest First)</option>
                <option value="uc_rate_desc">UC Rate (Highest First)</option>
                <option value="allocation_desc">Total Outlay (Highest First)</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-[#E5DFD3] rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-[#0B132B] text-white font-mono text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Member of Parliament</th>
                    <th className="py-3 px-3">Constituency / State</th>
                    <th className="py-3 px-3 text-right">Total Outlay</th>
                    <th className="py-3 px-3 text-center">SC Alloc %</th>
                    <th className="py-3 px-3 text-center">ST Alloc %</th>
                    <th className="py-3 px-3 text-center">UC Rate</th>
                    <th className="py-3 px-3 text-center">Audit Grade</th>
                    <th className="py-3 px-3 text-center">Earmark Status</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5DFD3]">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-xs font-mono text-[#6B7280]">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#D97706]" />
                        Loading verified MP statutory compliance records...
                      </td>
                    </tr>
                  ) : filteredLeaderboard.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-xs font-mono text-[#6B7280]">
                        No MP records found matching the filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredLeaderboard.map((mp) => {
                      const isScCompliant = mp.sc_allocation_pct >= 15.0;
                      const isStCompliant = mp.st_allocation_pct >= 7.5;
                      const statusClr =
                        mp.earmarking_status === "COMPLIANT"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                          : mp.earmarking_status === "DEFICIT"
                          ? "bg-amber-50 text-amber-700 border-amber-300"
                          : "bg-rose-50 text-rose-700 border-rose-300";

                      const gradeClr =
                        mp.statutory_compliance_grade === "A"
                          ? "bg-emerald-100 text-emerald-800"
                          : mp.statutory_compliance_grade === "B"
                          ? "bg-blue-100 text-blue-800"
                          : mp.statutory_compliance_grade === "C"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-rose-100 text-rose-800";

                      return (
                        <tr key={mp.id} className="hover:bg-[#FAF7F2] transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-[#0B132B]">{mp.name}</div>
                            <div className="text-[11px] text-[#6B7280] font-mono">{mp.house} • {mp.total_works} works</div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-medium text-[#1F2937]">{mp.constituency}</div>
                            <div className="text-[11px] text-[#6B7280]">{mp.state}</div>
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-medium">
                            ₹{(mp.total_allocation / 10000000).toFixed(2)} Cr
                          </td>
                          <td className="py-3 px-3 text-center font-mono">
                            <span
                              className={`px-2 py-0.5 rounded font-bold ${
                                isScCompliant ? "text-emerald-700 bg-emerald-50" : "text-rose-700 bg-rose-50"
                              }`}
                            >
                              {mp.sc_allocation_pct.toFixed(1)}%
                            </span>
                            <div className="text-[10px] text-[#6B7280]">Target: 15%</div>
                          </td>
                          <td className="py-3 px-3 text-center font-mono">
                            <span
                              className={`px-2 py-0.5 rounded font-bold ${
                                isStCompliant ? "text-emerald-700 bg-emerald-50" : "text-rose-700 bg-rose-50"
                              }`}
                            >
                              {mp.st_allocation_pct.toFixed(1)}%
                            </span>
                            <div className="text-[10px] text-[#6B7280]">Target: 7.5%</div>
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-medium">
                            <span
                              className={
                                mp.uc_compliance_rate >= 80
                                  ? "text-emerald-700"
                                  : mp.uc_compliance_rate >= 60
                                  ? "text-amber-700"
                                  : "text-rose-700"
                              }
                            >
                              {mp.uc_compliance_rate.toFixed(0)}%
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center font-mono">
                            <span className={`px-2 py-0.5 rounded-full font-bold text-xs ${gradeClr}`}>
                              {mp.statutory_compliance_grade}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center font-mono">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusClr}`}>
                              {mp.earmarking_status.replace("_", " ")}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => setSelectedMP(mp)}
                              className="text-xs font-mono font-bold text-[#6E4529] hover:text-[#0B132B] hover:underline"
                            >
                              Audit Dossier →
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div className="bg-[#FAF7F2] px-4 py-3 border-t border-[#E5DFD3] flex items-center justify-between text-xs font-mono text-[#4B5563]">
              <span>
                Showing {filteredLeaderboard.length} of {leaderboardTotal} MPs
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 bg-white border border-[#E5DFD3] rounded hover:bg-[#F0ECE1] disabled:opacity-40"
                >
                  Previous
                </button>
                <span>Page {page}</span>
                <button
                  disabled={page * 25 >= leaderboardTotal}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-2.5 py-1 bg-white border border-[#E5DFD3] rounded hover:bg-[#F0ECE1] disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          5. TAB 2: NEGATIVE LIST PROHIBITED WORKS
      ───────────────────────────────────────────────────────────── */}
      {activeTab === "negative_list" && (
        <div className="space-y-4">
          <div className="bg-[#FEF2F2] border border-rose-200 rounded-xl p-4 text-xs font-sans text-rose-900 flex items-start gap-3">
            <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold font-mono text-rose-800 uppercase tracking-wide">
                Statutory Prohibited Works Enforcement (Annexure-III)
              </div>
              <p className="mt-1 text-rose-700">
                Under Para 3.14 & Annexure-III of MoSPI MPLADS Guidelines 2023, public funds cannot be sanctioned for
                places of worship, memorials, statues, private commercial buildings, cash grants, or temporary sheds.
                Flagged works below require formal Collectorate justification or cancellation.
              </p>
            </div>
          </div>

          <div className="bg-white border border-[#E5DFD3] rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-[#0B132B] text-white font-mono text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Project ID & Title</th>
                    <th className="py-3 px-3">Member of Parliament</th>
                    <th className="py-3 px-3">Location</th>
                    <th className="py-3 px-3 text-right">Sanction Amount</th>
                    <th className="py-3 px-3">Statutory Violation Reason</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5DFD3]">
                  {negativeList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs font-mono text-[#6B7280]">
                        No prohibited negative list violations flagged in active portfolio.
                      </td>
                    </tr>
                  ) : (
                    negativeList.map((item) => (
                      <tr key={item.id} className="hover:bg-[#FAF7F2] transition-colors">
                        <td className="py-3 px-4">
                          <Link href={`/works/${item.id}`} className="font-bold text-[#0B132B] hover:underline">
                            {item.id}
                          </Link>
                          <div className="text-[11px] text-[#4B5563] line-clamp-1">{item.work}</div>
                          <div className="text-[10px] text-[#9CA3AF] font-mono">{item.category}</div>
                        </td>
                        <td className="py-3 px-3 font-medium text-[#1F2937]">{item.mp_name}</td>
                        <td className="py-3 px-3">
                          <div>{item.constituency}</div>
                          <div className="text-[11px] text-[#6B7280]">{item.state}</div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-rose-700">
                          ₹{(item.allocation_amount / 100000).toFixed(2)} Lakhs
                        </td>
                        <td className="py-3 px-3 text-rose-800 font-mono text-[11px]">
                          {item.negative_list_reason || "Annexure-III Negative List Match"}
                        </td>
                        <td className="py-3 px-3 text-center font-mono">
                          <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold">
                            FLAGGED
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Link
                            href={`/works/${item.id}`}
                            className="text-xs font-mono font-bold text-[#6E4529] hover:underline"
                          >
                            Inspect →
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          6. TAB 3: UC TRACKER
      ───────────────────────────────────────────────────────────── */}
      {activeTab === "uc_tracker" && summary && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-[#E5DFD3] rounded-xl p-4 shadow-xs">
              <div className="text-xs font-mono text-[#6E4529]">Total Completed Works</div>
              <div className="text-2xl font-serif font-black text-[#0B132B] mt-1">
                {summary.total_completed_works.toLocaleString()}
              </div>
              <div className="text-[11px] text-[#6B7280] mt-1">Requiring formal Utilization Certificates</div>
            </div>
            <div className="bg-white border border-[#E5DFD3] rounded-xl p-4 shadow-xs">
              <div className="text-xs font-mono text-[#059669]">UC Submitted On-Time</div>
              <div className="text-2xl font-serif font-black text-[#059669] mt-1">
                {summary.total_uc_submitted_works.toLocaleString()}
              </div>
              <div className="text-[11px] text-[#6B7280] mt-1">Furnished within statutory 30-day window</div>
            </div>
            <div className="bg-white border border-[#E5DFD3] rounded-xl p-4 shadow-xs">
              <div className="text-xs font-mono text-[#DC2626]">UC Overdue / Delinquent</div>
              <div className="text-2xl font-serif font-black text-[#DC2626] mt-1">
                {summary.total_uc_overdue_works.toLocaleString()}
              </div>
              <div className="text-[11px] text-[#DC2626] mt-1 font-bold">Blocks subsequent tranche releases</div>
            </div>
          </div>

          <div className="bg-white border border-[#E5DFD3] rounded-xl p-5 shadow-xs space-y-4">
            <h3 className="font-serif font-bold text-lg text-[#0B132B]">
              Utilization Certificate Mandate (Para 4.6 & GFR Rule 238)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans text-[#4B5563]">
              <div className="border border-[#E5DFD3] rounded-lg p-3 bg-[#FAF7F2]">
                <div className="font-bold text-[#0B132B] font-mono mb-1">Implementing Agency Obligation:</div>
                <p>
                  The executing department / agency must furnish physical and financial Utilization Certificates in
                  Annexure-VIII within <b>30 days</b> of the physical completion of the work. Unfurnished UCs are treated
                  as unliquidated financial advances.
                </p>
              </div>
              <div className="border border-[#E5DFD3] rounded-lg p-3 bg-[#FAF7F2]">
                <div className="font-bold text-[#0B132B] font-mono mb-1">District Authority Prerequisite:</div>
                <p>
                  District Collectorates cannot requisition subsequent MPLADS tranches from MoSPI if more than <b>20%</b> of
                  previously completed works have overdue Utilization Certificates.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/works?uc_status=OVERDUE"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#0B132B] text-white rounded-lg text-xs font-mono font-bold hover:bg-[#14213D] transition-colors"
              >
                <span>Filter All Overdue Works in Works Explorer →</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          7. TAB 4: TRUST & SOCIETY CEILING MONITOR
      ───────────────────────────────────────────────────────────── */}
      {activeTab === "trust_ceiling" && trustReport && (
        <div className="space-y-4">
          <div className="bg-white border border-[#E5DFD3] rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-lg text-[#0B132B]">
                Registered Societies / Trusts Expenditure Ceiling Monitor
              </h3>
              <span className="px-2.5 py-1 bg-amber-100 text-amber-900 font-mono text-xs rounded-md font-bold">
                Max ₹50.0 Lakhs / MP / FY
              </span>
            </div>
            <p className="text-xs text-[#4B5563]">
              Under <b>Para 3.14 of MPLADS Guidelines 2023</b>, an MP can recommend works to registered Trusts / Societies
              up to a maximum ceiling of <b>₹50.0 Lakhs in a single financial year</b>. Commercial or unaided private
              trusts are strictly prohibited.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Breached */}
            <div className="bg-white border border-rose-200 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs font-bold text-rose-700 uppercase">
                  Ceiling Breaches (&gt;₹50.0 Lakhs)
                </span>
                <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-xs font-bold">
                  {trustReport.total_breached} MPs
                </span>
              </div>
              {trustReport.breached_mps.length === 0 ? (
                <div className="text-xs text-[#6B7280] font-mono py-4 text-center">
                  Zero ceiling breaches detected nationwide.
                </div>
              ) : (
                <div className="space-y-2">
                  {trustReport.breached_mps.map((m, idx) => (
                    <div key={idx} className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs font-sans">
                      <div className="font-bold text-rose-900">{m.name}</div>
                      <div className="text-[11px] text-rose-700">{m.constituency} ({m.state})</div>
                      <div className="font-mono text-[11px] text-rose-800 mt-1">
                        Total Trust Spend: ₹{(m.trust_society_spend / 100000).toFixed(2)}L • Excess: ₹{(m.excess_amount / 100000).toFixed(2)}L
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Approaching */}
            <div className="bg-white border border-amber-200 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs font-bold text-amber-700 uppercase">
                  Approaching Ceiling (₹35L – ₹50L)
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-xs font-bold">
                  {trustReport.total_approaching} MPs
                </span>
              </div>
              {trustReport.approaching_mps.length === 0 ? (
                <div className="text-xs text-[#6B7280] font-mono py-4 text-center">
                  No MPs currently in warning band.
                </div>
              ) : (
                <div className="space-y-2">
                  {trustReport.approaching_mps.map((m, idx) => (
                    <div key={idx} className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs font-sans">
                      <div className="font-bold text-amber-900">{m.name}</div>
                      <div className="text-[11px] text-amber-700">{m.constituency} ({m.state})</div>
                      <div className="font-mono text-[11px] text-amber-800 mt-1">
                        Spend: ₹{(m.trust_society_spend / 100000).toFixed(2)}L • Headroom: ₹{(m.remaining_limit / 100000).toFixed(2)}L
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          8. TAB 5: STATUTORY RULES COMPENDIUM
      ───────────────────────────────────────────────────────────── */}
      {activeTab === "rules" && (
        <div className="bg-white border border-[#E5DFD3] rounded-xl p-6 shadow-xs space-y-6">
          <div className="border-b border-[#E5DFD3] pb-4">
            <h3 className="font-serif font-black text-xl text-[#0B132B]">
              Statutory Rules Compendium: MoSPI MPLADS Guidelines 2023
            </h3>
            <p className="text-xs text-[#4B5563] mt-1">
              Codified legal thresholds governing administrative compliance and non-discretionary statutory audits.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 border border-[#E5DFD3] rounded-lg p-4 bg-[#FAF7F2]">
              <div className="font-mono font-bold text-xs text-[#6E4529] uppercase">
                1. SC & ST Earmarking Mandate (Para 2.5)
              </div>
              <ul className="text-xs space-y-1.5 text-[#374151] list-disc pl-4 font-sans">
                <li><b>SC Habitation Minimum:</b> At least 15.0% of annual entitlement (₹75.0 Lakhs/year).</li>
                <li><b>ST Habitation Minimum:</b> At least 7.5% of annual entitlement (₹37.5 Lakhs/year).</li>
                <li><b>Combined Statutory Floor:</b> 22.5% of total MP fund entitlement.</li>
                <li><b>Flexibility Clause:</b> Redirection between SC/ST permissible only with State Nodal concurrence.</li>
              </ul>
            </div>

            <div className="space-y-2 border border-[#E5DFD3] rounded-lg p-4 bg-[#FAF7F2]">
              <div className="font-mono font-bold text-xs text-[#6E4529] uppercase">
                2. Utilization Certificate Mandate (Para 4.6 & GFR 238)
              </div>
              <ul className="text-xs space-y-1.5 text-[#374151] list-disc pl-4 font-sans">
                <li><b>Submission Window:</b> Within 30 days of physical work completion.</li>
                <li><b>Consolidated Reporting:</b> District Authority must furnish annual consolidated UC (Annexure-VIII).</li>
                <li><b>Funding Block:</b> Overdue UC backlog halts subsequent tranche releases from Ministry.</li>
              </ul>
            </div>

            <div className="space-y-2 border border-[#E5DFD3] rounded-lg p-4 bg-[#FAF7F2]">
              <div className="font-mono font-bold text-xs text-[#6E4529] uppercase">
                3. Negative / Prohibited Works (Annexure-III)
              </div>
              <ul className="text-xs space-y-1.5 text-[#374151] list-disc pl-4 font-sans">
                <li>Places of religious worship, temples, mosques, churches, or gurudwaras.</li>
                <li>Memorials, statues, monuments, or busts commemorating individuals.</li>
                <li>Commercial offices, private residential buildings, or private clubs.</li>
                <li>Cash grants, individual loans, or private medical assistance.</li>
                <li>Land acquisition or purchase of private land.</li>
              </ul>
            </div>

            <div className="space-y-2 border border-[#E5DFD3] rounded-lg p-4 bg-[#FAF7F2]">
              <div className="font-mono font-bold text-xs text-[#6E4529] uppercase">
                4. Mandatory Physical Inspection (Para 5.3)
              </div>
              <ul className="text-xs space-y-1.5 text-[#374151] list-disc pl-4 font-sans">
                <li>District Authority must physically inspect <b>≥10%</b> of all sanctioned works annually.</li>
                <li>Inspection records with geo-tagged photographs must be uploaded to e-SAKSHI.</li>
                <li>Measurement Books (MBs) must be countersigned by Executive Engineer.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          9. MP DETAIL MODAL / DRAWER
      ───────────────────────────────────────────────────────────── */}
      {selectedMP && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-[#E5DFD3] rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-[#E5DFD3] pb-4">
              <div>
                <div className="text-xs font-mono text-[#6E4529] uppercase">
                  Statutory Audit Dossier • {selectedMP.house}
                </div>
                <h2 className="text-xl font-serif font-black text-[#0B132B] mt-0.5">{selectedMP.name}</h2>
                <div className="text-xs text-[#6B7280] font-sans">
                  {selectedMP.constituency}, {selectedMP.state}
                </div>
              </div>
              <button
                onClick={() => setSelectedMP(null)}
                className="text-[#9CA3AF] hover:text-[#1F2937] text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-2.5 bg-[#FAF7F2] rounded-lg border border-[#E5DFD3]">
                <div className="text-[10px] font-mono text-[#6B7280]">Total Outlay</div>
                <div className="text-sm font-bold font-mono text-[#0B132B]">
                  ₹{(selectedMP.total_allocation / 10000000).toFixed(2)} Cr
                </div>
              </div>
              <div className="p-2.5 bg-[#FAF7F2] rounded-lg border border-[#E5DFD3]">
                <div className="text-[10px] font-mono text-[#6B7280]">SC Alloc %</div>
                <div
                  className={`text-sm font-bold font-mono ${
                    selectedMP.sc_allocation_pct >= 15 ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  {selectedMP.sc_allocation_pct.toFixed(1)}%
                </div>
              </div>
              <div className="p-2.5 bg-[#FAF7F2] rounded-lg border border-[#E5DFD3]">
                <div className="text-[10px] font-mono text-[#6B7280]">ST Alloc %</div>
                <div
                  className={`text-sm font-bold font-mono ${
                    selectedMP.st_allocation_pct >= 7.5 ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  {selectedMP.st_allocation_pct.toFixed(1)}%
                </div>
              </div>
              <div className="p-2.5 bg-[#FAF7F2] rounded-lg border border-[#E5DFD3]">
                <div className="text-[10px] font-mono text-[#6B7280]">Compliance Grade</div>
                <div className="text-sm font-bold font-mono text-[#0B132B]">
                  Grade {selectedMP.statutory_compliance_grade}
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs font-sans">
              <div className="flex justify-between py-1.5 border-b border-[#F3EFE6]">
                <span className="text-[#6B7280]">Scheduled Caste Allocation:</span>
                <span className="font-mono font-medium">₹{(selectedMP.sc_allocation_amount / 100000).toFixed(2)} Lakhs</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#F3EFE6]">
                <span className="text-[#6B7280]">Scheduled Tribe Allocation:</span>
                <span className="font-mono font-medium">₹{(selectedMP.st_allocation_amount / 100000).toFixed(2)} Lakhs</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#F3EFE6]">
                <span className="text-[#6B7280]">Utilization Certificate Compliance:</span>
                <span className="font-mono font-medium">{selectedMP.uc_compliance_rate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#F3EFE6]">
                <span className="text-[#6B7280]">Trust / Society Expenditure:</span>
                <span className="font-mono font-medium">
                  ₹{(selectedMP.trust_society_spend / 100000).toFixed(2)} Lakhs {selectedMP.trust_society_ceiling_breach && "(BREACH)"}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Link
                href={`/works?search=${encodeURIComponent(selectedMP.name)}`}
                className="px-4 py-2 bg-[#0B132B] text-white rounded-lg text-xs font-mono font-bold hover:bg-[#14213D] transition-colors"
              >
                View MP Works in Explorer →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
