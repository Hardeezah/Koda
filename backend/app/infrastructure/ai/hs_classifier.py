import os
from typing import List

import instructor
from groq import AsyncGroq
from pydantic import BaseModel
from tenacity import retry, stop_after_attempt, wait_exponential

from app.domain.models.vision import HSCodeCandidate, HSCodeResult, ProductAttributes
from app.infrastructure.ai.prompts import (
    HS_CLASSIFICATION_PROMPT_TEMPLATE,
    HS_CLASSIFICATION_SYSTEM_PROMPT,
)
from app.infrastructure.db.hs_code_repository import hs_code_repository


class HSCodeLLMResponse(BaseModel):
    assigned_code: str
    description: str
    confidence: float
    chapter: str
    heading: str
    reasoning: str


CATEGORY_CHAPTER_HINTS = {
    "food": ["02", "03", "04", "07", "08", "09", "10", "11", "15", "16", "17", "18", "19", "20", "21"],
    "agricultural": ["06", "07", "08", "09", "10", "12", "13", "14"],
    "textile": ["50", "51", "52", "53", "54", "55", "56", "57", "58", "59", "60", "61", "62", "63"],
    "electronics": ["84", "85", "86", "90"],
    "machinery": ["84", "85", "86", "87", "88", "89"],
    "chemicals": ["28", "29", "30", "31", "32", "33", "34", "35", "36", "37", "38"],
    "pharmaceutical": ["29", "30"],
    "cosmetics": ["33", "34"],
    "building_materials": ["25", "26", "68", "69", "70", "72", "73", "74"],
    "consumer_goods": ["39", "40", "42", "44", "48", "61", "62", "64", "69", "70", "73", "83", "84", "85", "94", "95"],
    "vehicles": ["86", "87", "88", "89"],
}


class HSClassifier:
    def __init__(self):
        self.client = instructor.from_groq(AsyncGroq(api_key=os.environ.get("GROQ_API_KEY")), mode=instructor.Mode.JSON)
        self.model = "qwen/qwen3.8-27b"

    def _build_search_query(self, attrs: ProductAttributes) -> str:
        parts = [attrs.product_name]
        if attrs.category and attrs.category != "other":
            parts.append(attrs.category)
        if attrs.material:
            parts.append(attrs.material)
        if attrs.purpose:
            parts.append(attrs.purpose)
        if attrs.description:
            parts.append(attrs.description)
        return " ".join(parts)

    def _format_candidates(self, candidates: List[HSCodeCandidate]) -> str:
        if not candidates:
            return "No vector candidates found."
        lines = []
        for c in candidates:
            lines.append(
                f"- {c.code}: {c.description} (Chapter {c.chapter}, similarity: {c.similarity:.3f})"
            )
        return "\n".join(lines)

    @retry(wait=wait_exponential(min=1, max=10), stop=stop_after_attempt(3))
    async def classify(self, attrs: ProductAttributes) -> HSCodeResult:
        query = self._build_search_query(attrs)
        candidates = await hs_code_repository.semantic_search(query, match_count=5)

        chapter_hints = CATEGORY_CHAPTER_HINTS.get(attrs.category, [])
        chapter_hints_str = ", ".join(chapter_hints) if chapter_hints else "none"

        prompt = HS_CLASSIFICATION_PROMPT_TEMPLATE.format(
            product_name=attrs.product_name,
            category=attrs.category,
            description=attrs.description,
            material=attrs.material or "unknown",
            brand=attrs.brand or "unknown",
            purpose=attrs.purpose or "unknown",
            packaging=attrs.packaging or "unknown",
            weight_class=attrs.weight_class or "unknown",
            origin_cues=attrs.origin_cues or "none visible",
            candidates_str=self._format_candidates(candidates),
            chapter_hints=chapter_hints_str
        )

        raw_response = await self.client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": HS_CLASSIFICATION_SYSTEM_PROMPT,
                },
                {"role": "user", "content": prompt},
            ],
            model=self.model,
            response_model=HSCodeLLMResponse,
            temperature=0.1,
        )

        return HSCodeResult(
            **raw_response.model_dump(),
            candidates=candidates,
        )


hs_classifier = HSClassifier()
