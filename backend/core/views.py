"""Contrôle de santé avec vraie requête SQL, sans détails internes divulgués."""
import logging

from django.db import DatabaseError, connection
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

logger = logging.getLogger(__name__)


class HealthView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = []

    def get(self, request):
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                result = cursor.fetchone()
            if result != (1,):
                raise DatabaseError("Database health probe returned unexpected data")
        except DatabaseError:
            logger.exception("Database health probe failed")
            return Response({"status": "unavailable"}, status=503)

        return Response({"status": "ok", "database": "ok", "service": "btdigit-agro-api"})
