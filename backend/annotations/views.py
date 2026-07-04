from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Image, Shape
from .serializers import ImageSerializer, ShapeSerializer

class ImageViewSet(viewsets.ModelViewSet):
    """
    ViewSet for uploading and listing Image files.
    Enforces owner-only access.
    """
    serializer_class = ImageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Return only images uploaded by the current user
        # Prefetch shapes to optimize JSON response serialization
        return Image.objects.filter(uploaded_by=user).prefetch_related('shapes')


class ShapeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Shape annotations.
    Enforces that users can only interact with shapes on images they own.
    """
    serializer_class = ShapeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Restruct query scope to shapes connected to images owned by the request user
        queryset = Shape.objects.filter(image__uploaded_by=user)
        
        # Support optional filtering of shapes by parent image
        image_id = self.request.query_params.get('image')
        if image_id:
            queryset = queryset.filter(image_id=image_id)
            
        return queryset
