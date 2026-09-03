'use client';

import { useState, useEffect } from 'react';
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
import { useMe } from '@/hooks/useAuth';
import { useSubmitContactMessage } from '@/hooks/useMessages';
import { api } from '@/lib/api';
import { Loader2, CheckCircle2, Upload, Send } from 'lucide-react';

const CATEGORIES = [
  { value: 'bug', label: 'Bug Report' },
  { value: 'query', label: 'General Query' },
  { value: 'others', label: 'Others' },
];

export function ContactPageClient() {
  const { data: user } = useMe();
  const submitContactMutation = useSubmitContactMessage();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('query');
  const [description, setDescription] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (user) {
      if (!name) setName(user.username || '');
      if (!email) setEmail(user.email || '');
    }
  }, [user]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/auth/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAttachmentUrl(data.url);
      toast.success('File attached successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to upload attachment');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !subject.trim() || !category || !description.trim()) {
      toast.error('Please fill in all required fields.');
      return;
    }

    submitContactMutation.mutate(
      {
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        category,
        description: description.trim(),
        attachment_url: attachmentUrl,
      },
      {
        onSuccess: () => {
          setSubmitted(true);
        },
      }
    );
  };

  return (
    <div className="min-h-full bg-zinc-50/50">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="mb-8 text-center sm:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
            Get in touch
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Contact Us
          </h1>
          <p className="mt-2 text-sm text-zinc-500 sm:text-base">
            Have questions, feedback, or need technical support? Send us a message and our team will get back to you.
          </p>
        </div>

        {submitted ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-bold text-zinc-900">Message Sent Successfully!</h2>
            <p className="mt-2 text-sm text-zinc-500">
              Thank you for reaching out. Our team has received your message and will respond to <span className="font-semibold text-zinc-700">{email}</span> within 24 hours.
            </p>
            <Button
              onClick={() => {
                setSubmitted(false);
                setSubject('');
                setDescription('');
                setAttachmentUrl('');
              }}
              className="mt-6 bg-zinc-950 text-white hover:bg-zinc-800 rounded-xl"
            >
              Send Another Message
            </Button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-[0_2px_15px_rgba(0,0,0,0.02)] sm:p-8"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-semibold text-zinc-800 uppercase tracking-wider">
                  Your Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Smith"
                  required
                  className="h-10 border-zinc-200 bg-white rounded-xl focus:ring-2 focus:ring-zinc-950/5"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-zinc-800 uppercase tracking-wider">
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@company.com"
                  required
                  className="h-10 border-zinc-200 bg-white rounded-xl focus:ring-2 focus:ring-zinc-950/5"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="subject" className="text-xs font-semibold text-zinc-800 uppercase tracking-wider">
                  Subject <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Summarize your inquiry..."
                  required
                  className="h-10 border-zinc-200 bg-white rounded-xl focus:ring-2 focus:ring-zinc-950/5"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="category" className="text-xs font-semibold text-zinc-800 uppercase tracking-wider">
                  Category <span className="text-red-500">*</span>
                </Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger id="category" className="h-10 w-full border-zinc-200 bg-white rounded-xl">
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
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs font-semibold text-zinc-800 uppercase tracking-wider">
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide complete details about your issue or question..."
                required
                rows={5}
                className="min-h-28 border-zinc-200 bg-white rounded-xl focus:ring-2 focus:ring-zinc-950/5"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="attachment" className="text-xs font-semibold text-zinc-800 uppercase tracking-wider">
                Attachment (Optional)
              </Label>
              <div className="flex items-center gap-3">
                <input
                  id="attachment"
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="attachment"
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100"
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-zinc-600" />
                  ) : (
                    <Upload className="h-4 w-4 text-zinc-600" />
                  )}
                  {attachmentUrl ? 'Change Attachment' : 'Upload File / Screenshot'}
                </label>
                {attachmentUrl && (
                  <span className="text-xs font-medium text-emerald-600">Attached ✓</span>
                )}
              </div>
            </div>

            <div className="border-t border-zinc-100 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-zinc-500">
                We respect your privacy and answer all messages promptly.
              </p>

              <Button
                type="submit"
                disabled={submitContactMutation.isPending || uploading}
                className="w-full sm:w-auto cursor-pointer bg-zinc-950 text-white hover:bg-zinc-800 rounded-xl px-6 h-11 font-semibold flex items-center gap-2"
              >
                {submitContactMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {submitContactMutation.isPending ? 'Submitting...' : 'Send Message'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
