# pyrefly: ignore [missing-import]
from django.db import models
# pyrefly: ignore [missing-import]
from django.conf import settings

class Job(models.Model):
       JOB_TYPE = [
           ('full-time', 'Full Time'),
           ('part-time', 'Part Time'),
           ('contract', 'Contract'),
           ('internship', 'Internship'),
       ]
       EXPERIENCE_LEVEL = [
           ('junior', 'Junior'),
           ('mid', 'Mid'),
           ('senior', 'Senior'),
       ]
       company = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                                   related_name='posted_jobs')
       title = models.CharField(max_length=200)
       description = models.TextField()
       requirements = models.TextField()
       location = models.CharField(max_length=200)
       is_remote = models.BooleanField(default=False)
       job_type = models.CharField(max_length=20, choices=JOB_TYPE, default='full-time')
       experience_level = models.CharField(max_length=20, choices=EXPERIENCE_LEVEL, default='junior')
       tech_stack = models.JSONField(default=list)  # e.g. ["Python", "React", "PostgreSQL"]
       salary_min = models.PositiveIntegerField(null=True, blank=True)
       salary_max = models.PositiveIntegerField(null=True, blank=True)
       is_active = models.BooleanField(default=True)
       created_at = models.DateTimeField(auto_now_add=True)
       updated_at = models.DateTimeField(auto_now=True)
       deadline = models.DateField(null=True, blank=True)

       class Meta:
           ordering = ['-created_at']

       def __str__(self):
           return f"{self.title} at {self.company.company_name}"
