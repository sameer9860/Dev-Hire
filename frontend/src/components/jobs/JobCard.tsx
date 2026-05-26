   import type { Job } from '@/types/api';
   import { Badge } from '@/components/ui/badge';

   interface JobCardProps {
     job: Job;
   }

   export function JobCard({ job }: JobCardProps) {
     const salaryDisplay = job.salary_min && job.salary_max
       ? `$${job.salary_min.toLocaleString()} – $${job.salary_max.toLocaleString()}`
       : 'Salary not disclosed';

     return (
       <div className="bg-white border rounded-xl p-5 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer">
         <div className="flex items-start justify-between gap-4">
           <div className="flex-1">
             <h3 className="font-semibold text-gray-900">{job.title}</h3>
             <p className="text-sm text-gray-500 mt-0.5">{job.company.company_name} · {job.location}</p>
           </div>
           {job.is_remote && <Badge variant="secondary">Remote</Badge>}
         </div>
         <div className="flex flex-wrap gap-1.5 mt-3">
           {job.tech_stack.slice(0, 5).map((tech) => (
             <span key={tech} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md">
               {tech}
             </span>
           ))}
         </div>
         <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
           <span>{salaryDisplay}</span>
           <span>{job.application_count} applicants</span>
         </div>
       </div>
     );
   }