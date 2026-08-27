import asyncio
import logging
from typing import List, Optional

from app.domain.models.rag import RetrievedChunk
from app.infrastructure.supabase import get_supabase_admin

logger = logging.getLogger(__name__)

MAX_RETRIES = 3
RETRY_DELAY = 1.0


class RegulatoryRetriever:
    def __init__(self):
        self._embedder = None
        self._embedding_disabled = False

    def _get_embedder(self):
        import os
        if self._embedding_disabled or os.environ.get("DISABLE_LOCAL_EMBEDDINGS", "false").lower() == "true":
            self._embedding_disabled = True
            return None
            
        if self._embedder is None:
            try:
                from fastembed import TextEmbedding
                # threads=1 reduces RAM usage significantly
                self._embedder = TextEmbedding(model_name="BAAI/bge-small-en-v1.5", threads=1)
            except Exception as e:
                logger.error(f"Failed to load embedder: {e}")
                self._embedding_disabled = True
        return self._embedder

    async def _embed_query(self, query: str) -> List[float]:
        embedder = self._get_embedder()
        if not embedder:
            # Return dummy 384D unit vector to satisfy pgvector, relying purely on BM25 FTS ranking
            dummy = [0.0] * 384
            dummy[0] = 1.0
            return dummy

        def _do():
            results = list(embedder.embed([query]))
            return results[0].tolist()
        return await asyncio.get_event_loop().run_in_executor(None, _do)

    async def retrieve(
        self,
        query: str,
        match_count: int = 8,
        filter_agency: Optional[str] = None,
    ) -> List[RetrievedChunk]:
        last_error = None
        for attempt in range(MAX_RETRIES):
            try:
                query_vector = await self._embed_query(query)
                supabase = get_supabase_admin()

                params = {
                    "query_text": query,
                    "query_embedding": query_vector,
                    "match_count": match_count,
                }
                if filter_agency:
                    params["filter_agency"] = filter_agency

                response = await asyncio.get_event_loop().run_in_executor(
                    None, lambda: supabase.rpc("match_document_chunks_hybrid", params).execute()
                )

                if not response.data:
                    return []

                return [
                    RetrievedChunk(
                        source=row["source"],
                        agency=row["agency"],
                        doc_date=row.get("doc_date"),
                        url=row.get("url"),
                        chunk_index=row.get("chunk_index", 0),
                        content=row["content"],
                        similarity=row["similarity"],
                    )
                    for row in response.data
                ]
            except Exception as e:
                last_error = e
                logger.warning(
                    "Retriever attempt %d/%d failed: %s",
                    attempt + 1,
                    MAX_RETRIES,
                    e,
                )
                if attempt < MAX_RETRIES - 1:
                    await asyncio.sleep(RETRY_DELAY * (attempt + 1))

        logger.error("Retriever failed after %d retries: %s", MAX_RETRIES, last_error)
        raise last_error

    async def retrieve_for_compliance(
        self, product_name: str, direction: str
    ) -> List[RetrievedChunk]:
        query = f"{direction} compliance Nigeria {product_name} regulations requirements"
        try:
            chunks = await self.retrieve(query, match_count=8)
        except Exception:
            logger.exception("Compliance retrieval failed for product=%s", product_name)
            return []

        if not chunks:
            return []

        min_similarity = 0.30
        filtered = [c for c in chunks if c.similarity >= min_similarity]
        logger.info(
            "Compliance retrieval: %d chunks returned, %d above similarity threshold",
            len(chunks),
            len(filtered),
        )
        return filtered


regulatory_retriever = RegulatoryRetriever()
