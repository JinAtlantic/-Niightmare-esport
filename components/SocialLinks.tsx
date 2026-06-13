import React from "react";
import { FacebookIcon, TiktokIcon, YoutubeIcon } from "@/components/Icons";
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
    { key: "tiktok", label: "TikTok", Icon: TiktokIcon },
  ];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {items.map(({ key, label, Icon }) =>
        socials[key] ? (
          <a
            key={key}
            href={socials[key]}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className="hover-glow grid h-8 w-8 place-items-center border border-edge bg-void/60 text-text-muted hover:text-accent"
          >
            <Icon size={size} />
          </a>
        ) : null
      )}
    </div>
  );
}
