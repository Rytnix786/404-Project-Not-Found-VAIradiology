from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Task
from .serializers import TaskSerializer

class TaskViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing, editing, and deleting Task instances.
    Enforces owner-only access and supports database-level status/date filters.
    """
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Restrict queryset scope to tasks owned by the requesting user
        queryset = Task.objects.filter(owner=user)
        
        # Read query parameters
        date = self.request.query_params.get('date')
        status_param = self.request.query_params.get('status')
        
        # Apply database-level filters for performance
        if date:
            queryset = queryset.filter(due_date=date)
            
        if status_param:
            queryset = queryset.filter(status=status_param)
            
        # Prefetch tags to eliminate N+1 select queries during serialization
        return queryset.prefetch_related('tags')
