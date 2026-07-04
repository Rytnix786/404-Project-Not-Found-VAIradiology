from datetime import date
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from .models import Task, Tag

User = get_user_model()

class TaskAPITests(APITestCase):
    """
    Test suite for the Tasks REST API.
    """
    def setUp(self):
        # Create two separate users to test owner isolation boundaries
        self.user_a = User.objects.create_user(email='user_a@test.com', password='password123')
        self.user_b = User.objects.create_user(email='user_b@test.com', password='password123')
        
        # Authenticate user_a by default
        self.client.force_authenticate(user=self.user_a)
        self.url = reverse('task-list')

    def test_create_task_with_tags(self):
        """
        Verify that a task can be successfully created with tags and is assigned to the authenticated owner.
        """
        data = {
            "title": "Build Django REST API",
            "description": "Scaffold data structures and endpoints",
            "status": "in_progress",
            "priority": "high",
            "due_date": "2026-07-05",
            "tags": ["django", "rest", "backend"]
        }
        
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify response attributes
        self.assertEqual(response.data['title'], "Build Django REST API")
        self.assertEqual(response.data['owner'], self.user_a.email)
        self.assertEqual(len(response.data['tags']), 3)
        self.assertIn("django", response.data['tags'])

        # Check database records
        task = Task.objects.get(id=response.data['id'])
        self.assertEqual(task.title, "Build Django REST API")
        self.assertEqual(task.owner, self.user_a)
        self.assertEqual(task.status, "in_progress")
        self.assertEqual(task.priority, "high")
        self.assertEqual(task.due_date, date(2026, 7, 5))
        
        # Verify Tag instances are created in DB
        self.assertEqual(task.tags.count(), 3)
        self.assertTrue(Tag.objects.filter(name="django").exists())

    def test_create_task_validation(self):
        """
        Verify validation rules: title is required and cannot be empty/whitespace, due_date is required.
        """
        # Test empty title validation
        data = {
            "title": "   ",
            "due_date": "2026-07-05"
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("title", response.data)

        # Test missing due_date validation
        data = {
            "title": "Valid Title"
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("due_date", response.data)

    def test_filter_tasks_by_date_and_status(self):
        """
        Verify database-level filtering by due_date and status.
        """
        # Create test tasks under User A
        Task.objects.create(title="Task 1", due_date="2026-07-04", status="todo", owner=self.user_a)
        Task.objects.create(title="Task 2", due_date="2026-07-04", status="in_progress", owner=self.user_a)
        Task.objects.create(title="Task 3", due_date="2026-07-05", status="todo", owner=self.user_a)
        
        # Filter by Date
        response = self.client.get(self.url, {"date": "2026-07-04"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Note: Pagination returns results nested under 'results' key
        self.assertEqual(response.data["count"], 2)
        titles = [t["title"] for t in response.data["results"]]
        self.assertIn("Task 1", titles)
        self.assertIn("Task 2", titles)
        
        # Filter by Date AND Status
        response = self.client.get(self.url, {"date": "2026-07-04", "status": "todo"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["title"], "Task 1")

    def test_owner_data_isolation(self):
        """
        Verify that a user cannot see or modify other users' tasks.
        """
        # Create a task owned by User B
        task_b = Task.objects.create(title="User B Task", due_date="2026-07-04", owner=self.user_b)
        
        # User A lists tasks - should return 0 results because of owner isolation
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 0)
        
        # User A tries to retrieve User B's task details - should return 404 (Not Found)
        detail_url = reverse('task-detail', args=[task_b.id])
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
