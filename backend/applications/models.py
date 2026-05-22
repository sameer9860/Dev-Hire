# pyrefly: ignore [missing-import]
from django.db import models
# pyrefly: ignore [missing-import]
from django.conf import settings

class Application(models.Model):
       STATUS_CHOICES = [
           ('pending', 'Pending'),
           ('reviewing', 'Reviewing'),
           ('shortlisted', 'Shortlisted'),
           ('accepted', 'Accepted'),
           ('rejected', 'Rejected'),
       ]
       developer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                                     related_name='applications')
       job = models.ForeignKey('jobs.Job', on_delete=models.CASCADE, related_name='applications')
       cover_letter = models.TextField(blank=True)
       resume_url = models.URLField(blank=True)
       status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
       applied_at = models.DateTimeField(auto_now_add=True)
       updated_at = models.DateTimeField(auto_now=True)
       notes = models.TextField(blank=True)  # Company internal notes

       class Meta:
           unique_together = ['developer', 'job']  # No duplicate applications
           ordering = ['-applied_at']

       def __str__(self):
           return f"{self.developer.username} → {self.job.title}"