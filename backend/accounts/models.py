# pyrefly: ignore [missing-import]
from django.contrib.auth.models import AbstractUser
# pyrefly: ignore [missing-import]
from django.db import models

class User(AbstractUser):
       ROLE_CHOICES = [
           ('developer', 'Developer'),
           ('company', 'Company'),
       ]
       role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='developer')
       bio = models.TextField(blank=True)
       avatar_url = models.URLField(blank=True)
       # Company-specific
       company_name = models.CharField(max_length=200, blank=True)
       company_website = models.URLField(blank=True)
       company_size = models.CharField(max_length=50, blank=True)
       # Developer-specific
       resume_url = models.URLField(blank=True)
       skills = models.JSONField(default=list)
       github_url = models.URLField(blank=True)
       portfolio_url = models.URLField(blank=True)

       def __str__(self):
           return f"{self.username} ({self.role})"
