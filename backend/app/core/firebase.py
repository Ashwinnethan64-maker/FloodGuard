"""
NEERPATH Firebase Admin SDK Integration Helper.
Manages push notifications to registered browser clients for verified flood incidents,
underpass waterlogging warnings, and road blockage alerts.
Preserves Supabase as the primary database and authentication provider.
"""
import os
import json
import logging
from typing import Optional, Dict, Any, List
from app.core.config import settings

logger = logging.getLogger(__name__)

_firebase_admin_initialized = False

def initialize_firebase_admin() -> bool:
    """
    Initializes the Firebase Admin SDK if service account credentials exist.
    Supports either a JSON key file path or an inline JSON environment string.
    Returns True if initialized, False if running in mock/offline mode.
    """
    global _firebase_admin_initialized
    if _firebase_admin_initialized:
        return True

    try:
        import firebase_admin
        from firebase_admin import credentials

        # Check if already initialized by another module
        if len(firebase_admin._apps) > 0:
            _firebase_admin_initialized = True
            return True

        cred = None
        # 1. Check path to serviceAccountKey.json
        if settings.FIREBASE_SERVICE_ACCOUNT_KEY_PATH and os.path.exists(settings.FIREBASE_SERVICE_ACCOUNT_KEY_PATH):
            cred = credentials.Certificate(settings.FIREBASE_SERVICE_ACCOUNT_KEY_PATH)
            logger.info("Firebase Admin initialized using service account key file.")
        # 2. Check inline JSON string
        elif settings.FIREBASE_SERVICE_ACCOUNT_JSON:
            try:
                cert_dict = json.loads(settings.FIREBASE_SERVICE_ACCOUNT_JSON)
                cred = credentials.Certificate(cert_dict)
                logger.info("Firebase Admin initialized using inline service account JSON.")
            except Exception as json_err:
                logger.warning(f"Could not parse FIREBASE_SERVICE_ACCOUNT_JSON: {json_err}")

        if cred:
            firebase_admin.initialize_app(cred, {
                'projectId': settings.FIREBASE_PROJECT_ID
            })
            _firebase_admin_initialized = True
            return True
        else:
            logger.info("Firebase Admin service account key not provided. Push alerts will operate in simulation/broadcast mode.")
            return False

    except Exception as exc:
        logger.warning(f"Firebase Admin initialization failed: {exc}")
        return False

def send_push_notification(
    token: str,
    title: str,
    body: str,
    data: Optional[Dict[str, str]] = None
) -> Dict[str, Any]:
    """
    Sends a push notification to a specific FCM device token.
    """
    if not initialize_firebase_admin():
        return {
            "status": "simulated",
            "message": "Firebase Admin not configured with service account credentials. Push was logged locally.",
            "title": title,
            "token": token[:10] + "..." if token else None
        }

    try:
        from firebase_admin import messaging
        message = messaging.Message(
            notification=messaging.Notification(
                title=title,
                body=body
            ),
            data=data or {},
            token=token
        )
        response = messaging.send(message)
        return {
            "status": "success",
            "message_id": response,
            "title": title
        }
    except Exception as exc:
        logger.error(f"Error sending Firebase push notification: {exc}")
        return {
            "status": "error",
            "error": str(exc)
        }

def broadcast_flood_alert_push(
    tokens: List[str],
    title: str,
    body: str,
    data: Optional[Dict[str, str]] = None
) -> Dict[str, Any]:
    """
    Broadcasts a flood or road blockage alert to a list of registered FCM tokens.
    """
    if not tokens:
        return {"status": "no_recipients", "sent_count": 0}

    if not initialize_firebase_admin():
        return {
            "status": "simulated",
            "message": f"Simulated push delivery to {len(tokens)} registered browser clients.",
            "recipient_count": len(tokens),
            "title": title
        }

    try:
        from firebase_admin import messaging
        messages = [
            messaging.Message(
                notification=messaging.Notification(title=title, body=body),
                data=data or {},
                token=t
            )
            for t in tokens
        ]
        batch_response = messaging.send_each(messages)
        return {
            "status": "success",
            "success_count": batch_response.success_count,
            "failure_count": batch_response.failure_count,
            "total_recipients": len(tokens)
        }
    except Exception as exc:
        logger.error(f"Error sending multicast push notifications: {exc}")
        return {
            "status": "error",
            "error": str(exc),
            "total_recipients": len(tokens)
        }

