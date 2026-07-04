from django.db import models
from django.conf import settings

class Image(models.Model):
    """
    Model representing uploaded images to be annotated.
    Width and height fields are automatically populated by Django on upload.
    """
    file = models.ImageField(
        upload_to='images/%Y/%m/%d/',
        width_field='original_width',
        height_field='original_height'
    )
    original_width = models.PositiveIntegerField(null=True, blank=True, editable=False)
    original_height = models.PositiveIntegerField(null=True, blank=True, editable=False)
    
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='uploaded_images'
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"Image {self.id} - {self.file.name}"


class Shape(models.Model):
    """
    Model representing custom vector shapes (polygons) drawn on images.
    Points are saved as normalized percentages (0.0 to 1.0) in JSON format.
    """
    image = models.ForeignKey(
        Image,
        on_delete=models.CASCADE,
        related_name='shapes'
    )
    shape_type = models.CharField(max_length=50, default='polygon')
    
    # Store array of normalized coordinate objects: [{"x": 0.12, "y": 0.45}, ...]
    points = models.JSONField()
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Shape {self.id} ({self.shape_type}) on Image {self.image_id}"
