"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { fetchWorks, fetchFilters } from "../../lib/api";
import { WorkItem } from "../../lib/types";
import { RiskBadge, PriorityBadge } from "../../components/ui/RiskBadge";
import { formatTypologyLabel } from "../../lib/typologies";
import { MagicCard } from "../../components/ui/MagicCard";
import { WorkCategoryAnalytics } from "../../components/analytics/WorkCategoryDistributionChart";
import {
  Search,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Layers,
  AlertTriangle,
  Download,
  Copy,
  Table,
  RotateCcw,
  Sparkles,
  TrendingUp,
  ShieldAlert,
  Building2,
  Clock,
  Check,
  X,
  Sliders,
  Zap,
  Scale,
  ShieldCheck,
} from "lucide-react";

export default function WorksExplorerPage() {
  const [works, setWorks] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState<"table" | "duplicate_groups">("table");

  // Filters (Uncoupled from persona/role switcher for pure forensic autonomy)
  const [search, setSearch] = useState("");
  const [state, setState] = useState("");
  const [category, setCategory] = useState("");
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [riskLevel, setRiskLevel] = useState("");
  const [fraudType, setFraudType] = useState("");
  const [sortBy, setSortBy] = useState("risk_score");
  const [sortOrder, setSortOrder] = useState("desc");
  const [activePreset, setActivePreset] = useState<string | null>(null);

  // Statutory Compliance Filter States
  const [beneficiaryType, setBeneficiaryType] = useState<string>("");
  const [ucStatus, setUcStatus] = useState<string>("");
  const [negativeListOnly, setNegativeListOnly] = useState<boolean>(false);
  const [showComplianceView, setShowComplianceView] = useState<boolean>(false);

  // Filter options from API
  const [options, setOptions] = useState<{
    states: string[];
    categories: string[];
    statuses: string[];
    fraud_types: string[];
    risk_levels: string[];
  }>({
    states: [],
    categories: [],
    statuses: [],
    fraud_types: [],
    risk_levels: [],
  });

  useEffect(() => {
    fetchFilters().then(setOptions).catch(console.error);
  }, []);

  useEffect(() => {
    async function loadWorks() {
      setLoading(true);
      try {
        const res = await fetchWorks({
          page,
          limit: viewMode === "duplicate_groups" ? 100 : 25,
          search: search || undefined,
          state: state || undefined,
          category: category || undefined,
          risk_level: riskLevel || undefined,
          fraud_type: fraudType || undefined,
          sort_by: sortBy,
          sort_order: sortOrder,
          beneficiary_type: beneficiaryType || undefined,
          uc_status: ucStatus || undefined,
          negative_list_only: negativeListOnly || undefined,
        });
        setWorks(res.items);
        setTotal(res.total);
        setTotalPages(res.total_pages);
      } catch (err) {
        console.error("Failed to load works:", err);
      } finally {
        setLoading(false);
      }
    }
    loadWorks();
  }, [page, search, state, riskLevel, fraudType, sortBy, sortOrder, viewMode, category, beneficiaryType, ucStatus, negativeListOnly]);

  // Handle Preset Clicks
  const applyPreset = (presetKey: string) => {
    setPage(1);
    if (activePreset === presetKey) {
      // Toggle off
      setActivePreset(null);
      setRiskLevel("");
      setFraudType("");
      setBeneficiaryType("");
      setUcStatus("");
      setNegativeListOnly(false);
      setShowComplianceView(false);
      setViewMode("table");
      return;
    }

    setActivePreset(presetKey);
    switch (presetKey) {
      case "critical":
        setRiskLevel("Critical");
        setFraudType("");
        setBeneficiaryType("");
        setUcStatus("");
        setNegativeListOnly(false);
        setShowComplianceView(false);
        setViewMode("table");
        break;
      case "duplicate":
        setFraudType("duplicate");
        setRiskLevel("");
        setBeneficiaryType("");
        setUcStatus("");
        setNegativeListOnly(false);
        setShowComplianceView(false);
        setViewMode("duplicate_groups");
        break;
      case "cost_overrun":
      case "overpricing":
        setFraudType("cost_overrun");
        setRiskLevel("");
        setBeneficiaryType("");
        setUcStatus("");
        setNegativeListOnly(false);
        setShowComplianceView(false);
        setViewMode("table");
        break;
      case "single_bid":
        setFraudType("single_bid_tender");
        setRiskLevel("");
        setBeneficiaryType("");
        setUcStatus("");
        setNegativeListOnly(false);
        setShowComplianceView(false);
        setViewMode("table");
        break;
      case "structuring":
        setFraudType("payment_structuring");
        setRiskLevel("");
        setBeneficiaryType("");
        setUcStatus("");
        setNegativeListOnly(false);
        setShowComplianceView(false);
        setViewMode("table");
        break;
      case "vendor_concentration":
      case "vendor_capture":
        setFraudType("vendor_concentration");
        setRiskLevel("");
        setBeneficiaryType("");
        setUcStatus("");
        setNegativeListOnly(false);
        setShowComplianceView(false);
        setViewMode("table");
        break;
      case "delayed_work":
      case "ghost_project":
        setFraudType("delayed_work");
        setRiskLevel("");
        setBeneficiaryType("");
        setUcStatus("");
        setNegativeListOnly(false);
        setShowComplianceView(false);
        setViewMode("table");
        break;
      case "sc_earmarked":
        setBeneficiaryType("SC_HABITATION");
        setUcStatus("");
        setNegativeListOnly(false);
        setRiskLevel("");
        setFraudType("");
        setShowComplianceView(true);
        setViewMode("table");
        break;
      case "st_earmarked":
        setBeneficiaryType("ST_HABITATION");
        setUcStatus("");
        setNegativeListOnly(false);
        setRiskLevel("");
        setFraudType("");
        setShowComplianceView(true);
        setViewMode("table");
        break;
      case "uc_overdue":
        setUcStatus("OVERDUE");
        setBeneficiaryType("");
        setNegativeListOnly(false);
        setRiskLevel("");
        setFraudType("");
        setShowComplianceView(true);
        setViewMode("table");
        break;
      case "negative_list":
        setNegativeListOnly(true);
        setBeneficiaryType("");
        setUcStatus("");
        setRiskLevel("");
        setFraudType("");
        setShowComplianceView(true);
        setViewMode("table");
        break;
    }
  };

  const clearAllFilters = () => {
    setSearch("");
    setState("");
    setCategory("");
    setRiskLevel("");
    setFraudType("");
    setBeneficiaryType("");
    setUcStatus("");
    setNegativeListOnly(false);
    setShowComplianceView(false);
    setSortBy("risk_score");
    setSortOrder("desc");
    setActivePreset(null);
    setViewMode("table");
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    search || state || riskLevel || fraudType || beneficiaryType || ucStatus || negativeListOnly || sortBy !== "risk_score" || sortOrder !== "desc" || activePreset
  );

  // Group works by duplicate cluster key (MP + Work Title + Amount)
  const duplicateClusters = useMemo(() => {
    const map = new Map<string, WorkItem[]>();
    works.forEach((w) => {
      const key = `${w.mp_name} ::: ${w.work} ::: ${w.allocation_amount}`;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(w);
    });

    return Array.from(map.entries()).map(([key, items]) => {
      const [mp_name, workTitle, amountStr] = key.split(" ::: ");
      return {
        key,
        mp_name,
        workTitle,
        amount: Number(amountStr),
        items,
        count: items.length,
        totalAmount: Number(amountStr) * items.length,
        avgRisk: items.reduce((acc, curr) => acc + curr.risk_score, 0) / items.length,
        state: items[0]?.state,
        constituency: items[0]?.constituency,
        ida: items[0]?.ida,
      };
    });
  }, [works]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#E5DFD3] pb-5 pt-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-[#6E4529] px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#F5EBE1]">
              National Audit Ledger
            </span>
            <span className="text-xs text-stone-500 font-mono">
              15,000 Scored Works • ₹223.1 Cr Monitored
            </span>
          </div>
          <h1 className="mt-1.5 text-2xl font-serif font-bold text-[#1C1917] sm:text-3xl tracking-tight">
            MPLADS Works Explorer
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-stone-600 max-w-3xl">
            Cross-jurisdictional forensic audit ledger. Search project anomalies, duplicate candidate clusters, and inspect explainability traces across all MPs and Implementing Agencies.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-xl border border-[#D9D2C5] bg-[#F0ECE1] p-1 text-xs">
            <button
              onClick={() => {
                setViewMode("table");
                setShowComplianceView(false);
              }}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition-all ${
                viewMode === "table" && !showComplianceView
                  ? "bg-[#6E4529] text-[#F5EBE1] shadow-xs"
                  : "text-stone-700 hover:bg-white hover:text-stone-900"
              }`}
            >
              <Table className="h-3.5 w-3.5" />
              <span>Forensic Risk View</span>
            </button>
            <button
              onClick={() => {
                setViewMode("table");
                setShowComplianceView(true);
              }}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition-all ${
                viewMode === "table" && showComplianceView
                  ? "bg-[#0B132B] text-amber-300 shadow-xs"
                  : "text-stone-700 hover:bg-white hover:text-stone-900"
              }`}
            >
              <Scale className="h-3.5 w-3.5 text-amber-500" />
              <span>Statutory Compliance View</span>
            </button>
            <button
              onClick={() => {
                setViewMode("duplicate_groups");
                setShowComplianceView(false);
              }}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition-all ${
                viewMode === "duplicate_groups"
                  ? "bg-[#6E4529] text-[#F5EBE1] shadow-xs"
                  : "text-stone-700 hover:bg-white hover:text-stone-900"
              }`}
            >
              <Copy className="h-3.5 w-3.5" />
              <span>Duplicate Clusters</span>
            </button>
          </div>

          <Link
            href="/proposals"
            className="flex items-center gap-1.5 rounded-xl border border-[#6E4529] bg-[#6E4529] px-3.5 py-2 text-xs font-bold text-[#F5EBE1] hover:bg-[#5A361F] transition-all shadow-xs"
          >
            <Zap className="h-3.5 w-3.5 text-[#FDE68A]" />
            <span>+ Feed Plan & Score</span>
          </Link>

          <Link
            href="/reports"
            className="flex items-center gap-1.5 rounded-xl border border-[#D9D2C5] bg-[#FFFDF9] px-3.5 py-2 text-xs font-bold text-[#6E4529] hover:bg-white transition-all shadow-xs"
          >
            <Download className="h-3.5 w-3.5 text-[#8C5D3B]" />
            <span>Export CSV</span>
          </Link>
        </div>
      </div>

      {/* Visual Analytics: Work Categories Donut & Sector Delays */}
      {showAnalytics && (
        <WorkCategoryAnalytics
          totalWorks={total}
          selectedCategory={category}
          onSelectCategory={(cat) => {
            setCategory(cat);
            setPage(1);
          }}
        />
      )}

      {/* Forensic Audit Anomaly Presets (One-Click Investigation Filters) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono font-bold uppercase tracking-wider text-[#8C5D3B]">
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-[#8C5D3B]" />
            Forensic Audit Presets:
          </span>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1 text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset All Filters</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => applyPreset("critical")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              activePreset === "critical"
                ? "bg-rose-900 text-white shadow-xs ring-2 ring-rose-500"
                : "border border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100"
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>🚨 All Critical (Risk &gt; 80)</span>
          </button>

          <button
            type="button"
            onClick={() => applyPreset("duplicate")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              activePreset === "duplicate"
                ? "bg-amber-900 text-white shadow-xs ring-2 ring-amber-500"
                : "border border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100"
            }`}
          >
            <Copy className="h-3.5 w-3.5" />
            <span>🔄 Duplicate Recommendation Shells</span>
          </button>

          <button
            type="button"
            onClick={() => applyPreset("cost_overrun")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              activePreset === "cost_overrun"
                ? "bg-amber-900 text-white shadow-xs ring-2 ring-amber-500"
                : "border border-[#E5DFD3] bg-[#FFFDF9] text-stone-800 hover:bg-[#F0ECE1]"
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5 text-amber-700" />
            <span>📈 Cost Overrun (&gt;+2.0σ)</span>
          </button>

          <button
            type="button"
            onClick={() => applyPreset("single_bid")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              activePreset === "single_bid"
                ? "bg-amber-900 text-white shadow-xs ring-2 ring-amber-500"
                : "border border-[#E5DFD3] bg-[#FFFDF9] text-stone-800 hover:bg-[#F0ECE1]"
            }`}
          >
            <Layers className="h-3.5 w-3.5 text-blue-700" />
            <span>⚡ Single-Bid Tender</span>
          </button>

          <button
            type="button"
            onClick={() => applyPreset("structuring")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              activePreset === "structuring"
                ? "bg-amber-900 text-white shadow-xs ring-2 ring-amber-500"
                : "border border-[#E5DFD3] bg-[#FFFDF9] text-stone-800 hover:bg-[#F0ECE1]"
            }`}
          >
            <Sliders className="h-3.5 w-3.5 text-purple-700" />
            <span>⚡ ₹5L Payment Structuring</span>
          </button>

          <button
            type="button"
            onClick={() => applyPreset("vendor_concentration")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              activePreset === "vendor_concentration"
                ? "bg-amber-900 text-white shadow-xs ring-2 ring-amber-500"
                : "border border-[#E5DFD3] bg-[#FFFDF9] text-stone-800 hover:bg-[#F0ECE1]"
            }`}
          >
            <Building2 className="h-3.5 w-3.5 text-sky-700" />
            <span>🏢 Vendor Concentration</span>
          </button>

          <button
            type="button"
            onClick={() => applyPreset("delayed_work")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              activePreset === "delayed_work"
                ? "bg-amber-900 text-white shadow-xs ring-2 ring-amber-500"
                : "border border-[#E5DFD3] bg-[#FFFDF9] text-stone-800 hover:bg-[#F0ECE1]"
            }`}
          >
            <Clock className="h-3.5 w-3.5 text-stone-600" />
            <span>⏳ Delayed / Stalled Work</span>
          </button>

          {/* Statutory Compliance Presets */}
          <button
            type="button"
            onClick={() => applyPreset("sc_earmarked")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              activePreset === "sc_earmarked"
                ? "bg-emerald-900 text-white shadow-xs ring-2 ring-emerald-500"
                : "border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
            }`}
          >
            <Scale className="h-3.5 w-3.5 text-emerald-600" />
            <span>🎯 SC Earmarked (≥15%)</span>
          </button>

          <button
            type="button"
            onClick={() => applyPreset("st_earmarked")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              activePreset === "st_earmarked"
                ? "bg-emerald-900 text-white shadow-xs ring-2 ring-emerald-500"
                : "border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
            }`}
          >
            <Scale className="h-3.5 w-3.5 text-emerald-600" />
            <span>🌲 ST Earmarked (≥7.5%)</span>
          </button>

          <button
            type="button"
            onClick={() => applyPreset("uc_overdue")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              activePreset === "uc_overdue"
                ? "bg-rose-900 text-white shadow-xs ring-2 ring-rose-500"
                : "border border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100"
            }`}
          >
            <Clock className="h-3.5 w-3.5 text-rose-600" />
            <span>⚠️ UC Overdue (&gt;30d)</span>
          </button>

          <button
            type="button"
            onClick={() => applyPreset("negative_list")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              activePreset === "negative_list"
                ? "bg-rose-900 text-white shadow-xs ring-2 ring-rose-500"
                : "border border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100"
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
            <span>🚫 Prohibited List (Annex-III)</span>
          </button>
        </div>
      </div>

      {/* Forensic Multi-Facet Query & Filter Bar */}
      <MagicCard 
        glowColor="245, 158, 11"
        enableBorderGlow={true}
        enableTilt={false}
        className="rounded-2xl border border-[#E5DFD3] bg-[#FFFDF9] p-4 shadow-xs"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Universal Search Box */}
          <div className="sm:col-span-2 relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
            <input
              type="text"
              placeholder="Search Work ID, MP, agency, title..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setActivePreset(null);
                setPage(1);
              }}
              className="w-full rounded-xl border border-[#D9D2C5] bg-[#FAF7F2] py-2 pl-9 pr-8 text-xs text-[#1C1917] placeholder-stone-400 focus:border-[#6E4529] focus:outline-none focus:ring-1 focus:ring-[#6E4529] font-sans transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* State / UT Filter */}
          <div>
            <select
              value={state}
              onChange={(e) => {
                setState(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-[#D9D2C5] bg-[#FAF7F2] px-3 py-2 text-xs text-stone-800 font-medium focus:border-[#6E4529] focus:outline-none focus:ring-1 focus:ring-[#6E4529] cursor-pointer transition-all"
            >
              <option value="">All States ({options.states.length || 31})</option>
              {options.states.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Risk Level Filter */}
          <div>
            <select
              value={riskLevel}
              onChange={(e) => {
                setRiskLevel(e.target.value);
                setActivePreset(null);
                setPage(1);
              }}
              className="w-full rounded-xl border border-[#D9D2C5] bg-[#FAF7F2] px-3 py-2 text-xs text-stone-800 font-medium focus:border-[#6E4529] focus:outline-none focus:ring-1 focus:ring-[#6E4529] cursor-pointer transition-all"
            >
              <option value="">All Risk Tiers</option>
              <option value="Critical">Critical (&gt; 80)</option>
              <option value="High">High (60 – 80)</option>
              <option value="Medium">Medium (35 – 60)</option>
              <option value="Low">Clean / Low (&lt; 35)</option>
            </select>
          </div>

          {/* Fraud Typology Filter */}
          <div>
            <select
              value={fraudType}
              onChange={(e) => {
                setFraudType(e.target.value);
                setActivePreset(null);
                setPage(1);
              }}
              className="w-full rounded-xl border border-[#D9D2C5] bg-[#FAF7F2] px-3 py-2 text-xs text-stone-800 font-medium focus:border-[#6E4529] focus:outline-none focus:ring-1 focus:ring-[#6E4529] cursor-pointer transition-all"
            >
              <option value="">All Anomaly Typologies</option>
              <option value="cost_overrun">Cost Overrun</option>
              <option value="ghost_work">Ghost Work</option>
              <option value="single_bid_tender">Single-Bid Tender</option>
              <option value="vendor_concentration">Vendor Concentration</option>
              <option value="payment_structuring">Payment Structuring</option>
              <option value="delayed_work">Delayed Work</option>
              <option value="abandoned_work">Abandoned Work</option>
              <option value="collusion_ring">Collusion Ring</option>
              <option value="documentation_deficit">Documentation Deficit</option>
              <option value="normal">Normal / Compliant Profile</option>
              {/* Legacy Aliases */}
              <option value="overpricing">Legacy: Cost Escalation</option>
              <option value="duplicate">Legacy: Duplicate Cloned Works</option>
              <option value="structuring">Legacy: Structuring (&lt;₹5L)</option>
              <option value="vendor_capture">Legacy: Agency Capture</option>
              <option value="ghost_project">Legacy: Stalled / Ghost</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [by, ord] = e.target.value.split("-");
                setSortBy(by);
                setSortOrder(ord);
              }}
              className="w-full rounded-xl border border-[#D9D2C5] bg-[#FAF7F2] px-3 py-2 text-xs text-stone-800 font-medium focus:border-[#6E4529] focus:outline-none focus:ring-1 focus:ring-[#6E4529] cursor-pointer transition-all"
            >
              <option value="risk_score-desc">Risk: Highest First</option>
              <option value="risk_score-asc">Risk: Lowest First</option>
              <option value="allocation_amount-desc">Amount: Highest First</option>
              <option value="allocation_amount-asc">Amount: Lowest First</option>
            </select>
          </div>
        </div>

        {/* Active Filters Pill Row & Live Counter */}
        <div className="mt-3 pt-3 border-t border-[#E5DFD3] flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] text-stone-500 font-medium">
              Filtered Scope:
            </span>

            {search && (
              <span className="inline-flex items-center gap-1 rounded-md bg-[#F0ECE1] px-2 py-0.5 text-[11px] font-mono text-stone-800">
                Keyword: &quot;{search}&quot;
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="hover:text-red-700"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {state && (
              <span className="inline-flex items-center gap-1 rounded-md bg-[#F0ECE1] px-2 py-0.5 text-[11px] font-mono text-stone-800">
                State: {state}
                <button
                  type="button"
                  onClick={() => setState("")}
                  className="hover:text-red-700"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {riskLevel && (
              <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 border border-rose-200 px-2 py-0.5 text-[11px] font-mono text-rose-800 font-bold">
                Tier: {riskLevel}
                <button
                  type="button"
                  onClick={() => setRiskLevel("")}
                  className="hover:text-red-700"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {fraudType && (
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-mono text-amber-900 font-bold">
                Anomaly: {fraudType}
                <button
                  type="button"
                  onClick={() => setFraudType("")}
                  className="hover:text-red-700"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {beneficiaryType && (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-300 px-2 py-0.5 text-[11px] font-mono text-emerald-900 font-bold">
                Earmark: {beneficiaryType === "SC_HABITATION" ? "SC Habitation (≥15%)" : beneficiaryType === "ST_HABITATION" ? "ST Habitation (≥7.5%)" : beneficiaryType}
                <button
                  type="button"
                  onClick={() => setBeneficiaryType("")}
                  className="hover:text-red-700"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {ucStatus && (
              <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 border border-rose-300 px-2 py-0.5 text-[11px] font-mono text-rose-900 font-bold">
                UC: {ucStatus}
                <button
                  type="button"
                  onClick={() => setUcStatus("")}
                  className="hover:text-red-700"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {negativeListOnly && (
              <span className="inline-flex items-center gap-1 rounded-md bg-rose-100 border border-rose-300 px-2 py-0.5 text-[11px] font-mono text-rose-900 font-bold">
                Annex-III Prohibited Only
                <button
                  type="button"
                  onClick={() => setNegativeListOnly(false)}
                  className="hover:text-red-700"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {!hasActiveFilters && (
              <span className="text-[11px] text-stone-400 font-mono italic">
                Showing all nationwide public works (No filter applied)
              </span>
            )}
          </div>

          <div className="font-mono text-xs text-stone-600">
            Matching Records:{" "}
            <strong className="text-[#6E4529] font-bold">
              {total.toLocaleString()} works
            </strong>
          </div>
        </div>

        {/* Dedicated Statutory Filter Row (Shown when Statutory Compliance View or presets are active) */}
        {showComplianceView && (
          <div className="mt-3 pt-3 border-t border-[#E5DFD3] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-stone-50/60 p-3 rounded-xl">
            <div>
              <label className="block text-[10px] font-mono font-bold text-stone-600 uppercase mb-1">
                Beneficiary Earmark (Para 2.5)
              </label>
              <select
                value={beneficiaryType}
                onChange={(e) => {
                  setBeneficiaryType(e.target.value);
                  setActivePreset(null);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-emerald-300 bg-white px-3 py-1.5 text-xs text-stone-800 font-medium focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 cursor-pointer transition-all"
              >
                <option value="">All Beneficiary Habitations</option>
                <option value="SC_HABITATION">🎯 SC Habitation (≥15% Mandate)</option>
                <option value="ST_HABITATION">🌲 ST Habitation (≥7.5% Mandate)</option>
                <option value="GENERAL">General Habitation</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold text-stone-600 uppercase mb-1">
                UC Compliance (GFR Rule 238)
              </label>
              <select
                value={ucStatus}
                onChange={(e) => {
                  setUcStatus(e.target.value);
                  setActivePreset(null);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-rose-300 bg-white px-3 py-1.5 text-xs text-stone-800 font-medium focus:border-rose-600 focus:outline-none focus:ring-1 focus:ring-rose-600 cursor-pointer transition-all"
              >
                <option value="">All Utilization Statuses</option>
                <option value="OVERDUE">⚠️ Overdue (&gt;30 Days Late)</option>
                <option value="SUBMITTED">✓ Submitted / Compliant</option>
                <option value="PENDING">⏳ In Progress / Pending</option>
              </select>
            </div>

            <div className="flex flex-col justify-end">
              <button
                type="button"
                onClick={() => {
                  setNegativeListOnly(!negativeListOnly);
                  setActivePreset(null);
                  setPage(1);
                }}
                className={`w-full flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
                  negativeListOnly
                    ? "bg-rose-900 border-rose-900 text-white shadow-xs ring-2 ring-rose-500"
                    : "border-rose-300 bg-white text-rose-800 hover:bg-rose-50"
                }`}
              >
                <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
                <span>Prohibited List (Annex-III)</span>
              </button>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold text-stone-600 uppercase mb-1">
                Statutory Score Sort
              </label>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [by, ord] = e.target.value.split("-");
                  setSortBy(by);
                  setSortOrder(ord);
                }}
                className="w-full rounded-xl border border-[#D9D2C5] bg-white px-3 py-1.5 text-xs text-stone-800 font-medium focus:border-[#6E4529] focus:outline-none focus:ring-1 focus:ring-[#6E4529] cursor-pointer transition-all"
              >
                <option value="compliance_score-asc">Score: Non-Compliant First</option>
                <option value="compliance_score-desc">Score: Compliant First</option>
                <option value="uc_overdue_days-desc">UC Overdue: Longest Delay</option>
                <option value="allocation_amount-desc">Amount: Highest First</option>
              </select>
            </div>
          </div>
        )}
      </MagicCard>

      {/* VIEW 1: GROUPED DUPLICATE CLUSTERS VIEW */}
      {viewMode === "duplicate_groups" ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-mono font-bold text-[#6E4529] uppercase tracking-wider">
              Identified Duplicate Recommendation Clusters
            </span>
            <span className="text-xs text-[#8C5D3B] font-mono font-bold">
              {duplicateClusters.filter((c) => c.count > 1).length} Multi-Work Duplicate Clusters Found
            </span>
          </div>

          {loading ? (
            <div className="py-20 text-center text-stone-500">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#8C5D3B] border-t-transparent mx-auto mb-2" />
              <span>Analyzing duplicate recommendation clusters...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {duplicateClusters.map((cluster) => (
                <div
                  key={cluster.key}
                  className={`rounded-2xl border p-5 shadow-xs transition-all ${
                    cluster.count > 1
                      ? "border-amber-300 bg-amber-50/40 shadow-sm"
                      : "border-[#E5DFD3] bg-[#FFFDF9]"
                  }`}
                >
                  {/* Cluster Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5DFD3] pb-3">
                    <div className="space-y-1 max-w-2xl">
                      <div className="flex items-center gap-2">
                        {cluster.count > 1 ? (
                          <span className="rounded-md bg-amber-100 border border-amber-300 px-2 py-0.5 text-xs font-bold text-amber-900 flex items-center gap-1">
                            <Copy className="h-3.5 w-3.5" /> Duplicate Cluster ({cluster.count} Identical Works)
                          </span>
                        ) : (
                          <span className="rounded-md bg-stone-100 px-2 py-0.5 text-xs text-stone-600 font-medium">
                            Single Recommendation
                          </span>
                        )}
                        <span className="text-xs text-stone-500 font-mono">
                          {cluster.constituency}, {cluster.state}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-[#1C1917]">{cluster.workTitle}</h3>
                      <p className="text-xs text-stone-600">
                        MP: <strong className="text-stone-900">{cluster.mp_name}</strong> • Agency:{" "}
                        <strong className="text-stone-900">{cluster.ida}</strong>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-stone-500 block font-mono">Total Cloned Value</span>
                      <span className="text-lg font-mono font-bold text-amber-800">
                        ₹{(cluster.totalAmount / 100000).toFixed(2)} Lakhs
                      </span>
                      <span className="text-[11px] text-stone-400 block font-mono">
                        ₹{cluster.amount.toLocaleString()} per work
                      </span>
                    </div>
                  </div>

                  {/* Individual Works Inside this Cluster */}
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                    {cluster.items.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-[#E5DFD3] bg-[#FFFDF9] p-3 space-y-2 flex flex-col justify-between shadow-2xs"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-bold text-stone-700">{item.id}</span>
                            <RiskBadge score={item.risk_score} level={item.risk_level} size="sm" />
                          </div>
                          <p className="text-xs text-[#1C1917] font-medium mt-1 line-clamp-1">
                            {item.work}
                          </p>
                          <span className="text-[10px] text-stone-500 block mt-0.5 font-mono">
                            Status: {item.status}
                          </span>
                        </div>

                        <div className="pt-2 border-t border-[#F0ECE1] flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-[#1C1917]">
                            ₹{item.allocation_amount.toLocaleString()}
                          </span>
                          <Link
                            href={`/works/${item.id}`}
                            className="inline-flex items-center gap-1 rounded bg-[#F0ECE1] hover:bg-[#6E4529] hover:text-[#F5EBE1] px-2 py-0.5 text-[11px] font-bold text-stone-800 transition-all"
                          >
                            <span>Trace</span>
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* VIEW 2: STANDARD DATA TABLE VIEW */
        <MagicCard 
          glowColor="245, 158, 11"
          enableBorderGlow={true}
          enableTilt={false}
          className="rounded-2xl border border-[#E5DFD3] bg-[#FFFDF9] shadow-xs overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E5DFD3] bg-[#FAF7F2] text-stone-600 uppercase tracking-wider font-mono text-[11px] font-bold">
                  <th className="py-3.5 pl-4">Work ID</th>
                  <th className="py-3.5">Work Recommendation</th>
                  <th className="py-3.5">MP & Jurisdiction</th>
                  {showComplianceView ? (
                    <>
                      <th className="py-3.5 text-center">Beneficiary Earmark</th>
                      <th className="py-3.5 text-right">Amount (INR)</th>
                      <th className="py-3.5 text-center">UC Status (Rule 238)</th>
                      <th className="py-3.5 text-center">Statutory Compliance</th>
                    </>
                  ) : (
                    <>
                      <th className="py-3.5">Agency (IDA)</th>
                      <th className="py-3.5 text-right">Amount (INR)</th>
                      <th className="py-3.5 text-center">Status</th>
                      <th className="py-3.5 text-center">Risk Score</th>
                    </>
                  )}
                  <th className="py-3.5 pr-4 text-center">Audit Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0ECE1]">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-stone-500">
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#8C5D3B] border-t-transparent" />
                        <span>Querying nationwide public works ledger...</span>
                      </div>
                    </td>
                  </tr>
                ) : works.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-stone-500">
                      <p className="font-semibold text-stone-700">No works match the selected filters.</p>
                      <button
                        onClick={clearAllFilters}
                        className="mt-2 inline-flex items-center gap-1 text-xs text-[#6E4529] font-bold underline"
                      >
                        Reset filters to view all works
                      </button>
                    </td>
                  </tr>
                ) : (
                  works.map((w) => (
                    <tr key={w.id} className="hover:bg-[#FAF7F2] transition-colors group">
                      <td className="py-3.5 pl-4 font-mono font-bold text-[#1C1917] whitespace-nowrap">
                        {w.id}
                      </td>
                      <td className="py-3.5 max-w-sm">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-semibold text-[#1C1917] line-clamp-1">{w.work}</p>
                          {showComplianceView && w.is_negative_list_violation ? (
                            <span className="rounded bg-rose-600 px-1.5 py-0.5 text-[10px] font-mono font-bold text-white">
                              PROHIBITED (ANNEX-III)
                            </span>
                          ) : (
                            <span className="rounded bg-[#FAF7F2] border border-[#D9D2C5] px-1.5 py-0.5 text-[10px] font-mono font-bold text-[#6E4529]">
                              {formatTypologyLabel(w.primary_typology || w.predicted_fraud_type)}
                            </span>
                          )}
                        </div>
                        {showComplianceView && w.negative_list_reason ? (
                          <p className="text-[11px] text-rose-700 line-clamp-1 mt-0.5 font-sans font-medium">
                            • Prohibited Violation: {w.negative_list_reason}
                          </p>
                        ) : (w.synthesized_reasons?.[0] || w.risk_reasons?.[0]) ? (
                          <p className="text-[11px] text-red-700 line-clamp-1 mt-0.5 font-sans">
                            • {w.synthesized_reasons?.[0] || w.risk_reasons?.[0]}
                          </p>
                        ) : null}
                      </td>
                      <td className="py-3.5 text-stone-600">
                        <p className="font-bold text-[#1C1917]">{w.mp_name}</p>
                        <p className="text-[10px] text-stone-500 font-mono">
                          {w.constituency}, {w.state}
                        </p>
                      </td>
                      {showComplianceView ? (
                        <>
                          <td className="py-3.5 text-center whitespace-nowrap">
                            {w.beneficiary_type === "SC_HABITATION" || w.is_sc_earmarked ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-300 px-2 py-0.5 text-[11px] font-mono font-bold text-emerald-800">
                                🎯 SC Habitation
                              </span>
                            ) : w.beneficiary_type === "ST_HABITATION" || w.is_st_earmarked ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-teal-50 border border-teal-300 px-2 py-0.5 text-[11px] font-mono font-bold text-teal-800">
                                🌲 ST Habitation
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-md bg-stone-100 border border-stone-200 px-2 py-0.5 text-[11px] font-mono text-stone-600">
                                General
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 text-right font-mono font-bold text-[#1C1917] whitespace-nowrap">
                            ₹{w.allocation_amount.toLocaleString()}
                          </td>
                          <td className="py-3.5 text-center whitespace-nowrap">
                            {w.uc_status === "OVERDUE" ? (
                              <div className="flex flex-col items-center">
                                <span className="inline-flex items-center gap-1 rounded-md bg-rose-100 border border-rose-300 px-2 py-0.5 text-[10px] font-mono font-bold text-rose-900">
                                  ⚠️ OVERDUE
                                </span>
                                <span className="text-[10px] text-rose-700 font-mono mt-0.5">
                                  {w.uc_overdue_days ?? 30}+ days late
                                </span>
                              </div>
                            ) : w.uc_status === "SUBMITTED" ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 border border-emerald-300 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-900">
                                ✓ SUBMITTED
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-mono text-amber-800">
                                ⏳ PENDING
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 text-center whitespace-nowrap">
                            <div className="flex flex-col items-center gap-1">
                              <span className={`font-mono text-xs font-bold ${
                                (w.compliance_score ?? 100) >= 80 
                                  ? 'text-emerald-700' 
                                  : (w.compliance_score ?? 100) >= 60 
                                  ? 'text-amber-700' 
                                  : 'text-rose-700'
                              }`}>
                                {Math.round(w.compliance_score ?? 100)} / 100
                              </span>
                              <div className="flex items-center gap-1 flex-wrap justify-center">
                                {w.is_negative_list_violation && (
                                  <span className="rounded bg-rose-600 text-white px-1.5 py-0.2 text-[9px] font-mono font-bold">
                                    Prohibited
                                  </span>
                                )}
                                {w.is_trust_society_work && (
                                  <span className="rounded bg-indigo-100 text-indigo-800 border border-indigo-200 px-1.5 py-0.2 text-[9px] font-mono font-semibold">
                                    Trust/Society
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-3.5 text-stone-600 max-w-[140px] truncate">{w.ida}</td>
                          <td className="py-3.5 text-right font-mono font-bold text-[#1C1917] whitespace-nowrap">
                            ₹{w.allocation_amount.toLocaleString()}
                          </td>
                          <td className="py-3.5 text-center whitespace-nowrap">
                            <span className="rounded-md border border-[#E5DFD3] bg-[#FAF7F2] px-2 py-0.5 text-[10px] font-mono font-medium text-stone-700">
                              {w.status}
                            </span>
                          </td>
                          <td className="py-3.5 text-center whitespace-nowrap">
                            <div className="flex flex-col items-center gap-1">
                              <RiskBadge score={w.overall_risk_score ?? w.risk_score} level={w.risk_level} size="sm" />
                              {w.investigation_priority && (
                                <PriorityBadge priority={w.investigation_priority} size="sm" />
                              )}
                            </div>
                          </td>
                        </>
                      )}
                      <td className="py-3.5 pr-4 text-center whitespace-nowrap">
                        <Link
                          href={`/works/${w.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#D9D2C5] bg-[#FFFDF9] px-2.5 py-1 text-xs font-bold text-stone-800 hover:bg-[#6E4529] hover:text-[#F5EBE1] hover:border-[#6E4529] transition-all shadow-2xs"
                        >
                          <span>Explain Trace</span>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Bar */}
          <div className="flex flex-wrap items-center justify-between border-t border-[#E5DFD3] bg-[#FAF7F2] px-4 py-3 text-xs text-stone-600 gap-3">
            <div className="font-mono">
              Showing <span className="font-bold text-[#1C1917]">{works.length}</span> of{" "}
              <span className="font-bold text-[#1C1917]">{total.toLocaleString()}</span> works
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex items-center gap-1 rounded-lg border border-[#D9D2C5] bg-[#FFFDF9] px-3 py-1.5 font-bold text-stone-700 hover:bg-[#F0ECE1] disabled:opacity-40 shadow-2xs cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              <span className="font-mono text-xs font-bold text-[#1C1917] px-1">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex items-center gap-1 rounded-lg border border-[#D9D2C5] bg-[#FFFDF9] px-3 py-1.5 font-bold text-stone-700 hover:bg-[#F0ECE1] disabled:opacity-40 shadow-2xs cursor-pointer"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </MagicCard>
      )}
    </div>
  );
}
