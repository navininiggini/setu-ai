"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Zap,
  RotateCcw,
  Sliders,
  Scale,
  Network,
  Banknote,
  FileCheck,
  Clock,
  Building2,
  ArrowLeft,
  Check,
  Info,
  Copy,
  Code2,
  ChevronDown,
  ChevronUp,
  Download,
  ShieldCheck,
  MapPin,
  Flame,
  AlertOctagon,
  Printer
} from "lucide-react";
import { scoreRawProposal } from "../../lib/api";
import { RawProposalScoringRequest, RawProposalScoringResponse } from "../../lib/types";
import { formatTypologyLabel } from "../../lib/typologies";
import { RiskBadge, PriorityBadge } from "../../components/ui/RiskBadge";
import { MagicCard } from "../../components/ui/MagicCard";
import { SpecularButton } from "../../components/ui/SpecularButton";
import { STATE_DISTRICTS, getDistrictsForState } from "../../lib/districts";

interface PresetScenario {
  id: string;
  name: string;
  badge: string;
  badgeColor: string;
  description: string;
  data: RawProposalScoringRequest;
}

const SAMPLE_PRESETS: PresetScenario[] = [
  {
    id: "preset-compliant",
    name: "Compliant Community Center",
    badge: "Routine Clearance",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
    description: "Standard competitive tender with verified PWD estimates and clean contractor record.",
    data: {
      work_name: "Construction of Multi-Purpose Community Hall",
      category: "Public Infrastructure",
      state: "Bihar",
      constituency: "Darbhanga",
      district: "Darbhanga",
      ida: "District Planning Authority",
      contractor_name: "Apex Infrastructure Ltd",
      sanctioned_amount: 2500000,
      estimated_cost: 2450000,
      tender_amount: 2450000,
      planned_duration_days: 180,
      work_type: "Civil Infrastructure",
      num_bidders: 4,
      is_single_bid: false,
      contractor_past_delays: 0,
      latitude: 26.1542,
      longitude: 85.8918,
    },
  },
  {
    id: "preset-structuring",
    name: "Threshold Structuring (₹4.92 Lakhs)",
    badge: "Smurfing Flag",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-300",
    description: "Sanction structured just below ₹5L statutory e-procurement threshold to bypass tender oversight.",
    data: {
      work_name: "Paver Block Pavement at Ward-04",
      category: "Roads & Bridges",
      state: "Bihar",
      constituency: "Darbhanga",
      district: "Darbhanga",
      ida: "District Rural Development Agency",
      contractor_name: "Chandra Civil Works",
      sanctioned_amount: 492000,
      estimated_cost: 490000,
      tender_amount: 492000,
      planned_duration_days: 90,
      work_type: "Paver Road",
      num_bidders: 2,
      is_single_bid: false,
      contractor_past_delays: 0,
      latitude: 26.148,
      longitude: 85.901,
    },
  },
  {
    id: "preset-cartel",
    name: "Single-Bid Cartel Procurement",
    badge: "Procurement Evasion",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
    description: "Sole bidder award with 2 prior recorded delays; triggers GFR anti-collusion review.",
    data: {
      work_name: "Solar High-Mast Lighting Tower Installation",
      category: "Electricity & Lighting",
      state: "Uttar Pradesh",
      constituency: "Varanasi",
      district: "Varanasi",
      ida: "Varanasi Smart City Authority",
      contractor_name: "Surya Urja Consortium",
      sanctioned_amount: 3850000,
      estimated_cost: 3100000,
      tender_amount: 3850000,
      planned_duration_days: 120,
      work_type: "Solar Installation",
      num_bidders: 1,
      is_single_bid: true,
      contractor_past_delays: 2,
      latitude: 25.3176,
      longitude: 82.9739,
    },
  },
  {
    id: "preset-escalation",
    name: "High Cost Escalation + Repeat Delays",
    badge: "Multi-Signal Flag",
    badgeColor: "bg-rose-100 text-rose-800 border-rose-300",
    description: "102% cost inflation over technical estimate with 4 contractor project delays.",
    data: {
      work_name: "RCC Bridge across Irrigation Canal at Belaur",
      category: "Roads & Bridges",
      state: "Bihar",
      constituency: "Darbhanga",
      district: "Darbhanga",
      ida: "District Planning Authority",
      contractor_name: "Mithila Construction Pvt Ltd",
      sanctioned_amount: 8500000,
      estimated_cost: 4200000,
      tender_amount: 8500000,
      planned_duration_days: 360,
      work_type: "Bridge Work",
      num_bidders: 2,
      is_single_bid: false,
      contractor_past_delays: 4,
      latitude: 26.17,
      longitude: 85.92,
    },
  },
  {
    id: "preset-geo-anomaly",
    name: "Remote Geo-Anomaly Borewell",
    badge: "Spatial Outlier",
    badgeColor: "bg-sky-100 text-sky-800 border-sky-300",
    description: "Isolated desert installation coordinates with extreme density outlier characteristics.",
    data: {
      work_name: "Deep Tube Well with Solar Submersible Pump",
      category: "Drinking Water",
      state: "Rajasthan",
      constituency: "Barmer",
      district: "Barmer",
      ida: "Public Health Engineering Department",
      contractor_name: "Thar Desert Aqua Works",
      sanctioned_amount: 1800000,
      estimated_cost: 1750000,
      tender_amount: 1800000,
      planned_duration_days: 60,
      work_type: "Water Supply",
      num_bidders: 3,
      is_single_bid: false,
      contractor_past_delays: 0,
      latitude: 25.7532,
      longitude: 71.3966,
    },
  },
  {
    id: "preset-unverified",
    name: "Unverified High-Value Sanction",
    badge: "Unverified PWD Benchmark",
    badgeColor: "bg-orange-100 text-orange-800 border-orange-300",
    description: "Large ₹4.80 Cr sanction submitted without technical estimate or Schedule of Rates verification.",
    data: {
      work_name: "District Stadium Sports Complex Phase II",
      category: "Public Infrastructure",
      state: "Tamil Nadu",
      constituency: "Madurai",
      district: "Madurai",
      ida: "Sports Development Authority",
      contractor_name: "Southern Infra Consortium",
      sanctioned_amount: 48000000,
      estimated_cost: 0,
      tender_amount: 48000000,
      planned_duration_days: 720,
      work_type: "Civil Construction",
      num_bidders: 2,
      is_single_bid: false,
      contractor_past_delays: 1,
      latitude: 9.9252,
      longitude: 78.1198,
    },
  },
];

export default function ProposalsPage() {
  const [formData, setFormData] = useState<RawProposalScoringRequest>(SAMPLE_PRESETS[0].data);
  const [activePresetId, setActivePresetId] = useState<string>(SAMPLE_PRESETS[0].id);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RawProposalScoringResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showJsonInspector, setShowJsonInspector] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const availableDistricts = useMemo(() => {
    return getDistrictsForState(formData.state || "Bihar");
  }, [formData.state]);

  const handlePresetSelect = (preset: PresetScenario) => {
    setFormData({ ...preset.data });
    setActivePresetId(preset.id);
    setError(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setActivePresetId(""); // Mark as custom if user edits
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (type === "number") {
      setFormData((prev) => ({ ...prev, [name]: value === "" ? "" : Number(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleReset = () => {
    setFormData({ ...SAMPLE_PRESETS[0].data });
    setActivePresetId(SAMPLE_PRESETS[0].id);
    setResult(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Sanitize and ensure numerical values are safely typed for backend
    const sanitizedPayload: RawProposalScoringRequest = {
      work_name: formData.work_name || "Proposed Infrastructure Project",
      category: formData.category || "Public Infrastructure",
      state: formData.state || "Bihar",
      constituency: formData.constituency || "Darbhanga",
      district: formData.district || formData.constituency || "Darbhanga",
      ida: formData.ida || "District Planning Authority",
      contractor_name: formData.contractor_name || "Apex Infrastructure Ltd",
      sanctioned_amount: formData.sanctioned_amount ? Number(formData.sanctioned_amount) : 2500000,
      estimated_cost: formData.estimated_cost !== undefined && formData.estimated_cost !== ("" as any) ? Number(formData.estimated_cost) : undefined,
      tender_amount: formData.tender_amount !== undefined && formData.tender_amount !== ("" as any) ? Number(formData.tender_amount) : undefined,
      planned_duration_days: formData.planned_duration_days ? Number(formData.planned_duration_days) : 180,
      work_type: formData.work_type || "Civil Infrastructure",
      num_bidders: formData.num_bidders ? Number(formData.num_bidders) : 3,
      is_single_bid: Boolean(formData.is_single_bid),
      contractor_past_delays: formData.contractor_past_delays !== undefined && formData.contractor_past_delays !== ("" as any) ? Number(formData.contractor_past_delays) : 0,
      latitude: formData.latitude !== undefined && formData.latitude !== ("" as any) ? Number(formData.latitude) : 26.1542,
      longitude: formData.longitude !== undefined && formData.longitude !== ("" as any) ? Number(formData.longitude) : 85.8918,
    };

    try {
      const res = await scoreRawProposal(sanitizedPayload);
      setResult(res);
    } catch (err: any) {
      console.error("Proposal scoring failed:", err);
      setError(err.message || "Proposal evaluation failed. Check backend connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyJson = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Banner */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#E5DFD3] pb-5 pt-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-[#6E4529] px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#F5EBE1]">
              Pre-Sanction AI Gate • Feed Project Plan
            </span>
            <span className="text-xs text-stone-500 font-mono flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              8-Model ML Inference Active (&lt; 200ms)
            </span>
          </div>
          <h1 className="mt-1.5 text-2xl font-editorial font-bold text-[#1C1917] sm:text-3xl tracking-tight">
            Feed Project Plan & Live Risk Scorer
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-stone-600 max-w-3xl">
            Simulate real-time forensic risk scoring on new or proposed MPLADS developmental plans. Evaluates across Models 1–7 (Unsupervised Domain Isolation Forests) and Model 8 (Calibrated XGBoost Supervised Fraud Classifier) before financial sanction.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#D9D2C5] bg-[#FFFDF9] px-3.5 py-2 text-xs font-bold text-[#6E4529] hover:bg-white transition-all shadow-2xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Command Center</span>
          </Link>
        </div>
      </div>

      {/* Quick Test Scenario Presets */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#8C5D3B] flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
            Quick Test Scenario Presets (Click to Load &amp; Score):
          </span>
          <span className="text-[11px] font-mono text-stone-500">
            Select a curated edge case or enter custom parameters below
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {SAMPLE_PRESETS.map((p) => {
            const isSelected = activePresetId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePresetSelect(p)}
                className={`text-left rounded-xl border p-3 shadow-2xs transition-all cursor-pointer group relative ${
                  isSelected
                    ? "border-[#6E4529] bg-[#FAF3E9] ring-1 ring-[#6E4529]"
                    : "border-[#E5DFD3] bg-[#FFFDF9] hover:border-[#6E4529] hover:bg-[#FAF7F2]"
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${p.badgeColor}`}>
                    {p.badge}
                  </span>
                  {isSelected && (
                    <span className="text-[10px] font-mono font-bold text-[#6E4529] flex items-center gap-0.5 bg-amber-100/80 px-1.5 py-0.5 rounded">
                      <Check className="h-3 w-3" /> Active
                    </span>
                  )}
                </div>
                <p className="text-xs font-bold text-[#1C1917] group-hover:text-[#6E4529] transition-colors leading-tight">
                  {p.name}
                </p>
                <p className="text-[11px] text-stone-500 font-mono mt-0.5">
                  ₹{p.data.sanctioned_amount.toLocaleString("en-IN")} • {p.data.constituency}
                </p>
                <p className="text-[10px] text-stone-600 mt-1 line-clamp-1">
                  {p.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Proposal Input Form */}
        <MagicCard
          glowColor="245, 158, 11"
          enableBorderGlow={true}
          enableTilt={false}
          className="lg:col-span-6 rounded-xl border border-[#E5DFD3] bg-[#FFFDF9] p-5 shadow-xs space-y-4"
        >
          <div className="flex items-center justify-between border-b border-[#E5DFD3] pb-3">
            <div>
              <h3 className="text-base font-editorial font-bold text-[#1C1917] flex items-center gap-2">
                <Sliders className="h-4 w-4 text-[#6E4529]" />
                Proposal Parameters &amp; Attributes
              </h3>
              <p className="text-xs text-stone-500 font-sans">
                Supports any custom values, boundary tests, or preset configurations
              </p>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="text-xs font-mono text-stone-500 hover:text-stone-800 flex items-center gap-1 cursor-pointer bg-stone-100 hover:bg-stone-200 px-2 py-1 rounded transition-colors"
            >
              <RotateCcw className="h-3 w-3" /> Reset Default
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 font-mono uppercase mb-1">
                Work Proposal Title *
              </label>
              <input
                type="text"
                name="work_name"
                required
                value={formData.work_name}
                onChange={handleInputChange}
                placeholder="e.g. Construction of Community Center"
                className="w-full rounded-lg border border-[#D9D2C5] bg-[#FAF7F2] px-3 py-2 text-xs text-[#1C1917] focus:border-[#6E4529] focus:outline-none focus:ring-1 focus:ring-[#6E4529] font-sans"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 font-mono uppercase mb-1">
                  Sector Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-[#D9D2C5] bg-[#FAF7F2] px-3 py-2 text-xs text-[#1C1917] focus:border-[#6E4529] focus:outline-none"
                >
                  <option value="Public Infrastructure">Public Infrastructure</option>
                  <option value="Roads & Bridges">Roads & Bridges</option>
                  <option value="Drinking Water">Drinking Water</option>
                  <option value="Education">Education</option>
                  <option value="Health & Sanitation">Health & Sanitation</option>
                  <option value="Electricity & Lighting">Electricity & Lighting</option>
                  <option value="Irrigation">Irrigation</option>
                  <option value="Community Infrastructure">Community Infrastructure</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 font-mono uppercase mb-1">
                  Requested Sanction (INR) *
                </label>
                <input
                  type="number"
                  name="sanctioned_amount"
                  required
                  min={0}
                  value={formData.sanctioned_amount !== undefined ? formData.sanctioned_amount : ""}
                  onChange={handleInputChange}
                  placeholder="₹ 2,500,000"
                  className="w-full rounded-lg border border-[#D9D2C5] bg-[#FAF7F2] px-3 py-2 text-xs text-[#1C1917] font-mono font-bold focus:border-[#6E4529] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 font-mono uppercase mb-1">
                  State *
                </label>
                <input
                  list="state-datalist"
                  type="text"
                  name="state"
                  required
                  value={formData.state}
                  onChange={(e) => {
                    handleInputChange(e);
                    const stateDistricts = getDistrictsForState(e.target.value);
                    if (stateDistricts && stateDistricts.length > 0) {
                      setFormData((prev) => ({
                        ...prev,
                        district: stateDistricts[0],
                        constituency: stateDistricts[0],
                      }));
                    }
                  }}
                  placeholder="e.g. Bihar"
                  className="w-full rounded-lg border border-[#D9D2C5] bg-[#FAF7F2] px-3 py-2 text-xs text-[#1C1917]"
                />
                <datalist id="state-datalist">
                  {Object.keys(STATE_DISTRICTS).map((st) => (
                    <option key={st} value={st} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 font-mono uppercase mb-1">
                  District *
                </label>
                <input
                  list="district-datalist"
                  type="text"
                  name="district"
                  required
                  value={formData.district || ""}
                  onChange={(e) => {
                    handleInputChange(e);
                    setFormData((prev) => ({ ...prev, constituency: e.target.value }));
                  }}
                  placeholder="e.g. Darbhanga"
                  className="w-full rounded-lg border border-[#D9D2C5] bg-[#FAF7F2] px-3 py-2 text-xs text-[#1C1917]"
                />
                <datalist id="district-datalist">
                  {availableDistricts.map((dst) => (
                    <option key={dst} value={dst} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 font-mono uppercase mb-1">
                  Constituency *
                </label>
                <input
                  type="text"
                  name="constituency"
                  required
                  value={formData.constituency}
                  onChange={handleInputChange}
                  placeholder="e.g. Darbhanga"
                  className="w-full rounded-lg border border-[#D9D2C5] bg-[#FAF7F2] px-3 py-2 text-xs text-[#1C1917]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 font-mono uppercase mb-1">
                  Implementing Agency (IDA)
                </label>
                <input
                  type="text"
                  name="ida"
                  value={formData.ida || ""}
                  onChange={handleInputChange}
                  placeholder="e.g. District Planning Authority"
                  className="w-full rounded-lg border border-[#D9D2C5] bg-[#FAF7F2] px-3 py-2 text-xs text-[#1C1917]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 font-mono uppercase mb-1">
                  Proposed Contractor
                </label>
                <input
                  type="text"
                  name="contractor_name"
                  value={formData.contractor_name || ""}
                  onChange={handleInputChange}
                  placeholder="e.g. Apex Infrastructure Ltd"
                  className="w-full rounded-lg border border-[#D9D2C5] bg-[#FAF7F2] px-3 py-2 text-xs text-[#1C1917]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 font-mono uppercase mb-1">
                  Technical Cost Estimate
                </label>
                <input
                  type="number"
                  name="estimated_cost"
                  min={0}
                  value={formData.estimated_cost !== undefined ? formData.estimated_cost : ""}
                  onChange={handleInputChange}
                  placeholder="Leave blank for unverified"
                  className="w-full rounded-lg border border-[#D9D2C5] bg-[#FAF7F2] px-3 py-2 text-xs text-[#1C1917] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 font-mono uppercase mb-1">
                  Tender Contract Value
                </label>
                <input
                  type="number"
                  name="tender_amount"
                  min={0}
                  value={formData.tender_amount !== undefined ? formData.tender_amount : ""}
                  onChange={handleInputChange}
                  placeholder="Tender amount"
                  className="w-full rounded-lg border border-[#D9D2C5] bg-[#FAF7F2] px-3 py-2 text-xs text-[#1C1917] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 font-mono uppercase mb-1">
                  Planned Days
                </label>
                <input
                  type="number"
                  name="planned_duration_days"
                  min={1}
                  max={3650}
                  value={formData.planned_duration_days !== undefined ? formData.planned_duration_days : 180}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-[#D9D2C5] bg-[#FAF7F2] px-3 py-2 text-xs text-[#1C1917] font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center pt-1">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 font-mono uppercase mb-1">
                  Number of Bidders
                </label>
                <input
                  type="number"
                  name="num_bidders"
                  min={1}
                  value={formData.num_bidders !== undefined ? formData.num_bidders : 3}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-[#D9D2C5] bg-[#FAF7F2] px-3 py-1.5 text-xs text-[#1C1917] font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 font-mono uppercase mb-1">
                  Contractor Past Delays
                </label>
                <input
                  type="number"
                  name="contractor_past_delays"
                  min={0}
                  value={formData.contractor_past_delays !== undefined ? formData.contractor_past_delays : 0}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-[#D9D2C5] bg-[#FAF7F2] px-3 py-1.5 text-xs text-[#1C1917] font-mono"
                />
              </div>

              <div className="pt-4">
                <label className="flex items-center gap-2 text-xs font-bold text-stone-800 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_single_bid"
                    checked={formData.is_single_bid || false}
                    onChange={handleInputChange}
                    className="h-4 w-4 rounded border-stone-300 text-[#6E4529] focus:ring-[#6E4529]"
                  />
                  <span>Single-Bid Tender Only</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[10px] font-bold text-stone-500 font-mono uppercase mb-0.5">
                  Latitude
                </label>
                <input
                  type="number"
                  step="0.0001"
                  name="latitude"
                  value={formData.latitude !== undefined ? formData.latitude : 26.1542}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-[#D9D2C5] bg-[#FAF7F2] px-2 py-1 text-xs text-[#1C1917] font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-stone-500 font-mono uppercase mb-0.5">
                  Longitude
                </label>
                <input
                  type="number"
                  step="0.0001"
                  name="longitude"
                  value={formData.longitude !== undefined ? formData.longitude : 85.8918}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-[#D9D2C5] bg-[#FAF7F2] px-2 py-1 text-xs text-[#1C1917] font-mono"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[#E5DFD3] flex items-center justify-between">
              <span className="text-[11px] text-stone-500 font-mono flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                Live in-memory scoring active
              </span>
              <SpecularButton
                type="submit"
                disabled={loading}
                variant="amber"
                size="md"
              >
                <Zap className="h-4 w-4" />
                <span>{loading ? "Evaluating Across 8 Models..." : "Evaluate Proposal Now"}</span>
              </SpecularButton>
            </div>
          </form>
        </MagicCard>

        {/* Live Evaluation Results Panel */}
        <div className="lg:col-span-6 space-y-4">
          {error && (
            <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-xs text-rose-800 space-y-1.5 shadow-xs">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                <span>Inference Communication Error</span>
              </div>
              <p className="font-mono text-[11px]">{error}</p>
              <p className="text-[10px] text-stone-600 mt-1">
                Ensure the FastAPI backend is running on <code>http://127.0.0.1:8001</code>.
              </p>
            </div>
          )}

          {result ? (
            <div className="space-y-4">
              <MagicCard
                glowColor={
                  result.overall_risk_score >= 60
                    ? "239, 68, 68"
                    : result.overall_risk_score >= 40
                    ? "245, 158, 11"
                    : "16, 185, 129"
                }
                enableBorderGlow={true}
                enableTilt={false}
                className="rounded-xl border border-[#E5DFD3] bg-[#FFFDF9] p-5 shadow-xs space-y-4"
              >
                {/* Result Header & Actions */}
                <div className="border-b border-[#E5DFD3] pb-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-bold text-stone-600 uppercase">
                        Proposal #{result.proposal_id}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyId(result.proposal_id)}
                        className="text-[10px] text-stone-400 hover:text-stone-700 flex items-center gap-0.5"
                        title="Copy proposal ID"
                      >
                        {copiedId ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {result.inference_time_ms !== undefined && (
                        <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded flex items-center gap-1">
                          <Zap className="h-3 w-3 text-emerald-600" />
                          {result.inference_time_ms.toFixed(1)} ms
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="text-stone-400 hover:text-stone-700 p-1 rounded"
                        title="Print / Save Dossier"
                      >
                        <Printer className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Recommendation Banner */}
                  <div
                    className={`rounded-lg p-3.5 border flex items-start gap-3 transition-all ${
                      result.approval_recommendation === "AUTOMATIC_CLEARANCE"
                        ? "bg-emerald-50/90 border-emerald-300 text-emerald-950"
                        : result.approval_recommendation === "CONDITIONAL_APPROVAL"
                        ? "bg-amber-50/90 border-amber-300 text-amber-950"
                        : result.approval_recommendation === "MANDATORY_TECHNICAL_AUDIT"
                        ? "bg-orange-50/90 border-orange-300 text-orange-950"
                        : "bg-rose-50/90 border-rose-300 text-rose-950"
                    }`}
                  >
                    {result.approval_recommendation === "AUTOMATIC_CLEARANCE" ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : result.approval_recommendation === "CONDITIONAL_APPROVAL" ? (
                      <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    ) : result.approval_recommendation === "MANDATORY_TECHNICAL_AUDIT" ? (
                      <AlertTriangle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                    ) : (
                      <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider font-mono">
                        {result.approval_recommendation.replace(/_/g, " ")}
                      </h4>
                      <p className="text-[11px] font-sans leading-relaxed mt-1">
                        {result.approval_recommendation === "AUTOMATIC_CLEARANCE"
                          ? "Low anomaly profile across all 7 domain filters. Proposal cleared for statutory administrative approval and normal fund sanction."
                          : result.approval_recommendation === "CONDITIONAL_APPROVAL"
                          ? "Moderate risk signals observed. Administrative sanction conditional upon milestone-based tranche releases and enhanced monitoring."
                          : result.approval_recommendation === "MANDATORY_TECHNICAL_AUDIT"
                          ? "Elevated multi-domain risk indicators detected. Mandatory pre-sanction site verification and Schedule of Rates audit required before funds are disbursed."
                          : "Critical multi-signal anomaly profile and elevated fraud probability. Fund release halted immediately pending institutional vigilance inquiry."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Structured KPI Metric Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="rounded-lg border border-[#E5DFD3] bg-[#FAF7F2] p-2.5">
                    <span className="text-[10px] text-stone-500 font-mono block">Overall Risk</span>
                    <span className={`text-xl font-black font-mono block ${
                      result.overall_risk_score >= 60 ? "text-rose-700" : result.overall_risk_score >= 40 ? "text-amber-700" : "text-emerald-700"
                    }`}>
                      {result.overall_risk_score.toFixed(1)}
                    </span>
                  </div>

                  <div className="rounded-lg border border-[#E5DFD3] bg-[#FAF7F2] p-2.5">
                    <span className="text-[10px] text-stone-500 font-mono block">Risk Tier</span>
                    <div className="mt-1">
                      <RiskBadge score={result.overall_risk_score} level={result.risk_level} size="sm" />
                    </div>
                  </div>

                  <div className="rounded-lg border border-[#E5DFD3] bg-[#FAF7F2] p-2.5">
                    <span className="text-[10px] text-stone-500 font-mono block">Priority</span>
                    <div className="mt-1">
                      <PriorityBadge priority={result.investigation_priority} size="sm" />
                    </div>
                  </div>

                  <div className="rounded-lg border border-[#E5DFD3] bg-[#FAF7F2] p-2.5">
                    <span className="text-[10px] text-stone-500 font-mono block">ML Fraud Prob</span>
                    <span className="text-xl font-black font-mono text-rose-700 block">
                      {(result.fraud_probability * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Typology Badge */}
                <div className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-[#FAF7F2] border border-[#E5DFD3]">
                  <span className="text-stone-600 font-medium text-[11px] font-mono">Predicted Anomaly Archetype:</span>
                  <span className="rounded bg-white border border-[#D9D2C5] px-2.5 py-0.5 font-mono font-bold text-xs text-[#6E4529]">
                    {formatTypologyLabel(result.primary_typology)}
                  </span>
                </div>

                {/* 8 Domain Anomaly Breakdown */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-700 uppercase font-mono tracking-wider">
                      8-Model Domain Anomaly Breakdown (0–100)
                    </span>
                    <span className="text-[10px] font-mono text-stone-500">
                      Lower is Safer
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    {[
                      { code: "M1", name: "Financial Anomaly", score: result.sub_scores?.financial || 0 },
                      { code: "M2", name: "Geospatial Anomaly", score: result.sub_scores?.geospatial || 0 },
                      { code: "M3", name: "Procurement Anomaly", score: result.sub_scores?.procurement || 0 },
                      { code: "M4", name: "Contractor Anomaly", score: result.sub_scores?.contractor || 0 },
                      { code: "M5", name: "Payment Anomaly", score: result.sub_scores?.payment || 0 },
                      { code: "M6", name: "Progress Anomaly", score: result.sub_scores?.progress || 0 },
                      { code: "M7", name: "Graph Network", score: result.sub_scores?.graph || 0 },
                      { code: "M8", name: "Supervised ML Fraud", score: result.sub_scores?.ml_fraud_probability || 0 },
                    ].map((d) => {
                      const isHigh = d.score >= 60;
                      const isMedium = d.score >= 35 && d.score < 60;
                      const barColor = isHigh ? "#ef4444" : isMedium ? "#f59e0b" : "#10b981";
                      const statusText = isHigh ? "High" : isMedium ? "Suspicious" : "Normal";
                      const statusClass = isHigh
                        ? "text-rose-700 bg-rose-50 border-rose-200"
                        : isMedium
                        ? "text-amber-700 bg-amber-50 border-amber-200"
                        : "text-emerald-700 bg-emerald-50 border-emerald-200";

                      return (
                        <div key={d.code} className="flex items-center justify-between gap-2.5">
                          <span className="font-mono text-[10px] text-stone-500 w-6">{d.code}</span>
                          <span className="text-[11px] text-stone-700 w-36 truncate font-medium">{d.name}</span>
                          <div className="flex-1 h-2 rounded-full bg-stone-200 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.min(100, Math.max(4, d.score))}%`,
                                backgroundColor: barColor,
                              }}
                            />
                          </div>
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${statusClass}`}>
                            {statusText}
                          </span>
                          <span className="font-mono text-[11px] font-bold text-[#1C1917] w-8 text-right font-tabular">
                            {d.score.toFixed(0)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Primary Root Cause & Evidence Traces */}
                <div className="space-y-2 pt-1 border-t border-[#E5DFD3]">
                  <span className="text-xs font-bold text-stone-700 uppercase font-mono tracking-wider block">
                    Forensic Evidence &amp; Root Cause Analysis
                  </span>

                  {result.primary_reason && (
                    <div className="rounded-lg border border-amber-300/80 bg-amber-50/70 p-2.5 text-xs text-amber-950 space-y-1">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-800 block">
                        Primary Anomaly Driver:
                      </span>
                      <p className="text-[11px] font-sans leading-relaxed">{result.primary_reason}</p>
                    </div>
                  )}

                  {result.secondary_reason && (
                    <div className="rounded-lg border border-stone-200 bg-[#FAF7F2] p-2.5 text-xs text-stone-800 space-y-1">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-600 block">
                        Secondary Contributing Signal:
                      </span>
                      <p className="text-[11px] font-sans leading-relaxed">{result.secondary_reason}</p>
                    </div>
                  )}

                  {result.synthesized_reasons && result.synthesized_reasons.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono font-bold text-stone-500 uppercase block">
                        Synthesized Evidence Traces:
                      </span>
                      <ul className="space-y-1 text-xs">
                        {result.synthesized_reasons.map((r, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-1.5 bg-[#FAF7F2] p-2 rounded border border-[#E5DFD3] text-[11px] text-stone-800 leading-snug"
                          >
                            <span className="text-[#6E4529] font-bold font-mono shrink-0">•</span>
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Backend Response Inspector Accordion */}
                <div className="border-t border-[#E5DFD3] pt-3">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setShowJsonInspector((prev) => !prev)}
                      className="text-xs font-mono font-bold text-[#6E4529] hover:text-[#4A2D1B] flex items-center gap-1.5 cursor-pointer py-1"
                    >
                      <Code2 className="h-3.5 w-3.5" />
                      <span>{showJsonInspector ? "Hide Live Backend Response Payload" : "Inspect Live Backend Response Payload"}</span>
                      {showJsonInspector ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyJson}
                      className="text-[11px] font-mono text-stone-500 hover:text-stone-800 flex items-center gap-1 bg-stone-100 hover:bg-stone-200 px-2 py-1 rounded transition-colors cursor-pointer"
                    >
                      {copiedJson ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-600" />
                          <span className="text-emerald-700 font-bold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy JSON</span>
                        </>
                      )}
                    </button>
                  </div>

                  {showJsonInspector && (
                    <div className="mt-2 rounded-lg border border-stone-800 bg-[#1E1E1E] p-3 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-72">
                      <pre>{JSON.stringify(result, null, 2)}</pre>
                    </div>
                  )}
                </div>
              </MagicCard>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[#D9D2C5] bg-[#FAF7F2]/60 p-10 text-center space-y-3">
              <Zap className="h-10 w-10 text-stone-400 mx-auto" />
              <div>
                <h4 className="text-sm font-bold text-stone-700 font-editorial">
                  Inference Results Waiting
                </h4>
                <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                  Click &quot;Evaluate Proposal Now&quot; on the left or select any scenario preset above to run real-time multi-model evaluation.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
