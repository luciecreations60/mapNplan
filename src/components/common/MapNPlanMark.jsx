export function MapNPlanMark({ className = '', size = 48, title }) {
  const labelled = Boolean(title);

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 72 72"
      role={labelled ? 'img' : undefined}
      aria-hidden={labelled ? undefined : 'true'}
      aria-label={labelled ? title : undefined}
      focusable="false"
    >
      <defs>
        <linearGradient id="mapnplan-panel-gradient" x1="24" y1="16" x2="47" y2="62" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1F90AD" />
          <stop offset="1" stopColor="#2CBB6B" />
        </linearGradient>
        <filter id="mapnplan-pin-shadow" x="-25%" y="-25%" width="150%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#0F172A" floodOpacity="0.22" />
        </filter>
      </defs>

      <path d="M7 25.5 25 20v40L7 65.5z" fill="#1F90AD" />
      <path d="m25 20 22 6v40l-22-6z" fill="url(#mapnplan-panel-gradient)" />
      <path d="m47 26 18-5.5v40L47 66z" fill="#2CBB6B" />
      <path d="M12 49c6-7 12-7 18-2 5 4 10 4 15-2 5-6 10-7 15-3" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeDasharray="2.5 6" />
      <circle cx="11.5" cy="49.5" r="3.2" fill="#fff" />
      <circle cx="60.5" cy="42" r="3.2" fill="#fff" />
      <g filter="url(#mapnplan-pin-shadow)">
        <path d="M36 5.5c-9.1 0-16.5 7.1-16.5 16 0 11.4 16.5 28.4 16.5 28.4s16.5-17 16.5-28.4c0-8.9-7.4-16-16.5-16Z" fill="#0F172A" />
        <circle cx="36" cy="21.2" r="6.2" fill="#fff" />
      </g>
    </svg>
  );
}
