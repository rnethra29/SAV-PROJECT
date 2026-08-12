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

  return (
    <div className="hidden min-w-0 flex-1 items-center gap-1.5 overflow-hidden text-sm text-text-secondary md:flex">
      <span className="shrink-0 font-medium text-text-primary">SAV Wind Foundations</span>
      {trail.map((crumb, index) => {
        const isCurrent = index === trail.length - 1;
        const label =
          crumb.dynamicKey && crumb.id
            ? (resolvedLabels[`${crumb.dynamicKey}:${crumb.id}`] ?? crumb.label)
            : crumb.label;

        return (
          <span key={`${crumb.href}-${index}`} className="flex min-w-0 shrink items-center gap-1.5">
            <span className="shrink-0 text-text-secondary/70">/</span>
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
