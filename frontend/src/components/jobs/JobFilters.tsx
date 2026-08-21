'use client';
   import type { JobFilters, JobType, ExperienceLevel } from '@/types/api';

   interface JobFiltersProps {
     filters: JobFilters;
     onChange: (filters: JobFilters) => void;
   }

  export function JobFiltersPanel({ filters, onChange, inline = false }: JobFiltersProps & { inline?: boolean }) {
     const update = <K extends keyof JobFilters>(key: K, value: JobFilters[K]) => {
       onChange({ ...filters, [key]: value });
     };

    const selectClass = inline
      ? 'min-w-[170px] mt-1 border rounded-lg p-2 text-sm'
      : 'w-full mt-1 border rounded-lg p-2 text-sm';

    return (
      <div className={inline ? 'flex flex-wrap items-center gap-4' : 'space-y-4'}>
        <div className={inline ? 'flex-shrink-0' : ''}>
          <label className="text-sm font-medium">Job type</label>
          <select className={selectClass}
            value={filters.job_type ?? ''}
            onChange={(e) => update('job_type', (e.target.value as JobType) || undefined)}>
            <option value="">All types</option>
            <option value="full-time">Full time</option>
            <option value="part-time">Part time</option>
            <option value="contract">Contract</option>
            <option value="internship">Internship</option>
          </select>
        </div>
        <div className={inline ? 'flex-shrink-0' : ''}>
          <label className="text-sm font-medium">Experience</label>
          <select className={selectClass}
            value={filters.experience_level ?? ''}
            onChange={(e) => update('experience_level', (e.target.value as ExperienceLevel) || undefined)}>
            <option value="">Any level</option>
            <option value="junior">Junior</option>
            <option value="mid">Mid</option>
            <option value="senior">Senior</option>
          </select>
        </div>

        <div className={inline ? 'flex-shrink-0' : ''}>
          <label className="text-sm font-medium">Sort</label>
          <select className={selectClass}
            value={filters.ordering ?? ''}
            onChange={(e) => update('ordering', (e.target.value as string) || undefined)}>
            <option value="">Relevance</option>
            <option value="-created_at">Newest</option>
            <option value="created_at">Oldest</option>
            <option value="deadline">Nearest deadline</option>
          </select>
        </div>

        <label className={inline ? 'flex items-center gap-2 cursor-pointer ml-2' : 'flex items-center gap-2 cursor-pointer'}>
          <input type="checkbox" checked={filters.is_remote ?? false}
            onChange={(e) => update('is_remote', e.target.checked || undefined)} />
          <span className="text-sm">Remote only</span>
        </label>
      </div>
    );
   }