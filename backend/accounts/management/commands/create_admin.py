from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
import os

class Command(BaseCommand):
    help = 'Creates a superuser automatically'

    def handle(self, *args, **options):
        User = get_user_model()
        username = os.getenv('ADMIN_USERNAME', 'hmsadmin')
        email = os.getenv('ADMIN_EMAIL', 'hmsadmin@gmail.com')
        password = os.getenv('ADMIN_PASSWORD', 'Hms@1234')

        if User.objects.filter(username=username).exists():
            u = User.objects.get(username=username)
            u.set_password(password)
            u.is_active = True
            u.is_staff = True
            u.is_superuser = True
            u.save()
            self.stdout.write(self.style.SUCCESS(f'Updated superuser: {username}'))
        else:
            User.objects.create_superuser(
                username=username,
                email=email,
                password=password
            )
            self.stdout.write(self.style.SUCCESS(f'Created superuser: {username}'))