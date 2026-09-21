"""Who is calling.

Production authenticates against the State SSO over OIDC.  Until that is wired
to a real identity provider, development reads the caller from headers -- and
**refuses to do so outside development**, so the fallback cannot be left on by
accident in a deployment that issues statutory notices.

The identity this produces is a :class:`~app.security.rbac.Principal`, and
every query in the workbench goes through it.  An endpoint that does not take
``PrincipalDep`` cannot read taxpayer data, because it has no way to scope the
query.
"""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends, Header, HTTPException

from app.security.rbac import Principal, Role
from app.settings import get_settings

__all__ = ["PrincipalDep", "get_principal"]


def _split(value: str | None) -> frozenset[str]:
    return frozenset(part.strip() for part in (value or "").split(",") if part.strip())


def get_principal(
    *,
    x_officer_id: Annotated[str | None, Header()] = None,
    x_officer_role: Annotated[str | None, Header()] = None,
    x_officer_commissionerates: Annotated[str | None, Header()] = None,
    x_officer_divisions: Annotated[str | None, Header()] = None,
    x_officer_ranges: Annotated[str | None, Header()] = None,
    authorization: Annotated[str | None, Header()] = None,
) -> Principal:
    """Resolve the caller.

    An OIDC bearer token is the production path.  It is not yet wired to an
    identity provider, so a request carrying one is refused with 501 rather
    than quietly falling through to the development identity -- silently
    trusting an unverified token is how an authentication layer becomes
    decorative.
    """
    settings = get_settings()

    if authorization:
        raise HTTPException(
            status_code=501,
            detail={
                "code": "OIDC_NOT_CONFIGURED",
                "message": (
                    "bearer tokens are not verified yet: no identity provider is "
                    "configured. This endpoint refuses rather than trusting the token."
                ),
                "roadmap_ref": "RM-09",
            },
        )

    if settings.environment != "development":
        raise HTTPException(
            status_code=401,
            detail={
                "code": "NOT_AUTHENTICATED",
                "message": "OIDC against the State SSO is required outside development",
            },
        )

    if not x_officer_id or not x_officer_role:
        raise HTTPException(
            status_code=401,
            detail={
                "code": "NOT_AUTHENTICATED",
                "message": (
                    "development identity requires X-Officer-Id and X-Officer-Role; "
                    "there is no anonymous access to taxpayer data"
                ),
            },
        )

    try:
        role = Role(x_officer_role.upper())
    except ValueError as exc:
        raise HTTPException(
            status_code=401,
            detail={
                "code": "UNKNOWN_ROLE",
                "message": f"no role {x_officer_role!r}; roles are {[r.value for r in Role]}",
            },
        ) from exc

    return Principal(
        officer_id=x_officer_id,
        role=role,
        commissionerates=_split(x_officer_commissionerates),
        divisions=_split(x_officer_divisions),
        ranges=_split(x_officer_ranges),
    )


PrincipalDep = Annotated[Principal, Depends(get_principal)]
