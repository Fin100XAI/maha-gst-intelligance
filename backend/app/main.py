"""FastAPI application shell.

Phase 0 mounts health and a machine-readable statement of what is *not* yet
configured.  The real surface arrives with ingestion in Phase 1; nothing here
fabricates a number, and the coming-soon integrations answer 501 with the
parameters each one unlocks rather than with plausible-looking data.
"""

from __future__ import annotations

from typing import Any, Final

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.agents import router as agents_router
from app.api.v1.alignment import router as alignment_router
from app.api.v1.coverage import router as coverage_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.dashboard_views import router as dashboard_views_router
from app.api.v1.engine import router as engine_router
from app.api.v1.filings import router as filings_router
from app.api.v1.ingestion import router as ingestion_router
from app.api.v1.insights import router as insights_router
from app.api.v1.library import router as library_router
from app.api.v1.parameters import router as parameters_router
from app.api.v1.workbench import router as workbench_router
from app.api.v1.worklist import router as worklist_router
from app.canonical import UNCONFIGURED
from app.settings import Settings, get_settings

#: docs/03 section 7.  Each names the parameters it unlocks, which is what turns
#: a roadmap slide into a budget conversation.
COMING_SOON: Final[dict[str, dict[str, Any]]] = {
    "gstn": {
        "title": "GSTN back-office API",
        "status": "IN DEVELOPMENT",
        "eta": "Q2",
        "roadmap_ref": "RM-01",
        "unlocks": [],
        "capability": "Replaces the Excel upload path entirely",
    },
    "icegate": {
        "title": "ICEGATE customs",
        "status": "PLANNED",
        "eta": "Q3",
        "roadmap_ref": "RM-02",
        "unlocks": ["P02", "P15", "P20", "P23"],
        "capability": "Bill-of-entry and shipping-bill matching",
    },
    "itd": {
        "title": "ITD / AIS turnover",
        "status": "PLANNED",
        "eta": "Q3",
        "roadmap_ref": "RM-03",
        "unlocks": ["P33", "P34"],
        "capability": "Income-tax turnover cross-check",
    },
    "dgarm": {
        "title": "DGARM red-flag feed",
        "status": "PLANNED",
        "eta": "Q3",
        "roadmap_ref": "RM-04",
        "unlocks": ["P28"],
        "capability": "Red Flag Reports 2 to 5",
    },
    "refund": {
        "title": "Refund module",
        "status": "PLANNED",
        "eta": "Q3",
        "roadmap_ref": "RM-05",
        "unlocks": ["P25", "P26", "P27"],
        "capability": "IGST, LUT and inverted-duty refund claims",
    },
    "mca": {
        "title": "MCA / ROC directors",
        "status": "PLANNED",
        "eta": "Q4",
        "roadmap_ref": "RM-06",
        "unlocks": [],
        "capability": "Director and shareholding overlap, for REG-04 at scale",
    },
    "notice_pdf": {
        "title": "Notice PDF rendering",
        "status": "IN DEVELOPMENT",
        "eta": "Q2",
        "roadmap_ref": "RM-08",
        "unlocks": [],
        "capability": (
            "A served PDF in English and Marathi. Devanagari needs an embedded font; "
            "until then the document text and its hash are served as JSON, and it is "
            "that hash which enters the audit chain at approval."
        ),
    },
    "oidc": {
        "title": "OIDC against the State SSO",
        "status": "IN DEVELOPMENT",
        "eta": "Q2",
        "roadmap_ref": "RM-09",
        "unlocks": [],
        "capability": (
            "Real authentication. Until an identity provider is configured, a bearer "
            "token is refused rather than trusted, and only development reads the "
            "caller from headers."
        ),
    },
    "vahan": {
        "title": "VAHAN vehicles",
        "status": "PLANNED",
        "eta": "Q4",
        "roadmap_ref": "RM-07",
        "unlocks": [],
        "capability": "Vehicle existence and class, for EWB-07",
    },
}

router = APIRouter()


@router.get("/health", tags=["admin"])
def health() -> dict[str, str]:
    settings = get_settings()
    return {
        "status": "ok",
        "environment": settings.environment,
        "engine_version": settings.engine_version,
        "params_version": settings.params_version,
    }


@router.get("/admin/unconfigured", tags=["admin"])
def unconfigured() -> dict[str, Any]:
    """Everything the platform knows it does not know.

    Never invent a threshold, rate, due date or form number: the gaps are listed
    here and rendered in the admin screen as unconfigured, awaiting the law
    officer's signature.
    """
    return {
        "count": len(UNCONFIGURED),
        "items": [
            {
                "parameter_id": entry.parameter_id,
                "missing": entry.missing,
                "todo_ref": entry.todo_ref,
                "status": "AWAITING_STATUTORY_CONFIRMATION",
            }
            for entry in UNCONFIGURED
        ],
    }


@router.get("/integrations/{name}/status", tags=["coming-soon"])
def integration_status(name: str) -> JSONResponse:
    """501 with a roadmap reference.  No fabricated data, ever."""
    module = COMING_SOON.get(name)
    if module is None:
        return JSONResponse(
            status_code=404,
            content={"code": "NOT_FOUND", "detail": f"no integration named {name!r}"},
        )
    return JSONResponse(status_code=501, content={"code": "NOT_IMPLEMENTED", **module})


@router.get("/integrations", tags=["coming-soon"])
def integrations() -> dict[str, Any]:
    return {"items": [{"id": key, **value} for key, value in COMING_SOON.items()]}


def create_app(settings: Settings | None = None) -> FastAPI:
    active = settings or get_settings()
    app = FastAPI(
        title="GST DRISHTI",
        version=active.engine_version,
        description=(
            "GST compliance intelligence for a State Commercial Taxes Department. "
            "Every monetary value crosses this API as a string."
        ),
        docs_url=f"{active.api_prefix}/docs",
        openapi_url=f"{active.api_prefix}/openapi.json",
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=active.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(router, prefix=active.api_prefix)
    app.include_router(dashboard_router, prefix=active.api_prefix)
    app.include_router(dashboard_views_router, prefix=active.api_prefix)
    app.include_router(engine_router, prefix=active.api_prefix)
    app.include_router(library_router, prefix=active.api_prefix)
    app.include_router(alignment_router, prefix=active.api_prefix)
    app.include_router(coverage_router, prefix=active.api_prefix)
    app.include_router(insights_router, prefix=active.api_prefix)
    app.include_router(filings_router, prefix=active.api_prefix)
    app.include_router(parameters_router, prefix=active.api_prefix)
    app.include_router(ingestion_router, prefix=active.api_prefix)
    app.include_router(worklist_router, prefix=active.api_prefix)
    app.include_router(agents_router, prefix=active.api_prefix)
    app.include_router(workbench_router, prefix=active.api_prefix)
    return app


app = create_app()
