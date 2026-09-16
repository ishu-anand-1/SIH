from typing import List, Dict, Any
import re

from app.database import SessionLocal
from app.models import Rule


class RuleEngine:
    """
    Deterministic compliance evaluator.

    AI/OCR supplies structured observations.
    This engine evaluates those observations against the
    active rule registry. The LLM is never used to make
    the legal/compliance decision.
    """

    FALLBACK_VERSION = "2026.1"

    @classmethod
    def _load_active_rules(cls) -> Dict[str, Rule]:
        db = SessionLocal()

        try:
            rules = (
                db.query(Rule)
                .filter(Rule.status == "ACTIVE")
                .all()
            )

            return {rule.id: rule for rule in rules}

        finally:
            db.close()

    @staticmethod
    def _text(field: Dict[str, Any]) -> str:
        value = field.get("raw_text")
        if value is None:
            value = field.get("normalized_value")

        return str(value or "").strip()

    @staticmethod
    def _confidence(field: Dict[str, Any], default: float = 0.0) -> float:
        try:
            value = float(field.get("ocr_confidence", default))
            return max(0.0, min(100.0, value))
        except (TypeError, ValueError):
            return default

    @staticmethod
    def _trace(
        rule: Rule,
        field: Dict[str, Any] | None,
        evaluation: str,
        result: str,
        image_detail: str = "Inspection image supplied to the analysis pipeline.",
    ) -> List[Dict[str, str]]:
        raw_text = ""
        normalized = ""

        if field:
            raw_text = str(field.get("raw_text") or "")
            normalized = str(field.get("normalized_value") or "")

        return [
            {
                "step": "IMAGE",
                "title": "Inspection Image",
                "detail": image_detail,
            },
            {
                "step": "DETECTED TEXT",
                "title": "Detected Text",
                "detail": raw_text or "No usable OCR text detected.",
            },
            {
                "step": "NORMALIZED FIELD",
                "title": "Normalized Field",
                "detail": normalized or "No normalized value available.",
            },
            {
                "step": "APPLICABLE RULE",
                "title": rule.title,
                "detail": (
                    f"{rule.source_reference} | "
                    f"Version {rule.current_version or RuleEngine.FALLBACK_VERSION}"
                ),
            },
            {
                "step": "EVALUATION",
                "title": "Deterministic Evaluation",
                "detail": evaluation,
            },
            {
                "step": "RESULT",
                "title": "Compliance Determination",
                "detail": result,
            },
        ]

    @classmethod
    def _finding(
        cls,
        rule: Rule,
        field: Dict[str, Any] | None,
        status: str,
        reason: str,
        evaluation: str,
        confidence: float,
        detected_value: str | None = None,
    ) -> Dict[str, Any]:

        return {
            "rule_id": rule.id,
            "rule_title": rule.title,
            "requirement": rule.description,
            "detected_value": (
                detected_value
                if detected_value is not None
                else (
                    field.get("normalized_value")
                    if field
                    else "NOT AVAILABLE"
                )
            ),
            "status": status,
            "confidence": round(confidence, 2),
            "reason": reason,
            "rule_version": rule.current_version or cls.FALLBACK_VERSION,
            "source_reference": rule.source_reference,
            "rule_trace_json": cls._trace(
                rule=rule,
                field=field,
                evaluation=evaluation,
                result=status,
            ),
        }

    @classmethod
    def _evaluate_net_quantity(
        cls,
        rule: Rule,
        field: Dict[str, Any] | None,
    ) -> Dict[str, Any]:

        if not field:
            return cls._finding(
                rule,
                None,
                "NEEDS_REVIEW",
                "No net quantity field was extracted. The available image/OCR evidence is insufficient to determine whether the declaration is absent or simply unreadable.",
                "Net quantity field unavailable; manual verification required.",
                0.0,
                "NOT DETECTED",
            )

        text = cls._text(field)
        normalized = str(field.get("normalized_value") or "").strip()
        confidence = cls._confidence(field)

        if not text and not normalized:
            return cls._finding(
                rule,
                field,
                "NEEDS_REVIEW",
                "Net quantity evidence is empty or unreadable.",
                "No usable quantity text available for deterministic validation.",
                confidence,
                "UNREADABLE",
            )

        unit_match = re.search(
            r"\b\d+(?:[.,]\d+)?\s*(?:mg|g|kg|ml|l)\b",
            text.lower(),
        )

        if unit_match:
          if confidence < 70.0:
             return cls._finding(
                rule,
                field,
                "NEEDS_REVIEW",
                "A quantity/unit pattern was detected, but OCR confidence is         below the configured review threshold.",
                f"Quantity/unit pattern matched: {unit_match.group(0)}, but OCR  confidence={confidence:.1f}% is below the 70.0% threshold.",
                confidence,
                normalized or unit_match.group(0),
             )

          return cls._finding(
             rule,
             field,
             "COMPLIANT",
             "A quantity value with a recognized unit suffix was detected with sufficient OCR confidence.",
             f"Quantity/unit pattern matched: {unit_match.group(0)} with OCR confidence={confidence:.1f}%.",
             confidence,
             normalized or unit_match.group(0),
          )

    @classmethod
    def _evaluate_mrp(
        cls,
        rule: Rule,
        field: Dict[str, Any] | None,
    ) -> Dict[str, Any]:

        if not field:
            return cls._finding(
                rule,
                None,
                "NEEDS_REVIEW",
                "No MRP field was extracted. The available evidence is insufficient to distinguish a missing declaration from an unreadable declaration.",
                "MRP field unavailable; manual verification required.",
                0.0,
                "NOT DETECTED",
            )

        text = cls._text(field)
        confidence = cls._confidence(field)

        if not text:
            return cls._finding(
                rule,
                field,
                "NEEDS_REVIEW",
                "MRP evidence is empty or unreadable.",
                "No usable MRP text available for deterministic validation.",
                confidence,
                "UNREADABLE",
            )

        price_match = re.search(
            r"(?:₹|rs\.?|inr)?\s*\d+(?:[.,]\d+)?",
            text.lower(),
        )

        tax_phrase = re.search(
            r"(?:incl\.?|inclusive)\s+of\s+all\s+tax(?:es)?",
            text.lower(),
        )

        if price_match and tax_phrase:
            status = "COMPLIANT"
            reason = (
                "A numeric price and the configured tax-inclusion "
                "phrase were detected."
            )
            evaluation = (
                "Numeric price pattern matched and tax-inclusion "
                "phrase matched."
            )
        elif price_match:
            status = "POTENTIAL_NON_COMPLIANCE"
            reason = (
                "A numeric price was detected, but the configured "
                "tax-inclusion phrase was not detected."
            )
            evaluation = (
                "Numeric price pattern matched; tax-inclusion "
                "phrase did not match."
            )
        else:
            status = "NEEDS_REVIEW"
            reason = (
                "The available MRP text could not be reliably parsed "
                "as a numeric price."
            )
            evaluation = (
                "Numeric price pattern could not be established."
            )

        return cls._finding(
            rule,
            field,
            status,
            reason,
            evaluation,
            confidence,
            field.get("normalized_value") or text,
        )

    @classmethod
    def _evaluate_manufacturer(
        cls,
        rule: Rule,
        field: Dict[str, Any] | None,
    ) -> Dict[str, Any]:

        if not field:
            return cls._finding(
                rule,
                None,
                "NEEDS_REVIEW",
                "Manufacturer/packer information was not extracted. Manual verification is required.",
                "Manufacturer field unavailable.",
                0.0,
                "NOT DETECTED",
            )

        text = cls._text(field)
        normalized = str(field.get("normalized_value") or "").strip()
        confidence = cls._confidence(field)

        if not text and not normalized:
            return cls._finding(
                rule,
                field,
                "NEEDS_REVIEW",
                "Manufacturer/packer information is unreadable or unavailable.",
                "No usable manufacturer/packer text available.",
                confidence,
                "UNREADABLE",
            )

        # Conservative text checks. This does not attempt to prove
        # legal completeness from OCR alone.
        has_address_indicator = bool(
            re.search(
                r"\b(?:road|rd|street|st|lane|ln|nagar|"
                r"industrial|estate|city|district|pin|"
                r"\d{6})\b",
                text.lower(),
            )
        )

        if normalized and has_address_indicator:
            return cls._finding(
                rule,
                field,
                "COMPLIANT",
                "Manufacturer/packer text and an address-like component were detected.",
                "Normalized manufacturer value present and address indicator detected.",
                confidence,
                normalized,
            )

        if normalized:
            return cls._finding(
                rule,
                field,
                "NEEDS_REVIEW",
                "Manufacturer/packer identity was detected, but OCR evidence does not establish completeness of the postal address.",
                "Identity detected; postal-address completeness requires officer verification.",
                confidence,
                normalized,
            )

        return cls._finding(
            rule,
            field,
            "NEEDS_REVIEW",
            "Manufacturer/packer text was detected but could not be normalized reliably.",
            "Raw text available without a reliable normalized identity.",
            confidence,
            text,
        )

    @classmethod
    def _evaluate_font_height(
        cls,
        rule: Rule,
        field: Dict[str, Any] | None,
    ) -> Dict[str, Any]:

        # Never invent a physical measurement.
        if not field:
            return cls._finding(
                rule,
                None,
                "NEEDS_REVIEW",
                "Physical font height cannot be established from the available OCR fields without calibrated image scale.",
                "No calibrated font-height measurement supplied.",
                0.0,
                "NOT MEASURED",
            )

        measured_mm = field.get("measured_mm")
        calibration_confidence = field.get("calibration_confidence")

        if measured_mm is None:
            return cls._finding(
                rule,
                field,
                "NEEDS_REVIEW",
                "No calibrated physical measurement was supplied. Pixel dimensions alone are not treated as millimetres.",
                "Physical scale/calibration unavailable; no compliance decision made.",
                cls._confidence(field),
                "NOT MEASURED",
            )

        try:
            measured_mm = float(measured_mm)
        except (TypeError, ValueError):
            return cls._finding(
                rule,
                field,
                "NEEDS_REVIEW",
                "The supplied font-height measurement is not numeric.",
                "Invalid physical measurement.",
                cls._confidence(field),
                str(measured_mm),
            )

        try:
            calibration_confidence = float(
                calibration_confidence
                if calibration_confidence is not None
                else 0
            )
        except (TypeError, ValueError):
            calibration_confidence = 0

        confidence = max(
            0.0,
            min(100.0, calibration_confidence),
        )

        # The 1.5 mm threshold is taken from the configured DB rule,
        # while the actual measurement must come from a calibrated
        # measurement pipeline.
        if confidence < 90:
            return cls._finding(
                rule,
                field,
                "NEEDS_REVIEW",
                "A physical measurement was supplied, but calibration confidence is insufficient for an automated determination.",
                f"Measured height={measured_mm:.2f} mm; calibration confidence={confidence:.1f}%.",
                confidence,
                f"{measured_mm:.2f} mm",
            )

        status = (
            "COMPLIANT"
            if measured_mm >= 1.5
            else "POTENTIAL_NON_COMPLIANCE"
        )

        return cls._finding(
            rule,
            field,
            status,
            (
                "Calibrated font-height measurement satisfies the "
                "configured threshold."
                if status == "COMPLIANT"
                else
                "Calibrated font-height measurement is below the "
                "configured threshold."
            ),
            (
                f"Measured height={measured_mm:.2f} mm; "
                f"configured threshold=1.50 mm; "
                f"calibration confidence={confidence:.1f}%."
            ),
            confidence,
            f"{measured_mm:.2f} mm",
        )

    @classmethod
    def evaluate_inspection(
        cls,
        product_id: str,
        ocr_fields: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:

        del product_id  # Reserved for future product-specific applicability.

        rules = cls._load_active_rules()

        fields_by_key = {
            str(field.get("field_key")): field
            for field in (ocr_fields or [])
            if field.get("field_key")
        }

        findings: List[Dict[str, Any]] = []

        evaluators = {
            "LMPC-6-NET-QTY": cls._evaluate_net_quantity,
            "LMPC-8-MRP": cls._evaluate_mrp,
            "LMPC-6-MFR": cls._evaluate_manufacturer,
            "LMPC-10-FONT": cls._evaluate_font_height,
        }

        field_keys = {
            "LMPC-6-NET-QTY": "net_quantity",
            "LMPC-8-MRP": "mrp",
            "LMPC-6-MFR": "manufacturer",
            "LMPC-10-FONT": "font_height",
        }

        for rule_id, evaluator in evaluators.items():

            rule = rules.get(rule_id)

            if not rule:
                # Do not fabricate a rule if it is absent from the
                # active registry.
                continue

            field = fields_by_key.get(field_keys[rule_id])

            findings.append(
                evaluator(rule, field)
            )

        return findings
