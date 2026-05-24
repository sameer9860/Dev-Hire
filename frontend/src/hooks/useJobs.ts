import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
   import api from '@/lib/api';
   import type { Job, JobFormData, JobFilters, PaginatedResponse } from '@/types/api';

   export function useJobs(filters: JobFilters = {}) {
     return useQuery<PaginatedResponse<Job>>({
       queryKey: ['jobs', filters],
       queryFn: async () => {
         const { data } = await api.get('/jobs/', { params: filters });
         return data;
       },
     });
   }

   export function useJob(id: number) {
     return useQuery<Job>({
       queryKey: ['job', id],
       queryFn: async () => {
         const { data } = await api.get(`/jobs/${id}/`);
         return data;
       },
     });
   }

   export function useCreateJob() {
     const queryClient = useQueryClient();
     return useMutation<Job, Error, JobFormData>({
       mutationFn: async (jobData) => {
         const { data } = await api.post('/jobs/', jobData);
         return data;
       },
       onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['jobs'] });
       },
     });
   }