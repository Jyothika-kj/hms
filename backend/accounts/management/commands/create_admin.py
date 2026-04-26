from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

class Command(BaseCommand):
    help = 'Creates a superuser automatically'

    def handle(self, *args, **options):
        User = get_user_model()
        
        u, created = User.objects.get_or_create(username='admin')
        u.email = 'admin@hms.com'
        u.set_password('Hms@1234')
        u.is_active = True
        u.is_staff = True
        u.is_superuser = True
        u.save()
        
        if created:
            self.stdout.write(self.style.SUCCESS('Created admin'))
        else:
            self.stdout.write(self.style.SUCCESS('Updated admin password'))