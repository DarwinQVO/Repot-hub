"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

type RouteParams = { reportId: string; slug?: string };

export default function ReportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  /* ✅ sin “any” */
  const { reportId, slug } = useParams<RouteParams>();

  const base = `/reports/${reportId}`;

  return (
    <div>
      {/* Tabs */}
      <div className="mb-6 border-b border-zinc-800 flex gap-6">
        <Tab href={`${base}/setup`}  active={slug === "setup"}>Setup</Tab>
        <Tab href={`${base}/output`} active={slug === "output"}>Output</Tab>
      </div>
      {children}
    </div>
  );
}

function Tab({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "border-b-2 border-blue-600 pb-1"
          : "text-zinc-400 hover:text-zinc-200 pb-1"
      }
    >
      {children}
    </Link>
  );
}
