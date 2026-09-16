from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict
from datetime import datetime

class UserBase(BaseModel):
    email: str
    name: str
    role: str = "INSPECTOR"
    badge_number: Optional[str] = None
    department: str = "Legal Metrology Division"

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class LoginRequest(BaseModel):
    email: str
    password: str

class ImageQualitySchema(BaseModel):
    blur_score: float = 95.0
    brightness_score: float = 90.0
    contrast_score: float = 92.0
    glare_score: float = 96.0
    text_visibility_score: float = 94.0
    quality_status: str = "GOOD"

class OcrResultSchema(BaseModel):
    id: str
    inspection_id: str
    field_key: str
    label: str
    raw_text: str
    normalized_value: str
    ocr_confidence: float
    bounding_box: Dict[str, Any]

class ComplianceFindingSchema(BaseModel):
    id: str
    inspection_id: str
    rule_id: str
    rule_title: str
    requirement: str
    detected_value: str
    status: str
    confidence: float
    reason: str
    evidence_id: Optional[str] = None
    rule_trace_json: List[Dict[str, Any]]

class EvidenceSchema(BaseModel):
    id: str
    inspection_id: str
    field_key: str
    detected_text: str
    ocr_confidence: float
    rule_id: str
    reason: str
    sha256_hash: str
    integrity_verified: bool = True
    bounding_box: Dict[str, Any]
    image_url: str
    timestamp: datetime

class OfficerReviewCreate(BaseModel):
    decision: str # MARK_COMPLIANT, MARK_NON_COMPLIANT, REQUEST_REINSPECTION, VERIFY_PHYSICALLY
    remarks: str

class OfficerReviewSchema(OfficerReviewCreate):
    id: str
    inspection_id: str
    officer_name: str
    timestamp: datetime

class InspectionImageSchema(BaseModel):
    id: str
    image_type: str
    image_url: str
    resolution: str
    quality_status: str
    sha256_hash: str

class ProductSchema(BaseModel):
    id: str
    name: str
    brand: str
    category: str
    manufacturer: str
    net_quantity_claimed: str
    mrp_claimed: str
    priority_score: float = 15.0
    repeat_findings_count: int = 0
    created_at: datetime

class InspectionDetailSchema(BaseModel):
    id: str
    product_id: str
    product_name: str
    brand: str
    category: str
    status: str
    overall_compliance: str
    rule_version: str = "2026.1"
    created_at: datetime
    finalized_at: Optional[datetime] = None
    summary_notes: Optional[str] = None
    images: List[InspectionImageSchema] = []
    ocr_results: List[OcrResultSchema] = []
    findings: List[ComplianceFindingSchema] = []
    evidence_items: List[EvidenceSchema] = []
    reviews: List[OfficerReviewSchema] = []

class ReportSchema(BaseModel):
    id: str
    inspection_id: str
    title: str
    pdf_url: str
    docx_url: str
    json_url: str
    rule_version: str = "2026.1"
    generated_at: datetime

class RuleSchema(BaseModel):
    id: str
    title: str
    category: str
    current_version: str = "2026.1"
    status: str = "ACTIVE"
    effective_date: str
    source_reference: str
    description: str
    validation_logic: str

class AuditLogSchema(BaseModel):
    id: int
    timestamp: datetime
    user_email: str
    action: str
    object_id: str
    ip_address: str
    metadata_json: Optional[Dict[str, Any]] = None

class SystemHealthSchema(BaseModel):
    status: str = "OPERATIONAL"
    services: Dict[str, Dict[str, Any]]
