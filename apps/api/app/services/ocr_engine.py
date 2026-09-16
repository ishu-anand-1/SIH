from typing import Dict, Any, List, Optional
import logging
import os
import re

import cv2
import numpy as np
import pytesseract


# ============================================================
# LOGGER
# ============================================================

logger = logging.getLogger(__name__)


# ============================================================
# TESSERACT CONFIGURATION
# ============================================================

# Tesseract configuration
# Local Windows can use the standard installation path.
# Render/Linux can use the `tesseract` executable from PATH.

TESSERACT_PATH = os.getenv("TESSERACT_CMD")

if TESSERACT_PATH and os.path.isfile(TESSERACT_PATH):
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_PATH
    logger.info("Tesseract configured from TESSERACT_CMD: %s", TESSERACT_PATH)
elif os.path.isfile(r"C:\Program Files\Tesseract-OCR\tesseract.exe"):
    pytesseract.pytesseract.tesseract_cmd = (
        r"C:\Program Files\Tesseract-OCR\tesseract.exe"
    )
    logger.info("Tesseract configured from Windows default path.")
else:
    # On Linux/Render, pytesseract will look for `tesseract` on PATH.
    logger.info("Using Tesseract executable from system PATH.")


def _tesseract_available() -> bool:
    """
    Check whether Tesseract is actually available.
    """
    try:
        version = pytesseract.get_tesseract_version()
        logger.info("Tesseract version: %s", version)
        return True
    except Exception as exc:
        logger.error("Tesseract unavailable: %s", exc)
        return False


# ============================================================
# IMAGE QUALITY
# ============================================================

def calculate_image_quality(image_bytes: bytes) -> Dict[str, Any]:
    """
    Real computer-vision based image quality estimation.

    Metrics:
    - blur_score: based on Laplacian variance
    - brightness_score: based on mean grayscale intensity
    - contrast_score: based on grayscale standard deviation
    - glare_score: estimated from overexposed pixels
    - text_visibility_score: combined quality indicator

    This is an image-quality gate only.
    It does NOT determine legal compliance.
    """

    if not image_bytes:
        return {
            "blur_score": 0.0,
            "brightness_score": 0.0,
            "contrast_score": 0.0,
            "glare_score": 0.0,
            "text_visibility_score": 0.0,
            "quality_status": "WARNING",
        }

    try:
        image_array = np.frombuffer(
            image_bytes,
            dtype=np.uint8,
        )

        image = cv2.imdecode(
            image_array,
            cv2.IMREAD_COLOR,
        )

        if image is None:
            raise ValueError("Unable to decode image")

        gray = cv2.cvtColor(
            image,
            cv2.COLOR_BGR2GRAY,
        )

        # ----------------------------------------------------
        # Blur
        # ----------------------------------------------------

        laplacian_variance = cv2.Laplacian(
            gray,
            cv2.CV_64F,
        ).var()

        # Normalize to a practical 0-100 range.
        blur_score = min(
            100.0,
            max(
                0.0,
                (laplacian_variance / 8.0),
            ),
        )

        # ----------------------------------------------------
        # Brightness
        # ----------------------------------------------------

        brightness = float(np.mean(gray))

        # Ideal brightness around middle range.
        brightness_distance = abs(
            brightness - 128.0
        )

        brightness_score = max(
            0.0,
            100.0 - (
                brightness_distance / 1.28
            ),
        )

        # ----------------------------------------------------
        # Contrast
        # ----------------------------------------------------

        contrast = float(np.std(gray))

        contrast_score = min(
            100.0,
            max(
                0.0,
                contrast * 2.0,
            ),
        )

        # ----------------------------------------------------
        # Glare
        # ----------------------------------------------------

        overexposed_ratio = (
            np.sum(gray >= 245)
            / gray.size
        )

        glare_score = max(
            0.0,
            min(
                100.0,
                100.0 - (
                    overexposed_ratio * 250.0
                ),
            ),
        )

        # ----------------------------------------------------
        # Combined text visibility
        # ----------------------------------------------------

        visibility_score = (
            blur_score * 0.35
            + brightness_score * 0.15
            + contrast_score * 0.25
            + glare_score * 0.25
        )

        if visibility_score >= 75:
            quality_status = "GOOD"
        elif visibility_score >= 50:
            quality_status = "WARNING"
        else:
            quality_status = "POOR"

        return {
            "blur_score": round(
                blur_score,
                1,
            ),
            "brightness_score": round(
                brightness_score,
                1,
            ),
            "contrast_score": round(
                contrast_score,
                1,
            ),
            "glare_score": round(
                glare_score,
                1,
            ),
            "text_visibility_score": round(
                visibility_score,
                1,
            ),
            "quality_status": quality_status,
        }

    except Exception as exc:
        logger.exception(
            "Image quality calculation failed: %s",
            exc,
        )

        return {
            "blur_score": 0.0,
            "brightness_score": 0.0,
            "contrast_score": 0.0,
            "glare_score": 0.0,
            "text_visibility_score": 0.0,
            "quality_status": "WARNING",
        }


# ============================================================
# TEXT NORMALIZATION
# ============================================================

def _normalize_ocr_text(
    value: str,
) -> str:
    """
    Normalize OCR whitespace without changing
    the underlying declaration meaning.
    """

    return " ".join(
        (value or "").split()
    ).strip()


def _normalize_common_ocr_errors(
    value: str,
) -> str:
    """
    Normalize only common OCR formatting errors.

    This function must NOT invent missing declarations.
    """

    text = _normalize_ocr_text(value)

    if not text:
        return ""

    # 5kG -> 5 KG
    text = re.sub(
        r"(?<=\d)\s*[kK]\s*[gG]\b",
        " KG",
        text,
    )

    # 500g -> 500 g
    text = re.sub(
        r"(?<=\d)\s*[gG]\b",
        " g",
        text,
    )

    # 500ml -> 500 ml
    text = re.sub(
        r"(?<=\d)\s*[mM][lL]\b",
        " ml",
        text,
    )

    # 1L -> 1 L
    text = re.sub(
        r"(?<=\d)\s*[lL]\b",
        " L",
        text,
    )

    return _normalize_ocr_text(text)


# ============================================================
# BOUNDING BOX HELPERS
# ============================================================

def _merge_bbox(
    old_box: Optional[Dict[str, int]],
    new_box: Dict[str, int],
) -> Dict[str, int]:

    if not old_box:
        return dict(new_box)

    x1 = min(
        old_box["x"],
        new_box["x"],
    )

    y1 = min(
        old_box["y"],
        new_box["y"],
    )

    x2 = max(
        old_box["x"] + old_box["width"],
        new_box["x"] + new_box["width"],
    )

    y2 = max(
        old_box["y"] + old_box["height"],
        new_box["y"] + new_box["height"],
    )

    return {
        "x": x1,
        "y": y1,
        "width": x2 - x1,
        "height": y2 - y1,
    }


# ============================================================
# DECLARATION EXTRACTION
# ============================================================

def _extract_declarations(
    lines: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """
    Convert OCR lines into structured declaration fields.

    Important:
    - Never invent a declaration.
    - Only extract values actually present in OCR.
    - Missing/ambiguous declarations remain absent.
    - Legal evaluation happens in the rule engine.
    """

    fields: List[Dict[str, Any]] = []

    normalized_lines: List[Dict[str, Any]] = []

    for item in lines:

        if isinstance(item, dict):

            text_value = str(
                item.get("text")
                or item.get("raw_text")
                or item.get("value")
                or ""
            ).strip()

            try:
                confidence = float(
                    item.get("confidence")
                    or item.get("ocr_confidence")
                    or 0
                )
            except (
                TypeError,
                ValueError,
            ):
                confidence = 0.0

            bbox = item.get(
                "bounding_box"
            )

        else:

            text_value = str(
                item
            ).strip()

            confidence = 0.0
            bbox = None

        text_value = _normalize_common_ocr_errors(
            text_value
        )

        if text_value:

            normalized_lines.append(
                {
                    "text": text_value,
                    "confidence": confidence,
                    "bbox": bbox,
                }
            )

    if not normalized_lines:
        return fields

    full_text = "\n".join(
        item["text"]
        for item in normalized_lines
    )

    # ========================================================
    # 1. NET QUANTITY
    # ========================================================

    quantity_pattern = re.compile(
        r"(?<![A-Za-z0-9])"
        r"(\d+(?:[.,]\d+)?)"
        r"\s*"
        r"(mg|kg|g|ml|l)"
        r"(?![A-Za-z])",
        re.IGNORECASE,
    )

    quantity_candidates = []

    for item in normalized_lines:

        match = quantity_pattern.search(
            item["text"]
        )

        if match:

            value = match.group(1)
            unit = match.group(2)

            quantity_candidates.append(
                {
                    "raw": match.group(0),
                    "normalized": (
                        f"{value} "
                        f"{unit.lower()}"
                    ),
                    "confidence": item[
                        "confidence"
                    ],
                    "bbox": item["bbox"],
                }
            )

    # Prefer explicit NET quantity context.
        # Prefer explicit NET quantity context.
        # Prefer explicit NET quantity context.
    explicit_quantity_context = re.search(
        r"(?:net\s*(?:wt|weight|qty|quantity))"
        r"\s*[:\-]?"
        r".{0,50}?"
        r"(\d+(?:[.,]\d+)?)"
        r"\s*(mg|kg|g|ml|l)\b",
        full_text,
        re.IGNORECASE | re.DOTALL,
    )

    if explicit_quantity_context:

        matched_text = (
            explicit_quantity_context
            .group(0)
            .strip()
        )

        value = (
            explicit_quantity_context
            .group(1)
        )

        unit = (
            explicit_quantity_context
            .group(2)
        )

        # ---------------------------------------------------------
        # Find the actual OCR line containing this quantity.
        # This provides REAL Tesseract confidence + bounding box.
        # ---------------------------------------------------------

        matched_ocr_line = None

        normalized_match = re.sub(
            r"\s+",
            " ",
            matched_text.lower()
        ).strip()

        for item in normalized_lines:

            item_text = str(
                item.get("text", "")
            ).strip()

            if not item_text:
                continue

            normalized_item = re.sub(
                r"\s+",
                " ",
                item_text.lower()
            ).strip()

            # Direct match
            if normalized_match in normalized_item:
                matched_ocr_line = item
                break

            # Fallback: match quantity value + unit
            quantity_pattern = re.compile(
                rf"{re.escape(value).replace(',', r'[,.]')}"
                rf"\s*{re.escape(unit)}\b",
                re.IGNORECASE,
            )

            if quantity_pattern.search(item_text):
                matched_ocr_line = item
                break

        # ---------------------------------------------------------
        # Extract actual OCR confidence
        # ---------------------------------------------------------

        actual_confidence = 0.0
        actual_bbox = None

        if matched_ocr_line:

            try:
                actual_confidence = float(
                    matched_ocr_line.get(
                        "confidence",
                        0.0
                    )
                )
            except (
                TypeError,
                ValueError,
            ):
                actual_confidence = 0.0

            actual_bbox = matched_ocr_line.get(
                "bbox"
            )

        # ---------------------------------------------------------
        # Safety: never invent OCR confidence or bbox.
        # ---------------------------------------------------------

        if actual_confidence < 0:
            actual_confidence = 0.0

        if actual_confidence > 100:
            actual_confidence = 100.0

        fields.append(
            {
                "field_key": "net_quantity",
                "label": "Net Quantity",
                "raw_text": matched_text,
                "normalized_value": (
                    f"{value} "
                    f"{unit.lower()}"
                ),
                "ocr_confidence": round(
                    actual_confidence,
                    2,
                ),
                "bounding_box": actual_bbox,
            }
        )

    elif quantity_candidates:

        best = max(
            quantity_candidates,
            key=lambda item: (
                item["confidence"],
                len(item["raw"]),
            ),
        )

        fields.append(
            {
                "field_key": "net_quantity",
                "label": "Net Quantity",
                "raw_text": best["raw"],
                "normalized_value": best[
                    "normalized"
                ],
                "ocr_confidence": best[
                    "confidence"
                ],
                "bounding_box": best["bbox"],
            }
        )
    elif quantity_candidates:

        best = max(
            quantity_candidates,
            key=lambda item: (
                item["confidence"],
                len(item["raw"]),
            ),
        )

        fields.append(
            {
                "field_key": "net_quantity",
                "label": "Net Quantity",
                "raw_text": best["raw"],
                "normalized_value": best[
                    "normalized"
                ],
                "ocr_confidence": best[
                    "confidence"
                ],
                "bounding_box": best["bbox"],
            }
        )

    # ========================================================
    # 2. MRP
    # ========================================================

    mrp_patterns = [
        re.compile(
            r"\bMRP\b"
            r"\s*[:\-]?"
            r"\s*(?:Rs\.?|INR|₹)?"
            r"\s*(\d+(?:[.,]\d+)?)",
            re.IGNORECASE,
        ),
        re.compile(
            r"\bM\.?\s*R\.?\s*P\.?\b"
            r"\s*[:\-]?"
            r"\s*(?:Rs\.?|INR|₹)?"
            r"\s*(\d+(?:[.,]\d+)?)",
            re.IGNORECASE,
        ),
    ]

    for item in normalized_lines:

        match = None

        for pattern in mrp_patterns:

            match = pattern.search(
                item["text"]
            )

            if match:
                break

        if match:

            price = match.group(1)

            fields.append(
                {
                    "field_key": "mrp",
                    "label": (
                        "Maximum Retail Price (MRP)"
                    ),
                    "raw_text": match.group(0),
                    "normalized_value": (
                        f"Rs. {price}"
                    ),
                    "ocr_confidence": item[
                        "confidence"
                    ],
                    "bounding_box": item["bbox"],
                }
            )

            break

    # ========================================================
    # 3. MANUFACTURER / PACKER
    # ========================================================

    manufacturer_pattern = re.compile(
        r"(?:"
        r"manufactured\s+by|"
        r"manufactured\s*&\s*packed\s+by|"
        r"manufactured\s+and\s+packed\s+by|"
        r"manufactured\s*&\s*packed\s*by|"
        r"mfg\.?\s*by|"
        r"packed\s*by|"
        r"marketed\s*by|"
        r"manufactured\s+for"
        r")"
        r"\s*[:\-]?"
        r"\s*(.+)",
        re.IGNORECASE,
    )

    for item in normalized_lines:

        match = manufacturer_pattern.search(
            item["text"]
        )

        if match:

            manufacturer = (
                match.group(1)
                .strip()
            )

            if manufacturer:

                fields.append(
                    {
                        "field_key": "manufacturer",
                        "label": (
                            "Manufacturer / Packer"
                        ),
                        "raw_text": item["text"],
                        "normalized_value": manufacturer,
                        "ocr_confidence": item[
                            "confidence"
                        ],
                        "bounding_box": item[
                            "bbox"
                        ],
                    }
                )

            break

    # ========================================================
    # 4. DATE / BATCH INFORMATION
    # ========================================================

    date_pattern = re.compile(
        r"(?:"
        r"MFD|MFG|PKD|"
        r"PACKED|"
        r"MANUFACTURED|"
        r"DATE"
        r")"
        r"\s*[:\-]?"
        r"\s*"
        r"("
        r"\d{1,2}[/-]\d{1,2}[/-]\d{2,4}"
        r"|"
        r"\d{4}[/-]\d{1,2}[/-]\d{1,2}"
        r"|"
        r"[A-Za-z]{3,9}\s+\d{4}"
        r")",
        re.IGNORECASE,
    )

    for item in normalized_lines:

        match = date_pattern.search(
            item["text"]
        )

        if match:

            fields.append(
                {
                    "field_key": "date",
                    "label": (
                        "Manufacturing / Packing Date"
                    ),
                    "raw_text": item["text"],
                    "normalized_value": (
                        match.group(1)
                    ),
                    "ocr_confidence": item[
                        "confidence"
                    ],
                    "bounding_box": item[
                        "bbox"
                    ],
                }
            )

            break

    # ========================================================
    # 5. BATCH / LOT NUMBER
    # ========================================================

    batch_pattern = re.compile(
        r"\b(?:"
        r"batch|"
        r"batch\s*no|"
        r"lot|"
        r"lot\s*no"
        r")"
        r"\s*[:#\-]?"
        r"\s*([A-Za-z0-9./_-]+)",
        re.IGNORECASE,
    )

    for item in normalized_lines:

        match = batch_pattern.search(
            item["text"]
        )

        if match:

            fields.append(
                {
                    "field_key": "batch_number",
                    "label": "Batch / Lot Number",
                    "raw_text": item["text"],
                    "normalized_value": (
                        match.group(1)
                    ),
                    "ocr_confidence": item[
                        "confidence"
                    ],
                    "bounding_box": item[
                        "bbox"
                    ],
                }
            )

            break

    return fields


# ============================================================
# OCR PASS
# ============================================================

def _run_tesseract_pass(
    image: np.ndarray,
    psm: int,
    coordinate_scale_x: float = 1.0,
    coordinate_scale_y: float = 1.0,
) -> List[Dict[str, Any]]:
    """
    Execute one Tesseract OCR pass.

    Tesseract returns coordinates in the coordinate system of the
    image passed to it.

    If the OCR image was resized/upscaled, coordinates are mapped
    back to the original image coordinate system.
    """

    data = pytesseract.image_to_data(
        image,
        config=f"--oem 3 --psm {psm}",
        output_type=pytesseract.Output.DICT,
    )

    lines_by_key: Dict[str, Dict[str, Any]] = {}

    count = len(data.get("text", []))

    for index in range(count):

        raw_text = _normalize_ocr_text(
            data["text"][index]
        )

        try:
            confidence = float(
                data["conf"][index]
            )
        except (TypeError, ValueError):
            confidence = 0.0

        if not raw_text:
            continue

        if confidence < 20:
            continue

        try:
            raw_x = int(data["left"][index])
            raw_y = int(data["top"][index])
            raw_w = int(data["width"][index])
            raw_h = int(data["height"][index])
        except (TypeError, ValueError):
            continue

        # ----------------------------------------------------
        # Map coordinates from OCR image back to original image
        # ----------------------------------------------------

        x = round(
            raw_x / max(coordinate_scale_x, 0.0001)
        )

        y = round(
            raw_y / max(coordinate_scale_y, 0.0001)
        )

        w = max(
            1,
            round(
                raw_w / max(coordinate_scale_x, 0.0001)
            ),
        )

        h = max(
            1,
            round(
                raw_h / max(coordinate_scale_y, 0.0001)
            ),
        )

        block = str(
            data["block_num"][index]
        )

        paragraph = str(
            data["par_num"][index]
        )

        line = str(
            data["line_num"][index]
        )

        key = f"{block}-{paragraph}-{line}"

        bbox = {
            "x": x,
            "y": y,
            "width": w,
            "height": h,
        }

        if key not in lines_by_key:

            lines_by_key[key] = {
                "text": raw_text,
                "confidence": confidence,
                "bounding_box": bbox,
            }

        else:

            current = lines_by_key[key]

            current["text"] = (
                current["text"]
                + " "
                + raw_text
            ).strip()

            current["confidence"] = (
                current["confidence"]
                + confidence
            ) / 2.0

            current["bounding_box"] = _merge_bbox(
                current["bounding_box"],
                bbox,
            )

    return list(
        lines_by_key.values()
    )


# ============================================================
# IMAGE PREPROCESSING
# ============================================================

def _build_ocr_variants(
    image: np.ndarray,
) -> List[Dict[str, Any]]:
    """
    Create multiple OCR-friendly image variants.

    Every variant carries the scale used to create it so that
    Tesseract bounding boxes can be mapped back to the original
    image coordinate system.
    """

    variants: List[Dict[str, Any]] = []

    original_height, original_width = image.shape[:2]

    # --------------------------------------------------------
    # Original
    # --------------------------------------------------------

    variants.append(
        {
            "name": "original",
            "image": image,
            "scale_x": 1.0,
            "scale_y": 1.0,
        }
    )

    # --------------------------------------------------------
    # Grayscale
    # --------------------------------------------------------

    gray = cv2.cvtColor(
        image,
        cv2.COLOR_BGR2GRAY,
    )

    height, width = gray.shape[:2]

    # Always initialize scale.
    scale = 1.0

    if width < 1800:

        scale = (
            1800.0
            / max(width, 1)
        )

        gray_upscaled = cv2.resize(
            gray,
            None,
            fx=scale,
            fy=scale,
            interpolation=cv2.INTER_CUBIC,
        )

    else:

        gray_upscaled = gray

    variants.append(
        {
            "name": "grayscale_upscaled",
            "image": gray_upscaled,
            "scale_x": scale,
            "scale_y": scale,
        }
    )

    # --------------------------------------------------------
    # OTSU
    # --------------------------------------------------------

    blurred = cv2.GaussianBlur(
        gray_upscaled,
        (3, 3),
        0,
    )

    otsu = cv2.threshold(
        blurred,
        0,
        255,
        cv2.THRESH_BINARY + cv2.THRESH_OTSU,
    )[1]

    variants.append(
        {
            "name": "otsu",
            "image": otsu,
            "scale_x": scale,
            "scale_y": scale,
        }
    )

    # --------------------------------------------------------
    # Adaptive threshold
    # --------------------------------------------------------

    adaptive = cv2.adaptiveThreshold(
        gray_upscaled,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        31,
        11,
    )

    variants.append(
        {
            "name": "adaptive",
            "image": adaptive,
            "scale_x": scale,
            "scale_y": scale,
        }
    )

    logger.debug(
        "OCR variants built: original=%sx%s scale=%.4f",
        original_width,
        original_height,
        scale,
    )

    return variants
# ============================================================
# OCR RESULT SCORING
# ============================================================

def _score_ocr_lines(
    lines: List[Dict[str, Any]],
) -> float:
    """
    Score an OCR result for selecting the best
    preprocessing + PSM combination.

    This score is NOT a legal/compliance score.
    """

    if not lines:
        return 0.0

    total_chars = sum(
        len(
            item.get(
                "text",
                "",
            )
        )
        for item in lines
    )

    average_confidence = (
        sum(
            float(
                item.get(
                    "confidence",
                    0,
                )
            )
            for item in lines
        )
        / len(lines)
    )

    declaration_keywords = (
        "mrp",
        "net",
        "quantity",
        "weight",
        "manufactured",
        "manufactured by",
        "packed",
        "mfg",
        "batch",
        "lot",
        "date",
        "kg",
        "g",
        "ml",
        "l",
        "rs",
    )

    keyword_hits = 0

    combined = " ".join(
        item.get(
            "text",
            "",
        ).lower()
        for item in lines
    )

    for keyword in declaration_keywords:

        if keyword in combined:
            keyword_hits += 1

    return (
        average_confidence
        + min(
            30.0,
            total_chars / 20.0,
        )
        + keyword_hits * 8.0
    )


# ============================================================
# MAIN OCR PIPELINE
# ============================================================

def run_ocr_pipeline(
    product_id: str,
    image_bytes: bytes = None,
) -> List[Dict[str, Any]]:
    """
    Real image OCR pipeline.

    product_id is retained for API compatibility.

    OCR data is derived ONLY from image_bytes.

    Pipeline:

        image bytes
            ↓
        OpenCV decode
            ↓
        preprocessing variants
            ↓
        Tesseract OCR
            ↓
        confidence + bounding boxes
            ↓
        best OCR result
            ↓
        structured declarations

    No legal decision is made here.
    """

    # product_id intentionally retained for API compatibility.
    _ = product_id

    if not image_bytes:

        logger.warning(
            "OCR skipped: empty image bytes"
        )

        return []

    if not _tesseract_available():

        logger.error(
            "OCR skipped because Tesseract is unavailable."
        )

        return []

    try:

        # ----------------------------------------------------
        # Decode image
        # ----------------------------------------------------

        image_array = np.frombuffer(
            image_bytes,
            dtype=np.uint8,
        )

        image = cv2.imdecode(
            image_array,
            cv2.IMREAD_COLOR,
        )

        if image is None:

            logger.error(
                "OCR failed: invalid image bytes"
            )

            return []

        logger.info(
            "OCR image decoded: width=%s height=%s",
            image.shape[1],
            image.shape[0],
        )

        # ----------------------------------------------------
        # Build variants
        # ----------------------------------------------------

        variants = _build_ocr_variants(
            image
        )

        candidates = []

        # ----------------------------------------------------
        # Multiple OCR passes
        # ----------------------------------------------------

        for variant in variants:

            variant_name = variant[
                "name"
            ]

            variant_image = variant[
                "image"
            ]

            for psm in (
                6,
                11,
            ):

                try:

                    lines = _run_tesseract_pass(
    variant_image,
    psm,
    coordinate_scale_x=float(
        variant.get("scale_x", 1.0)
    ),
    coordinate_scale_y=float(
        variant.get("scale_y", 1.0)
    ),
)

                    score = _score_ocr_lines(
                        lines
                    )

                    logger.info(
                        "OCR pass=%s psm=%s lines=%s score=%.2f",
                        variant_name,
                        psm,
                        len(lines),
                        score,
                    )

                    if lines:

                        candidates.append(
                            {
                                "variant": variant_name,
                                "psm": psm,
                                "lines": lines,
                                "score": score,
                            }
                        )

                except Exception as exc:

                    logger.warning(
                        "OCR pass failed: variant=%s psm=%s error=%s",
                        variant_name,
                        psm,
                        exc,
                    )

        if not candidates:

            logger.warning(
                "OCR produced no usable text."
            )

            return []

        # ----------------------------------------------------
        # Select best OCR pass
        # ----------------------------------------------------

        best_candidate = max(
            candidates,
            key=lambda item: item[
                "score"
            ],
        )

        logger.info(
            "Selected OCR pass: variant=%s psm=%s score=%.2f",
            best_candidate["variant"],
            best_candidate["psm"],
            best_candidate["score"],
        )

        # ----------------------------------------------------
        # Extract declarations
        # ----------------------------------------------------

        declarations = _extract_declarations(
            best_candidate["lines"]
        )

        if not declarations:

            # ------------------------------------------------
            # Fallback:
            # Try declaration extraction against every
            # candidate, not just the highest OCR score.
            # ------------------------------------------------

            ranked_candidates = sorted(
                candidates,
                key=lambda item: item[
                    "score"
                ],
                reverse=True,
            )

            for candidate in ranked_candidates:

                declarations = (
                    _extract_declarations(
                        candidate["lines"]
                    )
                )

                if declarations:

                    logger.info(
                        "Declarations recovered from fallback OCR pass: "
                        "variant=%s psm=%s",
                        candidate["variant"],
                        candidate["psm"],
                    )

                    break

        if not declarations:

            logger.warning(
                "OCR text exists but no supported declarations "
                "could be extracted."
            )

            return []

        logger.info(
            "OCR declarations extracted: %s",
            [
                {
                    "field_key": item[
                        "field_key"
                    ],
                    "normalized_value": item[
                        "normalized_value"
                    ],
                }
                for item in declarations
            ],
        )

        return declarations

    except Exception as exc:

        logger.exception(
            "OCR pipeline failed: %s",
            exc,
        )

        # Never fabricate compliance data after an OCR failure.
        return []