import React from "react";
import { FacebookIcon, InstagramIcon, TiktokIcon, YoutubeIcon } from "@/components/Icons";
import type { Socials } from "@/lib/types";

interface SocialLinksProps {
  socials: Socials;
  size?: number;
  className?: string;
}

export default function SocialLinks({ socials, size = 18, className = "" }: SocialLinksProps) {
  const items: { key: keyof Socials; label: string; Icon: typeof YoutubeIcon }[] = [
    { key: "youtube", label: "YouTube", Icon: YoutubeIcon },
    { key: "facebook", label: "Facebook", Icon: FacebookIcon },
    { key: "instagram", label: "Instagram", Icon: InstagramIcon },
    { key: "tiktok", label: "TikTok", Icon: TiktokIcon },
  ];

  // Only render an icon when there is a real link. Empty values and the "#"
  // placeholder are treated as "not set" and hidden.
  const visible = items.filter(({ key }) => {
    const link = socials[key]?.trim();
    return link && link !== "#";
  });

  if (visible.length === 0) return null;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {visible.map(({ key, label, Icon }) => (
        <a
          key={key}
          href={socials[key]}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className="hover-glow grid h-11 w-11 place-items-center border border-edge bg-crypt text-ash transition-colors hover:text-glow"
        >
          <Icon size={size} />
        </a>
      ))}
    </div>
  );
}
