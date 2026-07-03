import React from "react";

type IconProps = React.SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 20, ...props }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...props,
  };
}

export function YoutubeIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M10 9l5 3-5 3V9z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function FacebookIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M14 8.5h2.5V5.5H14c-2 0-3.2 1.2-3.2 3.2V11H8.5v3h2.3v6.5h3.2V14h2.4l.4-3h-2.8V9.2c0-.5.3-.7.9-.7z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function InstagramIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function TiktokIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path
        d="M14 3v9.2a3.2 3.2 0 1 1-2.4-3.1M14 3c.4 2 1.9 3.6 4 3.9"
        fill="none"
      />
    </svg>
  );
}

export function DiscordIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M7.5 7.5C9 6.8 10.4 6.5 12 6.5s3 .3 4.5 1c1.8 2 2.5 4.4 2.5 8 0 0-1.6 1.8-4 2l-.8-1.4M7.5 7.5C5.7 9.5 5 11.9 5 15.5c0 0 1.6 1.8 4 2l.8-1.4M9.5 13.5h0M14.5 13.5h0" />
    </svg>
  );
}

export function WhatsappIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 20l1.4-4A7.6 7.6 0 1 1 8.2 18.8L4 20z" />
      <path
        d="M9.2 8.6c-.2 0-.5 0-.7.3-.3.3-.9.8-.9 2s.9 2.3 1 2.5c.2.2 1.7 2.7 4.3 3.7 2.1.8 2.5.6 3 .6.5-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1l-1.7-.8c-.2-.1-.4-.1-.6.1l-.6.7c-.1.2-.3.2-.5.1-.7-.3-1.5-.8-2.2-1.7-.2-.3 0-.5.1-.6l.4-.5c.1-.2.1-.3 0-.5l-.7-1.7c-.1-.4-.3-.4-.5-.4z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <path d="M3.5 6.5 12 13l8.5-6.5" />
    </svg>
  );
}

export function GlobeIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.4 3.8 5.6 3.8 9S14.5 18.6 12 21c-2.5-2.4-3.8-5.6-3.8-9S9.5 5.4 12 3z" />
    </svg>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6.5 4h3l1.5 4-2 1.5a11 11 0 0 0 5 5l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A16 16 0 0 1 4.5 6.2 2 2 0 0 1 6.5 4z" />
    </svg>
  );
}

export function LiquipediaIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5 5.5h5.2c1.7 0 2.8 1 2.8 2.6s-1.1 2.7-2.8 2.7H7.8v5.7H5V5.5z" />
      <path d="M15.2 5.5H18v11h-2.8z" />
      <path d="M14 16.5h5" />
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function PlayIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M8 5.5l11 6.5-11 6.5z" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** MLBB game icon — stylized crossed-blades crest */
export function MlbbIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3l7 3v5c0 4-3 6.8-7 8-4-1.2-7-4-7-8V6l7-3z" />
      <path d="M9.5 9.5l5 5M14.5 9.5l-5 5" />
    </svg>
  );
}

/** eFootball game icon — football */
export function EfootballIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5l3 2.2-1.1 3.5h-3.8L9 9.7 12 7.5z" />
      <path d="M12 3v2.2M5.2 9.7l2 .6M18.8 9.7l-2 .6M8.3 19.2l1.2-2M15.7 19.2l-1.2-2" />
    </svg>
  );
}

/** Trophy cup — used in the Honours / Trophy Cabinet section. */
export function TrophyIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M7 4h10v4a5 5 0 0 1-10 0V4z" />
      <path d="M7 6H4.5a2.5 2.5 0 0 0 2.5 2.8M17 6h2.5A2.5 2.5 0 0 1 17 8.8" />
      <path d="M12 13v3M9 20h6M9.5 20c0-1.6 1-2.4 2.5-2.4s2.5.8 2.5 2.4" />
    </svg>
  );
}

export function ScytheIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M20 5c-6 0-11 3.5-13 9 4-3.5 8-4 12-3" />
      <path d="M7 14l-2 5" />
    </svg>
  );
}
