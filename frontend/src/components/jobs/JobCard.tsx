import type { Job } from '@/types/api';
   import { Badge } from '@/components/ui/badge';

   interface JobCardProps {
     job: Job;
     index?: number;
   }

   export function JobCard({ job, index = 0 }: JobCardProps) {
     const salaryDisplay = job.salary_min && job.salary_max
       ? `$${job.salary_min.toLocaleString()} – $${job.salary_max.toLocaleString()}`
       : 'Salary not disclosed';

     const colors = [
       'bg-blue-50 hover:bg-blue-100 border-blue-200',
       'bg-purple-50 hover:bg-purple-100 border-purple-200',
       'bg-green-50 hover:bg-green-100 border-green-200',
       'bg-amber-50 hover:bg-amber-100 border-amber-200',
       'bg-pink-50 hover:bg-pink-100 border-pink-200',
     ];
     const colorClass = colors[index % colors.length];

     return (
       <div className={`${colorClass} border rounded-lg p-5 hover:shadow-lg transition-all cursor-pointer`}>
         <div className="flex items-start justify-between gap-4">
           <div className="flex-1">
             <h3 className="font-semibold text-gray-900">{job.title}</h3>
             <p className="text-sm text-gray-600 mt-0.5">{job.company.company_name} · {job.location}</p>
           </div>
           {job.is_remote && <Badge variant="secondary">Remote</Badge>}
         </div>
         <div className="flex flex-wrap gap-1.5 mt-3">
           {job.tech_stack.slice(0, 5).map((tech) => (
             <span key={tech} className="text-xs bg-white/60 text-gray-700 px-2 py-0.5 rounded-md border border-gray-200">
               {tech}
             </span>
           ))}
         </div>
         <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
           <span>{salaryDisplay}</span>
           <span>{job.application_count} applicants</span>
         </div>
       </div>
     );
   }