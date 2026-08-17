'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const CATEGORIES = [
  { value: 'bug', label: 'Bug' },
  { value: 'query', label: 'Query' },
  { value: 'others', label: 'Others' },
];

export function ContactPageClient() {
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('others');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !category || !description.trim()) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    window.setTimeout(() => {
      setSubmitting(false);
      setSubject('');
      setCategory('others');
      setDescription('');
      toast.success('Message sent. We will get back to you within 24 hours.');
    }, 400);
  };

  return (
    <div className="min-h-full bg-zinc-50/50">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Contact Us</h1>
          <p className="mt-2 text-sm text-zinc-500 sm:text-base">
            We are here to help you. Report a bug or any queries.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8"
        >
          <div className="space-y-1.5">
            <Label htmlFor="subject" className="text-sm font-semibold text-zinc-800">
              Subject<span className="text-red-500">*</span>
            </Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              required
              className="h-10 border-zinc-200 bg-white"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="category" className="text-sm font-semibold text-zinc-800">
              Category<span className="text-red-500">*</span>
            </Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger id="category" className="h-10 w-full border-zinc-200 bg-white">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-sm font-semibold text-zinc-800">
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={6}
              className="min-h-32 border-zinc-200 bg-white"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="attachment" className="text-sm font-semibold text-zinc-800">
              Attachment
            </Label>
            <Input
              id="attachment"
              type="file"
              className="h-10 cursor-pointer border-zinc-200 bg-white file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:text-xs file:font-medium file:text-zinc-700"
            />
          </div>

          <p className="text-sm text-zinc-500">
            We will get back to you within 24 hours. Thank you for your patience.
          </p>

          <Button
            type="submit"
            disabled={submitting}
            className="cursor-pointer bg-zinc-950 text-white hover:bg-zinc-800"
          >
            {submitting ? 'Sending...' : 'Submit'}
          </Button>
        </form>
      </div>
    </div>
  );
}
