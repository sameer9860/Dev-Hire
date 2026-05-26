'use client';
   import type { JobFilters, JobType, ExperienceLevel } from '@/types/api';

   interface JobFiltersProps {
     filters: JobFilters;
     onChange: (filters: JobFilters) => void;
   }

   export function JobFiltersPanel({ filters, onChange }: JobFiltersProps) {
     const update = <K extends keyof JobFilters>(key: K, value: JobFilters[K]) => {
       onChange({ ...filters, [key]: value });
     };

     return (
       <div className="space-y-4">
         <div>
           <label className="text-sm font-medium">Job type</label>
           <select className="w-full mt-1 border rounded-lg p-2 text-sm"
             value={filters.job_type ?? ''}
             onChange={(e) => update('job_type', (e.target.value as JobType) || undefined)}>
             <option value="">All types</option>
             <option value="full-time">Full time</option>
             <option value="part-time">Part time</option>
             <option value="contract">Contract</option>
             <option value="internship">Internship</option>
           </select>
         </div>
         <div>
           <label className="text-sm font-medium">Experience</label>
           <select className="w-full mt-1 border rounded-lg p-2 text-sm"
             value={filters.experience_level ?? ''}
             onChange={(e) => update('experience_level', (e.target.value as ExperienceLevel) || undefined)}>
             <option value="">Any level</option>
             <option value="junior">Junior</option>
             <option value="mid">Mid</option>
             <option value="senior">Senior</option>
           </select>
         </div>
         <label className="flex items-center gap-2 cursor-pointer">
           <input type="checkbox" checked={filters.is_remote ?? false}
             onChange={(e) => update('is_remote', e.target.checked || undefined)} />
           <span className="text-sm">Remote only</span>
         </label>
       </div>
     );
   }