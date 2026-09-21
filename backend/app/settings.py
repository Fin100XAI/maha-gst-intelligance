"""Configuration.

Secrets come from the environment or a keyring, never from a file in the repo
and never into a log line.  Every value has a development default that works
against ``docker compose up`` and a production value that does not.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="DRISHTI_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    environment: Literal["development", "staging", "production"] = "development"
    debug: bool = False

    #: Deployment is inside the State network (State Data Centre or NIC/MeghRaj).
    #: No taxpayer data leaves Indian soil.
    deployment_note: str = "State Data Centre / NIC MeghRaj, inside the State network"

    #: SQLite is the supported database.  The whole schema, every migration and
    #: the full suite run on it, and a State Commercial Taxes deployment of this
    #: size -- tens of thousands of taxpayers, a nightly batch, a handful of
    #: concurrent officers -- is comfortably inside what a single file handles.
    #: The `JSON_DOC` type still carries a JSONB variant, so moving to
    #: PostgreSQL later is a URL change rather than a rewrite.
    database_url: str = "sqlite:///./drishti.db"
    redis_url: str = "redis://localhost:6379/0"

    minio_endpoint: str = "localhost:9000"
    minio_access_key: SecretStr = SecretStr("drishti")
    minio_secret_key: SecretStr = SecretStr("drishti-dev-secret")
    minio_bucket: str = "drishti-uploads"
    minio_secure: bool = False

    #: The State the deployment serves.  Drives the QRMP due-date category and
    #: the intra-State test; it is not cosmetic.
    state_code: str = "27"
    default_language: Literal["en", "mr", "hi"] = "en"

    api_prefix: str = "/api/v1"
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:5173"])

    #: Ingestion limits (section 6 hardening; enforced from Phase 1).
    max_upload_mb: int = 64
    allowed_upload_extensions: list[str] = Field(
        default_factory=lambda: [".xlsx", ".xls", ".xlsm", ".csv"]
    )
    #: Where raw uploads are kept until object storage is wired. Immutable
    #: once written: the provenance drawer resolves back to these bytes.
    upload_dir: str = "uploads"

    engine_version: str = "0.1.0"
    params_version: str = "unapproved-defaults"

    def database_url_for_alembic(self) -> str:
        return self.database_url


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
