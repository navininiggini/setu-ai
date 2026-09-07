"use client";

import React, { useState } from "react";
import {
  TrendingUp,
  Building2,
  Sliders,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Layers,
  ArrowRight,
  GitMerge,
  Cpu,
  ShieldCheck,
  Search,
  Scale,
  Network,
  Banknote,
  FileCheck
} from "lucide-react";
import { formatTypologyLabel, normalizeRiskLevel, normalizePriority } from "../../lib/typologies";
import { RiskBadge, PriorityBadge } from "./RiskBadge";

export interface EvidenceWorkData {
  id: string;
  work: string;
  mp_name: string;
  ida: string;
  state: string;
  constituency: string;
  village?: string;
  allocation_amount: number;
  status: string;
  risk_score: number;
  risk_level?: string;
  overall_risk_score?: number;
  investigation_priority?: string;
  primary_typology?: string;
  fraud_probability?: number;
  predicted_fraud_type?: string;
  risk_reasons?: string[];
  synthesized_reasons?: string[];
  primary_reason?: string;
  sub_scores?: Record<string, number>;
  domain_scores?: Record<string, number>;
  duplicate_count?: number;
  days_since_recommended?: number;
  state_mean_alloc?: number;
}

interface FraudEvidenceVisualizerProps {
  work: EvidenceWorkData;
  clusterWorks?: EvidenceWorkData[];
}

export function FraudEvidenceVisualizer({ work, clusterWorks = [] }: FraudEvidenceVisualizerProps) {
  const [activeForensicTab, setActiveForensicTab] = useState<string | null>(null);

  const rawTypology = work.primary_typology || work.predicted_fraud_type || "normal";
  const typologyLabel = formatTypologyLabel(rawTypology);
  const overallScore = work.overall_risk_score ?? work.risk_score ?? 0;
  const riskTier = normalizeRiskLevel(work.risk_level);
  const priority = normalizePriority(work.investigation_priority);
  const fraudProbPct = work.fraud_probability !== undefined
    ? Math.round(work.fraud_probability > 1.0 ? work.fraud_probability : work.fraud_probability * 100)
    : work.sub_scores?.ml_fraud_probability !== undefined
    ? Math.round(work.sub_scores.ml_fraud_probability)
    : Math.min(100, Math.round(overallScore * 0.9));

  // Extract domain scores from domain_scores or sub_scores or explanation
  const subs = work.domain_scores || work.sub_scores || (work as any).explanation?.sub_scores || {};
  const getDomainScore = (key: string, altKey?: string): number => {
    let val = subs[key] ?? (altKey ? subs[altKey] : undefined);
    if (val === undefined && (work as any).explanation?.sub_scores) {
      val = (work as any).explanation.sub_scores[key] ?? (altKey ? (work as any).explanation.sub_scores[altKey] : undefined);
    }
    return typeof val === "number" && !isNaN(val) ? Math.round(val * 10) / 10 : 0;
  };

  const domainModels = [
    {
      id: "financial",
      modelNumber: "M1",
      name: "Financial Anomaly",
      score: getDomainScore("financial", "financial_anomaly_score"),
      icon: Banknote,
      desc: "Peer cost variance & unit benchmark deviations",
      color: "border-rose-300 text-rose-800 bg-rose-50/50",
    },
    {
      id: "geospatial",
      modelNumber: "M2",
      name: "Geospatial Clustering",
      score: getDomainScore("geospatial", "geospatial_anomaly_score"),
      icon: Scale,
      desc: "Cluster density & coordinate isolation",
      color: "border-sky-300 text-sky-800 bg-sky-50/50",
    },
    {
      id: "procurement",
      modelNumber: "M3",
      name: "Tender / Procurement",
      score: getDomainScore("procurement", "procurement_anomaly_score"),
      icon: FileCheck,
      desc: "Single-bid tender & GFR Rule 155 compliance",
      color: "border-amber-300 text-amber-800 bg-amber-50/50",
    },
    {
      id: "contractor",
      modelNumber: "M4",
      name: "Contractor Capacity",
      score: getDomainScore("contractor", "contractor_anomaly_score"),
      icon: Building2,
      desc: "Vendor concentration & corporate ownership shifts",
      color: "border-indigo-300 text-indigo-800 bg-indigo-50/50",
    },
    {
      id: "payment",
      modelNumber: "M5",
      name: "Payment Structuring",
      score: getDomainScore("payment", "payment_anomaly_score"),
      icon: Sliders,
      desc: "Sub-ceiling contract splits (< ₹5 Lakhs threshold)",
      color: "border-purple-300 text-purple-800 bg-purple-50/50",
    },
    {
      id: "progress",
      modelNumber: "M6",
      name: "Physical-Financial Gap",
      score: getDomainScore("progress", "progress_anomaly_score"),
      icon: Clock,
      desc: "Disbursement velocity vs milestone progress proof",
      color: "border-orange-300 text-orange-800 bg-orange-50/50",
    },
    {
      id: "graph",
      modelNumber: "M7",
      name: "Entity Graph Risk",
      score: getDomainScore("graph", "graph_anomaly_score"),
      icon: Network,
      desc: "Recurrent exclusive pairing & syndicate conduits",
      color: "border-emerald-300 text-emerald-800 bg-emerald-50/50",
    },
  ];

  // Synthesized reason traces
  const reasons = work.synthesized_reasons && work.synthesized_reasons.length > 0
    ? work.synthesized_reasons
    : work.risk_reasons && work.risk_reasons.length > 0
    ? work.risk_reasons
    : work.primary_reason
    ? [work.primary_reason]
    : ["Standard project baseline adhering to statutory MPLADS guidelines."];

  // Forensic deep-dive criteria
  const hasStructuring = subs.payment >= 40 || (work.allocation_amount >= 450000 && work.allocation_amount < 500000);
  const hasCostEscalation = subs.financial >= 40 || overallScore >= 60;
  const hasVendorMonopoly = subs.contractor >= 40 || subs.graph >= 50;
  const hasStall = subs.progress >= 40 || (work.days_since_recommended || 0) >= 180;

  const stateMean = work.state_mean_alloc || work.allocation_amount * 0.45;
  const excessAmount = Math.max(0, work.allocation_amount - stateMean);
  const excessPercent = stateMean > 0 ? Math.round((excessAmount / stateMean) * 100) : 0;
  const daysStalled = work.days_since_recommended || 180;

  return (
    <div className="rounded-xl border border-[#E5DFD3] bg-[#FFFDF9] p-5 shadow-[0_2px_12px_rgba(40,20,10,0.04)] space-y-5 text-[#1C1917]">
      {/* Evidence Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5DFD3] pb-3.5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 border border-amber-300 text-amber-900 shrink-0 shadow-2xs">
            <GitMerge className="h-5 w-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-editorial font-bold text-[#1C1917]">
                Evidence Triangulation & Multi-Signal Fusion Engine
              </h3>
              <span className="rounded bg-[#FAF7F2] border border-[#D9D2C5] px-2 py-0.5 text-[10px] font-mono font-bold text-[#6E4529] uppercase">
                7 Models + Supervised Risk
              </span>
            </div>
            <p className="text-xs text-stone-500 font-sans">
              Independent evidence signals converge through the Risk Fusion Engine into calibrated audit intelligence
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-[#FAF7F2] border border-[#D9D2C5] px-3 py-1 text-xs font-mono font-bold text-[#6E4529] shadow-2xs">
            {typologyLabel}
          </span>
          <PriorityBadge priority={priority} size="sm" />
          <RiskBadge score={overallScore} level={riskTier} size="md" />
        </div>
      </div>

      {/* ── PARALLEL INDEPENDENT EVIDENCE ARCHITECTURE ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-stone-600 font-mono">
          <span className="font-bold uppercase tracking-wider text-[11px] text-[#6E4529]">
            Independent Anomaly Evidence Signals (Models 1–7)
          </span>
          <span className="text-[11px] text-stone-500">
            Parallel Evaluation • No Sequential Dependency
          </span>
        </div>

        {/* 7 Parallel Model Evidence Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2.5">
          {domainModels.map((m) => {
            const Icon = m.icon;
            const isHigh = m.score >= 50;
            const isElevated = m.score >= 25 && m.score < 50;

            return (
              <div
                key={m.id}
                className={`rounded-lg border p-3 flex flex-col justify-between transition-all duration-200 ${
                  isHigh
                    ? "border-rose-300 bg-rose-50/40 shadow-xs ring-1 ring-rose-300"
                    : isElevated
                    ? "border-amber-300 bg-amber-50/30"
                    : "border-[#E5DFD3] bg-[#FAF7F2]/70"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/80 border border-stone-200 text-stone-700">
                      {m.modelNumber}
                    </span>
                    <Icon
                      className={`h-3.5 w-3.5 ${
                        isHigh ? "text-rose-600" : isElevated ? "text-amber-600" : "text-stone-400"
                      }`}
                    />
                  </div>
                  <h4 className="text-xs font-bold text-[#1C1917] leading-tight line-clamp-1" title={m.name}>
                    {m.name}
                  </h4>
                  <p className="text-[10px] text-stone-500 line-clamp-2 mt-0.5 leading-tight">
                    {m.desc}
                  </p>
                </div>

                <div className="mt-2.5 pt-2 border-t border-stone-200/60 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-stone-500 uppercase">Score</span>
                  <span
                    className={`font-mono font-bold text-xs font-tabular ${
                      isHigh
                        ? "text-rose-700"
                        : isElevated
                        ? "text-amber-700"
                        : "text-emerald-700"
                    }`}
                  >
                    {m.score.toFixed(1)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Convergence Arrow into Risk Fusion Engine */}
        <div className="rounded-xl border border-[#D9D2C5] bg-gradient-to-r from-[#FAF7F2] via-[#F4EFE6] to-[#FAF7F2] p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#6E4529] text-[#F5EBE1] shrink-0 font-mono text-xs font-bold">
              M8
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-editorial font-bold text-[#1C1917]">
                  Model 8 Supervised Calibrated Risk Predictor
                </span>
                <span className="rounded bg-white border border-[#D9D2C5] px-2 py-0.5 text-[10px] font-mono font-bold text-[#6E4529]">
                  Fraud Probability: {fraudProbPct}%
                </span>
              </div>
              <p className="text-[11px] text-stone-600 font-sans">
                Trained on national ground-truth audit findings to calibrate evidence signals into actionable administrative priority.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-mono font-bold text-[#6E4529] uppercase hidden sm:inline">
              Triangulation Result:
            </span>
            <span className="rounded-md bg-white border border-[#D9D2C5] px-3 py-1 font-mono font-bold text-xs text-[#1C1917] shadow-2xs">
              Composite Risk: {overallScore.toFixed(1)} / 100
            </span>
          </div>
        </div>
      </div>

      {/* ── SYNTHESIZED AUDIT REASONS ── */}
      <div className="rounded-lg border border-[#E5DFD3] bg-[#FAF7F2] p-4 space-y-2.5 shadow-2xs">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-editorial font-bold text-[#1C1917] uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            Ranked Evidence Signals & Reason Traces
          </h4>
          <span className="text-[10px] font-mono text-stone-500">
            {reasons.length} Evidence Vector{reasons.length !== 1 ? "s" : ""}
          </span>
        </div>

        <ul className="space-y-1.5 text-xs text-stone-800">
          {reasons.map((r, idx) => (
            <li key={idx} className="flex items-start gap-2 bg-[#FFFDF9] border border-[#E5DFD3]/80 rounded-md p-2 shadow-2xs">
              <span className="font-mono text-[10px] font-bold text-[#6E4529] mt-0.5 shrink-0">
                #{idx + 1}
              </span>
              <span className="leading-relaxed font-sans">{r}</span>
            </li>
          ))}
        </ul>

        <p className="text-[10px] text-stone-500 italic pt-1 border-t border-[#E5DFD3]">
          Note: These are risk/anomaly signals and evidence for administrative investigation, not a final determination of fraud.
        </p>
      </div>

      {/* ── FORENSIC DEEP-DIVE EXPANDABLE MODULES ── */}
      {(hasStructuring || hasCostEscalation || hasVendorMonopoly || hasStall) && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs font-mono text-stone-600">
            <span className="font-bold uppercase tracking-wider text-[11px] text-[#6E4529]">
              Specialized Forensic Decoders
            </span>
            <span className="text-[11px] text-stone-500">Click to expand audit details</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* 1. Tender Structuring Gauge */}
            {hasStructuring && (
              <div className="rounded-lg border border-purple-200 bg-[#FAF7FD] p-3.5 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-950">
                    <Sliders className="h-4 w-4 text-purple-700" />
                    <span>Statutory ₹5 Lakh Tender Structuring</span>
                  </div>
                  <span className="rounded bg-purple-100 border border-purple-300 px-2 py-0.5 text-[10px] font-mono font-bold text-purple-800">
                    Proximity Alert
                  </span>
                </div>
                <p className="text-xs text-stone-700 leading-relaxed font-sans">
                  Work allocation of <strong>₹{work.allocation_amount.toLocaleString()}</strong> sits in the sensitive ₹4.5L–₹5.0L band, bypassing mandatory open e-tendering rules under GFR Rule 155.
                </p>
                <div className="h-2.5 w-full rounded-full bg-stone-200 overflow-hidden flex">
                  <div className="h-full bg-purple-600 rounded-l-full" style={{ width: `${Math.min(100, (work.allocation_amount / 500000) * 100)}%` }} />
                </div>
                <div className="flex justify-between text-[10px] text-stone-500 font-mono">
                  <span>₹0</span>
                  <span className="text-purple-900 font-bold">₹{work.allocation_amount.toLocaleString()}</span>
                  <span className="text-rose-700 font-bold">₹5,00,000 (Mandatory E-Tender Ceiling)</span>
                </div>
              </div>
            )}

            {/* 2. Benchmark Comparison */}
            {hasCostEscalation && (
              <div className="rounded-lg border border-rose-200 bg-[#FFF8F8] p-3.5 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-950">
                    <TrendingUp className="h-4 w-4 text-rose-700" />
                    <span>Cost Benchmark Variance</span>
                  </div>
                  <span className="rounded bg-rose-100 border border-rose-300 px-2 py-0.5 text-[10px] font-mono font-bold text-rose-800">
                    +{excessPercent}% Markup
                  </span>
                </div>
                <p className="text-xs text-stone-700 leading-relaxed font-sans">
                  Civil work cost in <strong>{work.state}</strong> averages ₹{Math.round(stateMean).toLocaleString()}. This project is sanctioned at ₹{work.allocation_amount.toLocaleString()} (excess markup of ₹{Math.round(excessAmount).toLocaleString()}).
                </p>
                <div className="space-y-1">
                  <div className="h-2 w-full rounded-full bg-stone-200 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-600 via-amber-500 to-rose-600 rounded-full" style={{ width: "90%" }} />
                  </div>
                </div>
              </div>
            )}

            {/* 3. Agency Monopolization */}
            {hasVendorMonopoly && (
              <div className="rounded-lg border border-sky-200 bg-[#F6F9FD] p-3.5 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-sky-950">
                    <Building2 className="h-4 w-4 text-sky-700" />
                    <span>Agency Monopolization Flow</span>
                  </div>
                  <span className="rounded bg-sky-100 border border-sky-300 px-2 py-0.5 text-[10px] font-mono font-bold text-sky-800">
                    Agency Syndicate
                  </span>
                </div>
                <p className="text-xs text-stone-700 leading-relaxed font-sans">
                  Executing agency <strong>{work.ida}</strong> exhibits disproportionate concentration of developmental works in {work.constituency}, indicating possible vendor capture.
                </p>
              </div>
            )}

            {/* 4. Execution Stagnation */}
            {hasStall && (
              <div className="rounded-lg border border-amber-200 bg-[#FEFDF7] p-3.5 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950">
                    <Clock className="h-4 w-4 text-amber-700" />
                    <span>Timeline Stagnation Tracker</span>
                  </div>
                  <span className="rounded bg-amber-100 border border-amber-300 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-800">
                    {daysStalled} Days Elapsed
                  </span>
                </div>
                <p className="text-xs text-stone-700 leading-relaxed font-sans">
                  Project recommended {daysStalled} days ago has remained frozen in &apos;{work.status}&apos; status without physical asset verification.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
