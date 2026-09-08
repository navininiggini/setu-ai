export type UserRole = "ministry" | "state" | "district" | "mp";

export type RiskTier = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "Critical" | "High" | "Medium" | "Low";
export type InvestigationPriority = "IMMEDIATE" | "PRIORITY" | "ROUTINE" | "Immediate" | "Priority" | "Routine";

export interface SummaryCards {
  total_works: number;
  total_allocation: number;
  flagged_works_count: number;
  amount_at_risk: number;
  avg_risk_score: number;
  critical_cases_count: number;
  resolved_cases_count: number;
  active_alerts_count: number;
}

export interface RiskDistribution {
  low: number;
  medium: number;
  high: number;
  critical: number;
}

export interface FraudTypeBreakdownItem {
  fraud_type: string;
  label: string;
  count: number;
  total_amount: number;
  percentage: number;
}

export interface GeoRiskSummaryItem {
  name: string;
  code?: string;
  total_works: number;
  total_allocation: number;
  avg_risk_score: number;
  flagged_works_count: number;
  amount_at_risk: number;
  risk_level: string;
}

export interface TopFlaggedWorkItem {
  id: string;
  work: string;
  mp_name: string;
  ida: string;
  state: string;
  constituency: string;
  allocation_amount: number;
  status: string;
  risk_score: number;
  risk_level: string;
  overall_risk_score?: number;
  investigation_priority?: string;
  primary_typology?: string;
  fraud_probability?: number;
  predicted_fraud_type?: string;
  risk_reasons: string[];
  synthesized_reasons?: string[];
  sub_scores?: Record<string, number>;
  domain_scores?: DomainScores;
}

export interface MonthlyTrendItem {
  month: string;
  total_sanctions: number;
  flagged_amount: number;
  flagged_count: number;
}

export interface DashboardData {
  role: UserRole;
  jurisdiction: string;
  summary: SummaryCards;
  risk_distribution: RiskDistribution;
  fraud_breakdown: FraudTypeBreakdownItem[];
  geo_breakdown: GeoRiskSummaryItem[];
  top_flagged_works: TopFlaggedWorkItem[];
  recent_alerts: AlertItem[];
  monthly_trends: MonthlyTrendItem[];
  extra_insights: Record<string, any>;
}

export interface DomainScores {
  financial: number;
  geospatial: number;
  procurement: number;
  contractor: number;
  payment: number;
  progress: number;
  graph: number;
  ml_fraud_probability?: number;
  [key: string]: number | undefined;
}

export interface WorkItem {
  id: string;
  mp_name: string;
  work: string;
  category: string;
  state: string;
  constituency: string;
  ida: string;
  city?: string;
  ward?: string;
  block?: string;
  village?: string;
  recommended_date?: string;
  allocation_amount: number;
  ida_approval: string;
  status: string;
  house: string;
  // Risk fields
  risk_score: number;
  risk_level: string;
  risk_reasons: string[];
  sub_scores: Record<string, number>;
  predicted_fraud_type?: string;
  days_since_recommended?: number;
  // 8-Model & Risk Fusion Architecture additions
  overall_risk_score?: number;
  investigation_priority?: string;
  primary_typology?: string;
  fraud_probability?: number;
  synthesized_reasons?: string[];
  domain_scores?: DomainScores;
  primary_reason?: string;
  secondary_reason?: string;
  tertiary_reason?: string;
  // Statutory Compliance fields
  beneficiary_type?: string;
  is_sc_earmarked?: boolean;
  is_st_earmarked?: boolean;
  uc_status?: string;
  uc_submitted_date?: string;
  uc_overdue_days?: number;
  is_negative_list_violation?: boolean;
  negative_list_reason?: string;
  is_trust_society_work?: boolean;
  compliance_flags?: string[];
  compliance_score?: number;
}

export interface RadarSignal {
  signal: string;
  score: number;
  fullMark: number;
}

export interface WorkDetail extends WorkItem {
  explanation?: {
    work_id: string;
    risk_score: number;
    risk_level: string;
    predicted_fraud_type: string;
    reasons: string[];
    sub_scores: Record<string, number>;
    radar_breakdown: RadarSignal[];
    is_auditable?: boolean;
  };
  // Detailed 8-model dossier fields
  feature_importance_contributions?: Record<string, number>;
  scored_at?: string;
  risk_detail?: ProjectRiskDetailResponse;
}

export interface ProjectRiskDetailResponse {
  project_id: string;
  overall_risk_score: number;
  risk_level: string;
  investigation_priority: string;
  primary_typology: string;
  fraud_probability: number;
  synthesized_reasons: string[];
  primary_reason: string;
  secondary_reason?: string;
  tertiary_reason?: string;
  domain_scores: {
    financial_anomaly_score: number;
    geospatial_anomaly_score: number;
    procurement_anomaly_score: number;
    contractor_anomaly_score: number;
    payment_anomaly_score: number;
    progress_anomaly_score: number;
    graph_anomaly_score: number;
    [key: string]: number;
  };
  feature_importance_contributions?: Record<string, number>;
  scored_at: string;
}

export interface RiskIntelligenceSummaryResponse {
  total_projects_evaluated: number;
  risk_tier_distribution: Record<string, number>;
  investigation_priority_distribution: Record<string, number>;
  typology_distribution: Record<string, number>;
  risk_score_statistics: Record<string, number>;
  generated_at: string;
}

export interface RawProposalScoringRequest {
  project_id?: string;
  work_name: string;
  category?: string;
  state?: string;
  constituency?: string;
  district?: string;
  ida?: string;
  contractor_name?: string;
  sanctioned_amount: number;
  estimated_cost?: number;
  tender_amount?: number;
  planned_duration_days?: number;
  work_type?: string;
  num_bidders?: number;
  is_single_bid?: boolean;
  contractor_past_delays?: number;
  latitude?: number;
  longitude?: number;
}

export interface RawProposalScoringResponse {
  proposal_id: string;
  overall_risk_score: number;
  risk_level: string;
  investigation_priority: string;
  primary_typology: string;
  fraud_probability: number;
  approval_recommendation: string;
  sub_scores: Record<string, number>;
  synthesized_reasons: string[];
  primary_reason: string;
  secondary_reason?: string;
  inference_time_ms: number;
  evaluated_at: string;
}

export interface LiveFusionRequest {
  project_id?: string;
  financial_anomaly_score?: number;
  geospatial_anomaly_score?: number;
  procurement_anomaly_score?: number;
  contractor_anomaly_score?: number;
  payment_anomaly_score?: number;
  progress_anomaly_score?: number;
  graph_anomaly_score?: number;
  fraud_probability?: number;
  predicted_typology?: string;
  domain_reasons?: Record<string, string[]>;
}

export interface LiveFusionResponse {
  project_id: string;
  overall_risk_score: number;
  risk_level: string;
  investigation_priority: string;
  primary_typology: string;
  fraud_probability: number;
  synthesized_reasons: string[];
  primary_reason: string;
  secondary_reason?: string;
  tertiary_reason?: string;
}

export interface CaseNote {
  author: string;
  text: string;
  timestamp: string;
  status_change?: string;
}

export interface CaseItem {
  id: string;
  case_number: string;
  title: string;
  description: string;
  status: "flagged" | "under_review" | "resolved";
  priority: "critical" | "high" | "medium" | "low";
  work_id?: string;
  mp_name?: string;
  state?: string;
  district?: string;
  ida?: string;
  risk_score: number;
  risk_level?: string;
  amount?: number;
  fraud_type?: string;
  assigned_to?: string;
  notes: CaseNote[];
  created_at: string;
  updated_at: string;
}

export interface AlertItem {
  id: string;
  title: string;
  description: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  work_id?: string;
  mp_name?: string;
  state?: string;
  district?: string;
  ida?: string;
  fraud_type?: string;
  risk_score: number;
  is_read: boolean;
  created_at: string;
}

export interface ModelMetricsData {
  model_name: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  roc_auc: number;
  confusion_matrix: { tn: number; fp: number; fn: number; tp: number };
  feature_importance: Array<{ feature: string; importance: number }>;
  pr_curve: Array<{ threshold: number; precision: number; recall: number }>;
  roc_curve: Array<{ threshold: number; fpr: number; tpr: number }>;
  training_sample_size: number;
  fraud_rate: number;
  timestamp: string;
  disclosure: string;
}

export interface DecisionSupportResponse {
  work_id: string;
  status: string;
  role: string;
  source?: string | null;
  confidence_note?: string | null;
  triggered_domains?: string[];
  recommendations: any;
  all_recommendations?: any;
  message?: string;
  generated_at?: string | null;
}
