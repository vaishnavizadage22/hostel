/**
 * Subtle architectural line-art illustration matching the bottom-right decoration
 * in the reference image: a campus/hostel building with flagpole, windows, door, and trees.
 */
export const BuildingDecoration = () => {
  return (
    <div className="building-decoration-wrapper" aria-hidden="true">
      <svg
        viewBox="0 0 170 140"
        width="160"
        height="132"
        fill="none"
        stroke="#94a3b8"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Ground baseline */}
        <line x1="8" y1="126" x2="162" y2="126" />

        {/* ── Left Tree ── */}
        <line x1="24" y1="126" x2="24" y2="100" />
        <ellipse cx="24" cy="92" rx="11" ry="16" />
        <line x1="24" y1="92" x2="24" y2="105" />

        {/* ── Main Building Structure ── */}
        {/* Main Walls */}
        <rect x="42" y="72" width="86" height="54" rx="2" />

        {/* Roof Gable */}
        <path d="M37 72 L85 40 L133 72 Z" />

        {/* Central Top Pediment / Tower */}
        <path d="M74 40 L74 24 L96 24 L96 40" />
        {/* Flag Pole and Flag */}
        <line x1="85" y1="24" x2="85" y2="8" />
        <path d="M85 8 L104 8 L104 17 L85 17" fill="none" />

        {/* Upper Windows */}
        <g>
          {/* Left Upper Window */}
          <rect x="52" y="78" width="14" height="15" rx="1.5" />
          <line x1="59" y1="78" x2="59" y2="93" />
          <line x1="52" y1="85.5" x2="66" y2="85.5" />

          {/* Middle Upper Window */}
          <rect x="78" y="78" width="14" height="15" rx="1.5" />
          <line x1="85" y1="78" x2="85" y2="93" />
          <line x1="78" y1="85.5" x2="92" y2="85.5" />

          {/* Right Upper Window */}
          <rect x="104" y="78" width="14" height="15" rx="1.5" />
          <line x1="111" y1="78" x2="111" y2="93" />
          <line x1="104" y1="85.5" x2="118" y2="85.5" />
        </g>

        {/* Lower Floor */}
        <g>
          {/* Left Lower Window */}
          <rect x="52" y="103" width="14" height="15" rx="1.5" />
          <line x1="59" y1="103" x2="59" y2="118" />
          <line x1="52" y1="110.5" x2="66" y2="110.5" />

          {/* Center Main Entrance Door */}
          <path d="M78 126 L78 103 Q85 99 92 103 L92 126" />
          <line x1="85" y1="101" x2="85" y2="126" />

          {/* Right Lower Window */}
          <rect x="104" y="103" width="14" height="15" rx="1.5" />
          <line x1="111" y1="103" x2="111" y2="118" />
          <line x1="104" y1="110.5" x2="118" y2="110.5" />
        </g>

        {/* ── Right Tree ── */}
        <line x1="146" y1="126" x2="146" y2="98" />
        <ellipse cx="146" cy="88" rx="11" ry="16" />
        <line x1="146" y1="88" x2="146" y2="103" />
      </svg>
    </div>
  );
};
