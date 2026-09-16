export type ComplianceStatus = 'COMPLIANT' | 'NEEDS_REVIEW' | 'POTENTIAL_NON_COMPLIANCE' | 'PROCESSING' | 'FINALIZED';

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'ADMIN' | 'SUPERVISOR' | 'INSPECTOR';
  badge_number?: string;
  department: string;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OcrResult {
  id: string;
  inspection_id: string;
  field_key: string;
  label: string;
  raw_text: string;
  normalized_value: string;
  ocr_confidence: number;
  bounding_box: BoundingBox;
}

export interface RuleTraceNode {
  step: string;
  title: string;
  detail: string;
}

export interface ComplianceFinding {
  id: string;
  inspection_id: string;
  rule_id: string;
  rule_title: string;
  requirement: string;
  detected_value: string;
  status: ComplianceStatus;
  confidence: number;
  reason: string;
  evidence_id?: string;
  rule_trace_json: RuleTraceNode[];
}

export interface EvidenceItem {
  id: string;
  inspection_id: string;
  field_key: string;
  detected_text: string;
  ocr_confidence: number;
  rule_id: string;
  reason: string;
  sha256_hash: string;
  integrity_verified: boolean;
  bounding_box: BoundingBox;
  image_url: string;
  timestamp: string;
}

export interface OfficerReview {
  id: string;
  inspection_id: string;
  officer_name: string;
  decision: 'MARK_COMPLIANT' | 'MARK_NON_COMPLIANT' | 'REQUEST_REINSPECTION' | 'VERIFY_PHYSICALLY';
  remarks: string;
  timestamp: string;
}

export interface InspectionImage {
  id: string;
  image_type: string;
  image_url: string;
  resolution: string;
  quality_status: 'GOOD' | 'WARNING' | 'INSUFFICIENT';
  blur_score?: number;
  brightness_score?: number;
  contrast_score?: number;
  glare_score?: number;
  text_visibility_score?: number;
  sha256_hash: string;
}

export interface InspectionDetail {
  id: string;
  product_id: string;
  product_name: string;
  brand: string;
  category: string;
  status: string;
  overall_compliance: ComplianceStatus;
  rule_version: string;
  created_at: string;
  finalized_at?: string;
  summary_notes?: string;
  images: InspectionImage[];
  ocr_results: OcrResult[];
  findings: ComplianceFinding[];
  evidence_items: EvidenceItem[];
  reviews: OfficerReview[];
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  manufacturer: string;
  priority_score: number;
  repeat_findings_count: number;
  inspections_count?: number;
  timeline?: Array<{
    inspection_id: string;
    date: string;
    status: ComplianceStatus;
    notes: string;
  }>;
}

export interface Rule {
  id: string;
  title: string;
  category: string;
  current_version: string;
  status: string;
  effective_date: string;
  source_reference: string;
  description: string;
  validation_logic: string;
}

export interface EnforcementItem {
  rank: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  product_id: string;
  product_name: string;
  brand: string;
  reason: string;
  prototype_priority_score: number;
  repeat_findings: number;
  last_inspection: string;
  recommended_action: string;
}

export interface AuditLog {
  id: number;
  timestamp: string;
  user_email: string;
  action: string;
  object_id: string;
  ip_address: string;
  metadata_json?: Record<string, any>;
}
