import logging
import os
from typing import List

from app.domain.models.rag import RetrievedChunk

logger = logging.getLogger(__name__)

AGENCY_SHORT_MAP = {
    "AfCFTA Secretariat": "AfCFTA",
    "Nigeria Customs Service": "NCS",
    "Central Bank of Nigeria": "CBN",
    "NAFDAC": "NAFDAC",
    "Standards Organisation of Nigeria": "SON",
    "Nigerian Export Promotion Council": "NEPC",
    "National Agricultural Quarantine Service": "NAQS",
    "NESREA": "NESREA",
}

_shared_cross_encoder = None

def _get_cross_encoder():
    global _shared_cross_encoder
    if os.environ.get("DISABLE_LOCAL_RERANKER", "false").lower() == "true":
        logger.info("Local reranker is disabled via environment variable to save memory.")
        return False
        
    if _shared_cross_encoder is None:
        try:
            from fastembed import TextCrossEncoder
            _shared_cross_encoder = TextCrossEncoder(model_name="Xenova/ms-marco-MiniLM-L-6-v2")
        except ImportError:
            logger.warning("fastembed not installed, cross-encoder disabled.")
            _shared_cross_encoder = False
    return _shared_cross_encoder

def rerank(chunks: List[RetrievedChunk], query_terms: List[str]) -> List[RetrievedChunk]:
    if not chunks:
        return []

    encoder = _get_cross_encoder()
    query = " ".join(query_terms)

    if not encoder:
        # Fallback to simple keyword boost if fastembed is missing
        query_lower = [t.lower() for t in query_terms]
        def score(chunk: RetrievedChunk) -> float:
            content_lower = chunk.content.lower()
            keyword_hits = sum(1 for term in query_lower if term in content_lower)
            return chunk.similarity + (keyword_hits * 0.05)
        return sorted(chunks, key=score, reverse=True)

    # Use Cross-Encoder for precise semantic relevance
    pairs = [(query, chunk.content) for chunk in chunks]
    # Fastembed returns a generator of scores
    scores = list(encoder.rerank(query, [chunk.content for chunk in chunks]))

    # We zip chunks with their new cross-encoder score
    for chunk, score in zip(chunks, scores):
        # Update the similarity to reflect the cross-encoder score
        chunk.similarity = float(score)

    # Filter out very low-scoring chunks to keep context window clean
    ranked = [c for c in chunks if c.similarity > 0.0]
    return sorted(ranked, key=lambda c: c.similarity, reverse=True)


def format_context(chunks: List[RetrievedChunk], max_chars: int = 6000) -> str:
    if not chunks:
        return "No regulatory documents retrieved."

    parts = []
    total = 0
    truncated = False
    for chunk in chunks:
        agency_short = AGENCY_SHORT_MAP.get(chunk.agency, chunk.agency)
        header = f"[SOURCE: {chunk.source} | AGENCY: {agency_short} | DATE: {chunk.doc_date or 'N/A'}]"
        block = f"{header}\n{chunk.content}\n"
        if total + len(block) > max_chars:
            truncated = True
            break
        parts.append(block)
        total += len(block)

    result = "\n---\n".join(parts)
    if truncated:
        remaining = len(chunks) - len(parts)
        if remaining > 0:
            logger.warning(
                "Context truncated: %d chunks dropped (%d chars limit). "
                "Consider increasing max_chars or reducing chunk count.",
                remaining,
                max_chars,
            )
            result += f"\n---\n[NOTE: {remaining} additional regulatory document chunks were omitted due to context length limits.]"
    return result


def extract_citations(chunks: List[RetrievedChunk]) -> List[dict]:
    seen = set()
    citations = []
    for chunk in chunks:
        key = (chunk.source, chunk.chunk_index)
        if key in seen:
            continue
        seen.add(key)
        agency_short = AGENCY_SHORT_MAP.get(chunk.agency, chunk.agency)
        excerpt = chunk.content[:300].strip()
        if len(chunk.content) > 300:
            last_space = excerpt.rfind(" ")
            if last_space > 200:
                excerpt = excerpt[:last_space]
        citations.append(
            {
                "source": chunk.source,
                "agency": chunk.agency,
                "agency_short": agency_short,
                "excerpt": excerpt,
                "url": chunk.url,
                "doc_date": chunk.doc_date,
                "relevance_score": round(chunk.similarity, 4),
            }
        )
    return citations
