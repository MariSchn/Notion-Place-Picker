import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 16, children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IconSearch = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="7" cy="7" r="4.5" />
    <path d="M13.5 13.5 10.5 10.5" />
  </Svg>
);

export const IconPin = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8 14s4.5-4.2 4.5-7.5a4.5 4.5 0 0 0-9 0C3.5 9.8 8 14 8 14Z" />
    <circle cx="8" cy="6.5" r="1.5" />
  </Svg>
);

export const IconText = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 4h10" />
    <path d="M3 8h10" />
    <path d="M3 12h7" />
  </Svg>
);

export const IconHash = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 2 4.5 14" />
    <path d="M11.5 2 10 14" />
    <path d="M2.5 6h11" />
    <path d="M2 10h11" />
  </Svg>
);

export const IconHome = (p: IconProps) => (
  <Svg {...p}>
    <path d="M2.5 7.5 8 3l5.5 4.5V13a1 1 0 0 1-1 1H3.5a1 1 0 0 1-1-1V7.5Z" />
  </Svg>
);

export const IconDatabase = (p: IconProps) => (
  <Svg {...p}>
    <ellipse cx="8" cy="4" rx="5" ry="2" />
    <path d="M3 4v8c0 1.1 2.2 2 5 2s5-.9 5-2V4" />
    <path d="M3 8c0 1.1 2.2 2 5 2s5-.9 5-2" />
  </Svg>
);

export const IconChevronRight = (p: IconProps) => (
  <Svg {...p}>
    <path d="m6 3 5 5-5 5" />
  </Svg>
);

export const IconChevronDown = (p: IconProps) => (
  <Svg {...p}>
    <path d="m3 6 5 5 5-5" />
  </Svg>
);

export const IconChevronLeft = (p: IconProps) => (
  <Svg {...p}>
    <path d="m10 3-5 5 5 5" />
  </Svg>
);

export const IconSidebar = (p: IconProps) => (
  <Svg {...p}>
    <rect x="2" y="3" width="12" height="10" rx="1.5" />
    <path d="M6 3v10" />
  </Svg>
);

export const IconPanelRight = (p: IconProps) => (
  <Svg {...p}>
    <rect x="2" y="3" width="12" height="10" rx="1.5" />
    <path d="M10 3v10" />
  </Svg>
);

export const IconClose = (p: IconProps) => (
  <Svg {...p}>
    <path d="m4 4 8 8M12 4l-8 8" />
  </Svg>
);

export const IconSun = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="8" cy="8" r="3" />
    <path d="M8 1.5v1.5M8 13v1.5M2.5 8H1M15 8h-1.5M3.5 3.5l1 1M11.5 11.5l1 1M3.5 12.5l1-1M11.5 4.5l1-1" />
  </Svg>
);

export const IconMoon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M13.5 9.5A5.5 5.5 0 0 1 6.5 2.5a5.5 5.5 0 1 0 7 7Z" />
  </Svg>
);

export const IconSettings = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="8" cy="8" r="2" />
    <path d="M13 8a5 5 0 0 0-.1-1l1.2-1-1.5-2.5-1.5.6a5 5 0 0 0-1.7-1L9 1.5h-2L6.6 3a5 5 0 0 0-1.7 1l-1.5-.6L1.9 6l1.2 1a5 5 0 0 0-.1 1c0 .3 0 .7.1 1l-1.2 1 1.5 2.5 1.5-.6a5 5 0 0 0 1.7 1L7 14.5h2l.4-1.5a5 5 0 0 0 1.7-1l1.5.6 1.5-2.5-1.2-1c.1-.3.1-.7.1-1Z" />
  </Svg>
);

export const IconCheck = (p: IconProps) => (
  <Svg {...p}>
    <path d="m3 8 3.5 3.5L13 5" />
  </Svg>
);

export const IconAlert = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8 1.5 1 13.5h14L8 1.5Z" />
    <path d="M8 6v3.5" />
    <circle cx="8" cy="11.5" r="0.6" fill="currentColor" />
  </Svg>
);

export const IconCommand = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 5a2 2 0 1 1 2 2H5V5Z" />
    <path d="M11 5a2 2 0 1 0-2 2h2V5Z" />
    <path d="M5 11a2 2 0 1 0 2-2H5v2Z" />
    <path d="M11 11a2 2 0 1 1-2-2h2v2Z" />
  </Svg>
);

export const IconLocation = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="8" cy="8" r="2" />
    <path d="M8 1v2M8 13v2M1 8h2M13 8h2" />
  </Svg>
);

export const IconCheckSquare = (p: IconProps) => (
  <Svg {...p}>
    <rect x="2" y="2" width="12" height="12" rx="2" />
    <path d="m5 8 2.5 2.5L11.5 6" />
  </Svg>
);

export const IconTag = (p: IconProps) => (
  <Svg {...p}>
    <path d="M2 8.5V3a1 1 0 0 1 1-1h5.5L14 7.5 7.5 14 2 8.5Z" />
    <circle cx="5.5" cy="5.5" r="0.8" fill="currentColor" />
  </Svg>
);

export const IconLink = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9 3.5h2.5a3 3 0 0 1 0 6H9" />
    <path d="M7 12.5H4.5a3 3 0 0 1 0-6H7" />
    <path d="M5.5 8h5" />
  </Svg>
);

export const IconMail = (p: IconProps) => (
  <Svg {...p}>
    <rect x="2" y="3.5" width="12" height="9" rx="1.5" />
    <path d="m2.5 4.5 5.5 4 5.5-4" />
  </Svg>
);

export const IconPhone = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 3h2.5l1 3-1.5 1c.5 1.5 2 3 3.5 3.5l1-1.5 3 1V13a1 1 0 0 1-1 1A10 10 0 0 1 3 4a1 1 0 0 1 1-1Z" />
  </Svg>
);

export const IconCalendar = (p: IconProps) => (
  <Svg {...p}>
    <rect x="2" y="3.5" width="12" height="10" rx="1.5" />
    <path d="M2 7h12M5 2v3M11 2v3" />
  </Svg>
);

export const IconUser = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="8" cy="6" r="2.5" />
    <path d="M3 13c1-2.5 3-3.5 5-3.5s4 1 5 3.5" />
  </Svg>
);
