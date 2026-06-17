import React from "react";

/**
 * Renders one or more JSON-LD objects as a <script type="application/ld+json">.
 * Server component — output ships in the initial HTML so crawlers see it without
 * running JS. The `<` escape prevents the JSON from breaking out of the script.
 */
export default function JsonLd({ data }: { data: object | object[] }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
