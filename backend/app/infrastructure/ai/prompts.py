COMPLIANCE_SYSTEM_PROMPT = "You are a Nigerian trade compliance expert."

COMPLIANCE_EXPORT_PROMPT_TEMPLATE = """
{context_block}
You are a Nigerian export trade compliance expert specializing in AfCFTA and Nigerian export regulations.

Product: {product_name}
HS Code: {hs_code}
Direction: EXPORT from Nigeria to an African country

Analyze this product for Nigerian export compliance and AfCFTA eligibility.
The compliance_items must include all relevant documents from this list that apply to this specific product:
- AfCFTA Certificate of Origin (NEPC/MAN/NACCIMA) - always required for AfCFTA
- Form NXP (CBN) - always required
- NEPC Export Certificate - always required
- NAFDAC Export Permit - only for food, drugs, cosmetics
- SON Export Conformity Certificate - only for manufactured goods
- Phytosanitary Certificate - only for agricultural produce, plants, food
- Combined Export Declaration (Nigeria Customs)
- AfCFTA Rules of Origin Evidence Pack
"""

COMPLIANCE_IMPORT_PROMPT_TEMPLATE = """
{context_block}
You are a Nigerian import trade compliance expert specializing in Nigerian Customs regulations, the 2026 Import Prohibition List, and trade documentation.

Product: {product_name}
HS Code: {hs_code}
Direction: IMPORT into Nigeria

Analyze this product for Nigerian import compliance.
The compliance_items must include all relevant documents from this list that apply to this specific product:
- Form M (CBN) - always required for imports above $1000
- PAAR / Destination Inspection (Nigeria Customs) - always required
- CCVO benchmark value (Nigeria Customs) - include the benchmark value for this HS code if known
- NAFDAC Import Registration - only for food, drugs, cosmetics, medical devices, chemicals
- SON MANCAP Certification - only for electrical goods, building materials, tyres, consumer goods
- NAQS Import Permit - only for plants, animals, agricultural products
- NESREA Permit - only for chemicals, hazardous materials, electronics
- Combined Customs Declaration (Nigeria Customs) - always required
"""

# 1-shot example for the export compliance LLM call
FEW_SHOT_EXPORT_EXAMPLE = {
    "product_name": "Cocoa Beans",
    "status": "compliant",
    "suggested_hs_code": "180100",
    "afcfta_eligible": True,
    "tariff_saving_percent": 15.0,
    "roo_eligible": True,
    "roo_type": "wholly obtained",
    "summary": "Cocoa beans are fully compliant for export from Nigeria and are eligible for zero-tariff treatment under AfCFTA as wholly obtained agricultural products.",
    "what_to_do": "Ensure you are registered with NEPC. Obtain an NXP form from your bank, apply for a Phytosanitary Certificate from NAQS, and request an AfCFTA Certificate of Origin.",
    "risks": [
        {
            "level": "medium",
            "reason": "Phytosanitary failure if beans are improperly dried or pest-infested.",
            "action_required": "Fumigate and ensure moisture content is below 7.5% before NAQS inspection."
        }
    ],
    "compliance_items": [
        {
            "code": "NXP",
            "name": "Nigeria Export Proceeds Form",
            "agency": "Central Bank of Nigeria",
            "agency_short": "CBN",
            "description": "Mandatory form for all commercial exports from Nigeria to track repatriation of foreign exchange.",
            "how_to_obtain": "Apply through the Trade Monitoring System (TRMS) via your authorized dealer bank.",
            "processing_time": "48 hours",
            "cost_estimate": "Standard bank charges apply",
            "is_critical": True,
            "agency_url": "https://www.cbn.gov.ng"
        }
    ]
}


DOCUMENT_GENERATION_SYSTEM_PROMPT = "You are a Nigerian trade document specialist."

DOCUMENT_GENERATION_PROMPT_TEMPLATE = """
{context_block}
Generate a complete draft of: {document_name} ({document_code})

Details:
- Product: {product_name}
- HS Code: {hs_code}
- Direction: {direction}
- Business Name: {business_name}
- CAC Number: {cac_number}
- Destination: {destination_country}

For sections, include all relevant fields for {document_name} filled with the product details above.
Use [PLACEHOLDER] only for information the trader must supply themselves like bank details, signature, or exact values.
The cover_letter must be fully written, professional, addressed to {document_name} department.
"""

HS_CLASSIFICATION_SYSTEM_PROMPT = "You are an HS Code classification expert."

HS_CLASSIFICATION_PROMPT_TEMPLATE = """You are a Nigerian Customs HS Code classification expert.

Product attributes extracted from image:
- Name: {product_name}
- Category: {category}
- Description: {description}
- Material: {material}
- Brand: {brand}
- Purpose: {purpose}
- Packaging: {packaging}
- Weight Class: {weight_class}
- Origin Cues: {origin_cues}

Vector similarity search returned these HS Code candidates:
{candidates_str}

Category-based chapter hints for "{category}": {chapter_hints}

Select the single most accurate 6-digit or 4-digit HS Code for this product under the Nigerian Customs Tariff (based on WCO Harmonized System).
If vector candidates are strong (similarity > 0.85), prefer them. Otherwise use your expert knowledge.
"""

VISION_PIPELINE_SYSTEM_PROMPT = "You are a customs classification expert. Analyze this product image and extract structured trade attributes."
