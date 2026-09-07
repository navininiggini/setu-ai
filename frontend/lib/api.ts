import {
  DashboardData,
  WorkItem,
  WorkDetail,
  CaseItem,
  AlertItem,
  ModelMetricsData,
  UserRole,
  ProjectRiskDetailResponse,
  RiskIntelligenceSummaryResponse,
  RawProposalScoringRequest,
  RawProposalScoringResponse,
  LiveFusionRequest,
  LiveFusionResponse,
  DecisionSupportResponse,
} from "./types";

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001/api";

export async function fetchDashboard(role: UserRole, jurisdiction?: string): Promise<DashboardData> {
  const url = new URL(`${API_BASE}/dashboard`);
  url.searchParams.append("role", role);
  if (jurisdiction && jurisdiction !== "National") {
    url.searchParams.append("jurisdiction", jurisdiction);
  }
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch dashboard data");
  return res.json();
}

export async function fetchWorks(params: Record<string, any> = {}): Promise<{
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  items: WorkItem[];
}> {
  const url = new URL(`${API_BASE}/works`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") {
      url.searchParams.append(k, String(v));
    }
  });
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch works");
  return res.json();
}

/**
 * Retrieves work baseline detail and merges it with the 8-model risk intelligence dossier if available.
 */
export async function fetchWorkDetail(workId: string): Promise<WorkDetail> {
  const res = await fetch(`${API_BASE}/works/${workId}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch work ${workId}`);
  const work: WorkDetail = await res.json();

  // Try to enrich with live 8-model risk intelligence dossier
  try {
    const riskDossier = await fetchProjectRiskDetail(workId);
    if (riskDossier) {
      work.risk_detail = riskDossier;
      work.overall_risk_score = riskDossier.overall_risk_score;
      work.investigation_priority = riskDossier.investigation_priority;
      work.primary_typology = riskDossier.primary_typology;
      work.fraud_probability = riskDossier.fraud_probability;
      work.synthesized_reasons = riskDossier.synthesized_reasons;
      work.feature_importance_contributions = riskDossier.feature_importance_contributions;
      work.primary_reason = riskDossier.primary_reason;
      work.secondary_reason = riskDossier.secondary_reason;
      work.tertiary_reason = riskDossier.tertiary_reason;
      if (riskDossier.domain_scores) {
        work.domain_scores = {
          financial: riskDossier.domain_scores.financial_anomaly_score,
          geospatial: riskDossier.domain_scores.geospatial_anomaly_score,
          procurement: riskDossier.domain_scores.procurement_anomaly_score,
          contractor: riskDossier.domain_scores.contractor_anomaly_score,
          payment: riskDossier.domain_scores.payment_anomaly_score,
          progress: riskDossier.domain_scores.progress_anomaly_score,
          graph: riskDossier.domain_scores.graph_anomaly_score,
        };
      }
    }
  } catch {
    // Non-blocking fallback: basic work record remains valid
  }

  return work;
}

export async function fetchFilters(): Promise<{
  states: string[];
  categories: string[];
  statuses: string[];
  fraud_types: string[];
  risk_levels: string[];
}> {
  const res = await fetch(`${API_BASE}/works/filters`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch filters");
  return res.json();
}

/* ────────────────────────────────────────────────────────────
   RISK INTELLIGENCE & 8-MODEL APIS
──────────────────────────────────────────────────────────── */

export async function fetchRiskIntelligenceSummary(): Promise<RiskIntelligenceSummaryResponse> {
  const res = await fetch(`${API_BASE}/risk-intelligence/summary`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch risk intelligence summary");
  return res.json();
}

export async function fetchProjectRiskDetail(projectId: string): Promise<ProjectRiskDetailResponse | null> {
  const res = await fetch(`${API_BASE}/risk-intelligence/projects/${projectId}`, { cache: "no-store" });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`Failed to fetch risk detail for ${projectId}`);
  }
  return res.json();
}

export async function fetchFusedRiskProjects(params: Record<string, any> = {}): Promise<{
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  items: any[];
}> {
  const url = new URL(`${API_BASE}/risk-intelligence/projects`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") {
      url.searchParams.append(k, String(v));
    }
  });
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch fused risk projects");
  return res.json();
}

export async function scoreRawProposal(
  request: RawProposalScoringRequest
): Promise<RawProposalScoringResponse> {
  const res = await fetch(`${API_BASE}/risk-intelligence/score-proposal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Proposal scoring failed (${res.status}): ${errText}`);
  }
  return res.json();
}

export async function liveFuseSignals(request: LiveFusionRequest): Promise<LiveFusionResponse> {
  const res = await fetch(`${API_BASE}/risk-intelligence/fuse`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!res.ok) throw new Error("Failed to run live signal fusion");
  return res.json();
}

export async function fetchAuditReports(): Promise<{
  total_reports: number;
  reports: Array<{ report_name: string; filename: string; size_bytes: number; modified_at: number }>;
}> {
  const res = await fetch(`${API_BASE}/risk-intelligence/reports`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch audit reports list");
  return res.json();
}

export async function fetchAuditReportContent(reportName: string): Promise<{ report_name: string; content: string }> {
  const res = await fetch(`${API_BASE}/risk-intelligence/reports/${encodeURIComponent(reportName)}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to fetch report ${reportName}`);
  return res.json();
}

/* ────────────────────────────────────────────────────────────
   GEOSPATIAL APIS
──────────────────────────────────────────────────────────── */

export async function fetchStateChoropleth(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/geo/states-choropleth`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch choropleth data");
  return res.json();
}

export async function fetchDistrictDrilldown(state: string = "Bihar"): Promise<any[]> {
  const res = await fetch(`${API_BASE}/geo/district-drilldown?state=${encodeURIComponent(state)}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch district drilldown");
  return res.json();
}

export async function fetchConstituencyPins(
  constituency?: string,
  mpName?: string,
  limit?: number
): Promise<any[]> {
  const url = new URL(`${API_BASE}/geo/pins`);
  if (constituency) url.searchParams.append("constituency", constituency);
  if (mpName) url.searchParams.append("mp_name", mpName);
  if (limit) url.searchParams.append("limit", limit.toString());
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch constituency pins");
  return res.json();
}

export interface ConstituencyRiskItem {
  id: string;
  name: string;
  state: string;
  district: string;
  mp_name: string;
  total_works: number;
  total_allocation: number;
  avg_risk_score: number;
  flagged_works_count: number;
  risk_level: string;
  lat?: number;
  lng?: number;
}

export interface ConstituencyDetailResponse extends ConstituencyRiskItem {
  top_works: Array<{
    id: string;
    work: string;
    allocation_amount: number;
    status: string;
    risk_score: number;
    risk_level: string;
    ida: string;
    reasons: string[];
  }>;
}

export async function fetchConstituenciesRisk(state?: string): Promise<ConstituencyRiskItem[]> {
  const url = new URL(`${API_BASE}/geo/constituencies-risk`);
  if (state && state !== "All India") url.searchParams.append("state", state);
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch constituencies risk data");
  return res.json();
}

export async function fetchConstituencyDetail(name: string): Promise<ConstituencyDetailResponse> {
  const url = new URL(`${API_BASE}/geo/constituency-detail`);
  url.searchParams.append("name", name);
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch constituency detail");
  return res.json();
}

/* ────────────────────────────────────────────────────────────
   GRAPH & ENTITY APIS
──────────────────────────────────────────────────────────── */

export async function fetchGraphEntities(state?: string): Promise<{
  states: string[];
  districts: string[];
  mps: { name: string; works_count: number; total_capital: number }[];
}> {
  const url = new URL(`${API_BASE}/graph/entities`);
  if (state && state !== "All India" && state !== "National") {
    url.searchParams.append("state", state);
  }
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch graph entities");
  return res.json();
}

export async function fetchNetworkGraph(
  maxNodes: number = 100,
  minRisk: number = 0,
  state?: string,
  district?: string,
  mpName?: string,
  role?: string,
  jurisdiction?: string
): Promise<{ nodes: any[]; links: any[]; telemetry?: any }> {
  const url = new URL(`${API_BASE}/graph/network`);
  url.searchParams.append("max_nodes", String(maxNodes));
  url.searchParams.append("min_risk", String(minRisk));
  if (state && state !== "All India" && state !== "National") {
    url.searchParams.append("state", state);
  }
  if (district) {
    url.searchParams.append("district", district);
  }
  if (mpName) {
    url.searchParams.append("mp_name", mpName);
  }
  if (role) {
    url.searchParams.append("role", role);
  }
  if (jurisdiction) {
    url.searchParams.append("jurisdiction", jurisdiction);
  }
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch network graph");
  return res.json();
}

/* ────────────────────────────────────────────────────────────
   CASE & ALERT APIS
──────────────────────────────────────────────────────────── */

export async function fetchCases(status?: string, priority?: string): Promise<CaseItem[]> {
  const url = new URL(`${API_BASE}/cases`);
  if (status) url.searchParams.append("status", status);
  if (priority) url.searchParams.append("priority", priority);
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch cases");
  return res.json();
}

export async function updateCaseStatus(caseId: string, status: string, note?: string): Promise<CaseItem> {
  const res = await fetch(`${API_BASE}/cases/${caseId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, note, author: "Investigating Officer" }),
  });
  if (!res.ok) throw new Error("Failed to update case status");
  return res.json();
}

export async function addCaseNote(caseId: string, text: string): Promise<CaseItem> {
  const res = await fetch(`${API_BASE}/cases/${caseId}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, author: "Investigating Officer" }),
  });
  if (!res.ok) throw new Error("Failed to add case note");
  return res.json();
}

export async function createCase(payload: {
  title: string;
  description: string;
  work_id?: string;
  mp_name?: string;
  state?: string;
  district?: string;
  ida?: string;
  risk_score?: number;
  fraud_type?: string;
}): Promise<CaseItem> {
  const res = await fetch(`${API_BASE}/cases`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, priority: "high", assigned_to: "District Vigilance Team" }),
  });
  if (!res.ok) throw new Error("Failed to create case");
  return res.json();
}

export async function fetchAlerts(): Promise<AlertItem[]> {
  const res = await fetch(`${API_BASE}/alerts`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch alerts");
  return res.json();
}

export async function markAlertAsRead(alertId: string): Promise<AlertItem> {
  const res = await fetch(`${API_BASE}/alerts/${alertId}/read`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to mark alert as read");
  return res.json();
}

export async function fetchModelMetrics(): Promise<ModelMetricsData> {
  const res = await fetch(`${API_BASE}/model-metrics`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch model metrics");
  return res.json();
}

export interface CartelConduitItem {
  id: string;
  agency_name: string;
  source_constituency: string;
  target_constituency: string;
  state: string;
  works_count: number;
  total_capital: number;
  avg_risk: number;
  risk_level: string;
  pattern: string;
}

export interface TemporalMonthSummary {
  month: string;
  label: string;
  total_works: number;
  total_capital: number;
  national_avg_risk: number;
  is_surge: boolean;
  constituencies: Record<string, number>;
}

export interface TemporalRiskData {
  months: string[];
  timeline: Record<string, TemporalMonthSummary>;
  current_month: string | null;
}

export async function fetchCartelConduits(minRisk: number = 45.0, limit: number = 40): Promise<CartelConduitItem[]> {
  const url = new URL(`${API_BASE}/geo/cartel-conduits`);
  url.searchParams.append("min_risk", String(minRisk));
  url.searchParams.append("limit", String(limit));
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch cartel conduits");
  return res.json();
}

export async function fetchTemporalRisk(): Promise<TemporalRiskData> {
  const res = await fetch(`${API_BASE}/geo/temporal-risk`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch temporal risk data");
  return res.json();
}


export async function fetchDecisionSupport(
  workId: string,
  role?: string
): Promise<DecisionSupportResponse> {
  const url = new URL(`${API_BASE}/works/${workId}/decision-support`);
  if (role) {
    url.searchParams.append("role", role);
  }
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch decision support for ${workId}`);
  }
  return res.json();
}
