from typing import Any, Dict, List
from .vision_analyzer import analyze_image


def _confidence_to_status(confidence: float) -> str:

    if confidence >= 0.85:
        return "HIGH"

    if confidence >= 0.60:
        return "MEDIUM"

    return "LOW"


def classify_and_extract(image_bytes: bytes) -> Dict[str, Any]:

    vision = analyze_image(image_bytes)

    classification = vision["classification"]

    status = classification["status"]
    confidence = classification["confidence"]

    if status == "NOT_PACKAGED_COMMODITY":

        return {
            "classification": classification,
            "product": vision.get("product"),
            "declarations": [],
            "rule_evaluations": [],
            "findings": [],
            "evidence": [],
            "overall_status": "NOT_APPLICABLE",
            "requires_officer_review": False,
            "analysis_message": (
                "The uploaded image does not appear to show a "
                "packaged commodity for the configured packaged-commodity "
                "declaration checks."
            )
        }

    if status == "UNCERTAIN" or confidence < 0.85:

        return {
            "classification": classification,
            "product": vision.get("product"),
            "declarations": vision.get("declarations", []),
            "rule_evaluations": [],
            "findings": [],
            "evidence": [],
            "overall_status": "REVIEW",
            "requires_officer_review": True,
            "analysis_message": (
                "The system could not establish with sufficient "
                "confidence whether the image represents a packaged commodity."
            )
        }

    declarations = vision.get("declarations", [])

    if not declarations:

        return {
            "classification": classification,
            "product": vision.get("product"),
            "declarations": [],
            "rule_evaluations": [],
            "findings": [],
            "evidence": [],
            "overall_status": "REVIEW",
            "requires_officer_review": True,
            "analysis_message": (
                "The package was identified, but insufficient visible "
                "declarations were extracted for automated evaluation."
            )
        }

    return {
        "classification": classification,
        "product": vision.get("product"),
        "declarations": declarations,
        "rule_evaluations": [],
        "findings": [],
        "evidence": [],
        "overall_status": "REVIEW",
        "requires_officer_review": True,
        "analysis_message": (
            "Packaged commodity identified. Declarations extracted. "
            "Deterministic rule evaluation is required."
        )
    }
