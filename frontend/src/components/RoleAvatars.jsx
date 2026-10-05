/**
 * High-fidelity vector illustrations matching the reference image.
 * Each avatar includes a 94px circular backdrop, character illustration,
 * and a distinct status/role badge at the bottom right.
 */

// 1. Admin Avatar: Professional male in suit & tie + Settings Gear badge
export const AdminAvatar = () => (
  <svg
    viewBox="0 0 100 100"
    width="94"
    height="94"
    className="role-avatar-svg"
    aria-label="Admin Avatar"
  >
    <defs>
      <clipPath id="adminClip">
        <circle cx="50" cy="50" r="44" />
      </clipPath>
    </defs>

    {/* Background Circle */}
    <circle cx="50" cy="50" r="44" fill="#9bc2fa" />

    {/* Character inside clip */}
    <g clipPath="url(#adminClip)">
      {/* Ears */}
      <circle cx="37" cy="48" r="4.5" fill="#fbc49d" />
      <circle cx="63" cy="48" r="4.5" fill="#fbc49d" />

      {/* Head */}
      <ellipse cx="50" cy="46" rx="13" ry="15" fill="#fdd8b8" />

      {/* Hair */}
      <path
        d="M36 42 C36 29 44 26 50 26 C56 26 64 29 64 42 C64 35 60 30 50 30 C42 30 38 35 36 42 Z"
        fill="#1e293b"
      />
      <path
        d="M38 34 C41 29 48 27 54 28 C60 29 63 32 63 35 C59 31 52 30 46 32 C41 34 39 36 38 34 Z"
        fill="#1e293b"
      />

      {/* Eyes & Eyebrows */}
      <ellipse cx="44.5" cy="45" rx="1.5" ry="1.8" fill="#1e293b" />
      <ellipse cx="55.5" cy="45" rx="1.5" ry="1.8" fill="#1e293b" />
      <path d="M42 41 Q45 39 47 41" stroke="#1e293b" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <path d="M53 41 Q55 39 58 41" stroke="#1e293b" strokeWidth="1.2" strokeLinecap="round" fill="none" />

      {/* Nose & Smile */}
      <path d="M50 46 L49.5 49 L51 49" stroke="#e09f7a" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M46.5 53 Q50 55.5 53.5 53" stroke="#d97757" strokeWidth="1.3" strokeLinecap="round" fill="none" />

      {/* Neck */}
      <rect x="45" y="58" width="10" height="9" fill="#fbc49d" />

      {/* Suit Jacket & White Shirt */}
      <path d="M26 94 L32 67 L44 65 L46 72 L50 82 L54 72 L56 65 L68 67 L74 94 Z" fill="#ffffff" />
      {/* Dark Suit */}
      <path d="M22 94 L29 66 L37 66 L42 85 L28 94 Z" fill="#1e293b" />
      <path d="M78 94 L71 66 L63 66 L58 85 L72 94 Z" fill="#1e293b" />

      {/* Collar & Burgundy Tie */}
      <polygon points="46,65 50,71 44,70" fill="#ffffff" />
      <polygon points="54,65 50,71 56,70" fill="#ffffff" />
      <polygon points="48,70 52,70 53,86 50,91 47,86" fill="#991b1b" />
    </g>

    {/* Badge: Settings Gear */}
    <g transform="translate(62, 62)">
      <circle cx="16" cy="16" r="14.5" fill="#ffffff" />
      <circle cx="16" cy="16" r="13" fill="#2563eb" />
      <g transform="translate(16, 16) scale(0.68) translate(-12, -12)" fill="#ffffff">
        <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
        <path fillRule="evenodd" clipRule="evenodd" d="M9.455 3.033a1.5 1.5 0 0 1 1.954-.925l.89.373a1.5 1.5 0 0 0 1.402 0l.89-.373a1.5 1.5 0 0 1 1.954.925l.373.89a1.5 1.5 0 0 0 .991.992l.89.373a1.5 1.5 0 0 1 .925 1.954l-.373.89a1.5 1.5 0 0 0 0 1.402l.373.89a1.5 1.5 0 0 1-.925 1.954l-.89.373a1.5 1.5 0 0 0-.992.991l-.373.89a1.5 1.5 0 0 1-1.954.925l-.89-.373a1.5 1.5 0 0 0-1.402 0l-.89.373a1.5 1.5 0 0 1-1.954-.925l-.373-.89a1.5 1.5 0 0 0-.991-.992l-.89-.373a1.5 1.5 0 0 1-.925-1.954l.373-.89a1.5 1.5 0 0 0 0-1.402l-.373-.89a1.5 1.5 0 0 1 .925-1.954l.89-.373a1.5 1.5 0 0 0 .992-.991l.373-.89ZM12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z" />
      </g>
    </g>
  </svg>
);

// 2. Warden Avatar: Professional female in blazer + Shield badge
export const WardenAvatar = () => (
  <svg
    viewBox="0 0 100 100"
    width="94"
    height="94"
    className="role-avatar-svg"
    aria-label="Warden Avatar"
  >
    <defs>
      <clipPath id="wardenClip">
        <circle cx="50" cy="50" r="44" />
      </clipPath>
    </defs>

    {/* Background Circle */}
    <circle cx="50" cy="50" r="44" fill="#96e3b3" />

    {/* Character inside clip */}
    <g clipPath="url(#wardenClip)">
      {/* Long dark hair behind */}
      <path
        d="M32 46 C30 65 35 78 37 84 L63 84 C65 78 70 65 68 46 C68 28 32 28 32 46 Z"
        fill="#1e293b"
      />

      {/* Ears */}
      <circle cx="37" cy="49" r="4" fill="#fbc49d" />
      <circle cx="63" cy="49" r="4" fill="#fbc49d" />

      {/* Head */}
      <ellipse cx="50" cy="47" rx="12.5" ry="14" fill="#fdd8b8" />

      {/* Front Hair parted style */}
      <path
        d="M36 43 C37 32 44 27 50 27 C56 27 63 32 64 43 C62 35 55 33 50 35 C45 33 38 35 36 43 Z"
        fill="#1e293b"
      />
      <path
        d="M36 43 C34 50 33 60 36 67 C38 67 39 58 40 50 C40 45 38 43 36 43 Z"
        fill="#1e293b"
      />
      <path
        d="M64 43 C66 50 67 60 64 67 C62 67 61 58 60 50 C60 45 62 43 64 43 Z"
        fill="#1e293b"
      />

      {/* Eyes & Eyebrows */}
      <ellipse cx="44.5" cy="46" rx="1.4" ry="1.6" fill="#1e293b" />
      <ellipse cx="55.5" cy="46" rx="1.4" ry="1.6" fill="#1e293b" />
      <path d="M42 42 Q45 40.5 47 42" stroke="#1e293b" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <path d="M53 42 Q55 40.5 58 42" stroke="#1e293b" strokeWidth="1.2" strokeLinecap="round" fill="none" />

      {/* Smile & Blush */}
      <ellipse cx="42" cy="49" rx="2" ry="1" fill="#fca5a5" opacity="0.6" />
      <ellipse cx="58" cy="49" rx="2" ry="1" fill="#fca5a5" opacity="0.6" />
      <path d="M47 52 Q50 54.5 53 52" stroke="#d97757" strokeWidth="1.3" strokeLinecap="round" fill="none" />

      {/* Neck */}
      <rect x="45.5" y="58" width="9" height="9" fill="#fbc49d" />

      {/* White inner top */}
      <polygon points="45,66 55,66 52,78 48,78" fill="#ffffff" />

      {/* Dark Teal/Green Blazer */}
      <path d="M25 94 L32 67 L44 65 L48 78 L43 94 Z" fill="#134e4a" />
      <path d="M75 94 L68 67 L56 65 L52 78 L57 94 Z" fill="#134e4a" />
      <path d="M43 78 L50 87 L57 78 L52 94 L48 94 Z" fill="#115e59" />
    </g>

    {/* Badge: Shield */}
    <g transform="translate(62, 62)">
      <circle cx="16" cy="16" r="14.5" fill="#ffffff" />
      <circle cx="16" cy="16" r="13" fill="#16a34a" />
      <g transform="translate(16, 16) scale(0.68) translate(-12, -12)" fill="#ffffff">
        <path d="M12 2L4 5V11.5C4 16.5 7.4 21.1 12 22.3C16.6 21.1 20 16.5 20 11.5V5L12 2Z" fill="#ffffff" />
        <path d="M12 4.2V20.1C15.5 19 18 15.3 18 11.5V6.4L12 4.2Z" fill="#dcfce7" opacity="0.8" />
      </g>
    </g>
  </svg>
);

// 3. College Staff Avatar: Male professor with glasses + Graduation Mortarboard badge
export const StaffAvatar = () => (
  <svg
    viewBox="0 0 100 100"
    width="94"
    height="94"
    className="role-avatar-svg"
    aria-label="College Staff Avatar"
  >
    <defs>
      <clipPath id="staffClip">
        <circle cx="50" cy="50" r="44" />
      </clipPath>
    </defs>

    {/* Background Circle */}
    <circle cx="50" cy="50" r="44" fill="#c7b3fa" />

    {/* Character inside clip */}
    <g clipPath="url(#staffClip)">
      {/* Ears */}
      <circle cx="37" cy="49" r="4" fill="#fbc49d" />
      <circle cx="63" cy="49" r="4" fill="#fbc49d" />

      {/* Head */}
      <ellipse cx="50" cy="47" rx="12.5" ry="14.5" fill="#fdd8b8" />

      {/* Hair */}
      <path
        d="M36 41 C36 29 44 26 50 26 C56 26 64 29 64 41 C64 34 59 31 50 31 C42 31 38 34 36 41 Z"
        fill="#1e293b"
      />

      {/* Spectacles / Glasses */}
      <circle cx="44" cy="46" r="4.2" stroke="#1e293b" strokeWidth="1.6" fill="rgba(255,255,255,0.3)" />
      <circle cx="56" cy="46" r="4.2" stroke="#1e293b" strokeWidth="1.6" fill="rgba(255,255,255,0.3)" />
      <line x1="48.2" y1="46" x2="51.8" y2="46" stroke="#1e293b" strokeWidth="1.6" />
      <line x1="37" y1="45" x2="39.8" y2="45" stroke="#1e293b" strokeWidth="1.4" />
      <line x1="60.2" y1="45" x2="63" y2="45" stroke="#1e293b" strokeWidth="1.4" />

      {/* Eyes behind lenses */}
      <ellipse cx="44" cy="46" rx="1.2" ry="1.4" fill="#1e293b" />
      <ellipse cx="56" cy="46" rx="1.2" ry="1.4" fill="#1e293b" />

      {/* Eyebrows & Smile */}
      <path d="M41 39.5 Q44 38 47 39.5" stroke="#1e293b" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <path d="M53 39.5 Q56 38 59 39.5" stroke="#1e293b" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <path d="M47 54 Q50 56 53 54" stroke="#d97757" strokeWidth="1.3" strokeLinecap="round" fill="none" />

      {/* Neck */}
      <rect x="45.5" y="60" width="9" height="8" fill="#fbc49d" />

      {/* Collared Professional Shirt */}
      <path d="M26 94 L32 68 L44 66 L50 75 L56 66 L68 68 L74 94 Z" fill="#f1f5f9" />
      {/* Light slate shoulder/coat outline */}
      <path d="M22 94 L31 68 L36 68 L41 94 Z" fill="#94a3b8" opacity="0.3" />
      <path d="M78 94 L69 68 L64 68 L59 94 Z" fill="#94a3b8" opacity="0.3" />

      {/* Shirt Collar & Tie */}
      <polygon points="44,66 50,73 45,71" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.5" />
      <polygon points="56,66 50,73 55,71" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.5" />
      <polygon points="48,72 52,72 53,88 50,92 47,88" fill="#1e293b" />
    </g>

    {/* Badge: Graduation Cap */}
    <g transform="translate(62, 62)">
      <circle cx="16" cy="16" r="14.5" fill="#ffffff" />
      <circle cx="16" cy="16" r="13" fill="#6d48c8" />
      <g transform="translate(16, 16) scale(0.68) translate(-12, -12)" fill="#ffffff">
        <polygon points="12,4 2,9 12,14 22,9" />
        <path d="M6 11.5V16.5C6 19 8.7 21 12 21C15.3 21 18 19 18 16.5V11.5L12 14.5L6 11.5Z" />
        <path d="M21 9.5V16H22V9.5Z" />
        <circle cx="21.5" cy="16.5" r="1" />
      </g>
    </g>
  </svg>
);

// 4. Parent Avatar: Father & Mother couple + Family badge
export const ParentAvatar = () => (
  <svg
    viewBox="0 0 100 100"
    width="94"
    height="94"
    className="role-avatar-svg"
    aria-label="Parent Avatar"
  >
    <defs>
      <clipPath id="parentClip">
        <circle cx="50" cy="50" r="44" />
      </clipPath>
    </defs>

    {/* Background Circle */}
    <circle cx="50" cy="50" r="44" fill="#fdc39b" />

    {/* Characters inside clip */}
    <g clipPath="url(#parentClip)">
      {/* ── Father (Left) ── */}
      <g transform="translate(-8, 2)">
        {/* Head */}
        <circle cx="43" cy="46" r="4" fill="#fbc49d" />
        <ellipse cx="48" cy="47" rx="10" ry="12" fill="#fdd8b8" />
        {/* Hair */}
        <path d="M38 44 C38 34 44 31 49 31 C54 31 58 34 58 44 C58 38 54 34 49 34 C44 34 40 37 38 44 Z" fill="#1e293b" />
        {/* Eyes & Smile */}
        <ellipse cx="45" cy="46.5" rx="1.2" ry="1.4" fill="#1e293b" />
        <ellipse cx="52" cy="46.5" rx="1.2" ry="1.4" fill="#1e293b" />
        <path d="M46 52 Q48.5 54 51 52" stroke="#d97757" strokeWidth="1.2" strokeLinecap="round" fill="none" />
        {/* Shirt - Blue */}
        <path d="M22 94 L32 68 L48 66 L52 94 Z" fill="#2563eb" />
        <polygon points="43,66 48,73 45,71" fill="#1d4ed8" />
      </g>

      {/* ── Mother (Right) ── */}
      <g transform="translate(10, 5)">
        {/* Hair behind */}
        <path d="M42 46 C40 60 43 72 45 76 L59 76 C61 72 64 60 62 46 C62 33 42 33 42 46 Z" fill="#1e293b" />
        {/* Head */}
        <ellipse cx="52" cy="47" rx="9" ry="11" fill="#fdd8b8" />
        {/* Front Hair */}
        <path d="M43 43 C44 34 49 32 52 32 C56 32 60 35 61 43 C59 38 56 36 52 37 C48 36 45 38 43 43 Z" fill="#1e293b" />
        {/* Eyes & Blush & Smile */}
        <ellipse cx="49" cy="46.5" rx="1.1" ry="1.3" fill="#1e293b" />
        <ellipse cx="55" cy="46.5" rx="1.1" ry="1.3" fill="#1e293b" />
        <ellipse cx="48" cy="49" rx="1.5" ry="0.8" fill="#fca5a5" opacity="0.6" />
        <ellipse cx="56" cy="49" rx="1.5" ry="0.8" fill="#fca5a5" opacity="0.6" />
        <path d="M50 51.5 Q52 53 54 51.5" stroke="#d97757" strokeWidth="1.2" strokeLinecap="round" fill="none" />
        {/* Top - Warm Orange */}
        <path d="M42 94 L46 68 L58 68 L66 94 Z" fill="#ea580c" />
        <path d="M49 68 Q52 74 55 68" stroke="#ffffff" strokeWidth="1" fill="none" />
      </g>
    </g>

    {/* Badge: Family / Group */}
    <g transform="translate(62, 62)">
      <circle cx="16" cy="16" r="14.5" fill="#ffffff" />
      <circle cx="16" cy="16" r="13" fill="#ea580c" />
      <g transform="translate(16, 16) scale(0.68) translate(-12, -12)" fill="#ffffff">
        {/* 3 People Icon */}
        <path d="M12 4.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM17 7a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM3.5 17c0-2.2 2.2-4 5-4s5 1.8 5 4v1H3.5v-1ZM14.5 13.5c1.7.5 2.5 1.7 2.5 3.5v1h-3v-1c0-1.4-.7-2.6-1.8-3.1.8-.2 1.6-.4 2.3-.4Z" />
      </g>
    </g>
  </svg>
);

// 5. Student Avatar: Young female student with backpack straps + Student/Graduation badge
export const StudentAvatar = () => (
  <svg
    viewBox="0 0 100 100"
    width="94"
    height="94"
    className="role-avatar-svg"
    aria-label="Student Avatar"
  >
    <defs>
      <clipPath id="studentClip">
        <circle cx="50" cy="50" r="44" />
      </clipPath>
    </defs>

    {/* Background Circle */}
    <circle cx="50" cy="50" r="44" fill="#fba2b7" />

    {/* Character inside clip */}
    <g clipPath="url(#studentClip)">
      {/* Hair in back */}
      <path
        d="M32 46 C30 65 35 78 37 84 L63 84 C65 78 70 65 68 46 C68 28 32 28 32 46 Z"
        fill="#1e293b"
      />

      {/* Head & Ears */}
      <circle cx="37" cy="49" r="4" fill="#fbc49d" />
      <circle cx="63" cy="49" r="4" fill="#fbc49d" />
      <ellipse cx="50" cy="47" rx="12" ry="13.5" fill="#fdd8b8" />

      {/* Hair styling with middle fringe */}
      <path
        d="M36 43 C37 32 44 27 50 27 C56 27 63 32 64 43 C61 35 55 33 50 35 C45 33 39 35 36 43 Z"
        fill="#1e293b"
      />
      <path
        d="M36 43 C35 50 34 58 37 66 C39 66 39 57 40 50 C40 45 38 43 36 43 Z"
        fill="#1e293b"
      />
      <path
        d="M64 43 C65 50 66 58 63 66 C61 66 61 57 60 50 C60 45 62 43 64 43 Z"
        fill="#1e293b"
      />

      {/* Eyes & Eyebrows */}
      <ellipse cx="44.5" cy="46" rx="1.4" ry="1.6" fill="#1e293b" />
      <ellipse cx="55.5" cy="46" rx="1.4" ry="1.6" fill="#1e293b" />
      <path d="M42 41.5 Q45 40 47 41.5" stroke="#1e293b" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <path d="M53 41.5 Q55 40 58 41.5" stroke="#1e293b" strokeWidth="1.2" strokeLinecap="round" fill="none" />

      {/* Cheerful Blush & Smile */}
      <ellipse cx="42" cy="49.5" rx="2" ry="1" fill="#fca5a5" opacity="0.6" />
      <ellipse cx="58" cy="49.5" rx="2" ry="1" fill="#fca5a5" opacity="0.6" />
      <path d="M47 52.5 Q50 55.5 53 52.5" stroke="#d97757" strokeWidth="1.4" strokeLinecap="round" fill="none" />

      {/* Neck */}
      <rect x="45.5" y="58" width="9" height="8" fill="#fbc49d" />

      {/* White T-shirt with subtle cyan collar */}
      <path d="M26 94 L32 68 L44 65 L50 72 L56 65 L68 68 L74 94 Z" fill="#ffffff" />
      <path d="M44 65 Q50 72 56 65" stroke="#38bdf8" strokeWidth="2" fill="none" />

      {/* Blue Backpack Straps over shoulders */}
      <path d="M33 68 L36 94" stroke="#2563eb" strokeWidth="5.5" strokeLinecap="round" />
      <path d="M67 68 L64 94" stroke="#2563eb" strokeWidth="5.5" strokeLinecap="round" />
    </g>

    {/* Badge: Graduation Cap / Student degree */}
    <g transform="translate(62, 62)">
      <circle cx="16" cy="16" r="14.5" fill="#ffffff" />
      <circle cx="16" cy="16" r="13" fill="#db2777" />
      <g transform="translate(16, 16) scale(0.68) translate(-12, -12)" fill="#ffffff">
        <polygon points="12,4 2,9 12,14 22,9" />
        <path d="M6 11.5V16.5C6 19 8.7 21 12 21C15.3 21 18 19 18 16.5V11.5L12 14.5L6 11.5Z" />
        <path d="M21 9.5V16H22V9.5Z" />
        <circle cx="21.5" cy="16.5" r="1" />
      </g>
    </g>
  </svg>
);
