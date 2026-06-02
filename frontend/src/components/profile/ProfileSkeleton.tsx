export function ProfileSkeleton() {
  return (
    <div className="max-w-2xl mx-auto p-6 animate-pulse space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-zinc-200" />
        <div className="space-y-2">
          <div className="h-5 w-40 bg-zinc-200 rounded" />
          <div className="h-4 w-24 bg-zinc-100 rounded" />
        </div>
      </div>
      <div className="h-24 bg-zinc-100 rounded-xl" />
      <div className="h-12 bg-zinc-100 rounded-xl" />
      <div className="h-12 bg-zinc-100 rounded-xl" />
    </div>
  );
}
