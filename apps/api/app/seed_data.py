from datetime import datetime, timedelta
import hashlib
from app.database import SessionLocal, engine, Base
from app.models import (
    User, Product, Inspection, InspectionImage, OcrResult, Rule,
    ComplianceFinding, Evidence, OfficerReview, Report, AuditLog
)
from app.services.sha256_verifier import generate_sha256_hash

def hash_password(password: str) -> str:
    return hashlib.sha256(f"metrologyx_salt_{password}".encode('utf-8')).hexdigest()

def seed_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # Check if already seeded
    if db.query(User).filter(User.email == "inspector@metrologyx.gov.in").first():
        print("Database already seeded.")
        db.close()
        return

    # 1. Users
    user1 = User(
        email="inspector@metrologyx.gov.in",
        hashed_password=hash_password("demo123"),
        name="Demo Inspector",
        role="INSPECTOR",
        badge_number="LM-OFFICER-402",
        department="Legal Metrology Enforcement Division"
    )
    user2 = User(
        email="supervisor@metrologyx.gov.in",
        hashed_password=hash_password("demo123"),
        name="Senior Officer Vikram Singh",
        role="SUPERVISOR",
        badge_number="LM-SUP-108",
        department="Legal Metrology Quality Control"
    )
    db.add_all([user1, user2])
    db.commit()

    # 2. LMPC Rules
    rule1 = Rule(
        id="LMPC-6-NET-QTY",
        title="Net Quantity Declaration",
        category="Package Quantity",
        current_version="2026.1",
        status="ACTIVE",
        effective_date="2026-01-01",
        source_reference="Legal Metrology (Packaged Commodities) Rules, Rule 6(1)(c)",
        description="Mandatory net quantity declaration using approved SI units (g, kg, ml, L).",
        validation_logic="Field present and uses standard SI unit suffix."
    )
    rule2 = Rule(
        id="LMPC-8-MRP",
        title="Maximum Retail Price (MRP) & Tax Statement",
        category="Pricing & Taxes",
        current_version="2026.1",
        status="ACTIVE",
        effective_date="2026-01-01",
        source_reference="Legal Metrology (Packaged Commodities) Rules, Rule 6(1)(e)",
        description="MRP must state Maximum Retail Price and statutory phrase 'Inclusive of all taxes'.",
        validation_logic="Contains numeric price and phrase 'Incl. of all taxes'."
    )
    rule3 = Rule(
        id="LMPC-6-MFR",
        title="Manufacturer & Packer Identity",
        category="Corporate Identity",
        current_version="2026.1",
        status="ACTIVE",
        effective_date="2026-01-01",
        source_reference="Legal Metrology (Packaged Commodities) Rules, Rule 6(1)(a)",
        description="Complete name and full postal address of manufacturer or packer.",
        validation_logic="Contains corporate name and registered street/city address."
    )
    rule4 = Rule(
        id="LMPC-10-FONT",
        title="Declaration Font Height Scale Check",
        category="Visual Typography",
        current_version="2026.1",
        status="ACTIVE",
        effective_date="2026-01-01",
        source_reference="Legal Metrology (Packaged Commodities) Rules, Rule 10(2)",
        description="Minimum declaration font height of 1.5 mm for packages > 200g.",
        validation_logic="Measured font numeral height >= 1.5 mm."
    )
    db.add_all([rule1, rule2, rule3, rule4])
    db.commit()

    # 3. Products
    prod1 = Product(
        id="PROD-FB-001",
        name="FreshBite Premium Potato Chips",
        brand="FreshBite",
        category="Packaged Food",
        manufacturer="FreshBite Foods Ltd, Industrial Estate, Sector 4, Haridwar, UK",
        net_quantity_claimed="100 g",
        mrp_claimed="Rs 30.00",
        priority_score=8.5,
        repeat_findings_count=0
    )
    prod2 = Product(
        id="PROD-HC-002",
        name="HomeCare Active Clean Detergent",
        brand="HomeCare",
        category="Household Cleaning",
        manufacturer="HomeCare Consumer Products India Pvt Ltd, Vadodara, Gujarat",
        net_quantity_claimed="1 kg",
        mrp_claimed="Rs 185.00",
        priority_score=84.2,
        repeat_findings_count=3
    )
    prod3 = Product(
        id="PROD-EC-003",
        name="EcoGrain Whole Wheat Flour",
        brand="EcoGrain",
        category="Staples & Grains",
        manufacturer="EcoGrain Agri Producer Co Ltd, Bhopal, MP",
        net_quantity_claimed="500 g",
        mrp_claimed="Rs 65.00",
        priority_score=42.0,
        repeat_findings_count=1
    )
    db.add_all([prod1, prod2, prod3])
    db.commit()

    # 4. Inspections & Scenarios
    insp1 = Inspection(
        id="INS-2026-00421",
        product_id="PROD-FB-001",
        officer_id=user1.id,
        officer_name="Demo Inspector",
        status="FINALIZED",
        overall_compliance="COMPLIANT",
        rule_version="2026.1",
        created_at=datetime.utcnow() - timedelta(days=2),
        finalized_at=datetime.utcnow() - timedelta(days=1),
        summary_notes="Package declarations fully verified and compliant with LMPC 2026.1."
    )
    insp2 = Inspection(
        id="INS-2026-00422",
        product_id="PROD-HC-002",
        officer_id=user1.id,
        officer_name="Demo Inspector",
        status="COMPLETED",
        overall_compliance="POTENTIAL_NON_COMPLIANCE",
        rule_version="2026.1",
        created_at=datetime.utcnow() - timedelta(hours=5),
        summary_notes="MRP declaration missing statutory 'Inclusive of all taxes' text."
    )
    insp3 = Inspection(
        id="INS-2026-00423",
        product_id="PROD-EC-003",
        officer_id=user1.id,
        officer_name="Demo Inspector",
        status="COMPLETED",
        overall_compliance="NEEDS_REVIEW",
        rule_version="2026.1",
        created_at=datetime.utcnow() - timedelta(hours=1),
        summary_notes="Font height optical measurement returned 71% confidence. Required officer physical verification."
    )
    db.add_all([insp1, insp2, insp3])
    db.commit()

    # 5. Inspection Images
    img1 = InspectionImage(
        id="IMG-421-01",
        inspection_id="INS-2026-00421",
        image_type="FRONT",
        image_url="/static/samples/freshbite_front.jpg",
        resolution="1920 x 1080",
        quality_status="GOOD",
        sha256_hash=generate_sha256_hash("freshbite_front_sample_image_data")
    )
    img2 = InspectionImage(
        id="IMG-422-01",
        inspection_id="INS-2026-00422",
        image_type="BACK",
        image_url="/static/samples/homecare_back.jpg",
        resolution="1920 x 1080",
        quality_status="GOOD",
        sha256_hash=generate_sha256_hash("homecare_back_sample_image_data")
    )
    img3 = InspectionImage(
        id="IMG-423-01",
        inspection_id="INS-2026-00423",
        image_type="FRONT",
        image_url="/static/samples/ecograin_front.jpg",
        resolution="1920 x 1080",
        quality_status="GOOD",
        sha256_hash=generate_sha256_hash("ecograin_front_sample_image_data")
    )
    db.add_all([img1, img2, img3])
    db.commit()

    # 6. OCR Results
    ocr1 = OcrResult(
        id="OCR-421-01",
        inspection_id="INS-2026-00421",
        field_key="net_quantity",
        label="Net Quantity",
        raw_text="Net Wt. 100 g",
        normalized_value="100 g",
        ocr_confidence=96.2,
        bounding_box={"x": 14, "y": 64, "width": 26, "height": 7}
    )
    ocr2 = OcrResult(
        id="OCR-421-02",
        inspection_id="INS-2026-00421",
        field_key="mrp",
        label="Maximum Retail Price (MRP)",
        raw_text="MRP Rs 30.00 (Incl. of all taxes)",
        normalized_value="Rs 30.00 (Incl. of all taxes)",
        ocr_confidence=95.8,
        bounding_box={"x": 56, "y": 64, "width": 36, "height": 8}
    )
    ocr3 = OcrResult(
        id="OCR-422-01",
        inspection_id="INS-2026-00422",
        field_key="mrp",
        label="Maximum Retail Price (MRP)",
        raw_text="MRP Rs 185.00",
        normalized_value="Rs 185.00",
        ocr_confidence=92.0,
        bounding_box={"x": 58, "y": 72, "width": 34, "height": 9}
    )
    db.add_all([ocr1, ocr2, ocr3])
    db.commit()

    # 7. Findings & Evidence
    finding1 = ComplianceFinding(
        id="FND-421-01",
        inspection_id="INS-2026-00421",
        rule_id="LMPC-6-NET-QTY",
        rule_title="Net Quantity Declaration",
        requirement="Mandatory net quantity declaration with standard SI units (g, kg, ml, L)",
        detected_value="100 g",
        status="COMPLIANT",
        confidence=96.2,
        reason="Net quantity is clearly stated using approved unit format.",
        rule_trace_json=[
            {"step": "IMAGE", "title": "Front Package Image", "detail": "Package front label captured"},
            {"step": "DETECTED TEXT", "title": "Raw Text Extracted", "detail": '"Net Wt. 100 g"'},
            {"step": "NORMALIZED FIELD", "title": "Parsed Quantity Field", "detail": "net_quantity = 100 g"},
            {"step": "APPLICABLE RULE", "title": "Rule LMPC-6-NET-QTY", "detail": "Legal Metrology Packaged Commodities Rules (2026.1)"},
            {"step": "EVALUATION", "title": "Unit Validation", "detail": "Field present ✓, Standard units satisfied ✓, Position prominent ✓"},
            {"step": "RESULT", "title": "Compliance Determination", "detail": "COMPLIANT"}
        ]
    )
    finding2 = ComplianceFinding(
        id="FND-422-01",
        inspection_id="INS-2026-00422",
        rule_id="LMPC-8-MRP",
        rule_title="Maximum Retail Price (MRP) & Tax Declaration",
        requirement="MRP must state 'Inclusive of all taxes' or 'Incl. of all taxes'",
        detected_value="MRP Rs 185.00",
        status="POTENTIAL_NON_COMPLIANCE",
        confidence=92.0,
        reason="MRP declaration states price numeral but omits statutory 'Inclusive of all taxes' phrase.",
        rule_trace_json=[
            {"step": "IMAGE", "title": "Package Price Panel", "detail": "Selected price bounding region"},
            {"step": "DETECTED TEXT", "title": "Raw Text Extracted", "detail": '"MRP Rs 185.00"'},
            {"step": "NORMALIZED FIELD", "title": "Parsed Price Field", "detail": "mrp = Rs 185.00"},
            {"step": "APPLICABLE RULE", "title": "Rule LMPC-8-MRP", "detail": "Version 2026.1"},
            {"step": "EVALUATION", "title": "Tax Statement Check", "detail": "Price numeral present ✓, Tax phrase missing ✗"},
            {"step": "RESULT", "title": "Compliance Determination", "detail": "POTENTIAL NON-COMPLIANCE"}
        ]
    )
    db.add_all([finding1, finding2])
    db.commit()

    ev1 = Evidence(
        id="EVD-421-01",
        inspection_id="INS-2026-00421",
        field_key="net_quantity",
        detected_text="Net Wt. 100 g",
        ocr_confidence=96.2,
        rule_id="LMPC-6-NET-QTY",
        reason="Evidence region matches net quantity declaration standard.",
        sha256_hash=generate_sha256_hash("Net Wt. 100 g | LMPC-6-NET-QTY | INS-2026-00421"),
        integrity_verified=True,
        bounding_box={"x": 14, "y": 64, "width": 26, "height": 7},
        image_url="/static/samples/freshbite_front.jpg"
    )
    ev2 = Evidence(
        id="EVD-422-01",
        inspection_id="INS-2026-00422",
        field_key="mrp",
        detected_text="MRP Rs 185.00",
        ocr_confidence=92.0,
        rule_id="LMPC-8-MRP",
        reason="Price panel evidence confirms omission of statutory tax inclusion statement.",
        sha256_hash=generate_sha256_hash("MRP Rs 185.00 | LMPC-8-MRP | INS-2026-00422"),
        integrity_verified=True,
        bounding_box={"x": 58, "y": 72, "width": 34, "height": 9},
        image_url="/static/samples/homecare_back.jpg"
    )
    db.add_all([ev1, ev2])
    db.commit()

    # 8. Audit Logs
    audit1 = AuditLog(
        user_email="inspector@metrologyx.gov.in",
        action="INSPECTION_FINALIZED",
        object_id="INS-2026-00421",
        ip_address="192.168.1.45",
        metadata_json={"rule_version": "2026.1", "compliance": "COMPLIANT"}
    )
    audit2 = AuditLog(
        user_email="inspector@metrologyx.gov.in",
        action="FINDING_REVIEWED",
        object_id="INS-2026-00422",
        ip_address="192.168.1.45",
        metadata_json={"finding_id": "FND-422-01", "decision": "MARK_NON_COMPLIANT"}
    )
    db.add_all([audit1, audit2])
    db.commit()
    
    print("Database seeding completed successfully.")
    db.close()
