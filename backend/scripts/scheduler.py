import asyncio
import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from app.infrastructure.rag.document_ingestion import ingest_all_from_assets

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("DataPipeline")

async def sync_regulatory_documents():
    """
    Automated retraining/ingestion trigger.
    Pulls latest regulatory documents from assets (or an external S3/API in the future),
    chunks them, embeds them, and updates the Supabase vector store.
    """
    logger.info("Starting automated Vector DB sync for regulatory documents...")
    try:
        results = await ingest_all_from_assets()
        total_chunks = sum(results.values())
        logger.info("Vector DB sync complete. Ingested %d chunks across %d sources.", total_chunks, len(results))
    except Exception as e:
        logger.error("Vector DB sync failed: %s", e)

if __name__ == "__main__":
    scheduler = AsyncIOScheduler()

    # Schedule the sync to run every night at 2:00 AM
    scheduler.add_job(
        sync_regulatory_documents,
        CronTrigger(hour=2, minute=0),
        id="sync_regulations",
        name="Sync Regulatory Documents to Vector DB",
        replace_existing=True
    )

    logger.info("Starting ML Data Pipeline Scheduler...")
    logger.info("Next sync scheduled for: 02:00 AM")

    scheduler.start()

    # Run once immediately on startup for demonstration purposes
    asyncio.get_event_loop().run_until_complete(sync_regulatory_documents())

    try:
        asyncio.get_event_loop().run_forever()
    except (KeyboardInterrupt, SystemExit):
        logger.info("Scheduler shutting down...")
