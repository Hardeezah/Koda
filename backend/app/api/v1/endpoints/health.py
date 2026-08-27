from fastapi import APIRouter
from app.infrastructure.supabase import get_supabase_admin

router = APIRouter()

@router.get("/health")
async def health_check():
    try:
        # A lightweight query to keep Supabase alive
        client = get_supabase_admin()
        client.table("profiles").select("id").limit(1).execute()
        db_status = "healthy"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    return {
        "status": "healthy", 
        "version": "0.1.0",
        "database": db_status
    }
