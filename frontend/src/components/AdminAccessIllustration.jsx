export const AdminAccessIllustration = () => {
  return (
    <div className="admin-illustration-wrapper" aria-hidden="true">
      <svg
        viewBox="0 0 360 210"
        width="100%"
        height="100%"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
          <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f0f7ff" />
          </linearGradient>
          <filter id="softShadow" x="-10%" y="-10%" width="125%" height="125%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#1e3a8a" floodOpacity="0.08" />
          </filter>
        </defs>

        {/* Floating Profile Card in Background */}
        <g filter="url(#softShadow)">
          <rect x="180" y="24" width="130" height="96" rx="8" fill="url(#cardGrad)" stroke="#dbeafe" strokeWidth="1.2" />
          {/* Card avatar & lines */}
          <circle cx="210" cy="52" r="16" fill="#bfdbfe" />
          <path d="M198 64c0-6 5.5-8 12-8s12 2 12 8" fill="#60a5fa" />
          <circle cx="210" cy="48" r="7" fill="#60a5fa" />
          {/* Text lines placeholder */}
          <rect x="236" y="44" width="60" height="5" rx="2.5" fill="#93c5fd" />
          <rect x="236" y="55" width="42" height="4" rx="2" fill="#cbd5e1" />
          <rect x="195" y="78" width="100" height="4" rx="2" fill="#e2e8f0" />
          <rect x="195" y="88" width="70" height="4" rx="2" fill="#e2e8f0" />
          <rect x="195" y="98" width="85" height="4" rx="2" fill="#e2e8f0" />
        </g>

        {/* Security Shield Badge */}
        <g filter="url(#softShadow)">
          <path
            d="M305 48c0 14-9 24-18 28-9-4-18-14-18-28 0-9 18-15 18-15s18 6 18 15z"
            fill="url(#shieldGrad)"
          />
          {/* Checkmark inside shield */}
          <path
            d="M280 48l5 5 10-10"
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        {/* Left Potted Plant */}
        <g>
          {/* Plant pot */}
          <path d="M80 162h20l-3 24h-14z" fill="#93c5fd" />
          <ellipse cx="90" cy="162" rx="10" ry="3" fill="#60a5fa" />
          {/* Plant leaves */}
          <path d="M90 160c-8-12-16-16-24-15 2 10 9 18 20 18" fill="#34d399" />
          <path d="M88 152c-6-15-2-26 3-32 5 10 4 22-1 33" fill="#10b981" />
          <path d="M91 155c8-14 16-18 25-18-2 11-10 19-21 20" fill="#059669" />
          <path d="M90 144c-3-14 5-22 12-25 1 10-4 19-10 26" fill="#34d399" />
        </g>

        {/* Desk Surface */}
        <rect x="60" y="184" width="240" height="6" rx="3" fill="#cbd5e1" />

        {/* Right Books Stack */}
        <g>
          {/* Book 1 (Bottom, Blue) */}
          <rect x="254" y="174" width="38" height="10" rx="2" fill="#3b82f6" />
          <rect x="258" y="177" width="30" height="4" rx="1" fill="#93c5fd" />
          {/* Book 2 (Middle, Emerald) */}
          <rect x="256" y="165" width="34" height="9" rx="2" fill="#10b981" />
          <rect x="260" y="168" width="26" height="3" rx="1" fill="#a7f3d0" />
          {/* Book 3 (Top, Amber) */}
          <rect x="259" y="157" width="28" height="8" rx="2" fill="#f59e0b" />
          <rect x="262" y="160" width="22" height="2.5" rx="1" fill="#fde68a" />
        </g>

        {/* Female Character with Laptop */}
        <g>
          {/* Body/Suit */}
          <path
            d="M142 184l3-36c1-9 7-15 16-15h24c9 0 15 6 16 15l3 36z"
            fill="#475569"
          />
          {/* Blazer/Jacket */}
          <path
            d="M145 184l3-34c1-8 6-13 14-13h2c-2 12 2 24 8 28l-7 19z"
            fill="#3b82f6"
          />
          <path
            d="M195 184l-3-34c-1-8-6-13-14-13h-2c2 12-2 24-8 28l7 19z"
            fill="#2563eb"
          />
          {/* White inner shirt / collar */}
          <path d="M165 137l5 14 5-14z" fill="#ffffff" />

          {/* Neck */}
          <rect x="167" y="127" width="7" height="11" rx="3" fill="#fed7aa" />

          {/* Head & Hair */}
          {/* Back Hair */}
          <path
            d="M153 105c0-14 10-24 23-24s23 10 23 24v22c-5 6-13 8-23 8s-18-2-23-8z"
            fill="#1e293b"
          />
          {/* Face */}
          <ellipse cx="170" cy="115" rx="13" ry="14" fill="#fed7aa" />
          {/* Ear */}
          <circle cx="157" cy="116" r="3" fill="#fbcfe8" />
          {/* Hair Front Side */}
          <path
            d="M157 106c4-8 12-11 20-11 7 0 14 3 17 8 0 8-5 13-10 13-5 0-7-6-11-6-4 0-8 3-12 9z"
            fill="#0f172a"
          />
          {/* Gentle Smile & Eye */}
          <circle cx="165" cy="114" r="1.5" fill="#1e293b" />
          <circle cx="176" cy="114" r="1.5" fill="#1e293b" />
          <path d="M168 122c2 2 5 2 7 0" stroke="#b45309" strokeWidth="1.2" strokeLinecap="round" />

          {/* Hands Typing */}
          <ellipse cx="166" cy="180" rx="6" ry="4" fill="#fed7aa" />
          <ellipse cx="180" cy="180" rx="6" ry="4" fill="#fed7aa" />

          {/* Laptop */}
          {/* Base */}
          <rect x="150" y="180" width="46" height="5" rx="2" fill="#334155" />
          {/* Open Screen Angle */}
          <path
            d="M154 180l4-24h38l-4 24z"
            fill="#1e293b"
            stroke="#475569"
            strokeWidth="1"
          />
          {/* Screen Display Glow */}
          <path
            d="M156 178l3.5-20h33l-3.5 20z"
            fill="#e0f2fe"
          />
          {/* Mini lines on screen */}
          <path d="M162 165l2-10h14" stroke="#0284c7" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M165 171l1-4h18" stroke="#38bdf8" strokeWidth="1" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
};
