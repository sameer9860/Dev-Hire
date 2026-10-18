# pyrefly: ignore [missing-import]
from django.db import models
# pyrefly: ignore [missing-import]
from django.conf import settings


class Roadmap(models.Model):
    """
    An AI-generated career roadmap for a developer.
    Each developer can have at most one active roadmap per target_role.
    """
    DURATION_CHOICES = [
        ('30', '30 Days'),
        ('60', '60 Days'),
        ('90', '90 Days'),
    ]

    developer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='roadmaps',
    )
    target_role = models.CharField(max_length=200)
    duration_days = models.CharField(max_length=5, choices=DURATION_CHOICES, default='30')
    skill_gaps = models.JSONField(default=list, blank=True)   # ["React", "Docker", ...]
    summary = models.TextField(blank=True)                    # AI-generated intro paragraph
    ai_enhanced = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.developer.username} → {self.target_role} ({self.duration_days}d)"

    @property
    def completion_percent(self):
        tasks = self.tasks.all()
        total = tasks.count()
        if total == 0:
            return 0
        done = tasks.filter(is_completed=True).count()
        return round((done / total) * 100)


class RoadmapTask(models.Model):
    """
    A single actionable task within a roadmap (learn X, build Y, etc.)
    """
    CATEGORY_CHOICES = [
        ('learn', 'Learn'),
        ('build', 'Build / Project'),
        ('practice', 'Practice'),
        ('read', 'Read / Watch'),
        ('apply', 'Apply'),
    ]

    roadmap = models.ForeignKey(
        Roadmap,
        on_delete=models.CASCADE,
        related_name='tasks',
    )
    title = models.CharField(max_length=300)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='learn')
    resource_url = models.CharField(max_length=500, blank=True)
    week = models.PositiveSmallIntegerField(default=1)        # which week of the roadmap
    order = models.PositiveSmallIntegerField(default=0)       # sort order within the week
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['week', 'order']

    def __str__(self):
        status = "✓" if self.is_completed else "○"
        return f"{status} Week {self.week} | {self.title}"
