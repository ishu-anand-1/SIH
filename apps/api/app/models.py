from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    name = Column(String, nullable=False)
    role = Column(String, default="INSPECTOR") # ADMIN, SUPERVISOR, INSPECTOR
    badge_number = Column(String, nullable=True)
    department = Column(String, default="Legal Metrology Division")
    is_active = Column(Boolean, default=True)
    last_login = Column(DateTime, default=datetime.utcnow)

class Product(Base):
    __tablename__ = "products"
    
    id = Column(String, primary_key=True, index=True) # e.g. PROD-FB-001
    name = Column(String, nullable=False)
    brand = Column(String, nullable=False)
    category = Column(String, nullable=False)
    manufacturer = Column(String, nullable=False)
    net_quantity_claimed = Column(String, nullable=False)
    mrp_claimed = Column(String, nullable=False)
    priority_score = Column(Float, default=15.0) # Prototype priority score 0-100
    repeat_findings_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    inspections = relationship("Inspection", back_populates="product")

class Inspection(Base):
    __tablename__ = "inspections"
    
    id = Column(String, primary_key=True, index=True) # e.g. INS-2026-00421
    product_id = Column(String, ForeignKey("products.id"), nullable=True)
    officer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    officer_name = Column(String, default="Demo Inspector")
    status = Column(String, default="CREATED") # CREATED, PROCESSING, COMPLETED, FINALIZED
    overall_compliance = Column(String, default="NEEDS_REVIEW") # COMPLIANT, NEEDS_REVIEW, POTENTIAL_NON_COMPLIANCE
    rule_version = Column(String, default="2026.1")
    created_at = Column(DateTime, default=datetime.utcnow)
    finalized_at = Column(DateTime, nullable=True)
    summary_notes = Column(Text, nullable=True)
    
    product = relationship("Product", back_populates="inspections")
    images = relationship("InspectionImage", back_populates="inspection", cascade="all, delete-orphan")
    findings = relationship("ComplianceFinding", back_populates="inspection", cascade="all, delete-orphan")
    evidence_items = relationship("Evidence", back_populates="inspection", cascade="all, delete-orphan")
    reviews = relationship("OfficerReview", back_populates="inspection", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="inspection", cascade="all, delete-orphan")

class InspectionImage(Base):
    __tablename__ = "inspection_images"
    
    id = Column(String, primary_key=True, index=True)
    inspection_id = Column(String, ForeignKey("inspections.id"), nullable=False)
    image_type = Column(String, default="FRONT") # FRONT, BACK, SIDE, NUTRITION
    image_url = Column(String, nullable=False)
    mime_type = Column(String, nullable=True)
    resolution = Column(String, default="1920 x 1080")
    blur_score = Column(Float, default=95.0)
    brightness_score = Column(Float, default=90.0)
    contrast_score = Column(Float, default=92.0)
    glare_score = Column(Float, default=96.0)
    text_visibility_score = Column(Float, default=94.0)
    quality_status = Column(String, default="GOOD") # GOOD, WARNING, INSUFFICIENT
    sha256_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    inspection = relationship("Inspection", back_populates="images")

class OcrResult(Base):
    __tablename__ = "ocr_results"
    
    id = Column(String, primary_key=True, index=True)
    inspection_id = Column(String, ForeignKey("inspections.id"), nullable=False)
    field_key = Column(String, nullable=False) # e.g. net_quantity, mrp, manufacturer, date, font_height
    label = Column(String, nullable=False) # e.g. "Net Quantity"
    raw_text = Column(String, nullable=False)
    normalized_value = Column(String, nullable=False)
    ocr_confidence = Column(Float, default=95.0)
    bounding_box = Column(JSON, nullable=False) # {x, y, width, height} in % or px
    source_image_id = Column(String, nullable=True)

class Rule(Base):
    __tablename__ = "rules"
    
    id = Column(String, primary_key=True, index=True) # e.g. LMPC-6-NET-QTY
    title = Column(String, nullable=False)
    category = Column(String, nullable=False)
    current_version = Column(String, default="2026.1")
    status = Column(String, default="ACTIVE")
    effective_date = Column(String, default="2026-01-01")
    source_reference = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    validation_logic = Column(Text, nullable=False)

class ComplianceFinding(Base):
    __tablename__ = "findings"
    
    id = Column(String, primary_key=True, index=True)
    inspection_id = Column(String, ForeignKey("inspections.id"), nullable=False)
    rule_id = Column(String, nullable=False)
    rule_title = Column(String, nullable=False)
    requirement = Column(String, nullable=False)
    detected_value = Column(String, nullable=False)
    status = Column(String, nullable=False) # COMPLIANT, NEEDS_REVIEW, POTENTIAL_NON_COMPLIANCE
    confidence = Column(Float, default=90.0)
    reason = Column(Text, nullable=False)
    evidence_id = Column(String, nullable=True)
    rule_trace_json = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    inspection = relationship("Inspection", back_populates="findings")

class Evidence(Base):
    __tablename__ = "evidence"
    
    id = Column(String, primary_key=True, index=True)
    inspection_id = Column(String, ForeignKey("inspections.id"), nullable=False)
    field_key = Column(String, nullable=False)
    detected_text = Column(String, nullable=False)
    ocr_confidence = Column(Float, default=95.0)
    rule_id = Column(String, nullable=False)
    reason = Column(Text, nullable=False)
    sha256_hash = Column(String, nullable=False)
    integrity_verified = Column(Boolean, default=True)
    bounding_box = Column(JSON, nullable=False)
    image_url = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    inspection = relationship("Inspection", back_populates="evidence_items")

class OfficerReview(Base):
    __tablename__ = "officer_reviews"
    
    id = Column(String, primary_key=True, index=True)
    inspection_id = Column(String, ForeignKey("inspections.id"), nullable=False)
    officer_id = Column(Integer, nullable=True)
    officer_name = Column(String, default="Demo Inspector")
    decision = Column(String, nullable=False) # MARK_COMPLIANT, MARK_NON_COMPLIANT, REQUEST_REINSPECTION, VERIFY_PHYSICALLY
    remarks = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    inspection = relationship("Inspection", back_populates="reviews")

class Report(Base):
    __tablename__ = "reports"
    
    id = Column(String, primary_key=True, index=True)
    inspection_id = Column(String, ForeignKey("inspections.id"), nullable=False)
    title = Column(String, nullable=False)
    pdf_url = Column(String, nullable=False)
    docx_url = Column(String, nullable=False)
    json_url = Column(String, nullable=False)
    rule_version = Column(String, default="2026.1")
    generated_at = Column(DateTime, default=datetime.utcnow)
    
    inspection = relationship("Inspection", back_populates="reports")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    user_email = Column(String, default="inspector@metrologyx.gov.in")
    action = Column(String, nullable=False) # LOGIN, INSPECTION_CREATED, IMAGE_UPLOADED, OCR_COMPLETED, FINDING_REVIEWED, INSPECTION_FINALIZED, REPORT_GENERATED
    object_id = Column(String, nullable=False)
    ip_address = Column(String, default="127.0.0.1")
    metadata_json = Column(JSON, nullable=True)

