# pyrefly: ignore [missing-import]
from django.contrib import admin
# pyrefly: ignore [missing-import]
from .models import Job, SavedJob

admin.site.register(Job)
admin.site.register(SavedJob)
