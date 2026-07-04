from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for returning custom User information.
    """
    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'is_staff', 'date_joined')
        read_only_fields = ('id', 'is_staff', 'date_joined')

class LoginSerializer(serializers.Serializer):
    """
    Serializer for handling authentication requests via email and password.
    """
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
