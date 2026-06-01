/** Ethiopia flag — SVG works on desktop where 🇪🇹 emoji often shows as "ET" */
export default function EthiopiaFlag({ className = 'inline-block w-5 h-3.5 shrink-0 rounded-sm' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 900 600"
      role="img"
      aria-label="Ethiopia"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="900" height="200" fill="#078930" />
      <rect y="200" width="900" height="200" fill="#FCDD09" />
      <rect y="400" width="900" height="200" fill="#DA121A" />
      <circle cx="450" cy="300" r="120" fill="#0F47AF" />
      <path
        fill="#FCDD09"
        d="M450 220l14 43h45l-36 26 14 43-37-27-37 27 14-43-36-26h45z"
      />
    </svg>
  );
}
