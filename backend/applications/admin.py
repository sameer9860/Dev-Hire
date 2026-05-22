# pyrefly: ignore [missing-import]
from django.contrib import admin
from .models import Application

@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ['developer', 'job', 'status', 'applied_at']
    list_filter = ['status', 'job__job_type', 'job__location']
    search_fields = ['developer__username', 'developer__email', 'job__title']
    readonly_fields = ['applied_at', 'updated_at']
    fieldsets = (
        ('Application', {
            'fields': ('developer', 'job', 'status', 'applied_at', 'updated_at')
        }),
        ('Content', {
            'fields': ('cover_letter', 'resume_url', 'notes')
        }),
    )
