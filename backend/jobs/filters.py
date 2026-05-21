import django_filters
from .models import Job

class JobFilter(django_filters.FilterSet):
       salary_min = django_filters.NumberFilter(field_name='salary_min', lookup_expr='gte')
       salary_max = django_filters.NumberFilter(field_name='salary_max', lookup_expr='lte')
       is_remote = django_filters.BooleanFilter()
       job_type = django_filters.ChoiceFilter(choices=Job.JOB_TYPE)
       experience_level = django_filters.ChoiceFilter(choices=Job.EXPERIENCE_LEVEL)

       class Meta:
           model = Job
           fields = ['is_remote', 'job_type', 'experience_level', 'salary_min', 'salary_max']