from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    # Rely entirely on Django's built-in groups for RBAC, so no custom role field
    pass
