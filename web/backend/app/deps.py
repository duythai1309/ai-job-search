from __future__ import annotations
import time

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt, jwk
from jose.exceptions import JWTError

from app.config import settings
from app.models.schemas import UserInfo

bearer = HTTPBearer()

# Cache Supabase JWKS (public keys) for verifying ES256/RS256 tokens.
_jwks_cache: dict = {"keys": None, "fetched_at": 0.0}
_JWKS_TTL = 3600  # seconds


def _get_jwks(force: bool = False) -> list[dict]:
    now = time.time()
    if force or _jwks_cache["keys"] is None or now - _jwks_cache["fetched_at"] > _JWKS_TTL:
        url = f"{settings.supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json"
        resp = httpx.get(url, timeout=10)
        resp.raise_for_status()
        _jwks_cache["keys"] = resp.json().get("keys", [])
        _jwks_cache["fetched_at"] = now
    return _jwks_cache["keys"] or []


def _decode_token(token: str) -> dict:
    header = jwt.get_unverified_header(token)
    alg = header.get("alg", "")
    options = {"verify_aud": False}

    # Legacy symmetric secret
    if alg == "HS256":
        return jwt.decode(token, settings.supabase_jwt_secret, algorithms=["HS256"], options=options)

    # Modern asymmetric signing keys (Supabase default): verify with JWKS
    kid = header.get("kid")
    keys = _get_jwks()
    jwk_data = next((k for k in keys if k.get("kid") == kid), None)
    if jwk_data is None:
        # Key may have rotated — refresh once.
        keys = _get_jwks(force=True)
        jwk_data = next((k for k in keys if k.get("kid") == kid), None)
    if jwk_data is None:
        raise JWTError("No matching signing key")

    public_key = jwk.construct(jwk_data, alg)
    return jwt.decode(token, public_key, algorithms=[alg], options=options)


def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(bearer),
) -> UserInfo:
    token = creds.credentials
    try:
        payload = _decode_token(token)
        user_id: str = payload.get("sub")
        email: str = payload.get("email", "")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        return UserInfo(id=user_id, email=email)
    except HTTPException:
        raise
    except (JWTError, Exception):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
