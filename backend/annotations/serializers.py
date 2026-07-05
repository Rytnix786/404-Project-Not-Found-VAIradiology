from rest_framework import serializers
from .models import Image, Shape

class ShapeSerializer(serializers.ModelSerializer):
    """
    Serializer for Shape models.
    Validates coordinate structure and ensures points are normalized (0.0 to 1.0).
    """
    class Meta:
        model = Shape
        fields = ('id', 'image', 'shape_type', 'points', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')

    def validate_points(self, value):
        """
        Validate that the points field is a list of dictionary coordinates
        normalized between 0.0 and 1.0.
        """
        if not isinstance(value, list):
            raise serializers.ValidationError("Points must be a list of coordinate dictionaries.")
        
        if len(value) < 3:
            raise serializers.ValidationError("A polygon shape requires at least 3 points.")
            
        for index, point in enumerate(value):
            if not isinstance(point, dict) or 'x' not in point or 'y' not in point:
                raise serializers.ValidationError(
                    f"Point at index {index} must contain 'x' and 'y' keys."
                )
            
            try:
                x = float(point['x'])
                y = float(point['y'])
            except (ValueError, TypeError):
                raise serializers.ValidationError(
                    f"Coordinates at index {index} must be numeric values."
                )
            
            # Check boundary conditions for normalized coordinates
            if not (0.0 <= x <= 1.0) or not (0.0 <= y <= 1.0):
                raise serializers.ValidationError(
                    f"Coordinates at index {index} must be normalized percentages between 0.0 and 1.0."
                )
                
        return value

    def validate(self, data):
        """
        Ensure user has permissions on the target Image before linking a Shape to it.
        """
        request = self.context.get('request')
        if request and 'image' in data:
            image = data['image']
            if image.uploaded_by != request.user:
                raise serializers.ValidationError(
                    {"image": "You do not have permission to annotate this image."}
                )
        return data


class ImageSerializer(serializers.ModelSerializer):
    """
    Serializer for Image models.
    Includes associated shapes inline.
    """
    shapes = ShapeSerializer(many=True, read_only=True)
    uploaded_by = serializers.ReadOnlyField(source='uploaded_by.email')
    
    class Meta:
        model = Image
        fields = (
            'id', 'file', 'original_width', 'original_height', 
            'uploaded_by', 'uploaded_at', 'shapes'
        )
        read_only_fields = ('id', 'original_width', 'original_height', 'uploaded_by', 'uploaded_at', 'shapes')

    def validate_file(self, value):
        """
        Hardened file upload security: validate image extension and file size limit.
        """
        import os
        ext = os.path.splitext(value.name)[1].lower()
        valid_extensions = ['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.tiff']
        if ext not in valid_extensions:
            raise serializers.ValidationError(
                f"Unsupported file extension '{ext}'. Allowed extensions: {', '.join(valid_extensions)}"
            )
        
        max_size = 10 * 1024 * 1024  # 10MB max limit
        if value.size > max_size:
            raise serializers.ValidationError("File size exceeds maximum limit of 10MB.")
            
        return value

    def create(self, validated_data):
        # Auto-assign the requesting user as the uploader
        validated_data['uploaded_by'] = self.context['request'].user
        return super().create(validated_data)
