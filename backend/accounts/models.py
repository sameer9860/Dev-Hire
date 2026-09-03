# pyrefly: ignore [missing-import]
from django.contrib.auth.models import AbstractUser
# pyrefly: ignore [missing-import]
from django.db import models
# pyrefly: ignore [missing-import]
from django.db.models import Q
# pyrefly: ignore [missing-import]
from django.conf import settings


class User(AbstractUser):
       ROLE_CHOICES = [
           ('developer', 'Developer'),
           ('company', 'Company'),
           ('admin', 'Admin'),
       ]
       role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='developer')
       bio = models.TextField(blank=True)
       avatar_url = models.CharField(max_length=500, blank=True)
       # Company-specific
       company_name = models.CharField(max_length=200, blank=True)
       company_website = models.CharField(max_length=500, blank=True)
       company_size = models.CharField(max_length=50, blank=True)
       company_category = models.CharField(max_length=100, blank=True)
       company_founded = models.CharField(max_length=10, blank=True)
       company_location = models.CharField(max_length=255, blank=True)
       company_address = models.CharField(max_length=500, blank=True)
       company_photos = models.JSONField(default=list, blank=True)
       company_social_links = models.JSONField(default=list, blank=True)
       # Developer-specific
       resume_url = models.CharField(max_length=500, blank=True)
       skills = models.JSONField(default=list, blank=True)
       github_url = models.CharField(max_length=500, blank=True)
       portfolio_url = models.CharField(max_length=500, blank=True)
       headline = models.CharField(max_length=255, blank=True)
       location = models.CharField(max_length=255, blank=True)
       phone_number = models.CharField(max_length=50, blank=True)
       gender = models.CharField(max_length=32, blank=True)
       date_of_birth = models.DateField(null=True, blank=True)
       address = models.CharField(max_length=255, blank=True)
       province = models.CharField(max_length=100, blank=True)
       city = models.CharField(max_length=100, blank=True)
       current_address = models.CharField(max_length=255, blank=True)
       social_links = models.JSONField(default=list, blank=True)
       education = models.JSONField(default=list, blank=True)
       experience = models.JSONField(default=list, blank=True)
       projects = models.JSONField(default=list, blank=True)
       achievements = models.JSONField(default=list, blank=True)
       training = models.JSONField(default=list, blank=True)
       languages = models.JSONField(default=list, blank=True)
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


class ActivityLog(models.Model):
    CATEGORY_CHOICES = [
        ('application', 'Application'),
        ('bookmark', 'Bookmark'),
        ('profile', 'Profile'),
        ('security', 'Security'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='activity_logs',
    )
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    action = models.CharField(max_length=64)
    message = models.CharField(max_length=255)
    metadata = models.JSONField(default=dict, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user_id}: {self.message}"


class ContactMessage(models.Model):
    CATEGORY_CHOICES = [
        ('bug', 'Bug'),
        ('query', 'Query'),
        ('others', 'Others'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='contact_messages',
    )
    name = models.CharField(max_length=150)
    email = models.EmailField()
    subject = models.CharField(max_length=255)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='others')
    description = models.TextField()
    attachment_url = models.CharField(max_length=500, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    admin_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.category}] {self.subject} - {self.email}"


class DirectMessage(models.Model):
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_messages',
    )
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='received_messages',
    )
    subject = models.CharField(max_length=255, blank=True)
    body = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"From {self.sender.username} to {self.recipient.username}: {self.subject or self.body[:30]}"

