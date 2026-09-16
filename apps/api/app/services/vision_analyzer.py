import base64
import json
import os
import re
from typing import Any, Dict

try:
    from groq import Groq
except Exception:
    Groq = None


MODEL = os.getenv("GROQ_VISION_MODEL", "qwen/qwen3.8-27b")


SYSTEM_PROMPT = """
You are the visual interpretation layer of METROLOGYX.

Your job is ONLY to inspect the supplied product image and return
structured observations.

You MUST NOT make a legal decision.

You MUST NOT say a product is illegal.

You MUST NOT invent text that is not visible.

You MUST distinguish between:

PACKAGED_COMMODITY
NOT_PACKAGED_COMMODITY
UNCERTAIN

A PACKAGED_COMMODITY requires visible evidence in the IMAGE itself that
the commodity is presented in retail packaging or a retail container intended
for sale as a packaged commodity.

Use these visual rules carefully:

1. PACKAGED_COMMODITY:
- A visible retail pouch, packet, bottle, jar, box, carton, wrapper, sachet,
  or similar consumer package.
- The package may show product artwork, branding, printed label, barcode,
  net quantity, MRP, manufacturer details, dates, or other label information.
- It is enough that the physical retail package is clearly visible even if
  some declarations cannot be read.

2. NOT_PACKAGED_COMMODITY:
- Food or other goods visibly served loose, in bowls, plates, trays, cups,
  or restaurant-style presentation without retail packaging.
- Loose produce, loose grains, unpackaged goods, people, buildings,
  documents, machinery, or ordinary objects without retail packaging.

3. UNCERTAIN:
- The image is too cropped, blurry, distant, occluded, or ambiguous to
  reliably determine whether a retail package is present.
- Do NOT classify something as packaged merely because the product name,
  filename, surrounding context, or expected scenario suggests packaging.

IMPORTANT:
- Judge ONLY what is visually present in the supplied image.
- Never use the filename as evidence.
- Do not invent a package that is not visibly present.
- If a retail package is clearly visible, classify it as PACKAGED_COMMODITY
  even when the individual declarations are unreadable.
- For a clearly packaged product, extract only declarations that are actually
  visible/readable. Missing or unreadable declarations must remain null or
  absent and may generate a warning.
- Do not make a legal compliance decision.

For packaged products extract only visible information.

Return valid JSON only.

Required schema:

{
  "classification": {
    "status": "PACKAGED_COMMODITY | NOT_PACKAGED_COMMODITY | UNCERTAIN",
    "confidence": 0.0,
    "reason": ""
  },
  "product": {
    "name": null,
    "brand": null,
    "category": null,
    "package_type": null
  },
  "declarations": [
    {
      "field": "",
      "raw_text": "",
      "normalized_value": "",
      "value": null,
      "unit": null,
      "confidence": 0.0,
      "bbox": null
    }
  ],
  "warnings": []
}

Confidence must be between 0 and 1.

If text is not actually readable, do not invent it.

If bounding boxes cannot be reliably established, return bbox=null.

Do not generate random coordinates.
"""


def _extract_json(text: str) -> Dict[str, Any]:
    text = (text or "").strip()

    try:
        return json.loads(text)
    except Exception:
        pass

    match = re.search(r"\{.*\}", text, re.DOTALL)

    if match:
        try:
            return json.loads(match.group(0))
        except Exception:
            pass

    raise ValueError("Vision model did not return valid JSON")


def _normalize_result(data: Dict[str, Any]) -> Dict[str, Any]:

    classification = data.get("classification") or {}

    status = str(
        classification.get("status") or "UNCERTAIN"
    ).upper().strip()

    allowed = {
        "PACKAGED_COMMODITY",
        "NOT_PACKAGED_COMMODITY",
        "UNCERTAIN"
    }

    if status not in allowed:
        status = "UNCERTAIN"

    try:
        confidence = float(classification.get("confidence", 0))
    except Exception:
        confidence = 0.0

    confidence = max(0.0, min(1.0, confidence))

    product = data.get("product") or {}

    declarations = []

    for item in data.get("declarations") or []:
        if not isinstance(item, dict):
            continue

        field = str(item.get("field") or "").strip()

        if not field:
            continue

        try:
            item_conf = float(item.get("confidence", 0))
        except Exception:
            item_conf = 0.0

        item_conf = max(0.0, min(1.0, item_conf))

        declarations.append({
            "field": field,
            "raw_text": item.get("raw_text"),
            "normalized_value": item.get("normalized_value"),
            "value": item.get("value"),
            "unit": item.get("unit"),
            "confidence": item_conf,
            "bbox": item.get("bbox")
        })

    return {
        "classification": {
            "status": status,
            "confidence": confidence,
            "reason": classification.get("reason") or ""
        },
        "product": {
            "name": product.get("name"),
            "brand": product.get("brand"),
            "category": product.get("category"),
            "package_type": product.get("package_type")
        },
        "declarations": declarations,
        "warnings": data.get("warnings") or []
    }


def analyze_image(
    image_bytes: bytes,
    mime_type: str = "image/jpeg",
) -> Dict[str, Any]:

    if not image_bytes:
        raise ValueError("Empty image")

    api_key = os.getenv("GROQ_API_KEY")

    if not api_key:
        raise RuntimeError("GROQ_API_KEY is not configured")

    if Groq is None:
        raise RuntimeError("Groq SDK is not installed")

    client = Groq(api_key=api_key)

    image_b64 = base64.b64encode(image_bytes).decode("utf-8")

    completion = client.chat.completions.create(
        model=MODEL,
        temperature=0,
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": SYSTEM_PROMPT
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": """
Analyze this image.

First determine whether it is a packaged commodity.

If it is NOT a packaged commodity, do not invent
MRP/manufacturer/net-quantity declarations.

If it is a packaged commodity, extract visible declarations.
"""
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{mime_type or 'image/jpeg'};base64,{image_b64}"
                        }
                    }
                ]
            }
        ]
    )

    content = completion.choices[0].message.content

    return _normalize_result(_extract_json(content))
