# pyrefly: ignore [missing-import]
from django.contrib.auth.models import AbstractUser
# pyrefly: ignore [missing-import]
from django.db import models
# pyrefly: ignore [missing-import]
from django.db.models import Q


class User(AbstractUser):
       ROLE_CHOICES = [
           ('developer', 'Developer'),
           ('company', 'Company'),
       ]
       role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='developer')
       bio = models.TextField(blank=True)
       avatar_url = models.CharField(max_length=500, blank=True)
       # Company-specific
       company_name = models.CharField(max_length=200, blank=True)
       company_website = models.CharField(max_length=500, blank=True)
       company_size = models.CharField(max_length=50, blank=True)
       # Developer-specific
       resume_url = models.CharField(max_length=500, blank=True)
       skills = models.JSONField(default=list)
       github_url = models.CharField(max_length=500, blank=True)
       portfolio_url = models.CharField(max_length=500, blank=True)
       # Social OAuth (developers only)
       oauth_provider = models.CharField(max_length=20, blank=True)
       oauth_uid = models.CharField(max_length=255, blank=True)

       class Meta:
           constraints = [
               models.UniqueConstraint(
                   fields=['oauth_provider', 'oauth_uid'],
                   name='unique_oauth_identity',
                   condition=~Q(oauth_uid=''),
               ),
           ]

       def __str__(self):
           return f"{self.username} ({self.role})"
