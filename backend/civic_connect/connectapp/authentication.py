"""Expiring token authentication.

DRF's built-in TokenAuthentication never expires, so a leaked token works
forever. This subclass enforces a TTL (default 30 days, see TOKEN_TTL_DAYS):
expired tokens are deleted on use and the request is rejected, so the
frontend falls back to the sign-in page.
"""

from datetime import timedelta

from django.conf import settings
from django.utils import timezone
from rest_framework.authentication import TokenAuthentication
from rest_framework.exceptions import AuthenticationFailed


def token_ttl():
    days = getattr(settings, 'TOKEN_TTL_DAYS', 30)
    try:
        return timedelta(days=int(days))
    except (TypeError, ValueError):
        return timedelta(days=30)


class ExpiringTokenAuthentication(TokenAuthentication):
    def authenticate_credentials(self, key):
        user, token = super().authenticate_credentials(key)
        if token.created < timezone.now() - token_ttl():
            token.delete()
            raise AuthenticationFailed('Token has expired. Sign in again.')
        return user, token
