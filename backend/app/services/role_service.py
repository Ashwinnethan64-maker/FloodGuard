"""
Role and User Management Service for FLOODGUARD.
Enforces trusted role assignments, account statuses, and admin role delegation
backed securely by Supabase Auth Admin API and app_metadata.
"""

import json
import logging
import urllib.request
from typing import Dict, List, Optional
from datetime import datetime, timezone

from pydantic import BaseModel
from app.core.config import settings

logger = logging.getLogger("neerpath.role_service")

class UserProfileRecord(BaseModel):
    id: str
    email: str
    full_name: str
    role: str # 'administrator' | 'responder' | 'resident'
    account_status: str # 'active' | 'pending' | 'suspended'
    avatar_url: Optional[str] = None
    created_at: Optional[str] = None
    last_sign_in_at: Optional[str] = None

class RoleUpdateRequest(BaseModel):
    user_id: str
    role: str # 'administrator' | 'responder' | 'resident'
    account_status: Optional[str] = "active"

class AuditLogEntry(BaseModel):
    id: str
    action: str
    actor_id: str
    actor_email: str
    target_id: Optional[str] = None
    details: str
    timestamp: str

class RoleService:
    def __init__(self):
        self._audit_logs: List[AuditLogEntry] = [
            AuditLogEntry(
                id="audit-001",
                action="SYSTEM_INIT",
                actor_id="system",
                actor_email="system@floodguard.in",
                details="FLOODGUARD Security & Role Engine initialized.",
                timestamp=datetime.now(timezone.utc).isoformat()
            )
        ]

    def _get_headers(self) -> Dict[str, str]:
        key = settings.SUPABASE_SECRET_KEY or settings.SUPABASE_KEY
        return {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json"
        }

    def get_user_profile(self, user_id: str) -> Optional[UserProfileRecord]:
        """Fetch user from Supabase Admin API and construct trusted UserProfileRecord."""
        if not settings.SUPABASE_URL or not (settings.SUPABASE_SECRET_KEY or settings.SUPABASE_KEY):
            return None

        url = f"{settings.SUPABASE_URL}/auth/v1/admin/users/{user_id}"
        req = urllib.request.Request(url, headers=self._get_headers(), method="GET")
        try:
            with urllib.request.urlopen(req, timeout=5) as resp:
                u = json.loads(resp.read().decode())
                app_meta = u.get("app_metadata") or {}
                user_meta = u.get("user_metadata") or {}
                
                # Role defaults strictly to resident unless granted in app_metadata
                role = app_meta.get("role") or "resident"
                status = app_meta.get("account_status") or "active"

                return UserProfileRecord(
                    id=u["id"],
                    email=u.get("email", ""),
                    full_name=user_meta.get("full_name") or user_meta.get("name") or u.get("email", "").split("@")[0],
                    role=role,
                    account_status=status,
                    avatar_url=user_meta.get("avatar_url") or user_meta.get("picture"),
                    created_at=u.get("created_at"),
                    last_sign_in_at=u.get("last_sign_in_at")
                )
        except Exception as e:
            logger.warning(f"Error fetching user profile for {user_id}: {e}")
            return None

    def list_users(self) -> List[UserProfileRecord]:
        """List all registered users from Supabase Auth Admin API."""
        if not settings.SUPABASE_URL or not (settings.SUPABASE_SECRET_KEY or settings.SUPABASE_KEY):
            return []

        url = f"{settings.SUPABASE_URL}/auth/v1/admin/users"
        req = urllib.request.Request(url, headers=self._get_headers(), method="GET")
        try:
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = json.loads(resp.read().decode())
                users_raw = data.get("users", [])
                result = []
                for u in users_raw:
                    app_meta = u.get("app_metadata") or {}
                    user_meta = u.get("user_metadata") or {}
                    role = app_meta.get("role") or "resident"
                    status = app_meta.get("account_status") or "active"

                    result.append(UserProfileRecord(
                        id=u["id"],
                        email=u.get("email", ""),
                        full_name=user_meta.get("full_name") or user_meta.get("name") or u.get("email", "").split("@")[0],
                        role=role,
                        account_status=status,
                        avatar_url=user_meta.get("avatar_url") or user_meta.get("picture"),
                        created_at=u.get("created_at"),
                        last_sign_in_at=u.get("last_sign_in_at")
                    ))
                return result
        except Exception as e:
            logger.error(f"Error listing users from Supabase: {e}")
            return []

    def update_user_role(self, target_user_id: str, new_role: str, account_status: str, actor_id: str, actor_email: str) -> bool:
        """Update user role and account status in Supabase app_metadata."""
        if new_role not in ["administrator", "responder", "resident"]:
            raise ValueError(f"Invalid role: {new_role}")

        if account_status not in ["active", "pending", "suspended"]:
            raise ValueError(f"Invalid account status: {account_status}")

        url = f"{settings.SUPABASE_URL}/auth/v1/admin/users/{target_user_id}"
        payload = {
            "app_metadata": {
                "role": new_role,
                "account_status": account_status
            }
        }
        data_bytes = json.dumps(payload).encode()
        req = urllib.request.Request(url, data=data_bytes, headers=self._get_headers(), method="PUT")
        try:
            with urllib.request.urlopen(req, timeout=5) as resp:
                if resp.status in (200, 204):
                    self.add_audit_log(
                        action="ROLE_UPDATE",
                        actor_id=actor_id,
                        actor_email=actor_email,
                        target_id=target_user_id,
                        details=f"Assigned role={new_role}, status={account_status}"
                    )
                    return True
                return False
        except Exception as e:
            logger.error(f"Failed to update role for {target_user_id}: {e}")
            return False

    def add_audit_log(self, action: str, actor_id: str, actor_email: str, details: str, target_id: Optional[str] = None):
        entry = AuditLogEntry(
            id=f"audit-{len(self._audit_logs) + 1:03d}",
            action=action,
            actor_id=actor_id,
            actor_email=actor_email,
            target_id=target_id,
            details=details,
            timestamp=datetime.now(timezone.utc).isoformat()
        )
        self._audit_logs.insert(0, entry)
        if len(self._audit_logs) > 100:
            self._audit_logs = self._audit_logs[:100]

    def get_audit_logs(self, limit: int = 50) -> List[AuditLogEntry]:
        return self._audit_logs[:limit]

role_service = RoleService()

