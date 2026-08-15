# pyrefly: ignore [missing-import]
from django.contrib import admin
# pyrefly: ignore [missing-import]
from .models import User, ActivityLog

admin.site.register(User)
admin.site.register(ActivityLog)
