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

export function ScytheIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M20 5c-6 0-11 3.5-13 9 4-3.5 8-4 12-3" />
      <path d="M7 14l-2 5" />
    </svg>
  );
}
