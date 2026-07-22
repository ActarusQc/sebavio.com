export function MountainRoadIllustration({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 280 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={className}
    >
      <defs>
        <linearGradient id="dash-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a4a62" />
          <stop offset="100%" stopColor="#0e2d46" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="dash-mtn-far" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4e7f85" />
          <stop offset="100%" stopColor="#2f5257" />
        </linearGradient>
        <linearGradient id="dash-mtn-near" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6fa8a1" />
          <stop offset="100%" stopColor="#3f6a70" />
        </linearGradient>
      </defs>
      <rect width="280" height="200" fill="url(#dash-sky)" />
      <path
        d="M0 128 L48 72 L86 108 L120 58 L168 98 L210 48 L280 118 L280 200 L0 200 Z"
        fill="url(#dash-mtn-far)"
        opacity="0.85"
      />
      <path
        d="M0 148 L62 96 L102 128 L148 78 L198 124 L240 88 L280 132 L280 200 L0 200 Z"
        fill="url(#dash-mtn-near)"
      />
      <path
        d="M28 200 C70 168 96 152 132 148 C168 144 198 156 236 178 C250 186 264 194 280 200"
        stroke="#c9bda6"
        strokeWidth="14"
        strokeLinecap="round"
        fill="none"
        opacity="0.95"
      />
      <path
        d="M40 200 C78 172 100 158 132 154 C166 150 194 162 230 182"
        stroke="#faf9f6"
        strokeWidth="2.5"
        strokeDasharray="6 8"
        strokeLinecap="round"
        fill="none"
        opacity="0.8"
      />
      <path
        d="M212 42 L216.2 50.6 L225.5 51.2 L218.4 57.4 L220.8 66.4 L212 61.6 L203.2 66.4 L205.6 57.4 L198.5 51.2 L207.8 50.6 Z"
        fill="#f0b64d"
      />
      <circle cx="62" cy="46" r="3" fill="#faf9f6" opacity="0.9" />
      <circle cx="88" cy="34" r="2" fill="#faf9f6" opacity="0.7" />
      <circle cx="248" cy="58" r="2.5" fill="#faf9f6" opacity="0.75" />
    </svg>
  );
}
