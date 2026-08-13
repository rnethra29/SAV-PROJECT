"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { buildBreadcrumbTrail, resolveDynamicLabel } from "@/lib/navigation/breadcrumbs";

export function Breadcrumbs() {
  const pathname = usePathname();
  const trail = useMemo(() => buildBreadcrumbTrail(pathname), [pathname]);
  const [resolvedLabels, setResolvedLabels] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;

    trail.forEach((crumb) => {
      if (!crumb.dynamicKey || !crumb.id) return;
      const cacheKey = `${crumb.dynamicKey}:${crumb.id}`;
      resolveDynamicLabel(crumb.dynamicKey, crumb.id).then((label) => {
        if (!cancelled && label) {
          setResolvedLabels((prev) => (prev[cacheKey] === label ? prev : { ...prev, [cacheKey]: label }));
        }
      });
    });

    return () => {
      cancelled = true;
    };
  }, [trail]);

  // A single crumb (e.g. just "RFQ" on the RFQ list page) duplicates the
  // page's own title with no real hierarchy to navigate — the sidebar
  // already identifies the active section and page. Only render once
  // there's an actual multi-level trail (e.g. "RFQ / RFQ-2026-0042 / BOQ").
  if (trail.length < 2) return null;

  return (
    <div className="hidden min-w-0 flex-1 items-center gap-1.5 overflow-hidden text-sm text-text-secondary md:flex">
      {trail.map((crumb, index) => {
        const isCurrent = index === trail.length - 1;
        const label =
          crumb.dynamicKey && crumb.id
            ? (resolvedLabels[`${crumb.dynamicKey}:${crumb.id}`] ?? crumb.label)
            : crumb.label;

        return (
          <span key={`${crumb.href}-${index}`} className="flex min-w-0 shrink items-center gap-1.5">
            {index > 0 && <span className="shrink-0 text-text-secondary/70">/</span>}
            {isCurrent ? (
              <span className="truncate font-medium text-text-primary" aria-current="page">
                {label}
              </span>
            ) : (
              <Link href={crumb.href} className="truncate text-secondary underline-offset-2 hover:underline">
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </div>
  );
}
