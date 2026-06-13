from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_router
from app.core.responses import APIErrorResponse


def create_app() -> FastAPI:
    app = FastAPI(
        title="VICA API",
        description="Modular monolith backend for the VICA Agentic Career MVP.",
        version="0.1.0",
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(RequestValidationError)
    async def request_validation_error(
        _request: Request,
        _exc: RequestValidationError,
    ) -> JSONResponse:
        error = APIErrorResponse(
            code="invalid_request",
            message="The request payload or parameters are invalid.",
            request_id=str(uuid4()),
        )
        return JSONResponse(status_code=422, content=error.model_dump())

    app.include_router(api_router, prefix="/api/v1")
    return app


app = create_app()
