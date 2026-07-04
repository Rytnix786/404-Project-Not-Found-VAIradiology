import os
import io
from datetime import date
from PIL import Image as PILImage, ImageDraw
from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
from django.contrib.auth import get_user_model
from tasks.models import Task, Tag
from annotations.models import Image, Shape

User = get_user_model()

class Command(BaseCommand):
    help = 'Idempotently seed the database with demo user, sample tasks, and annotated images for production.'

    def handle(self, *args, **options):
        self.stdout.write('Seeding database...')

        # 1. Seed Demo User
        user, created = User.objects.get_or_create(
            email='demo@404.com',
            defaults={
                'first_name': 'Demo',
                'last_name': 'Radiologist',
                'is_staff': True,
                'is_superuser': True,
            }
        )
        user.set_password('password123')
        user.save()
        if created:
            self.stdout.write(self.style.SUCCESS('Created demo user: demo@404.com'))
        else:
            self.stdout.write(self.style.SUCCESS('Updated demo user credentials: demo@404.com'))

        # 2. Seed Tags
        tag_names = ['radiology', 'urgent', 'review', 'frontend', 'backend']
        tags = {}
        for tname in tag_names:
            tag_obj, _ = Tag.objects.get_or_create(name=tname)
            tags[tname] = tag_obj

        # 3. Seed Tasks for Today
        today = date.today()
        sample_tasks = [
            {
                'title': 'Review chest X-ray annotations',
                'description': 'Verify polygon boundaries for lung field nodule segmentations.',
                'status': 'todo',
                'priority': 'high',
                'due_date': today,
                'tags': [tags['radiology'], tags['urgent']],
            },
            {
                'title': 'Calibrate viewport scaling ratio',
                'description': 'Ensure responsive canvas coordinate conversion matches natural image dimensions.',
                'status': 'in_progress',
                'priority': 'medium',
                'due_date': today,
                'tags': [tags['frontend']],
            },
            {
                'title': 'Deploy Django & DRF API to Render',
                'description': 'Configure PostgreSQL, Whitenoise, CORS settings, and idempotent migrations.',
                'status': 'done',
                'priority': 'high',
                'due_date': today,
                'tags': [tags['backend']],
            },
        ]

        for tdata in sample_tasks:
            task, t_created = Task.objects.get_or_create(
                owner=user,
                title=tdata['title'],
                due_date=tdata['due_date'],
                defaults={
                    'description': tdata['description'],
                    'status': tdata['status'],
                    'priority': tdata['priority'],
                }
            )
            if not t_created:
                task.status = tdata['status']
                task.priority = tdata['priority']
                task.save()
            task.tags.set(tdata['tags'])

        self.stdout.write(self.style.SUCCESS(f'Seeded {len(sample_tasks)} tasks for {today}'))

        # 4. Seed Image & Shapes
        existing_images = Image.objects.filter(uploaded_by=user)
        if not existing_images.exists():
            # Create synthetic medical-like test image (800x600 dark canvas with shapes)
            img_buf = io.BytesIO()
            pil_img = PILImage.new('RGB', (800, 600), color=(15, 17, 21))
            draw = ImageDraw.Draw(pil_img)
            # Draw sample grid / scan simulation
            draw.ellipse([250, 150, 550, 450], outline=(60, 70, 90), width=3)
            draw.rectangle([350, 250, 450, 350], outline=(100, 120, 150), width=2)
            pil_img.save(img_buf, format='PNG')
            img_buf.seek(0)

            image_obj = Image.objects.create(
                file=ContentFile(img_buf.read(), name='demo_scan_01.png'),
                uploaded_by=user,
                original_width=800,
                original_height=600,
            )
            self.stdout.write(self.style.SUCCESS(f'Created sample image (ID {image_obj.id})'))

            # Create polygon annotation
            Shape.objects.create(
                image=image_obj,
                shape_type='polygon',
                points=[
                    {'x': 0.3125, 'y': 0.25},
                    {'x': 0.6875, 'y': 0.25},
                    {'x': 0.6875, 'y': 0.75},
                    {'x': 0.3125, 'y': 0.75},
                ]
            )
            self.stdout.write(self.style.SUCCESS('Created sample shape annotation'))
        else:
            self.stdout.write(self.style.SUCCESS(f'Demo image already exists ({existing_images.count()} image(s))'))

        self.stdout.write(self.style.SUCCESS('Database seed completed successfully.'))
