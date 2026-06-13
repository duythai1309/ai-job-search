from fastapi import APIRouter

from app.api.v1.health import router as health_router
from app.modules.cv.router import router as cv_router
from app.modules.cv_analysis.router import router as cv_analysis_router
from app.modules.compatibility.router import router as compatibility_router
from app.modules.jobs.router import router as jobs_router
from app.modules.matching.router import router as matching_router
from app.modules.recommendations.router import router as recommendations_router

api_router = APIRouter()
api_router.include_router(health_router, tags=["health"])
api_router.include_router(cv_router)
api_router.include_router(cv_analysis_router)
api_router.include_router(jobs_router)
api_router.include_router(matching_router)
api_router.include_router(recommendations_router)
api_router.include_router(compatibility_router)
