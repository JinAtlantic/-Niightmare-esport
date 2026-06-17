"use client";

import React from "react";

/**
 * A template re-mounts on every route change, so wrapping the page in a
 * fade-in animation gives a smooth page transition between routes.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
