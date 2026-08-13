import type { SVGProps } from "react";

export function EyeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M1.5 10S4.5 4 10 4s8.5 6 8.5 6-3 6-8.5 6-8.5-6-8.5-6Z" />
      <circle cx="10" cy="10" r="2.5" />
    </svg>
  );
}

export function EyeOffIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M2.5 2.5l15 15" />
      <path d="M8.3 4.2A9.4 9.4 0 0 1 10 4c5.5 0 8.5 6 8.5 6a15.6 15.6 0 0 1-2.3 3.2M5.6 5.6C3.2 7.1 1.5 10 1.5 10s3 6 8.5 6a8.6 8.6 0 0 0 3.1-.6" />
      <path d="M7.9 8.1a2.5 2.5 0 0 0 3.5 3.5" />
    </svg>
  );
}

export function AlertCircleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <circle cx="10" cy="10" r="8" />
      <path d="M10 6.5v4" />
      <path d="M10 13.25h.01" />
    </svg>
  );
}

export function SpinnerIcon({ className = "", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className={`animate-spin ${className}`}
      {...props}
    >
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth={2} className="opacity-25" />
      <path
        d="M18 10a8 8 0 0 0-8-8"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        className="opacity-90"
      />
    </svg>
  );
}

// Shared shell for the dashboard/shell icon set below — reduces boilerplate
// now that there are enough of them to matter. The four icons above are
// left untouched (Login already ships with them).
function IconBase({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function LayoutIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <rect x="2.5" y="2.5" width="6" height="6" rx="1" />
      <rect x="11.5" y="2.5" width="6" height="6" rx="1" />
      <rect x="2.5" y="11.5" width="6" height="6" rx="1" />
      <rect x="11.5" y="11.5" width="6" height="6" rx="1" />
    </IconBase>
  );
}

export function BriefcaseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <rect x="3" y="6.5" width="14" height="9.5" rx="1.5" />
      <path d="M7.5 6.5V5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 12.5 5v1.5" />
      <path d="M3 10.5h14" />
    </IconBase>
  );
}

export function BuildingIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <rect x="4" y="3" width="12" height="15" rx="1" />
      <path d="M8 18v-3h4v3" />
      <path d="M7 7h1M12 7h1M7 10.5h1M12 10.5h1M7 14h1M12 14h1" />
    </IconBase>
  );
}

export function FolderIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M3 6a1 1 0 0 1 1-1h4l1.5 2H16a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6Z" />
    </IconBase>
  );
}

export function UsersIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <circle cx="7.5" cy="7" r="2.5" />
      <path d="M2.5 17c0-2.8 2.2-5 5-5s5 2.2 5 5" />
      <circle cx="14.5" cy="7.5" r="2" />
      <path d="M13 12.2c2.3.3 4 2.2 4 4.8" />
    </IconBase>
  );
}

export function LayersIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M10 3 3 7l7 4 7-4-7-4Z" />
      <path d="M3 10.5 10 14.5l7-4" />
      <path d="M3 14 10 18l7-4" />
    </IconBase>
  );
}

export function ShieldIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M10 2.5 16 5v5c0 4.2-2.7 6.9-6 8.5-3.3-1.6-6-4.3-6-8.5V5l6-2.5Z" />
    </IconBase>
  );
}

export function SettingsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <circle cx="10" cy="10" r="2.5" />
      <path d="M10 3v2.2M10 14.8V17M17 10h-2.2M5.2 10H3M15.1 4.9l-1.55 1.55M6.45 13.55 4.9 15.1M15.1 15.1l-1.55-1.55M6.45 6.45 4.9 4.9" />
    </IconBase>
  );
}

export function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <circle cx="8.5" cy="8.5" r="5.5" />
      <path d="M17 17l-4-4" />
    </IconBase>
  );
}

export function BellIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M5 8a5 5 0 0 1 10 0c0 4 1.5 5 1.5 5h-13S5 12 5 8Z" />
      <path d="M8 16a2 2 0 0 0 4 0" />
    </IconBase>
  );
}

export function MenuIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M3 5.5h14M3 10h14M3 14.5h14" />
    </IconBase>
  );
}

export function SunIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <circle cx="10" cy="10" r="3.5" />
      <path d="M10 2v2.2M10 15.8V18M18 10h-2.2M4.2 10H2M15.7 4.3l-1.55 1.55M5.85 14.15 4.3 15.7M15.7 15.7l-1.55-1.55M5.85 5.85 4.3 4.3" />
    </IconBase>
  );
}

export function PlusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M10 4v12M4 10h12" />
    </IconBase>
  );
}

export function ChevronDownIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M5 7.5 10 12.5 15 7.5" />
    </IconBase>
  );
}

export function ChevronLeftIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M12.5 5 7.5 10l5 5" />
    </IconBase>
  );
}

export function InboxIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M3 12 5.5 4h9L17 12" />
      <path d="M3 12v3a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3" />
      <path d="M3 12h4l1 2h4l1-2h4" />
    </IconBase>
  );
}

export function ChartBarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M4 17V10M10 17V4M16 17v-7" />
      <path d="M3 17h14" />
    </IconBase>
  );
}

export function TrendingUpIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M3 13.5 8 8.5l3 3 6-6" />
      <path d="M13 5.5h4v4" />
    </IconBase>
  );
}

export function TrashIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M4 6h12" />
      <path d="M7.5 6V4.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V6" />
      <path d="M5.5 6 6.2 16a1 1 0 0 0 1 .9h5.6a1 1 0 0 0 1-.9L14.5 6" />
      <path d="M8.5 9v5M11.5 9v5" />
    </IconBase>
  );
}

export function PencilIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M12.9 3.9 16.1 7.1 6.4 16.8 2.9 17.1 3.2 13.6Z" />
      <path d="M11 5.8 14.2 9" />
    </IconBase>
  );
}

export function CopyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <rect x="7.5" y="7.5" width="9" height="9" rx="1.5" />
      <path d="M4.5 12.5A1.5 1.5 0 0 1 3 11V4.5A1.5 1.5 0 0 1 4.5 3H11a1.5 1.5 0 0 1 1.5 1.5" />
    </IconBase>
  );
}

export function ArrowUpIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M10 15.5v-11M5 9l5-4.5 5 4.5" />
    </IconBase>
  );
}

export function ArrowDownIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M10 4.5v11M5 11l5 4.5 5-4.5" />
    </IconBase>
  );
}

export function DownloadIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M10 3v10M6 9.5l4 4 4-4" />
      <path d="M4 15.5v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-1" />
    </IconBase>
  );
}

export function PrinterIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M6 7.5V3.5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v4" />
      <rect x="3" y="7.5" width="14" height="7" rx="1.5" />
      <path d="M6 13v3.5a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V13" />
    </IconBase>
  );
}

export function CheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M4 10.5 8 14.5 16 6" />
    </IconBase>
  );
}

export function XIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M5 5l10 10M15 5 5 15" />
    </IconBase>
  );
}

export function ArrowRightIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M4.5 10h11M10.5 5.5 15 10l-4.5 4.5" />
    </IconBase>
  );
}

export function ShareIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <circle cx="15.5" cy="5" r="2" />
      <circle cx="4.5" cy="10" r="2" />
      <circle cx="15.5" cy="15" r="2" />
      <path d="M6.3 9l7.4-3.1M6.3 11l7.4 3.1" />
    </IconBase>
  );
}
