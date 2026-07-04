import io
from PIL import Image as PILImage
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from .models import Image, Shape

User = get_user_model()

def create_in_memory_image(width=100, height=200):
    """
    Helper function to generate a valid in-memory image file using Pillow.
    This lets us verify Django's width_field and height_field auto-populating behavior.
    """
    file_buffer = io.BytesIO()
    image = PILImage.new('RGB', size=(width, height), color=(73, 109, 137))
    image.save(file_buffer, 'png')
    file_buffer.seek(0)
    return SimpleUploadedFile(
        name='test_image.png',
        content=file_buffer.read(),
        content_type='image/png'
    )

class AnnotationAPITests(APITestCase):
    """
    Test suite for the Annotations REST API.
    """
    def setUp(self):
        # Create users
        self.user_a = User.objects.create_user(email='user_a@test.com', password='password123')
        self.user_b = User.objects.create_user(email='user_b@test.com', password='password123')
        
        # Authenticate User A
        self.client.force_authenticate(user=self.user_a)
        
        self.image_list_url = reverse('image-list')
        self.shape_list_url = reverse('shape-list')

    def test_upload_image_and_auto_metadata(self):
        """
        Verify that uploading an image successfully creates a record and auto-populates width/height.
        """
        image_file = create_in_memory_image(width=120, height=240)
        data = {'file': image_file}
        
        # multipart format is required for file uploads
        response = self.client.post(self.image_list_url, data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify metadata
        self.assertEqual(response.data['original_width'], 120)
        self.assertEqual(response.data['original_height'], 240)
        self.assertEqual(response.data['uploaded_by'], self.user_a.email)

        # Check database record
        img = Image.objects.get(id=response.data['id'])
        self.assertEqual(img.uploaded_by, self.user_a)
        self.assertEqual(img.original_width, 120)
        self.assertEqual(img.original_height, 240)

    def test_save_polygon_shape(self):
        """
        Verify that a polygon shape can be successfully saved with normalized coordinates.
        """
        # Upload an image first
        img = Image.objects.create(
            file=create_in_memory_image(),
            original_width=100,
            original_height=200,
            uploaded_by=self.user_a
        )
        
        valid_points = [
            {"x": 0.1, "y": 0.1},
            {"x": 0.9, "y": 0.1},
            {"x": 0.5, "y": 0.9}
        ]
        
        data = {
            "image": img.id,
            "shape_type": "polygon",
            "points": valid_points
        }
        
        response = self.client.post(self.shape_list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify database record
        shape = Shape.objects.get(id=response.data['id'])
        self.assertEqual(shape.image, img)
        self.assertEqual(shape.points, valid_points)

    def test_polygon_shape_validation(self):
        """
        Verify coordinate bounds and polygon formatting validation.
        """
        img = Image.objects.create(
            file=create_in_memory_image(),
            original_width=100,
            original_height=200,
            uploaded_by=self.user_a
        )

        # 1. Less than 3 points
        data = {
            "image": img.id,
            "shape_type": "polygon",
            "points": [{"x": 0.1, "y": 0.1}, {"x": 0.2, "y": 0.2}]
        }
        response = self.client.post(self.shape_list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("points", response.data)

        # 2. Out of bounds coordinates (x > 1.0)
        data = {
            "image": img.id,
            "shape_type": "polygon",
            "points": [
                {"x": 0.1, "y": 0.1},
                {"x": 1.5, "y": 0.2},
                {"x": 0.5, "y": 0.5}
            ]
        }
        response = self.client.post(self.shape_list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("points", response.data)

    def test_delete_specific_polygon(self):
        """
        Verify that deleting one specific polygon works and does not affect other shapes on the same image.
        """
        img = Image.objects.create(
            file=create_in_memory_image(),
            original_width=100,
            original_height=200,
            uploaded_by=self.user_a
        )
        
        # Create two shapes on the same image
        shape1 = Shape.objects.create(
            image=img,
            shape_type="polygon",
            points=[{"x": 0.1, "y": 0.1}, {"x": 0.2, "y": 0.1}, {"x": 0.2, "y": 0.2}]
        )
        shape2 = Shape.objects.create(
            image=img,
            shape_type="polygon",
            points=[{"x": 0.5, "y": 0.5}, {"x": 0.6, "y": 0.5}, {"x": 0.6, "y": 0.6}]
        )
        
        # Ensure both exist
        self.assertEqual(img.shapes.count(), 2)
        
        # Delete only shape1
        delete_url = reverse('shape-detail', args=[shape1.id])
        response = self.client.delete(delete_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Verify shape1 is deleted
        self.assertFalse(Shape.objects.filter(id=shape1.id).exists())
        # Verify shape2 is untouched
        self.assertTrue(Shape.objects.filter(id=shape2.id).exists())
        self.assertEqual(img.shapes.count(), 1)

    def test_user_owner_boundaries(self):
        """
        Verify that a user cannot see, create, or delete shapes on images owned by other users.
        """
        # User B uploads an image
        img_b = Image.objects.create(
            file=create_in_memory_image(),
            original_width=100,
            original_height=200,
            uploaded_by=self.user_b
        )
        
        # User A tries to create a shape on User B's image - should fail validation
        data = {
            "image": img_b.id,
            "shape_type": "polygon",
            "points": [{"x": 0.1, "y": 0.1}, {"x": 0.2, "y": 0.1}, {"x": 0.2, "y": 0.2}]
        }
        response = self.client.post(self.shape_list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # User B creates a shape
        shape_b = Shape.objects.create(
            image=img_b,
            shape_type="polygon",
            points=[{"x": 0.1, "y": 0.1}, {"x": 0.2, "y": 0.1}, {"x": 0.2, "y": 0.2}]
        )
        
        # User A tries to delete User B's shape - should return 404
        delete_url = reverse('shape-detail', args=[shape_b.id])
        response = self.client.delete(delete_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
