export default function GlobalLoading() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4 bg-white">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-zinc-950" />
      <p className="text-zinc-500 text-sm font-medium animate-pulse">Loading workspace...</p>
    </div>
  );
}
