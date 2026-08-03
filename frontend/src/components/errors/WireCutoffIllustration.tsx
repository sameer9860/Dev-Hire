export function WireCutoffIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 280 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Left cable body */}
      <path
        d="M0 78h78c6 0 10 4 14 10l18 28"
        stroke="#a1a1aa"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M0 78h78c6 0 10 4 14 10l18 28"
        stroke="#d4d4d8"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Right cable body */}
      <path
        d="M280 78h-78c-6 0-10 4-14 10l-18 28"
        stroke="#a1a1aa"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M280 78h-78c-6 0-10 4-14 10l-18 28"
        stroke="#d4d4d8"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Left frayed wires */}
      <path d="M108 112c6 4 10 14 8 24" stroke="#71717a" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M114 108c8 2 14 12 12 22" stroke="#52525b" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M120 104c6 6 8 16 4 24" stroke="#a1a1aa" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="116" cy="134" r="2.5" fill="#ef4444" />
      <circle cx="126" cy="128" r="2.5" fill="#22c55e" />
      <circle cx="124" cy="136" r="2.5" fill="#eab308" />

      {/* Right frayed wires */}
      <path d="M172 112c-6 4-10 14-8 24" stroke="#71717a" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M166 108c-8 2-14 12-12 22" stroke="#52525b" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M160 104c-6 6-8 16-4 24" stroke="#a1a1aa" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="164" cy="134" r="2.5" fill="#3b82f6" />
      <circle cx="154" cy="128" r="2.5" fill="#f97316" />
      <circle cx="156" cy="136" r="2.5" fill="#a855f7" />

      {/* Spark / break gap */}
      <path
        d="M136 88l4 10-6 4 8 8-4 10"
        stroke="#f59e0b"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="animate-pulse"
      />
      <path
        d="M148 86l-3 9 5 5-7 8 3 10"
        stroke="#fbbf24"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="animate-pulse"
      />

      {/* Cut marks */}
      <line x1="132" y1="72" x2="148" y2="96" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <line x1="148" y1="72" x2="132" y2="96" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}
