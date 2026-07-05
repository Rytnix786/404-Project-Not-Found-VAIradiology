from django.contrib.auth import authenticate
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token
from .serializers import UserSerializer, LoginSerializer

class HealthCheckView(APIView):
    """
    Open health-check endpoint to confirm backend availability.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({
            "status": "healthy",
            "message": "Backend API is up and running"
        }, status=status.HTTP_200_OK)

class LoginView(APIView):
    """
    Authenticate user via email and password, returning their DRF token and user profile.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        
        # In our custom model, email is USERNAME_FIELD so django auth expects 'username=email'
        user = authenticate(request, username=email, password=password)
        if not user:
            return Response({
                "non_field_errors": ["Invalid email or password."]
            }, status=status.HTTP_400_BAD_REQUEST)
        
        token, created = Token.objects.get_or_create(user=user)
        user_serializer = UserSerializer(user)
        
        return Response({
            "token": token.key,
            "user": user_serializer.data
        }, status=status.HTTP_200_OK)

class LogoutView(APIView):
    """
    Revoke/delete the authenticated user's DRF auth token.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Delete user's active token safely from database
        from rest_framework.authtoken.models import Token
        Token.objects.filter(user=request.user).delete()
        return Response({
            "message": "Successfully logged out."
        }, status=status.HTTP_200_OK)

class MeView(APIView):
    """
    Return profile info for the currently authenticated user.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)
